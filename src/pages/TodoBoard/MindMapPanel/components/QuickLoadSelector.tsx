import { 
  PlusCircle,
  FileInput,
  FileOutput,
  RefreshCcw,
  Edit2,
  Trash2,
  ImageDown,
  Loader2,
} from "lucide-react";
import type { MindMapMeta } from "../mindmap-types";

interface Props {
  fileList: MindMapMeta[];
  activeFileName: string;
  onSelectFile: (fileName: string) => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onExportMarkdownClick: () => void;
  onExportImageClick: () => void;
  isSavingImage?: boolean;
  onDeleteClick: () => void;
  onRenameClick: () => void;
  onCreateNewMap: () => void;
  onRefreshList: () => void;
}

export default function QuickLoadSelector({
  fileList,
  activeFileName,
  onSelectFile,
  onImportClick,
  onExportClick,
  onExportMarkdownClick,
  onExportImageClick,
  isSavingImage = false,
  onDeleteClick,
  onRenameClick,
  onCreateNewMap,
  onRefreshList
}: Props) {

  const btnBase =
    "flex items-center justify-center gap-1.5 px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-surface-600 dark:bg-surface-800 dark:hover:bg-surface-700 text-[10px] font-bold text-gray-700 dark:text-gray-200 transition-all cursor-pointer shadow-sm";

  return (
    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end w-full">

      {/* 1. Import / Export JSON — vertical pair */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button onClick={onImportClick} className={btnBase} title="Import JSON">
          <FileInput size={10} className="text-indigo-500 shrink-0" />
          <span>Import</span>
        </button>
        <button onClick={onExportClick} disabled={!activeFileName} className={btnBase} title="Export JSON">
          <FileOutput size={10} className="text-emerald-500 shrink-0" />
          <span>Export</span>
        </button>
      </div>

      {/* 2. MD Export / Save Image — vertical pair (matches Import/Export width) */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onExportMarkdownClick}
          disabled={!activeFileName}
          className={btnBase}
          title="Export Markdown (.md)"
        >
          <span className="text-[9px] font-black text-amber-500 leading-none shrink-0">M↓</span>
          <span>MD Export</span>
        </button>
        <button
          onClick={onExportImageClick}
          disabled={!activeFileName || isSavingImage}
          className={`${btnBase} ${isSavingImage ? "opacity-70 cursor-wait" : ""}`}
          title="Save as PNG image"
        >
          {isSavingImage ? (
            <Loader2 size={10} className="text-violet-500 shrink-0 animate-spin" />
          ) : (
            <ImageDown size={10} className="text-violet-500 shrink-0" />
          )}
          <span>{isSavingImage ? "Saving..." : "Save Image"}</span>
        </button>
      </div>

      <span className="w-px h-5 bg-gray-200 dark:bg-surface-800 hidden sm:block shrink-0"></span>

      {/* 3. Quick Load Selector dropdown */}
      <div className="flex items-center gap-1 min-w-[300px] max-w-[400px] shrink-0">
        <select
          value={activeFileName}
          onChange={(e) => onSelectFile(e.target.value)}
          className="w-full bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 outline-none shadow-sm focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
        >
          <option value="" disabled>📂 Select Map...</option>
          {fileList.map((file, idx) => (
            <option key={idx} value={file.fileName}>
              {file.fileName.replace(".json", "")}
            </option>
          ))}
          {fileList.length === 0 && (
            <option value="" disabled>No saved maps</option>
          )}
        </select>

        {/* Action icons for current file */}
        {activeFileName && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onRenameClick}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-750 text-gray-500 hover:text-gray-700 dark:text-gray-400 rounded-md transition-colors cursor-pointer"
              title="Rename Map"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={onDeleteClick}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
              title="Delete Map"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        <button
          onClick={onRefreshList}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-750 text-gray-500 hover:text-gray-700 dark:text-gray-400 rounded-md transition-colors cursor-pointer shrink-0"
          title="Refresh List"
        >
          <RefreshCcw size={12} />
        </button>
      </div>

      <span className="w-px h-5 bg-gray-200 dark:bg-surface-800 hidden sm:block shrink-0"></span>

      {/* 4. New Map Action Button */}
      <button
        onClick={onCreateNewMap}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
      >
        <PlusCircle size={13} />
        <span>New Map</span>
      </button>
    </div>
  );
}
