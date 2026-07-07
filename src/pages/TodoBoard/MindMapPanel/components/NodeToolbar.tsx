import { useState, useEffect, useRef } from "react";
import { SlidersHorizontal, Pencil, Smile } from "lucide-react";
import type { NodeShape, ColorTheme } from "../mindmap-types";
import { IconPicker } from "@/components/IconPicker";
import { LUCIDE_ICONS_MAP } from "@/components/DynamicIcon";

interface Props {
  selectedNodeId: string | null;
  selectedNodeLabel: string;
  selectedNodeShape: NodeShape;
  selectedNodeTheme: ColorTheme;
  selectedNodeIcon?: string;
  onUpdateShape: (shape: NodeShape) => void;
  onUpdateTheme: (theme: ColorTheme) => void;
  onUpdateLabel?: (nodeId: string, newLabel: string) => void;
  onUpdateIcon?: (nodeId: string, icon: string | null) => void;
}

const THEME_LABELS: Record<ColorTheme, { label: string; dot: string }> = {
  indigo: { label: "Indigo", dot: "bg-indigo-500" },
  emerald: { label: "Emerald", dot: "bg-emerald-500" },
  amber: { label: "Amber", dot: "bg-amber-500" },
  rose: { label: "Rose", dot: "bg-rose-500" },
  violet: { label: "Violet", dot: "bg-violet-500" },
  slate: { label: "Slate", dot: "bg-slate-500" }
};

export default function NodeToolbar({
  selectedNodeId,
  selectedNodeLabel,
  selectedNodeShape,
  selectedNodeTheme,
  selectedNodeIcon,
  onUpdateShape,
  onUpdateTheme,
  onUpdateLabel,
  onUpdateIcon,
}: Props) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editVal, setEditVal] = useState(selectedNodeLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  // 이모지 피커 상태 및 Ref
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  // 선택된 노드가 바뀌면 편집 및 피커 상태 초기화
  useEffect(() => {
    setIsEditingLabel(false);
    setShowIconPicker(false);
    setEditVal(selectedNodeLabel);
  }, [selectedNodeId, selectedNodeLabel]);

  // 편집 모드 진입 시 input에 포커스
  useEffect(() => {
    if (isEditingLabel) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingLabel]);

  // 피커 외부 클릭 닫기 처리
  useEffect(() => {
    if (!showIconPicker) return;
    function handleClickOutside(event: MouseEvent) {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showIconPicker]);

  const handleLabelSave = () => {
    setIsEditingLabel(false);
    const trimmed = editVal.trim();
    if (trimmed && trimmed !== selectedNodeLabel && selectedNodeId) {
      onUpdateLabel?.(selectedNodeId, trimmed);
    } else {
      setEditVal(selectedNodeLabel);
    }
  };

  if (!selectedNodeId) {
    return (
      <div className="flex items-center justify-center p-3 text-xs text-gray-400 dark:text-gray-500 bg-white/70 dark:bg-surface-900/60 rounded-xl border border-dashed border-gray-200 dark:border-surface-700/60 shrink-0 select-none">
        <SlidersHorizontal size={12} className="mr-1.5" />
        <span>Select a node to edit style. (Double-click: rename | Tab: add child | Del: delete)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-surface-900 p-2.5 rounded-xl border border-gray-200 dark:border-surface-700/80 shadow-md shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Target Node Label — click to edit */}
      {isEditingLabel ? (
        <input
          ref={inputRef}
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={handleLabelSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLabelSave();
            if (e.key === "Escape") { setIsEditingLabel(false); setEditVal(selectedNodeLabel); }
          }}
          className="flex-1 min-w-0 text-xs font-bold text-gray-800 dark:text-gray-100 bg-white dark:bg-surface-800 border border-indigo-400 dark:border-indigo-500 px-2.5 py-1 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all"
        />
      ) : (
        <div className="flex-1 min-w-0 flex items-center gap-1.5 relative">
          {/* Emoji / Icon Selector Button Area */}
          <div ref={iconPickerRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowIconPicker((v) => !v);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-surface-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="이모지/아이콘 변경"
            >
              {selectedNodeIcon ? (
                (() => {
                  const IconComp = LUCIDE_ICONS_MAP[selectedNodeIcon];
                  if (IconComp) return <IconComp size={13} className="text-gray-700 dark:text-gray-200" />;
                  return <span className="text-sm leading-none">{selectedNodeIcon}</span>;
                })()
              ) : (
                <span className="text-sm leading-none">📌</span>
              )}
            </button>

            {showIconPicker && (
              <IconPicker
                onSelect={(selectedIcon) => {
                  if (selectedNodeId) {
                    onUpdateIcon?.(selectedNodeId, selectedIcon);
                  }
                  setShowIconPicker(false);
                }}
                onClose={() => setShowIconPicker(false)}
                className="!bottom-full !top-auto mb-2 mt-0 left-0"
              />
            )}
          </div>

          {/* Node Text - click to edit */}
          <div
            onClick={() => setIsEditingLabel(true)}
            className="flex-1 min-w-0 flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-200 truncate bg-gray-100 dark:bg-surface-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded-lg cursor-text transition-colors group"
            title="Click to rename node"
          >
            <span className="truncate">{selectedNodeLabel}</span>
            <Pencil size={10} className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity ml-auto" />
          </div>
        </div>
      )}

      <div className="w-px h-5 bg-gray-200 dark:bg-surface-700"></div>

      {/* Shapes */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Shape</span>
        <div className="flex bg-gray-100 dark:bg-surface-800 p-0.5 rounded-lg border border-gray-200 dark:border-surface-700">
          {(["rounded-rect", "ellipse", "capsule"] as NodeShape[]).map((shape) => (
            <button
              key={shape}
              onClick={() => onUpdateShape(shape)}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                selectedNodeShape === shape
                  ? "bg-white dark:bg-surface-700 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {shape === "rounded-rect" ? "Rect" : shape === "ellipse" ? "Ellipse" : "Capsule"}
            </button>
          ))}
        </div>
      </div>

      {/* Themes */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Color</span>
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-surface-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-surface-700">
          {(["indigo", "emerald", "amber", "rose", "violet", "slate"] as ColorTheme[]).map((theme) => (
            <button
              key={theme}
              onClick={() => onUpdateTheme(theme)}
              className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${THEME_LABELS[theme].dot} ${
                selectedNodeTheme === theme ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-surface-900 scale-110 shadow-sm" : "opacity-80 hover:opacity-100 hover:scale-105"
              }`}
              title={THEME_LABELS[theme].label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
