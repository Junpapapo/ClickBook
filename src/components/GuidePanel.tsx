import React, { useState } from "react";
import {
  X,
  Keyboard,
  Command,
  BookOpen,
  Sparkles,
  FileText,
  Share2,
  ChevronRight,
  Rocket,
} from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  onClose: () => void;
  onOpenCommandPalette?: () => void;
  onOpenOnboarding?: () => void;
}

export default function GuidePanel({ onClose, onOpenCommandPalette, onOpenOnboarding }: Props) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<"shortcuts" | "springnote" | "mindmap" | "export">("shortcuts");

  const globalShortcuts = [
    {
      keys: ["Ctrl", "K"],
      macKeys: ["Cmd", "K"],
      label: t("guideCmdPaletteLabel"),
      desc: t("guideCmdPaletteDesc"),
    },
    {
      keys: ["Alt", "S"],
      macKeys: ["Option", "S"],
      label: t("guideSaveTabLabel"),
      desc: t("guideSaveTabDesc"),
    },
    {
      keys: ["Ctrl", "/"],
      macKeys: ["Cmd", "/"],
      label: t("guideShortcutsGuideLabel"),
      desc: t("guideShortcutsGuideDesc"),
    },
    {
      keys: ["Esc"],
      macKeys: ["Esc"],
      label: t("guideDismissModalLabel"),
      desc: t("guideDismissModalDesc"),
    },
  ];

  const springNoteTips = [
    {
      title: t("guideTipSlashTitle"),
      desc: t("guideTipSlashDesc"),
    },
    {
      title: t("guideTipPasteTitle"),
      desc: t("guideTipPasteDesc"),
    },
    {
      title: t("guideTipDrawingTitle"),
      desc: t("guideTipDrawingDesc"),
    },
  ];

  const mindMapTips = [
    {
      title: t("guideTipNodeTitle"),
      desc: t("guideTipNodeDesc"),
    },
    {
      title: t("guideTipAiExpandTitle"),
      desc: t("guideTipAiExpandDesc"),
    },
  ];

  const exportTips = [
    {
      title: t("guideTipJsonExportTitle"),
      desc: t("guideTipJsonExportDesc"),
    },
    {
      title: t("guideTipHtmlImportTitle"),
      desc: t("guideTipHtmlImportDesc"),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-surface-900 text-slate-800 dark:text-slate-100 border-l border-slate-200 dark:border-surface-700/80">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-surface-800 bg-slate-50/80 dark:bg-surface-950/60 shrink-0">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <BookOpen size={18} />
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-white">
            {t("cmdActionShortcutsGuide")}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
          title={t("closeTooltip")}
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Command Palette Button */}
      {onOpenCommandPalette && (
        <div className="p-3 bg-purple-500/5 dark:bg-purple-500/10 border-b border-purple-500/15 shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-xs shadow-sm hover:shadow transition-all active:scale-[0.99] group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Command size={14} className="group-hover:rotate-12 transition-transform" />
              <span>{t("guideCmdPaletteLabel")}</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-purple-800/60 rounded border border-purple-400/30 text-purple-100">
              Ctrl + K
            </span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-surface-800 bg-slate-100/50 dark:bg-surface-950/40 p-1 gap-1 shrink-0 text-[11px]">
        <button
          onClick={() => setActiveTab("shortcuts")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
            activeTab === "shortcuts"
              ? "bg-white dark:bg-surface-800 text-purple-600 dark:text-purple-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          {t("guideTabShortcuts")}
        </button>
        <button
          onClick={() => setActiveTab("springnote")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
            activeTab === "springnote"
              ? "bg-white dark:bg-surface-800 text-purple-600 dark:text-purple-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          {t("guideTabSpringNote")}
        </button>
        <button
          onClick={() => setActiveTab("mindmap")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
            activeTab === "mindmap"
              ? "bg-white dark:bg-surface-800 text-purple-600 dark:text-purple-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          {t("guideTabMindMap")}
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
            activeTab === "export"
              ? "bg-white dark:bg-surface-800 text-purple-600 dark:text-purple-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          {t("guideTabExport")}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
        {activeTab === "shortcuts" && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Keyboard size={12} className="text-purple-500" />
              {t("guideGlobalShortcutsTitle")}
            </h4>
            <div className="space-y-2.5">
              {globalShortcuts.map((s, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-surface-800/50 border border-slate-200/80 dark:border-surface-700/60"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">{s.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          {kIdx > 0 && <span className="text-[9px] text-slate-400 font-bold">+</span>}
                          <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-surface-900 border border-slate-300 dark:border-surface-700 rounded shadow-xs text-purple-600 dark:text-purple-300">
                            {k}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "springnote" && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <FileText size={12} className="text-amber-500" />
              {t("guideSpringNoteTipsTitle")}
            </h4>
            <div className="space-y-2.5">
              {springNoteTips.map((tItem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-surface-800/50 border border-slate-200/80 dark:border-surface-700/60 space-y-1"
                >
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-amber-500" />
                    {tItem.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-4">{tItem.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "mindmap" && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-500" />
              {t("guideMindMapTipsTitle")}
            </h4>
            <div className="space-y-2.5">
              {mindMapTips.map((tItem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-surface-800/50 border border-slate-200/80 dark:border-surface-700/60 space-y-1"
                >
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-emerald-500" />
                    {tItem.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-4">{tItem.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "export" && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Share2 size={12} className="text-sky-500" />
              {t("guideExportTipsTitle")}
            </h4>
            <div className="space-y-2.5">
              {exportTips.map((tItem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-surface-800/50 border border-slate-200/80 dark:border-surface-700/60 space-y-1"
                >
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-sky-500" />
                    {tItem.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-4">{tItem.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Onboarding Relaunch */}
      <div className="p-3 border-t border-slate-200 dark:border-surface-800 bg-slate-50/60 dark:bg-surface-950/60 flex flex-col gap-2 shrink-0">
        <button
          onClick={() => {
            onClose();
            onOpenOnboarding?.();
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 transition-all hover:shadow-2xs active:scale-95 cursor-pointer"
        >
          <Rocket size={13} className="text-indigo-500" />
          <span>{t("settingsOnboardingGuideBtn")} ({t("settingsOnboardingGuide")})</span>
        </button>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center">
          {isKo ? "💡 ClickBook 생산성 수트" : isJa ? "💡 ClickBook 生産性スイート" : "💡 ClickBook Productivity Suite"}
        </p>
      </div>
    </div>
  );
}
