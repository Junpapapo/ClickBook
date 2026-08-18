import React, { useMemo } from "react";
import { Folder as FolderIconLucide, ChevronRight, Plus } from "lucide-react";
import type { Folder, Bookmark } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { getLocalizedFolderName } from "@/shared/categories";
import { FolderIcon } from "@/components/DynamicIcon";

interface Props {
  folders: Folder[];
  bookmarks: Bookmark[];
  onSelectFolder: (folderId: string) => void;
}

// 각 폴더에 부여할 감성적인 그라디언트 테마 팔레트
const GRADIENTS = [
  "from-indigo-600/30 via-purple-600/20 to-pink-600/10",
  "from-emerald-600/30 via-teal-600/20 to-cyan-600/10",
  "from-amber-600/30 via-orange-600/20 to-red-600/10",
  "from-blue-600/30 via-indigo-600/20 to-violet-600/10",
  "from-fuchsia-600/30 via-pink-600/20 to-rose-600/10",
  "from-sky-600/30 via-blue-600/20 to-indigo-600/10",
];

export default function BookmarkCollectionCards({ folders, bookmarks, onSelectFolder }: Props) {
  const { lang } = useLang();

  // 폴더별 북마크 리스트 및 카운트 맵핑
  const bookmarksByFolder = useMemo(() => {
    const map: Record<string, Bookmark[]> = {};
    for (const b of bookmarks) {
      if (!map[b.folderId]) map[b.folderId] = [];
      map[b.folderId].push(b);
    }
    return map;
  }, [bookmarks]);

  // 루트 폴더만 필터링
  const rootFolders = useMemo(() => {
    return folders
      .filter((f) => f.parentId === null)
      .sort((a, b) => a.order - b.order);
  }, [folders]);

  return (
    <div className="w-full select-none">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {lang === "ko" ? "북마크 컬렉션" : "Bookmark Collections"}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {rootFolders.length} {lang === "ko" ? "개 컬렉션" : "collections"}
          </span>
        </div>
      </div>

      {/* ── 비주얼 컬렉션 카드 그리드 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {rootFolders.map((folder, idx) => {
          const folderBookmarks = bookmarksByFolder[folder.id] || [];
          const count = folderBookmarks.length;
          const previewBookmarks = folderBookmarks.slice(0, 4);
          const gradient = GRADIENTS[idx % GRADIENTS.length];

          return (
            <div
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className="group relative flex flex-col justify-between p-4 bg-white/60 dark:bg-slate-800/60 hover:bg-white/85 dark:hover:bg-slate-700/70 backdrop-blur-md border border-white/60 dark:border-white/10 hover:border-indigo-400/80 dark:hover:border-indigo-500/60 rounded-2xl shadow-figma-sm hover:shadow-figma-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer overflow-hidden min-h-[120px]"
            >
              {/* 상단 은은한 그라디언트 백그라운드 효과 */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none`}
              />

              {/* ── 카드 헤더: 폴더 아이콘, 이름, 개수 뱃지 ── */}
              <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-2xs border border-white/40 dark:border-slate-700/50 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-200 group-hover:scale-105 transition-transform">
                    <FolderIcon iconName={folder.icon || "📂"} size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">
                      {getLocalizedFolderName(folder, lang)}
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {count} {lang === "ko" ? "개 저장됨" : "items"}
                    </span>
                  </div>
                </div>

                <div className="w-5 h-5 rounded-full bg-white/50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0">
                  <ChevronRight size={12} />
                </div>
              </div>

              {/* ── 카드 하단: 파비콘 아바타 스택 (Avatar Favicon Stack) ── */}
              <div className="relative z-10 flex items-center justify-between mt-auto pt-2 border-t border-slate-200/40 dark:border-slate-700/40">
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {previewBookmarks.map((bm) => (
                    <div
                      key={bm.id}
                      className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs"
                      title={bm.title}
                    >
                      <img
                        src={bm.favicon || `https://www.google.com/s2/favicons?domain=${bm.domain || new URL(bm.url).hostname}&sz=32`}
                        alt=""
                        className="w-3.5 h-3.5 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ))}
                  {count > 4 && (
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      +{count - 4}
                    </div>
                  )}
                  {count === 0 && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                      {lang === "ko" ? "비어 있음" : "Empty"}
                    </span>
                  )}
                </div>

                <span className="text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {lang === "ko" ? "보기 →" : "View →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
