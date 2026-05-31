import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  X,
  Copy,
  Sun,
  Moon,
  BookOpen,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  CheckCheck
} from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import "./ReaderModeViewer.css";

interface ReaderModeViewerProps {
  bookmarkId: string;
  title: string;
  url?: string;
  initialContent: string;
  onClose: () => void;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// Helper to extract plain text from React elements (children) recursively
const getInnerText = (children: any): string => {
  if (!children) return "";
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(getInnerText).join("");
  }
  if (children.props && children.props.children) {
    return getInnerText(children.props.children);
  }
  return "";
};

export const ReaderModeViewer: React.FC<ReaderModeViewerProps> = ({
  bookmarkId,
  title,
  url,
  initialContent,
  onClose,
}) => {
  const { t, lang } = useLang();
  // Theme settings (loaded from localStorage or default)
  const [theme, setTheme] = useState<"light" | "sepia" | "dark">(() => {
    return (localStorage.getItem("clickbook_reader_theme") as any) || "dark";
  });
  const [fontFamily, setFontFamily] = useState<"serif" | "sans" | "mono">(() => {
    return (localStorage.getItem("clickbook_reader_font") as any) || "serif";
  });
  const [fontSize, setFontSize] = useState<"s" | "m" | "l" | "xl">(() => {
    return (localStorage.getItem("clickbook_reader_size") as any) || "m";
  });

  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isTOCVisible, setIsTOCVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Save layout configurations locally
  useEffect(() => {
    localStorage.setItem("clickbook_reader_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("clickbook_reader_font", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem("clickbook_reader_size", fontSize);
  }, [fontSize]);

  // Register recently read site
  useEffect(() => {
    if (!bookmarkId) return;
    chrome.storage.local.get(["clickbook_recent_reads"], (result) => {
      const recent = (result.clickbook_recent_reads as string[]) || [];
      const filtered = recent.filter((id) => id !== bookmarkId);
      const updated = [bookmarkId, ...filtered].slice(0, 8);
      chrome.storage.local.set({ clickbook_recent_reads: updated });
    });
  }, [bookmarkId]);

  // Calculate reading metrics
  const metrics = useMemo(() => {
    const text = initialContent || "";
    const cleanText = text
      .replace(/#{1,6}\s+/g, "")
      .replace(/[*`~_-]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const isAsian = lang === "ko" || lang === "ja";
    let count = 0;
    let readingTime = 0;

    if (isAsian) {
      count = cleanText.length;
      readingTime = Math.max(1, Math.ceil(count / 300));
    } else {
      const words = cleanText.split(/\s+/).filter(Boolean);
      count = words.length;
      readingTime = Math.max(1, Math.ceil(count / 200));
    }

    return { count, readingTime, isAsian };
  }, [initialContent, lang]);

  const savedScrollPercentRef = useRef<number | null>(null);
  const isRestoredRef = useRef(false);

  // Load saved scroll percentage
  useEffect(() => {
    isRestoredRef.current = false;
    chrome.storage.local.get(["clickbook_reader_scrolls"], (result) => {
      const scrolls = result.clickbook_reader_scrolls || {};
      const saved = scrolls[bookmarkId];
      if (typeof saved === "number") {
        savedScrollPercentRef.current = saved;
      } else {
        // No saved position: mark as restored immediately so scroll saving works from the start
        savedScrollPercentRef.current = null;
        isRestoredRef.current = true;
      }
    });
  }, [bookmarkId]);

  // Restore scroll position once content is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = containerRef.current;
      if (!el || isRestoredRef.current || savedScrollPercentRef.current === null) return;
      const totalHeight = el.scrollHeight - el.clientHeight;
      if (totalHeight > 0) {
        el.scrollTop = (savedScrollPercentRef.current / 100) * totalHeight;
        isRestoredRef.current = true;
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [initialContent]);

  // Save scroll position as the user scrolls
  const saveScrollProgress = () => {
    const el = containerRef.current;
    if (!el || !isRestoredRef.current) return;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight <= 0) return;
    const progress = (el.scrollTop / totalHeight) * 100;
    
    chrome.storage.local.get(["clickbook_reader_scrolls"], (result) => {
      const scrolls = result.clickbook_reader_scrolls || {};
      scrolls[bookmarkId] = progress;
      chrome.storage.local.set({ clickbook_reader_scrolls: scrolls });
    });
  };

  const saveTimeoutRef = useRef<any>(null);
  const handleScrollAndSave = () => {
    const el = containerRef.current;
    if (!el) return;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight <= 0) {
      setScrollProgress(100);
    } else {
      const progress = (el.scrollTop / totalHeight) * 100;
      setScrollProgress(progress);
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveScrollProgress();
    }, 300);
  };

  useEffect(() => {
    const el = containerRef.current;
    el?.addEventListener("scroll", handleScrollAndSave);
    return () => {
      el?.removeEventListener("scroll", handleScrollAndSave);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [bookmarkId, initialContent]);

  // Table of Contents generation
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  useEffect(() => {
    const parsed: TOCItem[] = [];
    const lines = (initialContent || "").split("\n");
    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s\uac00-\ud7a3\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, "")
          .trim()
          .replace(/\s+/g, "-");
        parsed.push({ id, text, level });
      }
    });
    setHeadings(parsed);
  }, [initialContent]);

  // Actions
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(initialContent || "");
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleCopyText = () => {
    // Simple regex strip of markdown annotations to get plain text
    const plainText = (initialContent || "")
      .replace(/#{1,6}\s+/g, "")
      .replace(/[*`~_-]/g, "")
      .replace(/\n\s*\n+/g, "\n\n")
      .trim();
    navigator.clipboard.writeText(plainText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ReactMarkdown components renderer to inject id to headings
  const renderHeading = (level: number) => ({ children, ...props }: any) => {
    const text = getInnerText(children);
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\uac00-\ud7a3\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
    return (
      <HeadingTag id={id} {...props}>
        {children}
      </HeadingTag>
    );
  };

  const mdComponents = {
    h1: renderHeading(1),
    h2: renderHeading(2),
    h3: renderHeading(3),
    h4: renderHeading(4),
    h5: renderHeading(5),
    h6: renderHeading(6),
  };

  const showSidebar = isTOCVisible && headings.length > 0;

  return (
    <div className={`reader-overlay reader-theme-${theme} ${showSidebar ? "reader-sidebar-open" : ""}`}>
      {/* Top scroll progress indicator */}
      <div className="reader-progress-container">
        <div className="reader-progress-bar" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Dynamic Table of Contents Sidebar */}
      {isTOCVisible && headings.length > 0 && (
        <aside className="reader-sidebar">
          <div className="reader-sidebar-header">
            <span className="reader-sidebar-title">{t("readerTOC")}</span>
            <button
              onClick={() => setIsTOCVisible(false)}
              className="reader-action-btn"
              title={t("readerTooltipHideTOC")}
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          <ul className="reader-toc-list">
            {headings.map((h, i) => (
              <li
                key={i}
                onClick={() => scrollToHeading(h.id)}
                className={`reader-toc-item reader-toc-level-${h.level}`}
              >
                {h.text}
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* Main Content Viewport */}
      <main className="reader-main">
        {/* Header Toolbar */}
        <header className="reader-toolbar">
          <div className="reader-title-area">
            {!isTOCVisible && headings.length > 0 && (
              <button
                onClick={() => setIsTOCVisible(true)}
                className="reader-action-btn"
                title={t("readerTooltipShowTOC")}
                style={{ marginRight: 8 }}
              >
                <PanelLeftOpen size={16} />
              </button>
            )}
            <div className="reader-doc-badge">
              <BookOpen size={12} style={{ marginRight: 4, display: "inline" }} />
              {t("readerTitle")}
            </div>
            <div className="reader-doc-badge" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#a78bfa", borderColor: "rgba(139, 92, 246, 0.25)" }}>
              <span>{t("estReadingTime", { n: metrics.readingTime })}</span>
              <span style={{ margin: "0 4px", opacity: 0.5 }}>•</span>
              <span>{metrics.isAsian ? t("characterCount", { n: metrics.count.toLocaleString() }) : t("wordsCount", { n: metrics.count.toLocaleString() })}</span>
            </div>
            <h1 className="reader-doc-title" title={title}>
              {title}
            </h1>
          </div>

          <div className="reader-controls">
            <div className="reader-controls-selectors">
              {/* Theme Toggle (Light / Sepia / Dark) */}
              <div className="reader-pill-selector">
                <button
                  onClick={() => setTheme("light")}
                  className={`reader-pill-btn ${theme === "light" ? "reader-pill-btn-active" : ""}`}
                  title={t("readerTooltipThemeLight")}
                >
                  <Sun size={14} />
                </button>
                <button
                  onClick={() => setTheme("sepia")}
                  className={`reader-pill-btn ${theme === "sepia" ? "reader-pill-btn-active" : ""}`}
                  title={t("readerTooltipThemeSepia")}
                  style={{ fontSize: "0.8rem" }}
                >
                  Sepia
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`reader-pill-btn ${theme === "dark" ? "reader-pill-btn-active" : ""}`}
                  title={t("readerTooltipThemeDark")}
                >
                  <Moon size={14} />
                </button>
              </div>

              {/* Font Family Selector */}
              <div className="reader-pill-selector">
                <button
                  onClick={() => setFontFamily("serif")}
                  className={`reader-pill-btn ${fontFamily === "serif" ? "reader-pill-btn-active" : ""}`}
                  title={t("readerFontSerif")}
                >
                  {t("readerFontSerif")}
                </button>
                <button
                  onClick={() => setFontFamily("sans")}
                  className={`reader-pill-btn ${fontFamily === "sans" ? "reader-pill-btn-active" : ""}`}
                  title={t("readerFontSans")}
                >
                  {t("readerFontSans")}
                </button>
                <button
                  onClick={() => setFontFamily("mono")}
                  className={`reader-pill-btn ${fontFamily === "mono" ? "reader-pill-btn-active" : ""}`}
                  title={t("readerFontMono")}
                >
                  {t("readerFontMono")}
                </button>
              </div>

              {/* Font Size Selector */}
              <div className="reader-pill-selector">
                <button
                  onClick={() => setFontSize("s")}
                  className={`reader-pill-btn ${fontSize === "s" ? "reader-pill-btn-active" : ""}`}
                  title="A-"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize("m")}
                  className={`reader-pill-btn ${fontSize === "m" ? "reader-pill-btn-active" : ""}`}
                  title="A"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize("l")}
                  className={`reader-pill-btn ${fontSize === "l" ? "reader-pill-btn-active" : ""}`}
                  title="A+"
                >
                  A+
                </button>
                <button
                  onClick={() => setFontSize("xl")}
                  className={`reader-pill-btn ${fontSize === "xl" ? "reader-pill-btn-active" : ""}`}
                  title="A++"
                >
                  A++
                </button>
              </div>
            </div>

            <div className="reader-controls-actions">
              {/* Utility Actions */}
              <button
                onClick={handleCopyMarkdown}
                className="reader-action-btn"
                title={t("readerTooltipCopyMarkdown")}
              >
                {copiedMarkdown ? <CheckCheck size={16} color="#10b981" /> : <Copy size={16} />}
              </button>

              <button
                onClick={handleCopyText}
                className="reader-action-btn"
                title={t("readerTooltipCopyText")}
              >
                {copiedText ? <CheckCheck size={16} color="#10b981" /> : <FileText size={16} />}
              </button>

              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="reader-action-btn"
                  title={t("readerTooltipOpenSource")}
                >
                  <ExternalLink size={16} />
                </a>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="reader-action-btn reader-close-btn"
                title={t("readerTooltipExit")}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div ref={containerRef} id="reader-scroll-container" className="reader-scroll-container">
          <div className="reader-content-wrap">
            <article
              className={`reader-markdown-content reader-font-${fontFamily} reader-size-${fontSize}`}
            >
              <ReactMarkdown components={mdComponents as any}>{initialContent}</ReactMarkdown>
              {/* Spacer at bottom */}
              <div className="reader-spacer" />
            </article>
          </div>
        </div>
      </main>
    </div>
  );
};
