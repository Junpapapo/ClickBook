import { DragDropContext, Droppable, DroppableProvided } from "@hello-pangea/dnd";
import { Plus, ListTodo, Loader2 } from "lucide-react";
import type { AppSettings } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";
import { useDialog } from "@/shared/useDialog";
import WallpaperBackground from "@/components/dashboard/WallpaperBackground";
import TodoColumn from "./TodoBoard/TodoColumn";
import TaskDetailsModal from "./TodoBoard/TaskDetailsModal";
import { useTodoState } from "./TodoBoard/hooks/useTodoState";
import { getSpringNote, saveSpringNote } from "@/utils/springNoteDb";

export default function TodoBoard({ settings }: { settings?: AppSettings }) {
  const { t, lang } = useLang();
  const { showConfirm, DialogEl } = useDialog();
  // TODO 카드에서 노트 클릭 시, 해당 태스크명으로 연동 노트를 자동생성/선택하고 스프링 노트 전용 화면으로 탭 이동
  const handleOpenSpringNoteAndRedirect = async (taskId: string) => {
    try {
      const clickedTask = data?.tasks?.[taskId];
      const taskTitle = clickedTask ? clickedTask.content : "Task Note";

      // 1. IndexedDB 상에 태스크 연동 노트가 생성되어 있는지 조회
      let note = await getSpringNote(taskId);
      if (note) {
        // 이미 연동노트가 존재하면, 최신 TODO 카드 제목으로 항상 자동 동기화 업데이트!
        if (note.title !== taskTitle) {
          note.title = taskTitle;
          await saveSpringNote(note);
        }
      } else {
        // 존재하지 않으면 태스크 제목 및 타임스탬프를 기입해 새 노트 자동 생성
        const initDate = new Date();
        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        };
        const formattedInit = initDate.toLocaleDateString(lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US", options);

        note = {
          id: taskId,
          title: taskTitle,
          pages: [
            {
              id: `page-${Date.now()}`,
              pageNumber: 1,
              text: "",
              objects: [],
            },
          ],
          theme: "sepia",
          font: "sans",
          fontSize: 16,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          customDate: formattedInit,
          associatedTaskId: taskId,
        };
        await saveSpringNote(note);
      }

      // 2. localStorage에 활성화할 타겟 노트 ID 적재
      localStorage.setItem("clickbook_active_spring_note_id", taskId);

      // 3. 전용 화면으로 탭 네비게이션 트리거
      window.dispatchEvent(new CustomEvent("OPEN_SPRING_NOTE"));
    } catch (err) {
      console.error("Failed to redirect to Associated SpringNote:", err);
    }
  };

  const {
    data,
    loading,
    activeSettings,
    editingColumnId,
    setEditingColumnId,
    editColumnTitle,
    setEditColumnTitle,
    addingTaskToCol,
    setAddingTaskToCol,
    newTaskContent,
    setNewTaskContent,
    showColorPickerForCol,
    setShowColorPickerForCol,
    editingTask,
    setEditingTask,
    handleDragEnd,
    addColumn,
    deleteColumn,
    saveColumnTitle,
    changeColumnColor,
    addTask,
    deleteTask,
    toggleTaskCompletion,
    openTaskModal,
    saveTaskModal,
  } = useTodoState(settings, t);

  if (loading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  // Find the column title of the editing task
  const editingTaskColumnTitle = editingTask
    ? data.columns[
        Object.keys(data.columns).find((colId) => data.columns[colId].taskIds.includes(editingTask.id)) || ""
      ]?.title || ""
    : "";

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <WallpaperBackground isDarkMode={isDarkMode}>
      {DialogEl}
      <div className="max-w-[1440px] w-full mx-auto pb-4 pt-2 sm:pt-4 px-2 sm:px-6 select-none flex flex-col h-[calc(100vh-2rem)] space-y-3">
        {/* ── 타이틀 & 컨트롤 헤더 (박스 없이 시원하게 노출) ── */}
        <div className="shrink-0 flex items-center justify-between px-1">
          <h1 className="text-xl font-extrabold flex items-center gap-2.5 tracking-tight text-slate-800 dark:text-slate-100">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
              <ListTodo size={16} strokeWidth={2.2} />
            </span>
            <span>
              {t("todoBoardTitle") || "TODO Board"}
            </span>
          </h1>
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-figma-xs transition-all active:scale-98 cursor-pointer"
          >
            <Plus size={13} strokeWidth={2.5} />
            {t("addTodoColumn") || "Add List"}
          </button>
        </div>

        {/* ── 칸반 컬럼 영역 (브라우저 높이에 유동적 피팅) ── */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar min-h-0">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="all-columns" direction="horizontal" type="column">
              {(provided: DroppableProvided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex gap-4 h-full items-start"
                >
                  {data.columnOrder.map((columnId, index) => {
                    const column = data.columns[columnId];
                    if (!column) return null;
                    const tasks = column.taskIds.map((taskId) => data.tasks[taskId]).filter(Boolean);

                    return (
                      <TodoColumn
                        key={column.id}
                        column={column}
                        index={index}
                        tasks={tasks}
                        editingColumnId={editingColumnId}
                        editColumnTitle={editColumnTitle}
                        setEditColumnTitle={setEditColumnTitle}
                        setEditingColumnId={setEditingColumnId}
                        onSaveColumnTitle={saveColumnTitle}
                        deleteColumn={(id) => deleteColumn(id, showConfirm)}
                        showColorPickerForCol={showColorPickerForCol}
                        setShowColorPickerForCol={setShowColorPickerForCol}
                        changeColumnColor={changeColumnColor}
                        addingTaskToCol={addingTaskToCol}
                        setAddingTaskToCol={setAddingTaskToCol}
                        newTaskContent={newTaskContent}
                        setNewTaskContent={setNewTaskContent}
                        addTask={addTask}
                        onToggleComplete={toggleTaskCompletion}
                        onOpenModal={openTaskModal}
                        onDeleteTask={(tid, cid, e) => deleteTask(tid, cid, showConfirm, e)}
                        onOpenSpringNote={handleOpenSpringNoteAndRedirect}
                        t={t}
                      />
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Task Details Modal Component */}
      {editingTask && (
        <TaskDetailsModal
          task={editingTask}
          columnTitle={editingTaskColumnTitle}
          onClose={() => setEditingTask(null)}
          onSave={saveTaskModal}
          enableTodoNotifications={activeSettings?.enableTodoNotifications}
          t={t}
          lang={lang}
        />
      )}
    </WallpaperBackground>
  );
}