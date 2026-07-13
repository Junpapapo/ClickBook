# Gemini Agent Rulebook & Guidelines (GEMINI.md)

# 1. User Collaboration & Communication Directives
1. **Language Requirement**: Always respond, report progress, and explain changes to the user in Korean.
2. **No Arbitrary Decisions**: Never make major design, behavioral, or implementation assumptions on your own. Always present options and ask the user for clarification before deciding.
3. **Structured Idea & Feedback Reporting**: When the user gives feedback, actively brainstorm and present structured ideas, improvements, or alternative suggestions to help refine the outcome.
4. **Collaborative Synergy**: Treat the pairing process as a collaborative brainstorm. The ultimate goal is to co-create the best possible outcome through continuous dialogue and alignment.
5. **Strict Change Boundaries**: Do not perform arbitrary or unsolicited modifications to files, configurations, or lines of code unrelated to the approved task. Always seek permission or alignment first.
6. **Reporting Style**: Write artifacts, plans, and task documents with professional depth and technical precision. However, when reporting results back to the user in conversation, keep it simple, concise, and clear — no verbose re-summaries of what was already written in the document.

# 2. RTK - Rust Token Killer

**Usage**: Token-optimized CLI proxy (60-90% savings on dev operations)

## Meta Commands (always use rtk directly)

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk discover          # Analyze Claude Code history for missed opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
```

## Installation Verification

```bash
rtk --version         # Should show: rtk X.Y.Z
rtk gain              # Should work (not "command not found")
which rtk             # Verify correct binary
```

⚠️ **Name collision**: If `rtk gain` fails, you may have reachingforthejack/rtk (Rust Type Kit) installed instead.

## Hook-Based Usage

All other commands are automatically rewritten by the Claude Code hook.
Example: `git status` → `rtk git status` (transparent, 0 tokens overhead)

Refer to CLAUDE.md for full command reference.

# 3. GitHub 저장소 이원화 및 백업 가이드

프로젝트 저장소는 용도에 따라 **공개용(메인)**과 **백업용**의 두 가지 원격 저장소로 이원화하여 관리합니다.

## 저장소별 차이점 비교
| 항목 | 공개용(메인) 저장소 | 백업용 저장소 |
| :--- | :--- | :--- |
| **저장소 주소** | `https://github.com/Junpapapo/ClickBook.git` | `https://github.com/Junpapapo/Backup_ClickBook.git` |
| **포함 대상** | 순수 프로젝트 소스 코드 및 기본 리소스 | **전체 데이터** (대용량 에셋 및 로컬 문서 포함) |
| **제외 대상** | `node_modules/`, `dist/`, `docs/`, `public/buddies/`, `scratch/` 등 | `node_modules/`, `dist/`, `.history/`, `.DS_Store`, `*.zip`, `.gemini/` 등 |
| **주요 목적** | 배포 및 협업을 위한 콤팩트한 메인 소스 관리 | 에셋 이미지 및 개발/기획 기록 문서 등의 전체 백업 |

## 백업용 저장소 푸시 방법 (Full Backup)
로컬 `main` 브랜치의 커밋 히스토리를 콤팩트하게 유지하기 위해, 백업 시에는 임시 브랜치를 생성해 백업 저장소로 강제 푸시하는 방식을 사용합니다.

```bash
# 1. 임시 백업 브랜치 생성 및 이동
git checkout -b backup-temp

# 2. .gitignore 파일 임시 수정
# (buddies, docs, scratch 등을 예외 리스트에서 삭제하여 git 추적 대상에 포함)

# 3. 백업 원격 저장소 추가 및 전체 스테이징
git remote add backup https://github.com/Junpapapo/Backup_ClickBook.git
git add .

# 4. 백업용 커밋 생성 및 백업 원격지의 main으로 강제 푸시
git commit -m "backup: ClickBook 전체 백업 (buddies, docs, scratch 포함)"
git push backup backup-temp:main --force

# 5. 원래 브랜치로 복귀 및 임시 자원 정리 (원상복구)
git checkout main
git branch -D backup-temp
git remote remove backup
```
