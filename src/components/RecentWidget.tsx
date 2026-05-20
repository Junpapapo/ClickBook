import { Clock } from "lucide-react";
import BookmarkCard from "./BookmarkCard";
import type { Bookmark, Folder, MemoMap } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  bookmarks: Bookmark[];
  folders?: Folder[];
  memos?: MemoMap;
  count?: number;
  onDelete?: (id: string) => void;
  onEdit?: (b: Bookmark) => void;
  onMemoChange?: () => void;
}

export default function RecentWidget({ bookmarks, folders, memos, count = 8, onDelete, onEdit, onMemoChange }: Props) {
  const { t } = useLang();
  const recent = [...bookmarks]
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, count);

  const folderMap = new Map(folders?.map((f) => [f.id, f.name]) ?? []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock size={15} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("recentTitle")}</h2>
      </div>
      {recent.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-600">{t("recentEmpty")}</p>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {recent.map((b) => (
            <BookmarkCard key={b.id} bookmark={b} memo={memos?.[b.id]} folderName={folderMap.get(b.folderId)} onDelete={onDelete} onEdit={onEdit} onMemoChange={onMemoChange} />
          ))}
        </div>
      )}
    </div>
  );
}
