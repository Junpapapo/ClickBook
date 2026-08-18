# ClickBook

> **Speichern Sie Tabs mit 1 Klick und lassen Sie sie von der KI automatisch in Ordner kategoriesieren.**

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [繁體中文](./README.zh-TW.md) | [简体中文](./README.zh-CN.md)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/junpa)

---

ClickBook ist ein Bookmark-Verwaltungstool, das mit Chrome Manifest V3 entwickelt wurde. Es ermöglicht Ihnen, Ihren aktiven Tab mit einem einzigen Klick sofort zu speichern und ihn mithilfe der integrierten KI von Chrome (Gemini Nano) oder eines regelbasierten Fallback-Systems automatisch in Kategorien zu organisieren.

## Screenshots

| Popup | Dashboard |
|---|---|
| 1-Klick-Speicherung über das Icon | Hierarchische Verwaltung in einem eigenen Tab |

---

## Funktionen

| # | Funktion | Beschreibung |
|---|---|---|
| 1 | **1-Klick-Speicherung** | Speichern Sie den aktiven Tab sofort durch Klicken auf das Erweiterungssymbol. |
| 2 | **KI-Kategorisierung** | Verwendet Chrome Gemini Nano (`window.ai`), um URL/Titel zu analysieren und in Ordner zu sortieren. |
| 3 | **KI-Massenreorganisation** | Ein-Klick-Schaltfläche in der Seitenleiste zur Neuklassifizierung aller gespeicherten Lesezeichen (mit automatischem Backup). |
| 4 | **Auto-Tagging** | KI generiert automatisch Tags für alle Lesezeichen ohne Tags über einen Hintergrunddienst. |
| 5 | **Task Control Center** | Einheitliches Echtzeit-Panel zur Überwachung aller Hintergrund-KI-Aufgaben mit Fortschrittsbalken. |
| 6 | **KI-Tag-Cloud** | Interaktive HSL-Tag-Cloud zum Filtern, Zusammenführen und Bearbeiten von Tags. |
| 7 | **Hierarchische Ordner** | Unterstützung für unbegrenzte Verschachtelung, Umbenennen, Verschieben und Emoji-Icons. |
| 8 | **Drag & Drop** | Intuitives Neuanordnen von Lesezeichen und Ordnern. |
| 9 | **Muster-Snapshots** | Speichern und Wiederherstellen Ihres gesamten Ordner-/Lesezeichen-Layouts als Snapshot. |
| 10 | **Chrome-Synchronisierung** | Importieren, Exportieren und Synchronisieren mit nativer Chrome-Lesezeichenleiste. |
| 11 | **Design-Themen** | Unterstützung für Dunkel- und Hellmodus (Dark/Light). |
| 12 | **100% Offline** | Läuft vollständig lokal mit `chrome.storage.local` (Keine externen Server). |
| 13 | **Mehrsprachig** | Vollständige Lokalisierung für 7 Sprachen (Englisch, Koreanisch, Japanisch, Deutsch, Spanisch, Traditionelles Chinesisch, Vereinfachtes Chinesisch). |
| 14 | **KI-Highlight-Clipper (Premium)** | Text markieren und über Kontextmenü als mehrsprachige Notizen mit KI speichern. |
| 15 | **Smart Tab Suspender (Premium)** | Pausiert inaktive Hintergrund-Tabs automatisch zur Einsparung von bis zu 90% RAM. |
| 16 | **Tab-Gruppen-Sync (Premium)** | Sichert Chrome-Tab-Gruppen in Ordnern und stellt sie als farbige Tab-Gruppen wieder her. |
| 17 | **Datenschutz-Sitzungsreiniger (Premium)** | Automatisches Löschen von Cookies/Cache beim Schließen von Tabs in Sicherheitsordnern. |
| 18 | **FTS-Volltextsuche (Premium)** | Durchsucht den gesamten Seitentext von gespeicherten Lesezeichen in Echtzeit. |
| 19 | **Offline-Lesemodus & Zen-Reader (Premium)** | Ablenkungsfreies Lesen mit Themes, Inhaltsverzeichnis und Fortschrittsbalken. |
| 20 | **KI-Cleaner** | KI-gestützte Duplikaterkennung zum Bereinigen doppelter Lesezeichen. |
| 21 | **Visuelles Mind-Map (Premium)** | Interaktive knotenbasierte Mind-Map-Ansicht mit KI-Erweiterung und Emoji-Picker. |
| 22 | **Trend-Rankings** | Dashboards für GitHub-Trends, Hugging Face, Hacker News und Wikipedia. |
| 23 | **Produktivitäts-Boards** | Integriertes Kanban-TODO-Board und Memo-Verwaltungssystem. |
| 24 | **Smarte Kalender-Integration (Premium)** | Kalender mit Nahtloser Todo/Memo-Verknüpfung und Feiertags-Synchronisierung. |
| 25 | **Analoger Spring-Note (Premium)** | Tiptap-basierter Notizbereich mit analogen Buch-Themes. |
| 26 | **ClickBook Buddy & Fokus-Timer (Premium)** | Interaktive Schreibtisch-Haustiere mit Pomodoro-Timer und Radialmenü. |
| 27 | **Smarte Konsonantensuche** | Ultraschnelle koreanische Anfangskonsonantensuche (z. B. 'ㅋㄹㅂ' für 'ClickBook'). |

---

## Technologiestapel

| Kategorie | Technologie | Version |
|---|---|---|
| UI | React | 18.x |
| Sprache | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 3.x (`darkMode: "class"`) |
| Build Tool | Vite | 5.x |
| Extension Tool | vite-plugin-web-extension | 4.x |
| Icons | lucide-react | 0.400.x |
| Manifest | Chrome Manifest V3 | — |
| Speicher | chrome.storage.local | 10MB Limit |
| KI | Chrome Gemini Nano | `window.ai.languageModel` (Experimentell) |

---

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe die Datei [LICENSE](./LICENSE) für Details.
