# ClickBook

> **Save tabs with 1-click and let AI auto-categorize them into folders.**
> **1클릭으로 탭을 저장하고, AI가 자동으로 폴더에 분류하는 Chrome 확장 프로그램**

[English version](./README.md) | [日本語版](./README.ja.md) | [한국어판](./README.ko.md)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/junpa)

---

ClickBook is a bookmark management tool built with Chrome Manifest V3. It allows you to instantly save your active tab with a single click and automatically organizes it into categories using Chrome's built-in AI (Gemini Nano) or a rule-based fallback system.

## Screenshots

| Popup | Dashboard |
|---|---|
| 1-click save from the icon | Hierarchical management in a dedicated tab |

---

## Features

| # | Feature | Description |
|---|---|---|
| 1 | **1-Click Save** | Instantly save the active tab by clicking the extension icon. |
| 2 | **AI Categorization** | Uses Chrome Gemini Nano (`window.ai`) to analyze URL/Title and sort into folders. |
| 3 | **Bulk AI Reorganize** | One-click button in the sidebar to re-classify all saved bookmarks (with auto-backup). |
| 4 | **Auto Tag** | AI auto-generates tags for all untagged bookmarks via a long-running background port. Falls back to domain/title-based rule tagging if AI is unavailable. |
| 5 | **Task Control Center** | Unified real-time panel to monitor all background AI tasks (AI Organize, Auto Tag). Shows live progress bars, success/failure state, and enforces a 1-concurrent AI task limit. Completed tasks auto-dismiss after 3 seconds; failed tasks persist until manually dismissed. |
| 6 | **AI Tag Cloud & Management** | Collapsible interactive HSL tag cloud. Filter bookmarks by tag, merge redundant tags, and edit tags inline. Auto Tag button integrated directly into the Tag Cloud page header. |
| 7 | **Hierarchy Folders** | Infinite nesting support. Create, rename, move, delete, and set emoji icons. |
| 8 | **Drag & Drop** | Intuitive reordering for both bookmarks and folders. |
| 9 | **Pattern Snapshots** | Save and restore your entire folder/bookmark layout as a snapshot. |
| 10 | **Chrome Sync** | Import, export, and sync with native Chrome bookmarks. |
| 11 | **Theming** | Support for Dark and Light modes, persisting via `localStorage`. |
| 12 | **100% Offline** | Runs entirely locally using `chrome.storage.local` (No external servers). |
| 13 | **Multi-Language** | Full localized experience for English, Korean, and Japanese. |
| 14 | **AI Highlight Clipper (Premium)** | Highlight webpage text and use right-click context menu to automatically refine and save it as multi-lingual memos using on-device AI. |
| 15 | **Smart Tab Suspender (Premium)** | Automatically suspends inactive background tabs to save up to 90% of RAM. |
| 16 | **Chrome Tab Groups Sync (Premium)** | Back up active Chrome tab groups into folders, and instantly restore them back into native, colored Chrome tab groups. |
| 17 | **Privacy Session Sweeper (Premium)** | Designate folders as 'Secure Folders'. Cookies, cache, storage, and history are instantly shredded when closing secure tabs. |
| 18 | **FTS Body Search (Premium)** | Scrapes webpage text in background on bookmarking, supporting ultra-fast multi-keyword AND searches across title, URL, tags, summaries, and full body text. |
| 19 | **Offline Reader & Zen Mode (Premium)** | Read bookmarked pages distraction-free with Light/Sepia/Dark themes, dynamic Table of Contents, scroll progress, and text export. |
| 20 | **AI Cleaner** | AI-powered duplicate detection to find and clean up redundant bookmarks. |
| 21 | **Visual Mind Map (Premium)** | Interactive node-based mind-map view. Supports dragging and dropping nodes for custom positioning that saves permanently, on-device AI helpers to auto-expand branches or translate/rewrite node content, and an integrated Emoji & Icon Picker selectable via floating toolbar or settings panel. |
| 22 | **Trend Rankings** | Built-in dashboards for GitHub trending repos, Hugging Face models, Hacker News, and Wikipedia. |
| 23 | **Productivity Boards** | Integrated Kanban-style TODO board and Memo management system. |
| 24 | **Smart Calendar Integration (Premium)** | A smart calendar seamlessly integrated with Todo lists and Memo functions. Supports real-time holiday synchronization (Nager.Date API) for multiple countries (Korea, US, Japan, etc.), Month/Week/Day view transitions, schedule/time adjustment via HTML5 Drag & Drop, and various recurring event options (daily, weekly, monthly, etc.). |
| 25 | **Analogue Spring Note (Premium)** | An analogue-inspired rich-text notepad workspace (Tiptap-based). Offers custom visual themes (Light, Grid, Sepia, Dark). Outer panel background, leather book spine shadows, and editor separators automatically synchronize to match your selected theme. |
| 26 | **ClickBook Buddy & Focus Timer (Premium)** | Stay focused with cute animated desk pets, a Pomodoro timer, and full-screen visual completion effects (Starry Night, Zen Forest, Cozy Fireplace, Sunset Lake, Zen Yoga with Singing bowl synthesis, and 18-episode cinematic widescreen Success Stories cards). |

