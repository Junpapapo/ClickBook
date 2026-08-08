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
} from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  onClose: () => void;
  onOpenCommandPalette?: () => void;
}

export default function GuidePanel({ onClose, onOpenCommandPalette }: Props) {
  const { lang } = useLang();
  const isKo = lang === "ko";
  const [activeTab, setActiveTab] = useState<"shortcuts" | "springnote" | "mindmap" | "export">("shortcuts");

  const globalShortcuts = [
    { keys: ["Ctrl", "K"], macKeys: ["Cmd", "K"], label: isKo ? "커맨드 팔레트 열기" : "Open Command Palette", desc: isKo ? "대시보드 전체 기능 & 검색에 신속하게 접근합니다." : "Quick access to all features and search." },
    { keys: ["Alt", "S"], macKeys: ["Option", "S"], label: isKo ? "현재 탭 저장" : "Save Current Tab", desc: isKo ? "활성 탭을 1클릭으로 저장하고 AI 분류를 수행합니다." : "Instantly save active tab with AI auto-categorization." },
    { keys: ["Ctrl", "/"], macKeys: ["Cmd", "/"], label: isKo ? "단축키 가이드 열기" : "Open Shortcuts Guide", desc: isKo ? "오른쪽 가이드 패널을 빠르게 토글합니다." : "Toggle this right guide panel." },
    { keys: ["Esc"], macKeys: ["Esc"], label: isKo ? "모달 / 팝업 닫기" : "Close Modal / Popup", desc: isKo ? "열려있는 설정, 뷰어, 팔레트 모달을 닫습니다." : "Dismiss any open modal or viewer overlay." },
  ];

  const springNoteTips = [
    {
      title: isKo ? "슬래시 메뉴 (`/` 입력)" : "Slash Menu (Type `/`)",
      desc: isKo ? "본문에 / 키를 입력해 표, 체크리스트, H1/H2 포맷, AI 도우미를 호출하세요." : "Type `/` to insert tables, checklists, headings, or call AI.",
    },
    {
      title: isKo ? "이미지 클립보드 붙여넣기 & D&D" : "Instant Image Paste & Drop",
      desc: isKo ? "Ctrl + V 붙여넣기 또는 이미지를 에디터 시트로 드래그 앤 드롭하세요." : "Paste images via Ctrl+V or drag & drop files into editor.",
    },
    {
      title: isKo ? "캔버스 드로잉 메모 노드" : "Drawing Memo Canvas Node",
      desc: isKo ? "노트 바깥쪽 빈 모눈 공간을 더블 클릭하면 드로잉 노드가 생성됩니다." : "Double-click empty grid space to spawn a drawing canvas node.",
    },
  ];

  const mindMapTips = [
    {
      title: isKo ? "노드 생성 & 마우스 조작" : "Node Creation & Navigation",
      desc: isKo ? "루트 노드 클릭 후 + 버튼으로 하위 노드를 생성하고 휠/드래그로 캔버스를 탐색하세요." : "Click root node and hit + to add child nodes. Drag/wheel to navigate.",
    },
    {
      title: isKo ? "AI 하위 아이디어 확장" : "AI Idea Expansion",
      desc: isKo ? "노드 우클릭 후 'AI 하위 아이디어 생성'을 누르면 Gemini Nano가 아이디어를 확장해 줍니다." : "Right click node and select AI Expand to get auto-generated sub-ideas.",
    },
  ];

  const exportTips = [
    {
      title: isKo ? "스프링노트 내보내기" : "Spring Note Export",
      desc: isKo ? "Markdown (.md), HTML (.html), Plain Text (.txt), 또는 PDF 인쇄 서식을 지원합니다." : "Export as Markdown (.md), HTML (.html), Text (.txt) or PDF print layout.",
    },
    {
      title: isKo ? "마인드맵 내보내기" : "MindMap Export",
      desc: isKo ? "고화질 PNG 이미지, SVG 벡터, 또는 JSON 스냅샷으로 내보내기 및 복원 가능합니다." : "Export as HD PNG image, SVG vector, or JSON snapshot file.",
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-surface-900 text-slate-800 dark:text-slate-100 border-l border-slate-200 dark:border-surface-700/80">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-surface-800 bg-slate-50/80 dark:bg-surface-950/60 shrink-0">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <BookOpen size={18} />
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-white">
            {isKo ? "사용자 가이드 & 단축키" : "Guide & Hotkeys"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
          title={isKo ? "닫기" : "Close"}
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
              <span>{isKo ? "커맨드 팔레트 열기" : "Open Command Palette"}</span>
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
          {isKo ? "단축키" : "Hotkeys"}
        </button>
        <button
          onClick={() => setActiveTab("springnote")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
            activeTab === "springnote"
              ? "bg-white dark:bg-surface-800 text-purple-600 dark:text-purple-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          {isKo ? "스프링노트" : "Note"}
        </button>
        <button
          onClick={() => setActiveTab("mindmap")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
            activeTab === "mindmap"
              ? "bg-white dark:bg-surface-800 text-purple-600 dark:text-purple-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          {isKo ? "마인드맵" : "Map"}
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
            activeTab === "export"
              ? "bg-white dark:bg-surface-800 text-purple-600 dark:text-purple-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          {isKo ? "내보내기" : "Export"}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
        {activeTab === "shortcuts" && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Keyboard size={12} className="text-purple-500" />
              {isKo ? "전역 키보드 단축키" : "Global Hotkeys"}
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
              {isKo ? "스프링노트 핵심 팁" : "Spring Note Features"}
            </h4>
            <div className="space-y-2.5">
              {springNoteTips.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-surface-800/50 border border-slate-200/80 dark:border-surface-700/60 space-y-1"
                >
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-amber-500" />
                    {t.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-4">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "mindmap" && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-500" />
              {isKo ? "마인드맵 핵심 팁" : "MindMap Features"}
            </h4>
            <div className="space-y-2.5">
              {mindMapTips.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-surface-800/50 border border-slate-200/80 dark:border-surface-700/60 space-y-1"
                >
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-emerald-500" />
                    {t.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-4">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "export" && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Share2 size={12} className="text-sky-500" />
              {isKo ? "내보내기 (Export 2.0) 안내" : "Export 2.0 Guide"}
            </h4>
            <div className="space-y-2.5">
              {exportTips.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-surface-800/50 border border-slate-200/80 dark:border-surface-700/60 space-y-1"
                >
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-sky-500" />
                    {t.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-4">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 dark:border-surface-800 bg-slate-50/60 dark:bg-surface-950/60 text-center shrink-0">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          {isKo ? "💡 ClickBook 생산성 수트 v1.6.2" : "💡 ClickBook Productivity Suite v1.6.2"}
        </p>
      </div>
    </div>
  );
}
