# 상태 흐름도 및 데이터 라이프사이클 명세서 (State Flow & Data Lifecycle)

> **문서 버전**: v1.0.0  
> **최종 수정일**: 2026-08-17  
> **대상 시스템**: ClickBook Data Flow & State Synchronization Engine

---

## 1. 개요 (Overview)

ClickBook은 여러 독립된 탭(Tab)과 윈도우, 백그라운드 서비스 워커 간에 데이터 불일치(Race Condition)가 발생하지 않도록 **단방향 데이터 흐름(Unidirectional Data Flow)**과 **원자적 스토리지 락(`withStorageLock`) 메커니즘**을 사용합니다.

---

## 2. 전역 상태 동기화 파이프라인 (Global Synchronization Pipeline)

```mermaid
flowchart TD
    UserAction["사용자 인터랙션 (북마크 추가, 태스크 수정, 타이머 완료)"]
    
    subgraph Contexts [발행 컨텍스트]
        PopupUI["Popup View"]
        NewTabUI["NewTab Dashboard"]
        BuddyUI["Buddy Content Script"]
    end
    
    UserAction --> PopupUI
    UserAction --> NewTabUI
    UserAction --> BuddyUI

    subgraph MessageBus [비동기 메시지 버스]
        SendMsg["chrome.runtime.sendMessage"]
        MsgRouter["Message Router (message-router.ts)"]
        SendMsg --> MsgRouter
    end

    PopupUI --> SendMsg
    NewTabUI --> SendMsg
    BuddyUI --> SendMsg

    subgraph LockEngine [원자적 스토리지 락 엔진 withStorageLock]
        AcquireLock{"Lock 획득 대기 (Max 8000ms)"}
        CommitMutation["스토리지 데이터 수정 및 커밋"]
        ReleaseLock["Lock 해제"]
        
        AcquireLock -->|획득 성공| CommitMutation
        CommitMutation --> ReleaseLock
    end

    MsgRouter --> AcquireLock

    subgraph Storages [영속 스토리지 레이어]
        ChromeStorageLocal[("chrome.storage.local")]
        IndexedDBNotes[("IndexedDB: SpringNote")]
    end

    CommitMutation --> ChromeStorageLocal
    CommitMutation --> IndexedDBNotes

    subgraph BroadcastChannel [스토리지 변경 브로드캐스트]
        OnChanged["chrome.storage.onChanged.addListener"]
    end

    ChromeStorageLocal -.->|자동 이벤트 전파| OnChanged
    OnChanged -.->|State 업데이트| NewTabUI
    OnChanged -.->|BuddyState 동기화| BuddyUI
    OnChanged -.->|PopupState 동기화| PopupUI
```

---

## 3. 스토리지 락 FSM (Finite State Machine)

동시 다발적인 쓰기 요청으로부터 데이터 정합성을 보장하기 위해 `withStorageLock` 함수는 다음과 같은 유한 상태 기계(FSM)로 동작합니다.

```mermaid
stateDiagram-v2
    [*] --> IDLE: 초기 상태

    IDLE --> ACQUIRING: withStorageLock() 호출
    
    state ACQUIRING {
        [*] --> CheckLock
        CheckLock --> Locked: Lock 점유 중 (lock_held = true)
        CheckLock --> Free: Lock 비어있음
        Locked --> WaitRetry: 50ms 폴링 & 대기
        WaitRetry --> CheckLock
        Locked --> TimeoutTriggered: 8000ms 초과 시
    }

    ACQUIRING --> MUTATING: Lock 획득 완료
    ACQUIRING --> FALLBACK_EXEC: 8초 타임아웃 강제 해제

    state MUTATING {
        [*] --> ReadFreshData: 최신 스토리지 스냅샷 로드
        ReadFreshData --> ApplyBusinessLogic: 변이(Mutation) 계산
        ApplyBusinessLogic --> WriteStorage: chrome.storage.local.set()
        WriteStorage --> [*]
    }

    MUTATING --> RELEASING: 쓰기 완료 또는 에러 발생
    FALLBACK_EXEC --> RELEASING: 격리 실행 완료

    RELEASING --> IDLE: Lock 플래그 제거 & 락 해제
```

---

## 4. 방문 통계 배치 큐 (Visit Batch Queue) 라이프사이클

북마크 클릭 시 빈번한 I/O로 인한 스토리지 부하를 최소화하기 위해 **1.5초 디바운스 배치 큐(`visitBatchQueue`)**를 운용합니다.

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자
    participant BMCard as BookmarkCard
    participant StorageMgr as storage.ts (visitBatchQueue)
    participant Timer as Debounce Timer (1500ms)
    participant ChromeStorage as chrome.storage.local

    User->>BMCard: 북마크 링크 클릭 (방문)
    BMCard->>StorageMgr: recordBookmarkVisit(id)
    StorageMgr->>StorageMgr: visitBatchQueue.set(id, count + 1)
    
    alt 1500ms 이내 추가 클릭 없음
        StorageMgr->>Timer: 1500ms 대기 타이머 시작
        Timer-->>StorageMgr: 타이머 만료 (flushVisitBatch)
        StorageMgr->>ChromeStorage: withStorageLock() 진입하여 배치 일괄 쓰기
        StorageMgr->>StorageMgr: visitBatchQueue.clear()
    else 사용자가 탭/창을 즉시 닫음 (beforeunload / visibilitychange)
        StorageMgr->>StorageMgr: window.addEventListener("beforeunload") 감지
        StorageMgr->>ChromeStorage: 즉시 flushVisitBatch() 실행하여 유실 0% 보장
    end
```

---

## 5. 스프링노트 (IndexedDB) 데이터 동기화 원칙

1. **단일 진실 공급원 (Single Source of Truth)**:
   - 스프링노트 본문(`content`) 및 캔버스 손글씨/드로잉 이미지 데이터는 대용량 바이너리를 지원하는 `IndexedDB(clickbook_spring_note_db)`에 영속화됩니다.
2. **트랜잭션 격리 (Transaction Isolation)**:
   - `readwrite` 트랜잭션을 통해 각 페이지별 델타 업데이트를 즉시 커밋합니다.
3. **통합 백업 동기화 (v2.1.0)**:
   - `exportData()` 호출 시 `getAllSpringNotes()`를 통해 IndexedDB 데이터를 일괄 추출하여 JSON 단일 백업 파일에 결합합니다.
   - `importData()` 호출 시 `saveAllSpringNotes()`를 통해 트랜잭션 단위로 전체 노트를 안전하게 복원합니다.
