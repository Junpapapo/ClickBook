import { useState } from "react";
import {
  X,
  Share2,
  FileText,
  Code,
  Download,
  Copy,
  Printer,
  Check,
} from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string; // HTML content from Tiptap editor
}

export default function SpringNoteExportModal({
  isOpen,
  onClose,
  title,
  content,
}: Props) {
  const { lang, t } = useLang();
  const isKo = lang === "ko";
  const isJa = lang === "ja";
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const safeTitle = title.trim() || (isKo ? "무제_스프링노트" : isJa ? "無題_スプリングノート" : "Untitled_SpringNote");
  const fileNameSlug = safeTitle.replace(/[/\\?%*:|"<>]/g, "_");

  // Helper to convert HTML to simple clean Markdown
  const htmlToMarkdown = (htmlStr: string): string => {
    let md = htmlStr;
    // Headings
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
    // Text formatting
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
    md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, "<u>$1</u>");
    md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~");
    md = md.replace(/<strike[^>]*>(.*?)<\/strike>/gi, "~~$1~~");
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
    // Paragraphs and breaks
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
    md = md.replace(/<br\s*\/?>/gi, "\n");
    // List items
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
    // Strip remaining tags
    md = md.replace(/<[^>]+>/g, "");
    // Decode basic entities
    md = md
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    return md.trim();
  };

  // Helper to strip HTML to plain text
  const htmlToPlainText = (htmlStr: string): string => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = htmlStr;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleDownload = (format: "md" | "html" | "txt") => {
    let contentToDownload = "";
    let mimeType = "text/plain;charset=utf-8";
    let ext = format;

    if (format === "md") {
      contentToDownload = `# ${safeTitle}\n\n${htmlToMarkdown(content)}`;
      mimeType = "text/markdown;charset=utf-8";
    } else if (format === "html") {
      contentToDownload = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 2rem; max-w: 800px; margin: 0 auto; color: #333; }
    h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    pre { background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto; }
    code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  ${content}
</body>
</html>`;
      mimeType = "text/html;charset=utf-8";
    } else if (format === "txt") {
      contentToDownload = `${safeTitle}\n${"=".repeat(safeTitle.length)}\n\n${htmlToPlainText(content)}`;
      mimeType = "text/plain;charset=utf-8";
    }

    const blob = new Blob([contentToDownload], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileNameSlug}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (format: "md" | "text") => {
    const textToCopy = format === "md" ? `# ${safeTitle}\n\n${htmlToMarkdown(content)}` : htmlToPlainText(content);
    navigator.clipboard.writeText(textToCopy);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${safeTitle}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 2rem; color: #1e293b; }
    h1 { border-bottom: 2px solid #cbd5e1; padding-bottom: 0.5rem; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <div>${content}</div>
  <script>window.onload = function() { window.print(); window.close(); };</script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-surface-900 border border-slate-200 dark:border-surface-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-surface-800 bg-slate-50/80 dark:bg-surface-950/60">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <Share2 size={18} />
            <span>{isKo ? "스프링노트 내보내기 & 공유" : isJa ? "スプリングノート エクスポート＆共有" : "Export & Share Note"}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
            title={t("closeTooltip")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-100/70 dark:bg-surface-800/60 rounded-xl border border-slate-200/60 dark:border-surface-700/60">
            <p className="text-[11px] text-slate-400 font-medium">{isKo ? "대상 노트 제목" : isJa ? "対象ノートタイトル" : "Target Note Title"}</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">{safeTitle}</p>
          </div>

          {/* Export Options Grid */}
          <div className="space-y-2.5">
            {/* Markdown Export */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-surface-800/40 border border-slate-200/80 dark:border-surface-700/60 hover:border-amber-400/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Code size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Markdown (.md)</p>
                  <p className="text-[10px] text-slate-400">{isKo ? "마크다운 문서 저장 및 복사" : isJa ? "Markdownドキュメントの保存・コピー" : "Save/copy as Markdown"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy("md")}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                  title={isKo ? "마크다운 복사" : isJa ? "Markdownをコピー" : "Copy Markdown"}
                >
                  {copiedFormat === "md" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => handleDownload("md")}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                >
                  <Download size={13} />
                  <span>MD</span>
                </button>
              </div>
            </div>

            {/* HTML Export */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-surface-800/40 border border-slate-200/80 dark:border-surface-700/60 hover:border-indigo-400/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">HTML 웹 문서 (.html)</p>
                  <p className="text-[10px] text-slate-400">{isKo ? "웹 브라우저용 서식 문서" : isJa ? "ウェブブラウザ用フォーマット文書" : "Web document with styles"}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload("html")}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
              >
                <Download size={13} />
                <span>HTML</span>
              </button>
            </div>

            {/* Plain Text Export */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-surface-800/40 border border-slate-200/80 dark:border-surface-700/60 hover:border-emerald-400/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">순수 텍스트 (.txt)</p>
                  <p className="text-[10px] text-slate-400">{isKo ? "서식 없는 일반 텍스트" : isJa ? "書式なしプレーンテキスト" : "Plain unformatted text"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy("text")}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                  title={isKo ? "텍스트 복사" : isJa ? "テキストをコピー" : "Copy Text"}
                >
                  {copiedFormat === "text" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => handleDownload("txt")}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                >
                  <Download size={13} />
                  <span>TXT</span>
                </button>
              </div>
            </div>

            {/* Print & PDF */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-surface-800/40 border border-slate-200/80 dark:border-surface-700/60 hover:border-purple-400/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Printer size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{isKo ? "인쇄 / PDF 미리보기" : isJa ? "印刷 / PDFプレビュー" : "Print / Save to PDF"}</p>
                  <p className="text-[10px] text-slate-400">{isKo ? "브라우저 인쇄 모달을 통한 PDF 저장" : isJa ? "ブラウザ印刷ダイアログによるPDF保存" : "Print layout or PDF save"}</p>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
              >
                <Printer size={13} />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-surface-800 bg-slate-50/60 dark:bg-surface-950/60 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {isKo 
              ? "💡 언제든지 원하는 포맷으로 자유롭게 내보내세요." 
              : isJa
              ? "💡 いつでもお好みの形式で自由にエクスポートできます。"
              : "💡 Export your notes in any preferred format anytime."}
          </p>
        </div>
      </div>
    </div>
  );
}
