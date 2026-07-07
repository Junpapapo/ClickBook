import { useState } from "react";
import { X, Pencil } from "lucide-react";

interface Props {
  fileName: string;
  onConfirm: (newName: string) => void;
  onClose: () => void;
}

export default function RenameModal({ fileName, onConfirm, onClose }: Props) {
  const cleanOldName = fileName.replace(".json", "");
  const [newName, setNewName] = useState(cleanOldName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === cleanOldName) return;
    onConfirm(newName.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[200] animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 relative mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">✏️</span>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              마인드맵 이름 변경
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            선택된 마인드맵의 새로운 이름을 입력해 주세요.
          </p>
          
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            className="w-full px-4 py-2.5 !bg-slate-100 dark:!bg-slate-950 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm !text-slate-900 dark:!text-slate-100 placeholder-gray-400 dark:placeholder-gray-600 transition-all outline-none"
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!newName.trim() || newName.trim() === cleanOldName}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Pencil size={13} />
              <span>변경 적용</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
