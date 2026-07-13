# ClickBook 버디(Buddy) 상태별 이미지 에셋 가이드라인 (BUDDY_IMAGE_GUIDELINE.md)

이 문서는 ClickBook 버디 캐릭터의 상태별 맞춤형 애니메이션을 추가할 때 준수해야 할 이미지 규격, 파일명 규칙 및 시스템의 폴백(Fallback) 작동 원리를 명시합니다. 

---

## 1. 디렉토리 구조 및 파일명 규칙

버디 이미지 에셋은 크롬 익스텐션 리소스 폴더인 `buddies/` 하위에 각 캐릭터 ID명 폴더로 구분하여 저장됩니다.

### 📂 기본 디렉토리 경로
```text
(익스텐션 루트)/buddies/{buddyId}/
```
*   `buddyId` 종류: `owl` (부엉이), `cat` (고양이), `fox` (여우), `penguin` (펭귄), `rabbit` (토끼)

### 🏷️ 파일명 네이밍 룰

#### 1) 기본(Loop) 애니메이션 프레임 (기존 파일)
일반 상태에서 주기적으로 움직이는 애니메이션 프레임입니다.
```text
frame_{frameNum}.webp
```
*   *예: `frame_01.webp`, `frame_02.webp`, `frame_03.webp`, `frame_04.webp`*

#### 2) 특정 상태(State) 애니메이션 프레임 (신규 정의)
각 특정 상태에 있을 때 기본 프레임 대신 노출될 이미지 에셋입니다.
```text
state_{stateName}_{frameNum}.webp
```
*   `stateName` 종류:
    *   `focus`: 집중 타이머 작동 중 (Focus 페이즈)
    *   `break`: 집중 타이머 작동 중 (Break 휴식 페이즈)
    *   `loading`: AI 분석/대화 응답 대기 중
    *   `celebrate`: 타이머 목표 달성 성공 축하
    *   `idle`: 오랜 시간 유저 조작이 없는 대기 상태
*   `frameNum`: `01`부터 시작하여 애니메이션 프레임 수만큼 2자리 정수 매핑 (`01`, `02`, `03` ...)
*   *예: `state_focus_01.webp`, `state_focus_02.webp`, `state_break_01.webp`*
*   **유의 사항**:
    *   **`stateName` 자체가 없는 경우 (기본 대기 상태)**: 별도의 맞춤 상태가 아니거나 에셋이 지정되지 않았을 때는 1)번의 기본 명명 규칙인 `frame_{frameNum}.webp`를 순회하며 노출합니다.
    *   **특정 상태 이미지 생략 가능**: 특정 상태 이미지는 필수가 아니며, 파일이 없는 경우 자동으로 기본 프레임 이미지로 폴백되어 렌더링되므로 시스템 에러가 발생하지 않습니다.

---

## 2. 이미지 에셋 규격 가이드

버디가 화면에서 찌그러지거나 흐리게 보이지 않도록 아래 규격을 엄격히 준수하여 에셋을 제작해야 합니다.

| 항목 | 권장 사양 | 설명 |
| :--- | :--- | :--- |
| **권장 해상도** | **128 x 128 px** | 최대 `256 x 256 px`를 초과하지 않도록 합니다 (메모리 최적화). |
| **종횡비** | **1:1 (정비율)** | 정비율이 아닐 경우 섀도우 돔 스타일링에 의해 이미지가 찌그러질 수 있습니다. |
| **파일 포맷** | **WebP (권장)** | 알파 채널(투명 배경)이 지원되며, 용량 대비 화질이 뛰어납니다. (PNG도 지원하지만 WebP 권장) |
| **배경** | **투명 (Transparent)** | 웹페이지 본문 위에 자연스럽게 조화되기 위해 배경 투명화 처리는 필수입니다. |
| **애니메이션 프레임 수** | **4 ~ 8 프레임** | 기본 버디들과의 모션 자연스러움 싱크를 위해 4~8프레임 구성을 추천합니다. (1프레임의 단일 정적 이미지도 동작 가능) |

---

## 3. 에러 방지 폴백(Fallback) 원리

사용자가 특정 상태 에셋을 실제로 파일로 제공하지 않더라도 웹사이트에 오류나 깨짐 현상(404 콘솔 로그 등)이 발생하지 않도록 **사전 유효성 검사 및 하이브리드 폴백 구조**를 채택합니다.

