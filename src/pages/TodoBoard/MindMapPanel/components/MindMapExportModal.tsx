import React, { useState } from "react";
import {
  X,
  Share2,
  Image as ImageIcon,
  FileCode,
  Download,
  Check,
} from "lucide-react";
import { toPng, toSvg } from "html-to-image";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  nodes: any[];
  edges: any[];
  flowWrapperRef?: React.RefObject<HTMLDivElement>;
}

export default function MindMapExportModal({
  isOpen,
  onClose,
  title,
  nodes,
  edges,
  flowWrapperRef,
}: Props) {
  const { lang } = useLang();
  const isKo = lang === "ko";
  const [isExporting, setIsExporting] = useState(false);
  const [successFormat, setSuccessFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const safeTitle = title.trim() || (isKo ? "마인드맵_아이디어" : "MindMap_Idea");
  const fileNameSlug = safeTitle.replace(/[/\\?%*:|"<>]/g, "_");

  const handleExportPNG = async () => {
    const el = flowWrapperRef?.current || document.querySelector(".react-flow");
    if (!el) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(el as HTMLElement, {
        cacheBust: true,
        backgroundColor: "#0f172a",
        filter: () => {
          // Exclude controls / minimap if needed, or keep all
          return true;
        },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileNameSlug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSuccessFormat("png");
      setTimeout(() => setSuccessFormat(null), 2000);
    } catch (err) {
      console.error("Failed to export PNG:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = async () => {
    const el = flowWrapperRef?.current || document.querySelector(".react-flow");
    if (!el) return;
    try {
      setIsExporting(true);
      const dataUrl = await toSvg(el as HTMLElement, {
        cacheBust: true,
        backgroundColor: "#0f172a",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileNameSlug}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSuccessFormat("svg");
      setTimeout(() => setSuccessFormat(null), 2000);
    } catch (err) {
      console.error("Failed to export SVG:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    try {
      const data = {
        version: "1.0",
        title: safeTitle,
        exportDate: new Date().toISOString(),
        nodes,
        edges,
      };
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileNameSlug}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessFormat("json");
      setTimeout(() => setSuccessFormat(null), 2000);
    } catch (err) {
      console.error("Failed to export JSON:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-surface-900 border border-slate-200 dark:border-surface-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-surface-800 bg-slate-50/80 dark:bg-surface-950/60">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <Share2 size={18} />
            <span>{isKo ? "마인드맵 내보내기 & 공유" : "Export & Share MindMap"}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-100/70 dark:bg-surface-800/60 rounded-xl border border-slate-200/60 dark:border-surface-700/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">{isKo ? "마인드맵 제목" : "MindMap Title"}</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">{safeTitle}</p>
            </div>
            <div className="text-[10px] font-bold text-slate-500 bg-white dark:bg-surface-900 px-2 py-1 rounded-md border border-slate-200 dark:border-surface-700">
              {nodes.length} 노드
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-2.5">
            {/* PNG Image */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-surface-800/40 border border-slate-200/80 dark:border-surface-700/60 hover:border-emerald-400/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ImageIcon size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">PNG 이미지 (.png)</p>
                  <p className="text-[10px] text-slate-400">{isKo ? "고화질 마인드맵 캡처 이미지" : "HD MindMap image snapshot"}</p>
                </div>
              </div>
              <button
                onClick={handleExportPNG}
                disabled={isExporting}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                {successFormat === "png" ? <Check size={13} /> : <Download size={13} />}
                <span>{isExporting ? "생성중..." : "PNG"}</span>
              </button>
            </div>

            {/* SVG Image */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-surface-800/40 border border-slate-200/80 dark:border-surface-700/60 hover:border-indigo-400/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FileCode size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">SVG 벡터 (.svg)</p>
                  <p className="text-[10px] text-slate-400">{isKo ? "확대해도 깨지지 않는 벡터" : "Scalable vector image"}</p>
                </div>
              </div>
              <button
                onClick={handleExportSVG}
                disabled={isExporting}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                {successFormat === "svg" ? <Check size={13} /> : <Download size={13} />}
                <span>{isExporting ? "생성중..." : "SVG"}</span>
              </button>
            </div>

            {/* JSON Data Snapshot */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-surface-800/40 border border-slate-200/80 dark:border-surface-700/60 hover:border-purple-400/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <FileCode size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">JSON 스냅샷 (.json)</p>
                  <p className="text-[10px] text-slate-400">{isKo ? "백업 및 다시 불러오기용 데이터" : "Backup & import data snapshot"}</p>
                </div>
              </div>
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                {successFormat === "json" ? <Check size={13} /> : <Download size={13} />}
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-surface-800 bg-slate-50/60 dark:bg-surface-950/60 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {isKo ? "💡 내보낸 JSON 파일은 불러오기(Import) 메뉴로 복원할 수 있습니다." : "💡 Exported JSON files can be restored using the Import menu."}
          </p>
        </div>
      </div>
    </div>
  );
}
