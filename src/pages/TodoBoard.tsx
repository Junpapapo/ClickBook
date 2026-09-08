import { useState, useEffect } from "react";
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
import type { TodoTheme } from "./TodoBoard/todo-themes";
import { TODO_THEMES, getTodoThemeConfig } from "./TodoBoard/todo-themes";

export default function TodoBoard({ settings }: { settings?: AppSettings }) {
  const { t, lang } = useLang();
  const { showConfirm, DialogEl } = useDialog();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [todoTheme, setTodoTheme] = useState<TodoTheme>("modern");

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["clickbook_todo_theme"], (res) => {
        if (res && res.clickbook_todo_theme) {
          setTodoTheme(res.clickbook_todo_theme as TodoTheme);
        }
      });
    }
  }, []);

  const handleThemeChange = (newTheme: TodoTheme) => {
    setTodoTheme(newTheme);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ clickbook_todo_theme: newTheme });
    }
  };

  const themeConfig = getTodoThemeConfig(todoTheme);

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

  return (
    <WallpaperBackground isDarkMode={isDarkMode}>
      {DialogEl}
      <div className="w-full pb-4 pt-2 sm:pt-4 px-2 sm:px-6 select-none flex flex-col h-[calc(100vh-2rem)] space-y-3">
        {/* ── 타이틀 & 컨트롤 헤더 (피그마/Linear 스타일 슬림 세그먼트 & 시그니처 톤) ── */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          <h1 className="text-xl font-extrabold flex items-center gap-2.5 tracking-tight text-slate-800 dark:text-slate-100">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
              <ListTodo size={16} strokeWidth={2.2} />
            </span>
            <span>
              {t("todoBoardTitle") || "TODO Board"}
            </span>
          </h1>

          {/* Theme Selector (SpringNote Style Slim Pill Segmented Control - Unified in English) */}
          <div className="flex items-center h-[32px] p-0.5 rounded-xl border transition-all duration-300 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-white/10 shadow-figma-xs">
            {TODO_THEMES.map((tItem) => {
              const isSelected = todoTheme === tItem.id;
              return (
                <button
                  key={tItem.id}
                  onClick={() => handleThemeChange(tItem.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-figma-xs font-bold scale-[0.98]"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5"
                  }`}
                  title={tItem.name}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${tItem.dotColor}`} />
                  <span className="text-[11px]">{tItem.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-figma-xs transition-all active:scale-98 cursor-pointer"
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
                  className="flex gap-4 h-full items-stretch"
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
                        themeConfig={themeConfig}
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