```mermaid
graph TD
    A[상태 변경 감지] --> B{state_{stateName}_01 에셋이 로컬에 존재?}
    B -- Yes (존재함) --> C[상태 전용 이미지 렌더링 & 순회 재생]
    C --> D[CSS 추가 연출 효과 병행 적용]
    
    B -- No (존재하지 않음) --> E[기본 frame_01 이미지로 유지]
    E --> D[CSS 추가 연출 효과 단독 적용]
```

### 🛠️ 세부 동작 메커니즘
1.  **리소스 유효성 사전 검사 (`fetch HEAD`)**:
    *   버디 엔진 구동 시 또는 특정 상태로 돌입하는 최초의 시점에 `chrome.runtime.getURL`로 해당 파일의 경로 획득 후 `fetch(url, { method: "HEAD" })`를 수행합니다.
    *   이를 통해 파일이 실제로 로컬 스토리지에 존재하는지 사전 검증합니다.
2.  **결과 캐싱 (Resource Check Caching)**:
    *   매 프레임/상태 검사 시 불필요한 HEAD 요청이 중복되어 발생하는 성능 저하를 방지하기 위해, 존재 확인 결과는 메모리 맵(`Map<string, boolean>`)에 보관하여 최초 1회만 확인하도록 제어합니다.
3.  **동적 프레임 및 폴백 렌더링**:
    *   **상태별 파일이 아예 없는 경우 (또는 404)**: 조용히 기본 `frame_01.webp` 등으로 회귀(Fallback)하여 렌더링하고, 콘솔에 에러를 기록하지 않도록 처리합니다. 이 경우에도 캐릭터가 숨을 쉬거나(`.buddy-breathe`) 껑충 바운스하는 CSS 트랜스폼 효과는 온전히 동작합니다.
    *   **단일 프레임만 있는 경우 (`state_focus_01.webp`만 존재)**: `02`, `03` 파일의 부재로 인한 404 에러를 방지하기 위해, 시스템이 자동으로 단일 프레임 고정 키프레임을 생성하여 하나의 이미지만 띄워줍니다.
    *   **다중 프레임이 있는 경우 (`01~02` 혹은 `01~03` 존재)**: 존재 여부가 확인된 프레임 수에 최적화하여 2프레임 혹은 3프레임 분할 `@keyframes` 스타일을 동적으로 생성 및 주입하여 프레임 애니메이션이 자연스럽게 루프 재생되도록 합니다.

---

## 4. AI 이미지 생성용 프롬프트 가이드 (Grid Matrix Sprite Sheet 제작)

여러 개의 버디 캐릭터를 세로(Y축)로 배열하고, 각 캐릭터의 상태별 동작 프레임을 가로(X축)로 나열한 **2차원 행렬(Grid Matrix) 스프라이트 시트**를 한 번에 생성하기 위한 프롬프트 템플릿입니다.

### 🖼️ 레퍼런스 이미지 사용법
Midjourney나 DALL-E에 기존 캐릭터들의 대표 이미지를 제공한 뒤 아래의 매트릭스 프롬프트를 실행하면, 일관성 있는 화풍의 전체 캐릭터 세트 상태 이미지를 일괄 획득할 수 있습니다.

### ✍️ AI 생성 프롬프트 템플릿

```text
[기존_캐릭터_이미지_URL] A 2D game asset character sprite sheet grid matrix. 
- Vertical rows represent different characters: [캐릭터_종류_목록_예: a cute owl, a cute cat, a cute fox, a cute rabbit, a cute penguin]
- Horizontal columns represent 5 different states for each character in sequence:
  1) idle waiting (default)
  2) studying hard with a book (focus)
  3) drinking coffee (break)
  4) thinking deeply with floating question marks (loading)
  5) cheering happily in victory (celebrate)

Flat vector illustration, clean lines, consistent cute game-art style, consistent colors for each character. Transparent background, no background shadow --no shadow --iw 2.0
```

### 💡 실전 프롬프트 입력 예시
> **실제 적용 예시**:
> `[대표_이미지_URL] A 2D game asset character sprite sheet grid matrix. Vertical rows represent 5 different characters: a cute owl, a cute cat, a cute fox, a cute rabbit, a cute penguin. Horizontal columns represent 5 different states for each character in sequence: 1) idle waiting, 2) studying hard with a book, 3) drinking coffee, 4) thinking deeply with floating question marks, and 5) cheering happily in victory. Flat vector illustration, clean lines, consistent cute game-art style, consistent colors for each character. Transparent background, no background shadow --no shadow --iw 2.0`

