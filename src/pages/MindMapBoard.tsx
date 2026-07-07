import type { Bookmark, Folder } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { MindMapPanel } from "./TodoBoard/MindMapPanel";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  memos: Record<string, any>;
  onRefresh: () => void;
}

export default function MindMapBoard({ onRefresh }: Props) {
  const { lang } = useLang();

  return (
    <div className="h-full flex flex-row overflow-hidden bg-white dark:bg-surface-900">
      {/* Right Content Area: MindMap Editor (Takes Full Screen) */}
      <div className="flex-1 h-full min-w-0">
        <MindMapPanel
          taskId="global_workspace"
          taskTitle={lang === "ko" ? "나의 아이디어 마인드맵" : lang === "ja" ? "マイアイデアマインドマップ" : "My Idea Mind Map"}
          onClose={() => {}}
        />
      </div>
    </div>
  );
}
