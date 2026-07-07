import React, { useState, useRef } from "react";
import { X, Upload, FileJson } from "lucide-react";

interface Props {
  onImport: (fileName: string, content: string) => void;
  onClose: () => void;
}

export default function ImportModal({ onImport, onClose }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".json")) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".json")) {
        setSelectedFile(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        onImport(selectedFile.name, text);
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[200] animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-2xl shadow-2xl p-5 relative mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📥</span>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              마인드맵 파일 가져오기 (JSON Import)
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Info */}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
          기존에 백업한 마인드맵 `.json` 파일을 업로드하여 저장소 목록에 등재합니다. 
          가져온 파일은 퀵로드 셀렉터에서 즉시 선택해 열 수 있습니다.
        </p>

        {/* Drag Zone */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`
            border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer
            ${dragActive 
              ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/15" 
              : "border-gray-300 hover:border-indigo-400 dark:border-surface-700 dark:hover:border-indigo-500/50 bg-gray-50/50 dark:bg-surface-800/40"
            }
          `}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".json"
            onChange={handleFileChange}
            className="hidden" 
          />

          {selectedFile ? (
            <>
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileJson size={20} />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[280px]">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-gray-100 dark:bg-surface-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                <Upload size={18} />
              </div>
              <div className="text-center select-none">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  마인드맵 파일(.json)을 여기에 끌어놓으세요
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  또는 이곳을 클릭하여 로컬 파일 선택
                </p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-surface-850 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-200 disabled:dark:bg-surface-800 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            가져오기 실행
          </button>
        </div>
      </div>
    </div>
  );
}
