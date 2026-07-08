import React from "react";
import { X, Keyboard, Sparkles, Image, MousePointerClick, Type } from "lucide-react";

interface Props {
  onClose: () => void;
  lang?: string;
}

export default function SpringNoteShortcutGuide({ onClose, lang = "ko" }: Props) {
  const isKo = lang === "ko";

  const shortcuts = [
    { keys: ["Ctrl", "B"], label: isKo ? "텍스트 굵게" : "Bold Text", desc: isKo ? "선택한 텍스트를 굵게 만듭니다." : "Make selected text bold." },
    { keys: ["Ctrl", "I"], label: isKo ? "텍스트 기울임" : "Italic Text", desc: isKo ? "선택한 텍스트를 기울입니다." : "Make selected text italic." },
    { keys: ["Ctrl", "U"], label: isKo ? "텍스트 밑줄" : "Underline Text", desc: isKo ? "선택한 텍스트에 밑줄을 긋습니다." : "Underline selected text." },
    { keys: ["Ctrl", "Shift", "X"], label: isKo ? "텍스트 취소선" : "Strikethrough", desc: isKo ? "선택한 텍스트에 취소선을 긋습니다." : "Strikethrough selected text." },
    { keys: ["Ctrl", "Alt", "C"], label: isKo ? "코드 블록 생성" : "Code Block", desc: isKo ? "선택 영역을 소스코드 블록으로 감쌉니다." : "Wrap selection in a code block." },
    { keys: ["Alt", "S"], label: isKo ? "노트 수동 저장" : "Save Note", desc: isKo ? "현재 작성된 모든 노트 내용을 데이터베이스에 저장합니다." : "Instantly save all content to the database." },
    { keys: ["Shift", "Enter"], label: isKo ? "강제 줄바꿈" : "Soft Line Break", desc: isKo ? "문단을 나누지 않고 현재 줄에서 개행(줄바꿈)만 수행합니다." : "Insert a line break without creating a new paragraph." },
  ];

  const features = [
    {
      icon: <Sparkles size={14} className="text-purple-400" />,
      title: isKo ? "슬래시 메뉴 (`/` 입력)" : "Slash Menu (Type `/`)",
      desc: isKo 
        ? "본문에 / 키를 입력하여 표 삽입, 체크리스트, 제목(H1/H2) 포맷, AI 글쓰기 등을 신속히 호출합니다." 
        : "Type `/` in the editor to quickly insert tables, checklists, headings, or call AI writing assistance."
    },
    {
      icon: <Image size={14} className="text-amber-400" />,
      title: isKo ? "이미지 클립보드 붙여넣기 & 드롭" : "Instant Image Paste & Drop",
      desc: isKo 
        ? "복사한 이미지를 Ctrl + V로 본문에 바로 붙여넣거나 외부 이미지 파일을 드래그 앤 드롭해 바로 삽입할 수 있습니다." 
        : "Paste images directly using Ctrl + V or drag and drop image files directly into the editor sheet."
    },
    {
      icon: <MousePointerClick size={14} className="text-emerald-400" />,
      title: isKo ? "캔버스 빈 곳 더블 클릭" : "Double-Click on Canvas",
      desc: isKo 
        ? "노트 바깥쪽의 빈 모눈 영역을 더블 클릭하면 그 자리에 즉시 드로잉(메모/그림판) 노드를 생성하여 자유롭게 필기합니다." 
        : "Double-click on empty grid areas outside the notebook to spawn a drawing memo node."
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 dark:bg-surface-950/95 border border-white/10 dark:border-surface-800/80 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-white animate-in zoom-in-95 duration-200 relative select-none max-h-[85vh] overflow-y-auto scrollbar-thin">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5 shrink-0">
          <div className="flex items-center gap-2 text-amber-500">
            <Keyboard size={18} />
            <h3 className="text-sm font-black tracking-wide uppercase text-white">
              {isKo ? "스프링노트 단축키 & 기능 가이드" : "Spring Note Shortcuts & Guide"}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/10 rounded-lg transition-all active:scale-90 text-gray-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Section 1: Shortcuts */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Type size={12} className="text-indigo-400" />
              {isKo ? "텍스트 편집 단축키" : "Editor Hotkeys"}
            </h4>
            <div className="space-y-3 bg-slate-950/40 rounded-xl p-3.5 border border-white/5">
              {shortcuts.map((s, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 py-0.5">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100">{s.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {s.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && <span className="text-[9px] text-slate-600 font-bold">+</span>}
                        <kbd className="px-1.5 py-0.5 text-[9px] font-black font-mono bg-slate-800 border border-slate-700/80 rounded shadow-sm text-amber-400">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Features */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles size={12} className="text-purple-400" />
              {isKo ? "스마트 필기 기능" : "Core Writing Features"}
            </h4>
            <div className="space-y-3.5 bg-slate-950/40 rounded-xl p-3.5 border border-white/5">
              {features.map((f, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="p-1.5 bg-white/5 rounded-lg shrink-0 h-fit mt-0.5">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100">{f.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center">
          <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase text-center">
            {isKo 
              ? "💡 마우스 없이 키보드와 드래그만으로 풍부한 아날로그 필기를 경험하세요." 
              : "💡 Experience rich analog styling using keyboard hotkeys and simple drag-drops."}
          </p>
        </div>

      </div>
    </div>
  );
}