---

## Tech Stack

| Category | Technology | Version |
|---|---|---|
| UI | React | 18.x |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 3.x (`darkMode: "class"`) |
| Build Tool | Vite | 5.x |
| Extension Tool | vite-plugin-web-extension | 4.x |
| Icons | lucide-react | 0.400.x |
| Manifest | Chrome Manifest V3 | — |
| Storage | chrome.storage.local | 10MB limit |
| AI | Chrome Gemini Nano | `window.ai.languageModel` (Experimental) |

---

## Directory Structure

```
ClickBook/
├── manifest.json              # Chrome extension manifest (MV3)
├── vite.config.ts             # Vite + vite-plugin-web-extension config
├── tailwind.config.js
├── tsconfig.json
├── docs/
│   └── TASK_CONTROL_CENTER.md # Task Control Center design spec
├── public/
│   ├── _locales/              # Standard localization folders (en, ko, ja)
│   ├── icons/                 # Extension icons (16/48/128px)
│   ├── help.html              # Documentation page (English)
│   ├── help.ko.html           # Documentation page (Korean)
│   ├── help.ja.html           # Documentation page (Japanese)
│   └── privacy.html           # Privacy policy page
├── src/
│   ├── background/
│   │   └── service-worker.ts  # MV3 background service worker (AI Organize, Auto Tag ports)
│   ├── components/
│   │   ├── Sidebar.tsx        # Navigation, AI Organize (80%) + Auto Tag (20%) buttons, Task Control menu
│   │   ├── BookmarkCard.tsx   # Bookmark card component supporting drag & drop
│   │   ├── BookmarkEditPanel.tsx
│   │   ├── ChromeBookmarkPanel.tsx
│   │   ├── PatternBar.tsx     # Backup pattern saving/restoration
│   │   ├── RankingWidget.tsx
│   │   ├── RecentWidget.tsx
│   │   ├── SearchBar.tsx
│   │   └── ThemeToggle.tsx
│   ├── newtab/
│   │   ├── App.tsx            # Main bookmark manager dashboard & page routing
│   │   ├── index.html
│   │   └── main.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx      # Default view for all bookmarks
│   │   ├── FolderView.tsx     # Specialized category view
│   │   ├── TagBoard.tsx       # AI Tag Cloud, tag filter, merge, and Auto Tag
│   │   ├── TaskControlPage.tsx # Task Control Center — real-time background task monitor
│   │   ├── TodoBoard.tsx      # Kanban-style TODO board with reminders
│   │   ├── MemoBoard.tsx      # Memo management board
│   │   ├── BookmarkMap.tsx    # Visual bookmark map
│   │   ├── GitHubRanking.tsx  # GitHub trending repositories
│   │   ├── HFRanking.tsx      # Hugging Face AI trending
│   │   ├── HNRanking.tsx      # Hacker News trending
│   │   └── WikiRanking.tsx    # Wikipedia trending
│   ├── popup/
│   │   ├── Popup.tsx          # Mini popover window on icon click
│   │   ├── index.html
│   │   └── main.tsx
│   └── shared/
│       ├── categories.ts      # Default folder definitions and fallback rules
│       ├── categorizer.ts     # Multi-stage category matching engine (AI + Rule-based)
│       ├── storage.ts         # Wrapper on top of chrome.storage.local
│       ├── types.ts           # Shared TypeScript interfaces & types (incl. TaskItem)
│       ├── useTaskQueue.ts    # Task queue React hook (Concurrency Guard, auto-dismiss)
│       ├── i18n.ts            # Translation dictionary (EN / JA / KO)
│       ├── LanguageContext.tsx
│       ├── ThemeContext.tsx
│       └── useDialog.tsx      # Customized dialog hook
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Google Chrome** (Latest version. Canary is recommended for AI features).

### Installation & Build

```bash
# Clone the repository
git clone https://github.com/Junpapapo/ClickBook.git
cd ClickBook

