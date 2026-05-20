import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useLang } from "./LanguageContext";

interface DialogState {
  message: string;
  type: "alert" | "confirm";
  confirmLabel: string;
  cancelLabel: string;
  variant: "warn" | "info";
  onConfirm: () => void;
  onCancel?: () => void;
}

function DialogModal({
  message,
  type,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}: DialogState) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={type === "alert" ? onConfirm : undefined}
    >
      <div
        className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 rounded-2xl shadow-2xl p-5 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3 mb-5">
          {variant === "warn" ? (
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <Info size={18} className="text-sky-500 shrink-0 mt-0.5" />
          )}
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          {type === "confirm" && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-surface-700 dark:hover:bg-surface-600 rounded-lg transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              type === "confirm"
                ? variant === "warn"
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-gray-700 dark:text-gray-200"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useDialog() {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const { t } = useLang();

  function showConfirm(
    message: string,
    confirmLabel = t("confirmBtn"),
    cancelLabel = t("cancelBtn"),
    variant: "warn" | "info" = "warn"
  ): Promise<boolean> {
    return new Promise((resolve) => {
      setDialog({
        message,
        type: "confirm",
        confirmLabel,
        cancelLabel,
        variant,
        onConfirm: () => { setDialog(null); resolve(true); },
        onCancel: () => { setDialog(null); resolve(false); },
      });
    });
  }

  function showAlert(message: string, variant: "warn" | "info" = "info"): Promise<void> {
    return new Promise((resolve) => {
      setDialog({
        message,
        type: "alert",
        confirmLabel: "OK",
        cancelLabel: t("cancelBtn"),
        variant,
        onConfirm: () => { setDialog(null); resolve(); },
      });
    });
  }

  const DialogEl = dialog ? <DialogModal {...dialog} /> : null;

  return { showConfirm, showAlert, DialogEl };
}