---

### 💎 고품질 8열 캐릭터 컬렉션 시트 생성 프롬프트 (Premium)

독창적인 귀여운 캐릭터(행/세로)를 무제한으로 채우며, 각 캐릭터당 8가지의 애니메이션 상태(열/가로)를 일관성 있는 스타일로 일괄 생성하기 위한 고해상도 프리미엄 프롬프트입니다.

* **애니메이션 시퀀스 (8열 구성)**:
  1. `Idle — Frame 1` (기본 대기 프레임 1)
  2. `Idle — Frame 2` (기본 대기 프레임 2)
  3. `Idle — Frame 3` (미세한 호흡/동작 대기 프레임 3)
  4. `Studying with an open book` (집중/focus)
  5. `Drinking coffee` (휴식/break)
  6. `Thinking deeply with floating question marks` (생각 중/loading)
  7. `Cheering happily with raised arms` (축하/celebrate)
  8. `Celebration variation with confetti and joyful expression` (축하 변형/confetti 효과 포함)

#### ✍️ 완성형 생성 프롬프트 (Copy & Paste)
```text
Create a single ultra-high-resolution character collection sheet.

Use a perfectly aligned 8-column grid.

The number of rows is not fixed. Continue generating new rows until the entire canvas is filled with unique characters.

Each row represents one completely different original kawaii mascot character.

Each row contains exactly 8 sequential frames of the same character.

Animation sequence for every row:
1. Idle — Frame 1
2. Idle — Frame 2
3. Idle — Frame 3 (subtle breathing or gentle bobbing)
4. Studying with an open book (focus)
5. Drinking coffee (break)
6. Thinking deeply with floating question marks (loading)
7. Cheering happily with raised arms (celebrate)
8. Celebration variation with confetti and joyful expression

Create imaginative and diverse original mascot characters, including fantasy creatures, aliens, magical beings, spirits, robots, slimes, monsters, plants, clouds, stars, food mascots, abstract mascots, tiny creatures, living objects, cosmic beings, or completely original fictional designs.

Every row must introduce a completely different character.

Each character must have a unique silhouette, distinct personality, unique color palette, and remain perfectly consistent across all eight frames.

Premium mascot illustration, ultra-high-resolution digital artwork, sticker-quality illustration, professional character design sheet, modern app mascot style, collectible mascot design, clean vector-like outlines, soft cel shading, bright vibrant colors, smooth gradients, highly detailed, crisp edges, crystal-clear lines, consistent lighting, front-facing, centered composition, identical proportions across all frames.

Large canvas, perfectly aligned 8-column grid, unlimited rows, equal spacing, every character occupies approximately 60–65% of its cell, generous transparent padding around every character, wide spacing between rows and columns, characters must never overlap or touch neighboring cells, every character perfectly centered within its cell.

Transparent PNG background. No scenery. No decorative background. No text. No labels. No names. No numbers. No icons. No borders. No frames. Only the characters.

Ultra sharp, maximum clarity, premium illustration quality, professional production quality, extremely crisp, ultra clean, high detail, 8K quality, crystal-clear edges, vibrant colors.

Negative prompt: pixel art, sprite sheet, retro game, game asset, low quality, low resolution, blurry, blur, soft, soft focus, out of focus, pixelated, compression artifacts, noise, grain, watercolor, oil painting, painterly, rough sketch, messy, unfinished, 3D render, photorealistic, anime screenshot, duplicate character, repeated design, inconsistent character, inconsistent proportions, inconsistent scale, cropped, cut off, overlapping characters, touching characters, uneven spacing, misaligned grid, text, letters, words, labels, names, numbers, logo, watermark, border, frame, background scenery, tiny characters, cluttered composition.

IMPORTANT: Fill the entire canvas with as many unique character rows as possible. Every row must contain exactly one unique character shown in eight sequential frames. Maintain perfect character consistency within each row, maximize sharpness, preserve generous transparent spacing, and keep a perfectly aligned professional character sheet layout.

8K quality, ultra-high-resolution

```