# Install dependencies
npm install

# Production build (outputs to dist/)
npm run build

# Development mode (watch and rebuild)
npm run dev
```

### Loading into Chrome

1. Open `chrome://extensions` in your browser.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `dist/` folder generated by the build process.

---

## AI Features

### AI Bulk Reorganize

By clicking the **"AI Organize"** button (80% width) in the sidebar, the extension re-categorizes all saved bookmarks into the most appropriate folders using a 3-stage pipeline:

```
categorize(url, title, domain)
    │
    ├─ 1. Chrome Gemini Nano (window.ai.languageModel)
    │      └─ Success → Return Folder ID
    │      └─ Failure / Unavailable ↓
    │
    ├─ 2. Rule-based (Domain pattern matching)
    │      └─ Match → Return Folder ID
    │      └─ No match ↓
    │
    └─ 3. "Other" (Fallback folder)
```

### Auto Tag

By clicking the **"Auto Tag"** button (icon-only, 20% width in sidebar; or full button in Tag Cloud page header), the extension generates tags for all untagged bookmarks:

```
autoTag(bookmark)
    │
    ├─ 1. generateSummaryAndTags() via Gemini Nano
    │      └─ Tags returned → updateBookmark() saved to storage
    │      └─ No tags / Failure ↓
    │
    └─ 2. generateFallbackTags() — domain map + title keyword extraction
           └─ Tags returned → updateBookmark() saved to storage
```

### Task Control Center

Accessed via the **"Task Control"** menu item in the sidebar. All AI background tasks are tracked here:

- **Concurrency Guard**: Only 1 AI task runs at a time. Additional tasks are queued.
- **Live progress**: Real-time progress bars via `chrome.runtime.connect` port messaging.
- **Auto-dismiss**: Completed tasks disappear after 3 seconds.
- **Persistent errors**: Failed tasks stay visible until manually dismissed or retried.

---

## Default Folders (8 Categories)

| ID | Name | Examples |
|---|---|---|
| `technology` | Technology | GitHub, Stack Overflow, MDN |
| `design` | Design | Figma, Dribbble, Behance |
| `business` | Business | Notion, Slack, LinkedIn |
| `entertainment` | Entertainment | YouTube, Netflix, Twitch |
| `science` | Science | arXiv, PubMed, Nature |
| `sports` | Sports | ESPN, BBC Sport |
| `travel` | Travel | Booking.com, Airbnb |
| `other` | Other | Anything that doesn't fit above |

---

## Contact & Support

If you have any questions, suggestions, or bug reports, please use the following channels:

- [GitHub Issues](https://github.com/Junpapapo/ClickBook/issues): For bug reports and feature requests.
- [GitHub Discussions](https://github.com/Junpapapo/ClickBook/discussions): For general questions and community discussion.
- Email: [junpapapo@gmail.com](mailto:junpapapo@gmail.com)

---

## License

MIT
