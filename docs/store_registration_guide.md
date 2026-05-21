# ClickBook 크롬 웹 스토어 등록 가이드

이 문서는 ClickBook 확장 프로그램을 크롬 웹 스토어에 등록/업데이트할 때 필요한 모든 정보와 절차를 정리한 문서입니다.

## 1. 스토어 기본 정보 (Store Listing)

* **기본 언어 (Primary Language):** `영어(English)` (추후 스토어 등록정보에서 한국어, 일본어를 추가하여 현지화 가능)
* **카테고리:** `생산성 (Productivity)` > `도구 (Tools)`
* **스토어 아이콘 (Store Icon):** `public/icons/icon128.png` (128x128 PNG)
* **전 언어 공통 애셋 (Graphic Assets):**
  * **스크린샷:** 1280x800 또는 640x400 (최대 5장)
  * **프로모션 이미지 (Promo Tile):** 440x280 (1장 필수)

### 스토어 설명 (Description)
```text
ClickBook — Smart Bookmark Manager with Local AI

Save any tab with a single click. ClickBook automatically categorizes your bookmarks, generates smart summaries, and extracts keywords using Chrome's built-in local AI (Gemini Nano) to keep your web life perfectly organized.

✦ AI-Powered Features:
• Smart Summary & Auto-Tagging — Automatically generates a 1-2 sentence TL;DR and extracts 3 key tags whenever you save a site.
• Auto-categorization — Automatically sorts incoming bookmarks into the most appropriate folder based on the site's content.
• Semantic Search Expansion — Understands your natural language search intent and expands it into related keywords to find exactly what you need.
• Smart Site Recommendation — Suggests the most relevant bookmarks based on your search keywords.
• Bulk Reorganize — Re-classify all your bookmarks at once with an automatic backup system.

✦ Core Features:
• One-click save — Click the extension icon or use the shortcut to instantly bookmark the current tab.
• Hierarchical folders — Unlimited nesting with emoji icons and intuitive drag & drop reordering.
• Pattern snapshots — Save and restore your entire bookmark and folder layout as backup "patterns".
• Chrome bookmark sync — Import, export, and seamlessly interact with Chrome's native bookmarks.
• Memo notes — Attach colored sticky notes to any bookmark to jot down important thoughts.
• Bulk import — Save all open tabs simultaneously or paste multiple URLs at once.
• Export/Import — JSON and HTML export with timestamped filenames for easy backups.
• Visit ranking — Track your most-visited bookmarks at a glance on the dashboard.
• Browsing data cleanup — One-click clearing of cache, cookies, history, and downloads.
• Dark / Light theme — Beautiful UI that toggles aesthetics with one click.
• Multi-language — Fully supported in English, Japanese, and Korean.

✦ Privacy First:
• 100% Offline & Local AI — All data is stored locally via chrome.storage.local. The built-in AI processes everything directly on your device.
• No external servers — Zero API calls to outside servers, no analytics, and no tracking. Your data never leaves your browser.

✦ Keyboard shortcut:
• Alt+S — Save current tab instantly
```

---

## 2. 개인정보보호 (Privacy)

### 단일 목적 (Single purpose)
> "ClickBook is a smart bookmark manager that allows users to save, organize, and easily search their web bookmarks and open tabs."

### 권한 사용 근거 (Permission Justifications)
* **activeTab:** "The activeTab permission is required to retrieve the URL, title, and meta description of the current active tab when the user clicks the extension icon or uses the shortcut (Alt+S) to save the page as a bookmark and generate an AI summary."
* **storage:** "The storage permission is required to securely store and maintain the user's bookmarked data, folder hierarchy, sticky notes, and extension settings locally within the browser (chrome.storage.local) without relying on any external servers."
* **tabs:** "The tabs permission is required to query and retrieve a list of all currently open tabs for the bulk-save feature, and to programmatically open or navigate to the user's selected bookmarks in new or active tabs."
* **bookmarks:** "The bookmarks permission is required to read and interact with Chrome's native bookmark system. This allows users to seamlessly import their existing browser bookmarks into the extension, and to sync or export their organized bookmarks back to the browser."
* **browsingData:** "The browsingData permission is required to provide a built-in browser cleanup utility. This feature allows users to easily clear their cache, cookies, browsing history, and download history directly from the extension's dashboard with a single click."
* **scripting:** "The scripting permission is required to temporarily inject a script that extracts the meta description of the current web page when the user saves a bookmark. This context is then passed to the local AI to generate highly accurate smart summaries and auto-tags."

### 수집하는 사용자 데이터 (Data Collection)
다음 2개 항목에만 체크:
* [v] **웹 기록 (Web History):** 사이트 제목, URL 저장 및 벌크 등록 시 탭 조회용
* [v] **웹사이트 콘텐츠 (Website content):** AI 요약을 위해 사이트 meta description 추출용

**하단 3가지 정책 서약:** 모두 체크 필수

### 원격 호스팅 코드 (Remote Code)
* "이 확장 프로그램은 원격 코드를 다운로드하거나 실행합니까?" 👉 **"아니요(No)"**

### 개인정보처리방침 URL (Privacy Policy URL)
* URL: `https://junpapapo.github.io/ClickBook/public/privacy.html`
* (이 링크가 유효하도록 프로젝트 `public/privacy.html`을 GitHub에 푸시해야 합니다.)

---

## 3. 배포(빌드 및 업로드) 단계

1. **버전 업데이트:** `manifest.json` 파일 내의 `"version"` 값(예: `1.1.7`)을 이전 버전보다 높게 설정합니다.
2. **프로덕션 빌드:** 개발 환경(터미널)에서 아래 명령어를 실행하여 빌드합니다.
   ```bash
   npm run build
   ```
3. **압축:** 프로젝트 폴더 내부에 생성된 `dist` 폴더를 통째로 `.zip` 파일로 압축합니다. (`dist.zip`)
4. **업로드:** [크롬 웹 스토어 개발자 대시보드](https://chrome.google.com/webstore/devconsole/)의 '패키지 업로드' 메뉴에서 `dist.zip`을 업로드합니다.
5. 위에서 정리한 텍스트 정보들을 폼에 맞게 기입한 뒤 심사를 제출합니다.
