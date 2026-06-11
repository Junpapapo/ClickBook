import { useState, useEffect, useRef } from "react";
import {
  BookmarkPlus, BookmarkCheck, ExternalLink, AlertCircle, CheckCircle2, Loader2,
  Sparkles, Cpu, AlignLeft, WrapText, Link, FileCode, Layers, ClipboardList, X,
  Settings, Globe2, Check, Sun, Moon, ShieldCheck,
  Database, Cookie, Download, History, HardDrive, KeyRound, Trash2, RefreshCw, StickyNote, BookOpen, Bug, MessageSquare
} from "lucide-react";
import ChromeBookmarkPanel from "@/components/ChromeBookmarkPanel";
import type { MessageResponse, MemoColor } from "@/shared/types";
import type { ClassifyMethod } from "@/shared/categorizer";
import { extractUrls } from "@/shared/utils";
import { MEMO_DOT, ALL_MEMO_COLORS } from "@/shared/colors";
import { useLang } from "@/shared/LanguageContext";
import { isAIAvailable, setAIEnabled, verifyAISession } from "@/shared/categorizer";

type Status = "idle" | "loading" | "success" | "duplicate" | "error";
type SaveResult = { folderName: string; method: ClassifyMethod };

const GITHUB_ISSUES_URL = "https://github.com/Junpapapo/ClickBook/issues/new/choose";
const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd84kbl768v0lx8rJMw4jq-cnS9fwwVj45fFBHEmG5Wu5iMCg/viewform?usp=dialog";


