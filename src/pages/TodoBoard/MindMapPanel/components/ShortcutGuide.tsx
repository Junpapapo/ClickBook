import React from "react";
import { X, Keyboard } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  onClose: () => void;
}

export default function ShortcutGuide({ onClose }: Props) {
  const { lang, t } = useLang();

  const shortcuts = [
    {
      keys: ["Tab"],
      label: lang === "ko" ? "하위(자식) 노드 추가" : lang === "ja" ? "子ノード追加" : "Add Child Node",
      desc: lang === "ko" ? "선택한 노드 아래에 새로운 자식 노드를 만듭니다." : lang === "ja" ? "選択したノードの下に新しい子ノードを作成します。" : "Create a new child node under the selected node."
    },
    {
      keys: ["Enter"],
      label: lang === "ko" ? "동일 깊이(형제) 노드 추가" : lang === "ja" ? "同階層(兄弟)ノード追加" : "Add Sibling Node",
      desc: lang === "ko" ? "선택한 노드와 같은 레벨에 새로운 형제 노드를 만듭니다. (Root 제외)" : lang === "ja" ? "選択したノードと同じ階層に新しいノードを作成します。(Root除く)" : "Create a new node at the same level (Except Root)."
    },
    {
      keys: ["F2", "Space"],
      label: lang === "ko" ? "노드 이름 편집" : lang === "ja" ? "ノード名編集" : "Edit Node Name",
      desc: lang === "ko" ? "선택한 노드의 이름을 인플레이스로 즉시 수정합니다." : lang === "ja" ? "選択したノードの名前を即座にインライン編集します。" : "Instantly edit the name of the selected node."
    },
    {
      keys: ["Delete", "Backspace"],
      label: lang === "ko" ? "노드 삭제" : lang === "ja" ? "ノード削除" : "Delete Node",
      desc: lang === "ko" ? "선택한 노드와 그 하위 서브트리 노드를 모두 삭제합니다." : lang === "ja" ? "選択したノード配下のサブツリーをすべて削除します。" : "Delete the selected node and all its sub-nodes."
    },
    {
      keys: ["↑", "↓", "←", "→"],
      label: lang === "ko" ? "노드 포커스 이동" : lang === "ja" ? "ノードフォーカス移動" : "Navigate Nodes",
      desc: lang === "ko" ? "2D 좌표 상에서 가장 가까운 방향의 노드로 선택 포커스를 옮깁니다." : lang === "ja" ? "最も近い方向のノードへ選択フォーカスを移動します。" : "Move focus to the nearest node in that direction."
    },
    {
      keys: ["Esc"],
      label: lang === "ko" ? "편집 취소 / 닫기" : lang === "ja" ? "編集キャンセル / 閉じる" : "Cancel / Close",
      desc: lang === "ko" ? "노드 편집을 취소하거나 모달 창을 닫습니다." : lang === "ja" ? "編集をキャンセルするかモーダルを閉じます。" : "Cancel editing or dismiss modal."
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 dark:bg-surface-950/95 border border-white/10 dark:border-surface-800/80 w-full max-w-md rounded-2xl shadow-2xl p-6 text-white animate-in zoom-in-95 duration-200 relative select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Keyboard size={18} />
            <h3 className="text-sm font-black tracking-wide uppercase text-white">
              {lang === "ko" ? "마인드맵 단축키 가이드" : lang === "ja" ? "マインドマップ ショートカット" : "MindMap Shortcuts Guide"}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/10 rounded-lg transition-all active:scale-90 text-gray-400 hover:text-white cursor-pointer"
            title={t("closeTooltip")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcut List */}
        <div className="space-y-3.5">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-start justify-between gap-4 py-0.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100">{s.label}</p>
                <p className="text-[10px] text-slate-400/90 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                {s.keys.map((k, kIdx) => (
                  <React.Fragment key={kIdx}>
                    {kIdx > 0 && <span className="text-[9px] text-slate-500 font-bold">or</span>}
                    <kbd className="px-2 py-1 text-[10px] font-black font-mono bg-slate-800 border border-slate-700/80 rounded-md shadow-sm text-indigo-300">
                      {k}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-center">
          <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">
            💡 마우스 없이 키보드만으로 빠른 아이디어 확장이 가능합니다.
          </p>
        </div>

      </div>
    </div>
  );
}
