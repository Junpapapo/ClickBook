import { useState, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { FolderIcon } from "./DynamicIcon";
import { ChevronRight, ChevronDown, Pencil, Trash2, StickyNote } from "lucide-react";
import { MemoPopover } from "./BookmarkCard";
import { MEMO_DOT } from "@/shared/colors";

export function FolderNode({ data }: { data: any }) {
  const { label, icon, isExpanded, isBookmarksExpanded, count, isRoot, layoutDir, onToggleSubfolders, onToggleBookmarks, onRenameFolder, folderId, isHighlighted } = data;
  const isTB = layoutDir === "TB";
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(label);

  const handleSave = () => {
    setIsEditing(false);
    if (editName.trim() !== "" && editName !== label) {
      onRenameFolder?.(folderId, editName.trim());
    } else {
      setEditName(label);
    }
  };

  const highlightClass = isHighlighted
    ? "!border-yellow-400 shadow-[0_0_12px_2px_rgba(250,204,21,0.7)] animate-pulse"
    : "";
  
  if (isRoot) {
    return (
      <div 
        className={`bg-white dark:bg-surface-800 border-2 border-indigo-400 rounded-full px-4 py-2 shadow-lg flex items-center gap-2 cursor-pointer hover:border-indigo-500 hover:shadow-indigo-500/20 transition-all ${highlightClass}`}
        onClick={(e) => { e.stopPropagation(); onToggleSubfolders?.(folderId); }}
        title="하위 폴더 펼치기/접기"
      >
        <span className="text-lg leading-none shrink-0"><FolderIcon iconName={icon} fallbackColorClass="bg-indigo-400" /></span>
        <span className="font-bold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{label}</span>
        <div className="ml-1 text-gray-400 dark:text-gray-500">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        <Handle type="source" position={isTB ? Position.Bottom : Position.Right} className="w-2 h-2 !bg-indigo-400 border-none" />
      </div>
    );
  }

    return (
      <div 
        className={`bg-white dark:bg-surface-800 border-2 border-indigo-400 rounded-full shadow-lg flex items-stretch hover:border-indigo-500 hover:shadow-indigo-500/20 transition-all overflow-hidden group ${highlightClass}`}>
        <Handle type="target" position={isTB ? Position.Top : Position.Left} className="w-2 h-2 !bg-indigo-400 border-none" />
      
      {/* Bookmark Toggle Area */}
      <div 
        className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        onClick={(e) => { 
          if (!isEditing) {
            e.stopPropagation(); 
            onToggleBookmarks?.(folderId); 
          }
        }}
        title="북마크 목록 펼치기/접기"
      >
        <span className="text-lg leading-none shrink-0"><FolderIcon iconName={icon} fallbackColorClass="bg-indigo-400" /></span>
        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setIsEditing(false);
                setEditName(label);
              }
            }}
            onBlur={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap bg-transparent border-b border-indigo-400 outline-none w-24"
          />
        ) : (
          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{label}</span>
        )}
        {count !== undefined && count > 0 && !isEditing && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isBookmarksExpanded ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-400'}`}>
            {count}
          </span>
        )}
      </div>

      {/* Rename Folder Area */}
      {!isEditing && (
        <div 
          className="opacity-0 group-hover:opacity-100 flex items-center justify-center px-2 cursor-pointer bg-gray-50 dark:bg-surface-700/50 hover:bg-gray-100 dark:hover:bg-surface-600 transition-all border-l border-gray-100 dark:border-surface-600 w-0 group-hover:w-8 overflow-hidden"
          onClick={(e) => { 
            e.stopPropagation(); 
            setIsEditing(true);
            setEditName(label);
          }}
          title="폴더 이름 변경"
        >
          <Pencil size={14} className="text-gray-400 hover:text-indigo-500 shrink-0" />
        </div>
      )}

      {/* Subfolder Toggle Area */}
      <div 
        className="flex items-center justify-center px-2 cursor-pointer bg-gray-50 dark:bg-surface-700/50 hover:bg-gray-100 dark:hover:bg-surface-600 transition-colors border-l border-gray-100 dark:border-surface-600"
        onClick={(e) => { e.stopPropagation(); onToggleSubfolders?.(folderId); }}
        title="하위 폴더 펼치기/접기"
      >
        {isExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-400" />}
      </div>
      
      <Handle type="source" position={isTB ? Position.Bottom : Position.Right} className="w-2 h-2 !bg-indigo-400 border-none" />
    </div>
  );
}

export function BookmarkNode({ data }: { data: any }) {
  const { id, title, url, favicon, onRename, onDelete, onMemoChange, onDeleteMemo, memo, layoutDir, isHighlighted } = data;
  const isTB = layoutDir === "TB";
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showPopover, setShowPopover] = useState(false);
  const stickyBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleSave = () => {
    setIsEditing(false);
    if (editTitle.trim() && editTitle.trim() !== title && onRename) {
      onRename(id, editTitle.trim());
    } else {
      setEditTitle(title);
    }
  };

  return (
    <>
    <div 
      className={`bg-white dark:bg-surface-900 border rounded-lg p-2.5 shadow-sm flex items-center gap-2.5 hover:shadow-md transition-all max-w-[200px] group relative ${
        isHighlighted
          ? "border-yellow-400 shadow-[0_0_10px_2px_rgba(250,204,21,0.65)] animate-pulse"
          : "border-gray-200 dark:border-surface-600 hover:border-indigo-400"
      }`}
      title={title}
    >
      {memo && (
        <div className={`absolute -top-1.5 -left-1.5 w-2.5 h-2.5 rounded-full z-10 shadow-sm ${MEMO_DOT[memo.color]}`} />
      )}
      <Handle type="target" position={isTB ? Position.Top : Position.Left} className="w-2 h-2 !bg-gray-400 border-none" />
      <img 
        src={favicon || "/icons/icon128.png"} 
        alt="" 
        className="w-4 h-4 rounded-sm shrink-0 cursor-pointer" 
        onClick={() => window.open(url, "_blank")}
        onError={(e) => { e.currentTarget.src = "/icons/icon128.png"; }} 
      />
      {isEditing ? (
        <input 
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setIsEditing(false);
              setEditTitle(title);
            }
          }}
          onBlur={handleSave}
          className="text-xs w-full bg-gray-100 dark:bg-surface-800 text-gray-800 dark:text-gray-200 outline-none px-1 rounded flex-1 min-w-0"
        />
      ) : (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span 
            className="text-xs text-gray-700 dark:text-gray-200 truncate cursor-pointer hover:underline flex-1"
            onClick={() => window.open(url, "_blank")}
          >
            {title}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-indigo-500 transition-opacity shrink-0"
            title="Edit"
          >
            <Pencil size={11} />
          </button>
          <button 
            ref={stickyBtnRef}
            onClick={(e) => { e.stopPropagation(); setShowPopover(true); }} 
            className={`opacity-0 group-hover:opacity-100 p-0.5 transition-opacity shrink-0 ${memo ? "text-yellow-500 opacity-100" : "text-gray-400 hover:text-yellow-500"}`}
            title="Memo"
          >
            <StickyNote size={11} />
          </button>
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(id); }} 
              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity shrink-0"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
    {showPopover && (
      <MemoPopover
        memo={memo}
        anchorRef={stickyBtnRef}
        onClose={() => setShowPopover(false)}
        onSave={(content, color) => onMemoChange?.(id, content, color)}
        onDelete={() => onDeleteMemo?.(id)}
      />
    )}
    </>
  );
}