export default function Popup() {
  const { t, lang, setLang } = useLang();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [isTogglingAi, setIsTogglingAi] = useState(false);
  const [tabUrl, setTabUrl] = useState("");
  const [tabTitle, setTabTitle] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [bulkStatus, setBulkStatus] = useState<"idle" | "loading" | "done">("idle");
  const [bulkResult, setBulkResult] = useState<{ saved: number; skipped: number } | null>(null);
  const [textImportOpen, setTextImportOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textImportStatus, setTextImportStatus] = useState<"idle" | "loading" | "done">("idle");
  const [textImportResult, setTextImportResult] = useState<{ saved: number; skipped: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chromePanel, setChromePanel] = useState(false);
  const [openDashboardInNewTab, setOpenDashboardInNewTab] = useState(false);
  const [clearSelections, setClearSelections] = useState({
    cache: true, cookies: true, downloads: false, history: false, storage: false, passwords: false,
  });
  const [clearStatus, setClearStatus] = useState<"idle" | "loading" | "done">("idle");
  const [existingBookmarkId, setExistingBookmarkId] = useState<string | null>(null);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoText, setMemoText] = useState("");
  const [memoColor, setMemoColor] = useState<MemoColor>("yellow");
  const [memoStatus, setMemoStatus] = useState<"idle" | "loading" | "done">("idle");
  const [tabGroups, setTabGroups] = useState<chrome.tabGroups.TabGroup[]>([]);
  const [isCurrentTabSecure, setIsCurrentTabSecure] = useState(false);
  const [isReaderLoading, setIsReaderLoading] = useState(false);

  const [popupTheme, setPopupThemeState] = useState<"light" | "dark">(() => {
    const s = localStorage.getItem("clickbook_theme");
    return s === "light" ? "light" : "dark";
  });

  function applyTheme(t: "light" | "dark") {
    setPopupThemeState(t);
    localStorage.setItem("clickbook_theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", popupTheme === "dark");
  }, []);

  useEffect(() => {
    chrome.storage.local.get([
      "clickbook_popup_chrome", 
      "clickbook_settings"
    ], (r) => {
      if (r.clickbook_popup_chrome === true) setChromePanel(true);
      if (r.clickbook_settings?.openDashboardInNewTab !== undefined) {
        setOpenDashboardInNewTab(r.clickbook_settings.openDashboardInNewTab);
      }
    });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    async function init() {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        setTabUrl(tab.url);

        // Check if current tab is secure
        try {
          const secRes = await chrome.runtime.sendMessage({ type: "CHECK_DOMAIN_SECURE", url: tab.url }) as MessageResponse;
          if (secRes.success && secRes.isSecure) {
            setIsCurrentTabSecure(true);
          }
        } catch (err) {
          console.warn("Failed to check if domain is secure:", err);
        }

        const res = await chrome.runtime.sendMessage({ type: "GET_ALL_DATA" }) as MessageResponse;
        if (res.success && res.data) {
          const data = res.data as { bookmarks: Array<{ id: string; url: string }> };
          const bm = data.bookmarks.find((b) => b.url === tab.url);
          if (bm) {
            setExistingBookmarkId(bm.id);
            const memosRes = await chrome.runtime.sendMessage({ type: "GET_MEMOS" }) as MessageResponse;
            if (memosRes.success && memosRes.data) {
              const memos = memosRes.data as Record<string, { content: string; color: string }>;
              const memo = memos[bm.id];
              if (memo) {
                setMemoText(memo.content);
                setMemoColor(memo.color as MemoColor);
              }
            }
          }
        }
      }
      if (tab?.title) setTabTitle(tab.title);

      // Get tab groups
      try {
        const groupsRes = await chrome.runtime.sendMessage({ type: "GET_CHROME_TAB_GROUPS" }) as MessageResponse;
        if (groupsRes.success && Array.isArray(groupsRes.data)) {
          setTabGroups(groupsRes.data as chrome.tabGroups.TabGroup[]);
        }
      } catch (e) {
        console.warn("Failed to get tab groups:", e);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function checkAI() {
      const available = await isAIAvailable();
      setAiAvailable(available);
    }
    checkAI();

    // storage 변경 감지 (다른 탭/팝업에서 토글 시 반영)
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.clickbook_ai_enabled) {
        setAiAvailable(changes.clickbook_ai_enabled.newValue === true);
      }
      if (changes.clickbook_settings) {
        const next = changes.clickbook_settings.newValue;
        if (next && next.openDashboardInNewTab !== undefined) {
          setOpenDashboardInNewTab(next.openDashboardInNewTab);
        }
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  async function handleSave() {
    setStatus("loading");
    setSaveResult(null);
    try {
      const res = await chrome.runtime.sendMessage({ type: "SAVE_TAB" }) as MessageResponse;
      if (res.success) {
        setStatus("success");
        setMessage(t("popupSaved"));
        const d = res.data as { folderName?: string; method?: ClassifyMethod; bookmark?: { id: string } } | undefined;
        if (d?.folderName && d?.method) setSaveResult({ folderName: d.folderName, method: d.method });
        if (d?.bookmark?.id) setExistingBookmarkId(d.bookmark.id);
      } else if (res.isDuplicate) {
        setStatus("duplicate");
        setMessage(t("popupDuplicate"));
      } else {
        setStatus("error");
        setMessage(res.error ?? t("popupSaveFailed"));
      }
    } catch (err) { console.warn("Operation failed:", err); setStatus("error"); setMessage(t("popupError")); }
  }

  async function handleOpenPopupReader() {
    setIsReaderLoading(true);
    let targetBookmarkId = existingBookmarkId;

    if (!targetBookmarkId) {
      // Not bookmarked yet. Save first.
      try {
        const res = await chrome.runtime.sendMessage({ type: "SAVE_TAB" }) as MessageResponse;
        if (res.success) {
          const d = res.data as { folderName?: string; method?: ClassifyMethod; bookmark?: { id: string } } | undefined;
          if (d?.bookmark?.id) {
            targetBookmarkId = d.bookmark.id;
            setExistingBookmarkId(d.bookmark.id);
            if (d?.folderName && d?.method) setSaveResult({ folderName: d.folderName, method: d.method });
          }
        } else if (res.isDuplicate) {
          const dataRes = await chrome.runtime.sendMessage({ type: "GET_ALL_DATA" }) as MessageResponse;
          if (dataRes.success && dataRes.data) {
            const data = dataRes.data as { bookmarks: Array<{ id: string; url: string }> };
            const bm = data.bookmarks.find((b) => b.url === tabUrl);
            if (bm) {
              targetBookmarkId = bm.id;
              setExistingBookmarkId(bm.id);
            }
          }
        }
      } catch (err) {
        console.warn("Auto-save failed inside offline reader:", err);
      }
    }

    if (!targetBookmarkId) {
      setStatus("error");
      setMessage(t("popupSaveFailed"));
      setIsReaderLoading(false);
      return;
    }

    // Redirect to dashboard with reader parameter
    const url = chrome.runtime.getURL(`src/newtab/index.html?mode=dashboard&reader=${targetBookmarkId}`);
    if (openDashboardInNewTab) {
      chrome.tabs.create({ url });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id !== undefined) {
          chrome.tabs.update(tabs[0].id, { url });
          window.close();
        }
      });
    }
    setIsReaderLoading(false);
  }

  async function handleBulkSave() {
    setBulkStatus("loading");
    setBulkResult(null);
    const tabs = await chrome.tabs.query({});
    const validTabs = tabs
      .filter((t) => t.url && (t.url.startsWith("http://") || t.url.startsWith("https://")) && t.title)
      .map((t) => ({ url: t.url!, title: t.title ?? t.url! }));
    if (validTabs.length === 0) { setBulkStatus("idle"); return; }
    const res = await chrome.runtime.sendMessage({ type: "BULK_IMPORT_CHROME", items: validTabs }) as MessageResponse;
    const saved = (res.success && res.data) ? ((res.data as { count: number }).count ?? 0) : 0;
    setBulkStatus("done");
    setBulkResult({ saved, skipped: validTabs.length - saved });
    setTimeout(() => { setBulkStatus("idle"); setBulkResult(null); }, 3000);
  }

  async function handleTextImport() {
    const urls = extractUrls(textInput);
    if (urls.length === 0) return;
    setTextImportStatus("loading");
    setTextImportResult(null);
    const items = urls.map(u => ({ url: u, title: u }));
    const res = await chrome.runtime.sendMessage({ type: "BULK_IMPORT_CHROME", items }) as MessageResponse;
    const saved = (res.success && res.data) ? ((res.data as { count: number }).count ?? 0) : 0;
    setTextImportStatus("done");
    setTextImportResult({ saved, skipped: urls.length - saved });
    if (saved > 0) setTextInput("");
    setTimeout(() => { setTextImportStatus("idle"); setTextImportResult(null); }, 4000);
  }

  async function handleSaveMemo() {
    if (!memoText.trim()) return;
    setMemoStatus("loading");

    let bookmarkId = existingBookmarkId;

    // ブックマーク未登録の場合は先に保存する
    if (!bookmarkId) {
      try {
        const res = await chrome.runtime.sendMessage({ type: "SAVE_TAB" }) as MessageResponse;
        if (res.success) {
          const d = res.data as { folderName?: string; method?: ClassifyMethod; bookmark?: { id: string } } | undefined;
          if (d?.bookmark?.id) {
            bookmarkId = d.bookmark.id;
            setExistingBookmarkId(d.bookmark.id);
            if (d?.folderName && d?.method) setSaveResult({ folderName: d.folderName, method: d.method });
          }
        } else if (res.isDuplicate) {
          const dataRes = await chrome.runtime.sendMessage({ type: "GET_ALL_DATA" }) as MessageResponse;
          if (dataRes.success && dataRes.data) {
            const data = dataRes.data as { bookmarks: Array<{ id: string; url: string }> };
            const bm = data.bookmarks.find((b) => b.url === tabUrl);
            if (bm) { bookmarkId = bm.id; setExistingBookmarkId(bm.id); }
          }
        }
      } catch (err) {
        console.warn("Operation failed:", err);
        setMemoStatus("idle");
        return;
      }
    }

    if (!bookmarkId) { setMemoStatus("idle"); return; }
    await chrome.runtime.sendMessage({ type: "SAVE_MEMO", bookmarkId, content: memoText.trim(), color: memoColor });
    setMemoStatus("done");
    setTimeout(() => setMemoStatus("idle"), 1500);
  }

  async function handleSaveTabGroup(groupId: number, name: string) {
    try {
      const res = await chrome.runtime.sendMessage({
        type: "SAVE_TAB_GROUP_AS_FOLDER",
        groupId,
        name
      }) as MessageResponse;
      if (res.success) {
        setStatus("success");
        setTabGroups(prev => prev.filter(g => g.id !== groupId));
        const d = res.data as { folder?: { name: string }; savedCount?: number };
        setMessage(t("popupSaved") + ` (${d.savedCount} tabs saved to ${d.folder?.name})`);
      } else {
        setStatus("error");
        setMessage(res.error || t("popupSaveFailed"));
      }
    } catch (e) {
      setStatus("error");
      setMessage(t("popupError"));
    }
  }

  async function handleClearData() {
    if (!Object.values(clearSelections).some(Boolean)) return;
    setClearStatus("loading");
    try {
      const dataTypes: chrome.browsingData.DataTypeSet = {
        ...(clearSelections.cache     && { cache: true }),
        ...(clearSelections.cookies   && { cookies: true }),
        ...(clearSelections.downloads && { downloads: true }),
        ...(clearSelections.history   && { history: true }),
        ...(clearSelections.storage   && { localStorage: true }),
        ...(clearSelections.passwords && { passwords: true }),
      };
      await chrome.browsingData.remove({}, dataTypes);
      setClearStatus("done");
      setTimeout(() => setClearStatus("idle"), 2000);
    } catch (err) {
      console.warn("Operation failed:", err);
      setClearStatus("idle");
    }
  }

  async function handleHardReload() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id !== undefined) {
      await chrome.tabs.reload(tab.id, { bypassCache: true });
    }
  }

  async function copyFormat(idx: number, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  const COPY_ACTIONS = [
    { label: "Simple",    desc: t("copySimpleDesc"),    example: "Title URL",     Icon: AlignLeft, format: () => `${tabTitle} ${tabUrl}` },
    { label: "Breakline", desc: t("copyBreaklineDesc"), example: "Title↵URL",     Icon: WrapText,  format: () => `${tabTitle}\n${tabUrl}` },
    { label: "URL Only",  desc: t("copyUrlDesc"),       example: "https://...",   Icon: Link,      format: () => tabUrl },
    { label: "Markdown",  desc: t("copyMarkdownDesc"),  example: "[Title](URL)",  Icon: FileCode,  format: () => `[${tabTitle}](${tabUrl})` },
    { label: "Backlog",   desc: t("copyBacklogDesc"),   example: "[[Title:URL]]", Icon: Layers,    format: () => `[[${tabTitle}:${tabUrl}]]` },
  ];

  const CLEAR_ITEMS = [
    { key: "cache"     as const, label: t("popupCacheLabel"),     Icon: Database  },
    { key: "cookies"   as const, label: "Cookie",                 Icon: Cookie    },
    { key: "downloads" as const, label: t("popupDownloadsLabel"), Icon: Download  },
    { key: "history"   as const, label: t("popupHistoryLabel"),   Icon: History   },
    { key: "storage"   as const, label: t("popupStorageLabel"),   Icon: HardDrive },
    { key: "passwords" as const, label: t("popupPasswordsLabel"), Icon: KeyRound  },
  ];

  return (
    <div className="w-96 bg-surface-900 text-gray-100 p-4 flex flex-col gap-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icons/icon128.png" alt="ClickBook" className="w-5 h-5 rounded-sm" />
          <h1 className="text-base font-semibold tracking-tight">ClickBook</h1>
        </div>
        <div className="flex items-center gap-1.5">
          {aiAvailable !== null && (
            <button
              onClick={async () => {
                if (isTogglingAi) return;
                const next = !aiAvailable;
                if (next) {
                  setIsTogglingAi(true);
                  const actuallyAvailable = await verifyAISession();
                  setIsTogglingAi(false);
                  if (!actuallyAvailable) {
                    setStatus("error");
                    setMessage(t("aiNotAvailable"));
                    return;
                  }
                }
                await setAIEnabled(next);
                setAiAvailable(next);
              }}
              title={aiAvailable ? t("popupAiAvailableTitle") : t("popupAiUnavailableTitle")}
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium cursor-pointer transition-all duration-200 ${
                aiAvailable
                  ? "bg-purple-900/60 text-purple-300 border border-purple-700/50 hover:bg-purple-800/60"
                  : "bg-surface-800 text-gray-600 border border-surface-700 hover:bg-surface-700 hover:text-gray-400"
              }`}
            >
              {isTogglingAi ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              {isTogglingAi ? "TESTING..." : aiAvailable ? "AI ON" : "AI OFF"}
            </button>
          )}
          {/* 管理ページへ */}
          <button
            onClick={() => {
              const url = chrome.runtime.getURL("src/newtab/index.html?mode=dashboard");
              if (openDashboardInNewTab) {
                chrome.tabs.create({ url });
              } else {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                  if (tabs[0]?.id !== undefined) {
                    chrome.tabs.update(tabs[0].id, { url });
                    window.close();
                  }
                });
              }
            }}
            title={t("popupManageTitle")}
            className="p-1.5 rounded-lg text-gray-400 bg-surface-700 hover:bg-surface-600 hover:text-white transition-colors"
          >
            <ExternalLink size={14} />
          </button>
          {/* 設定ギア */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen(o => !o)}
              title={t("popupSettingsTitle")}
              className={`p-1.5 rounded-lg transition-colors ${
                settingsOpen
                  ? "text-white bg-indigo-600"
                  : "text-gray-300 bg-surface-700 hover:bg-surface-600 hover:text-white"
              }`}
            >
              <Settings size={15} />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-surface-800 border border-surface-600 rounded-xl shadow-xl py-1">

              <div className="px-3 pt-2 pb-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t("popupTheme")}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => applyTheme("light")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors ${
                        popupTheme === "light" ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-surface-700"
                      }`}
                    >
                      <Sun size={11} /> {t("popupLight")}
                    </button>
                    <button
                      onClick={() => applyTheme("dark")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors ${
                        popupTheme === "dark" ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-surface-700"
                      }`}
                    >
                      <Moon size={11} /> {t("popupDark")}
                    </button>
                  </div>
                </div>
                <div className="border-t border-surface-700 mx-2 my-1" />
                <div className="px-3 pb-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t("settingsLanguage")}</p>
                  <div className="flex gap-1">
                    {(["en", "ja", "ko"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          lang === l ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-surface-700"
                        }`}
                      >
                        {l === "en" ? "EN" : l === "ja" ? "日本語" : "한국어"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-surface-700 mx-2 my-1" />
                <button
                  onClick={() => { setTextImportOpen(o => !o); setSettingsOpen(false); setTimeout(() => textareaRef.current?.focus(), 50); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-700 text-gray-300 text-xs transition-colors"
                >
                  <ClipboardList size={13} />
                  {t("popupTextImportMenu")}
                </button>
                <div className="border-t border-surface-700 mx-2 my-1" />
                <button
                  onClick={() => {
                    const v = !chromePanel;
                    setChromePanel(v);
                    chrome.storage.local.set({ clickbook_popup_chrome: v });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-700 text-gray-300 text-xs transition-colors"
                >
                  <Globe2 size={13} />
                  {t("popupChromePanelMenu")}
                  <span className={`ml-auto w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    chromePanel ? "bg-indigo-500 border-indigo-500" : "border-surface-500"
                  }`}>
                    {chromePanel && <Check size={9} className="text-white" />}
                  </span>
                </button>
                {/* ── Feedback Links ─────────────────── */}
                <div className="border-t border-surface-700 mx-2 my-1" />
                <button
                  onClick={() => {
                    chrome.tabs.create({ url: GITHUB_ISSUES_URL });
                    setSettingsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-700 text-gray-300 text-xs transition-colors"
                >
                  <Bug size={13} />
                  {t("feedbackBugReport")}
                  <ExternalLink size={9} className="ml-auto text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    chrome.tabs.create({ url: FEEDBACK_FORM_URL });
                    setSettingsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-700 text-gray-300 text-xs transition-colors rounded-b-xl"
                >
                  <MessageSquare size={13} />
                  {t("feedbackQuick")}
                  <ExternalLink size={9} className="ml-auto text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCurrentTabSecure && (
        <div className="flex gap-3 items-start bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 shadow-lg backdrop-blur-md transition-all duration-300">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.15)] animate-pulse">
            <ShieldCheck size={16} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 tracking-tight">
              {t("popupSecureActive")}
            </p>
            <p className="text-[10px] text-emerald-500/80 leading-relaxed font-medium">
              {t("popupSecureDesc")}
            </p>
          </div>
        </div>
      )}

      {/* 탭 그룹 동기화 (Tab Groups Sync) */}
      {tabGroups.length > 0 && (
        <div className="flex flex-col gap-2 bg-indigo-950/40 border border-indigo-900/60 rounded-xl p-3">
          <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Layers size={12} />
            {t("saveTabGroupAsFolder")}
          </p>
          <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
            {tabGroups.map((group) => {
              const colorClasses: Record<string, string> = {
                grey: "border-gray-500 bg-gray-500/10 text-gray-300",
                blue: "border-blue-500 bg-blue-500/10 text-blue-300",
                red: "border-red-500 bg-red-500/10 text-red-300",
                yellow: "border-yellow-500 bg-yellow-500/10 text-yellow-300",
                green: "border-emerald-500 bg-emerald-500/10 text-emerald-300",
                pink: "border-pink-500 bg-pink-500/10 text-pink-300",
                purple: "border-purple-500 bg-purple-500/10 text-purple-300",
                cyan: "border-cyan-500 bg-cyan-500/10 text-cyan-300",
                orange: "border-orange-500 bg-orange-500/10 text-orange-300",
              };
              const cls = colorClasses[group.color] || colorClasses.grey;
              const title = group.title || `${group.color.toUpperCase()} Group`;
              return (
                <div key={group.id} className={`flex items-center justify-between border rounded-lg px-2.5 py-1.5 ${cls}`}>
                  <span className="text-xs font-semibold truncate max-w-[180px]">{title}</span>
                  <button
                    onClick={() => handleSaveTabGroup(group.id, title)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold active:scale-95 transition-all cursor-pointer"
                  >
                    <BookmarkPlus size={10} />
                    {t("saveGroup")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ブックマック管理 */}
      <p className="text-[10px] text-orange-400 uppercase tracking-wider font-medium -mb-1">{t("popupBookmarkSection")}</p>

      {/* 保存ボタン行 */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={status === "loading" || status === "success"}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-xs cursor-pointer"
          >
            {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : <BookmarkPlus size={14} />}
            {t("popupSave")}
          </button>
          <button
            onClick={handleOpenPopupReader}
            disabled={isReaderLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-xs text-white shadow-[0_0_12px_rgba(139,92,246,0.25)] hover:shadow-[0_0_18px_rgba(139,92,246,0.45)] border border-purple-500/20 cursor-pointer"
          >
            {isReaderLoading ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
            {t("offlineReaderBtn")}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBulkSave}
            disabled={bulkStatus === "loading"}
            title={t("popupBulkSaveTitle")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-[11px] cursor-pointer"
          >
            {bulkStatus === "loading" ? <Loader2 size={12} className="animate-spin" /> : <BookmarkCheck size={12} />}
            {t("popupBulkSave")}
          </button>
          <button
            onClick={() => { setTextImportOpen(o => !o); setTimeout(() => textareaRef.current?.focus(), 50); }}
            title={t("popupTextImportTitle")}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded active:scale-95 transition-all text-[11px] font-medium cursor-pointer ${
              textImportOpen
                ? "bg-indigo-600 text-white"
                : "bg-surface-700 hover:bg-surface-600 text-gray-300 hover:text-indigo-300"
            }`}
          >
            <ClipboardList size={12} />
            {t("popupTextImportMenu")}
          </button>
          <button
            onClick={() => setMemoOpen(o => !o)}
            title={t("popupMemoTitle")}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded active:scale-95 transition-all text-[11px] font-medium cursor-pointer ${
              memoOpen
                ? "bg-indigo-600 text-white"
                : "bg-surface-700 hover:bg-surface-600 text-gray-300 hover:text-indigo-300"
            }`}
          >
            <StickyNote size={12} />
            {t("memo")}
          </button>
        </div>
      </div>

      {/* テキストインポートパネル */}
      {textImportOpen && (
        <div className="flex flex-col gap-2 bg-surface-800 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-amber-400 flex items-center gap-1.5">
              <ClipboardList size={12} />
              {t("popupTextImportPanel")}
            </p>
            <button onClick={() => setTextImportOpen(false)} className="text-gray-600 hover:text-gray-400">
              <X size={12} />
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder={t("bulkImportPlaceholder")}
            rows={5}
            className="w-full text-xs bg-surface-900 border border-surface-600 rounded-lg px-2.5 py-2 text-gray-200 outline-none focus:border-amber-500 transition-colors placeholder-gray-700 resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-gray-600">
              {textInput ? t("popupTextDetected", { n: extractUrls(textInput).length }) : t("popupTextAutoDetect")}
            </p>
            <button
              onClick={handleTextImport}
              disabled={textImportStatus === "loading" || extractUrls(textInput).length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
            >
              {textImportStatus === "loading" ? <Loader2 size={11} className="animate-spin" /> : <BookmarkCheck size={11} />}
              {textImportStatus === "loading" ? t("popupTextImporting") : t("popupTextImportBtn")}
            </button>
          </div>
          {textImportResult && (
            <p className={`text-[11px] flex items-center gap-1.5 ${
              textImportResult.saved > 0 ? "text-emerald-400" : "text-amber-400"
            }`}>
              <CheckCircle2 size={12} />
              {t("popupTextResult", { saved: textImportResult.saved, skipped: textImportResult.skipped })}
            </p>
          )}
        </div>
      )}

      {/* メモパネル */}
      {memoOpen && (
        <div className="flex flex-col gap-2 bg-surface-800 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-yellow-400 flex items-center gap-1.5">
              <StickyNote size={12} />
              {t("popupMemoPanel")}
            </p>
            <button onClick={() => setMemoOpen(false)} className="text-gray-600 hover:text-gray-400">
              <X size={12} />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {ALL_MEMO_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setMemoColor(c)}
                className={`w-4 h-4 rounded-full ${MEMO_DOT[c]} transition-all ${
                  memoColor === c
                    ? "ring-2 ring-offset-1 ring-gray-400 ring-offset-surface-800"
                    : "opacity-50 hover:opacity-100"
                }`}
              />
            ))}
          </div>
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            autoFocus
            placeholder={t("popupMemoPlaceholder")}
            rows={3}
            onKeyDown={(e) => { if (e.key === "Escape") setMemoOpen(false); }}
            className="w-full text-xs bg-surface-900 border border-surface-700 rounded-lg px-2.5 py-2 text-gray-200 outline-none focus:border-yellow-500/50 transition-colors placeholder-gray-700 resize-none leading-relaxed"
          />
          {!existingBookmarkId && memoText.trim() && (
            <p className="text-[10px] text-gray-500">{t("popupMemoAutoBookmark")}</p>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleSaveMemo}
              disabled={memoStatus === "loading" || !memoText.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
            >
              {memoStatus === "loading" ? <Loader2 size={11} className="animate-spin" /> : memoStatus === "done" ? <CheckCircle2 size={11} /> : <StickyNote size={11} />}
              {memoStatus === "done" ? t("popupMemoSaved") : t("popupMemoSave")}
            </button>
          </div>
        </div>
      )}

      {/* ステータス */}
      {status === "success" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle2 size={15} />{message}
          </div>
          {saveResult && (
            <div className="flex items-center justify-between bg-surface-800 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-400">
                📂 <span className="text-gray-200 font-medium">{saveResult.folderName}</span>
              </span>
              <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${saveResult.method === "ai" ? "bg-purple-900/60 text-purple-300" : "bg-surface-700 text-gray-500"}`}>
                {saveResult.method === "ai" ? <><Sparkles size={9} /> AI</> : <><Cpu size={9} /> {t("popupRuleBased")}</>}
              </span>
            </div>
          )}
        </div>
      )}
      {status === "duplicate" && (
        <div className="flex items-center gap-2 text-amber-400 text-sm"><AlertCircle size={15} />{message}</div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle size={15} />{message}</div>
      )}
      {bulkResult && (
        <div className="flex items-center gap-2 text-teal-400 text-xs">
          <BookmarkCheck size={13} />
          <span>{t("popupBulkResult", { saved: bulkResult.saved, skipped: bulkResult.skipped })}</span>
        </div>
      )}

      {/* URL コピーツールバー */}
      {tabUrl && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] text-orange-400 uppercase tracking-wider font-medium">{t("popupUrlCopySection")}</p>
          <div className="flex items-center justify-between bg-surface-700 rounded-lg px-1 py-1.5">
            {COPY_ACTIONS.map((action, idx) => {
              const tipPos =
                idx === 0 ? "left-0"
                : idx === COPY_ACTIONS.length - 1 ? "right-0"
                : "left-1/2 -translate-x-1/2";
              return (
              <div key={idx} className="relative group flex flex-col items-center">
                <button
                  onClick={() => copyFormat(idx, action.format())}
                  className={`flex items-center justify-center p-2 rounded-md transition-all active:scale-95 ${
                    copiedIdx === idx
                      ? "text-emerald-400 bg-emerald-400/10"
                      : "text-gray-300 hover:text-indigo-300 hover:bg-surface-600"
                  }`}
                >
                  {copiedIdx === idx ? <Check size={16} /> : <action.Icon size={16} />}
                </button>
                {/* ツールチップ */}
                <div className={`absolute bottom-full mb-3 ${tipPos} w-36 bg-surface-700 border border-surface-600 text-[10px] rounded-lg px-2.5 py-2 text-center shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 leading-relaxed`}>
                  <p className="font-semibold text-gray-100 mb-0.5">{action.label}</p>
                  <p className="text-gray-400 mb-1">{action.desc}</p>
                  <p className="text-indigo-300 font-mono text-[9px] bg-surface-900 rounded px-1 py-0.5">{action.example}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-surface-600" />
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ブラウザデータ削除 */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] text-orange-400 uppercase tracking-wider font-medium">{t("popupBrowserDataSection")}</p>
        <div className="flex items-center justify-between bg-surface-800 rounded-lg px-2 py-1.5">
          {CLEAR_ITEMS.map(({ key, label, Icon }, idx) => {
            const selected = clearSelections[key];
            const tipPos = idx === 0 ? "left-0" : idx === CLEAR_ITEMS.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2";
            return (
              <div key={key} className="relative group flex flex-col items-center">
                <button
                  onClick={() => setClearSelections(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={`p-2 rounded-md transition-colors ${
                    selected
                      ? "text-red-400 bg-red-500/15"
                      : "text-gray-600 hover:text-gray-400 hover:bg-surface-700"
                  }`}
                >
                  <Icon size={14} />
                </button>
                <div className={`absolute bottom-full mb-2 ${tipPos} bg-surface-700 border border-surface-600 text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap`}>
                  <p className={`font-medium ${selected ? "text-red-300" : "text-gray-300"}`}>{label}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-surface-600" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearData}
            disabled={clearStatus === "loading" || !Object.values(clearSelections).some(Boolean)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium"
          >
            {clearStatus === "loading" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : clearStatus === "done" ? (
              <CheckCircle2 size={13} />
            ) : (
              <Trash2 size={13} />
            )}
            {clearStatus === "done" ? t("popupClearDone") : "CLEAR"}
          </button>
          <button
            onClick={handleHardReload}
            title={t("popupHardReloadTitle")}
            className="shrink-0 flex items-center justify-center px-3.5 py-2 rounded-lg bg-surface-700 hover:bg-indigo-600 text-gray-400 hover:text-white active:scale-95 transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {aiAvailable === false && (
        <p className="text-[10px] text-orange-400 text-center pb-2">
          {t("popupAiNote")}
        </p>
      )}

      {/* Chrome ブックマークパネル */}
      {chromePanel && (
        <div className="border-t border-surface-700 -mx-4 px-0 pt-0">
          <ChromeBookmarkPanel onRefresh={() => {}} />
        </div>
      )}
    </div>
  );
}
