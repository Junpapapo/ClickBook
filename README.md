# ClickBook

> **Save tabs with 1-click and let AI auto-categorize them into folders.**
> **1클릭으로 탭을 저장하고, AI가 자동으로 폴더에 분류하는 Chrome 확장 프로그램**

[English version](./README.md) | [日本語版](./README.ja.md) | [한국어판](./README.ko.md)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/junpa)

---

ClickBook is a bookmark management tool built with Chrome Manifest V3. It allows you to instantly save your active tab with a single click and automatically organizes it into one of 8 categories using Chrome's built-in AI (Gemini Nano) or a rule-based fallback system.

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
| 4 | **Hierarchy Folders** | Infinite nesting support. Create, rename, move, delete, and set emoji icons. |
| 5 | **Drag & Drop** | Intuitive reordering for both bookmarks and folders. |
| 6 | **Pattern Snapshots** | Save and restore your entire folder/bookmark layout as a snapshot. |
| 7 | **Chrome Sync** | Import, export, and sync with native Chrome bookmarks. |
| 8 | **Theming** | Support for Dark and Light modes, persisting via `localStorage`. |
| 9 | **100% Offline** | Runs entirely locally using `chrome.storage.local` (No external servers). |
| 10 | **Multi-Language** | Full localized experience for English, Korean, and Japanese using Chrome Extension i18n. |
| 11 | **AI Highlight Clipper (Premium)** | Highlight webpage text and use right-click context menu to automatically refine and save it as multi-lingual memos using on-device AI. |
| 12 | **Smart Tab Suspender (Premium)** | Automatically suspends inactive background tabs to save up to 90% of RAM (smart filters for audible/pinned tabs, with easy hover/one-click restore). |
| 13 | **Chrome Tab Groups Sync (Premium)** | Back up active Chrome tab groups into folders, and instantly restore folders back into native, colored Chrome tab groups with naming and state intact. |
| 14 | **Privacy Session Sweeper (Premium)** | Designate folders as 'Secure Folders'. When closing secure tabs, their origin-specific cookies, cache, storage, and history are instantly and completely shredded. |

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
├── public/
│   ├── _locales/              # Standard localization folders (en, ko, ja)
│   ├── icons/                 # Extension icons (16/48/128px)
│   ├── help.html              # Documentation page (English)
│   ├── help.ko.html           # Documentation page (Korean)
│   ├── help.ja.html           # Documentation page (Japanese)
│   └── privacy.html           # Privacy policy page
├── src/
│   ├── background/
│   │   └── service-worker.ts  # MV3 background service worker
│   ├── components/
│   │   ├── Sidebar.tsx        # Directory tree navigation & AI actions
│   │   ├── BookmarkCard.tsx   # Bookmark card component supporting drag & drop
│   │   ├── BookmarkEditPanel.tsx
│   │   ├── ChromeBookmarkPanel.tsx
│   │   ├── PatternBar.tsx     # Backup pattern saving/restoration
│   │   ├── RankingWidget.tsx
│   │   ├── RecentWidget.tsx
│   │   ├── SearchBar.tsx
│   │   └── ThemeToggle.tsx
│   ├── newtab/
│   │   ├── App.tsx            # Main bookmark manager dashboard
│   │   ├── index.html
│   │   └── main.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx      # Default view for all bookmarks
│   │   └── FolderView.tsx     # Specialized category view
│   ├── popup/
│   │   ├── Popup.tsx          # Mini popover window on icon click
│   │   ├── index.html
│   │   └── main.tsx
│   └── shared/
│       ├── categories.ts      # Default folder definitions and fallback rules
│       ├── categorizer.ts     # Multi-stage category matching engine (AI + Rule-based)
│       ├── storage.ts         # Wrapper on top of chrome.storage.local
│       ├── types.ts           # Shared TypeScript interfaces & types
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
git clone https://github.com/your-name/clickbook.git
cd clickbook

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

## AI Bulk Reorganize (Core Feature)

### Overview

By clicking the "**AI Organize**" button in the sidebar, the extension will automatically re-categorize all your saved bookmarks into the most appropriate folders.

### Classification Flow

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
