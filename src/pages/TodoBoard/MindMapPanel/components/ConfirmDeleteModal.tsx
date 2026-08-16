import { X, Trash2 } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  fileName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDeleteModal({ fileName, onConfirm, onClose }: Props) {
  const { t } = useLang();
  const cleanName = fileName.replace(".json", "");

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[200] animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-2xl shadow-2xl p-5 relative mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {t("mindmapDeleteConfirmTitle")}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 py-1">
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
            {t("mindmapDeleteConfirmMsg", { name: cleanName })}
          </p>
          <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 p-2.5 rounded-xl text-[10.5px] text-rose-600 dark:text-rose-400 leading-relaxed select-none">
            {t("mindmapDeleteWarning")}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4.5">
          <button
            onClick={onClose}
            className="px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-surface-850 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{t("mindmapExecuteDelete")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

