import React, { useState } from "react";
import { DragDropContext, Droppable, DroppableProvided } from "@hello-pangea/dnd";
import { Plus, Check, ListTodo, Loader2 } from "lucide-react";
import type { AppSettings, SpringNote } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
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
      const clickedTask = data.tasks[taskId];
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

  return (
    <>
      {DialogEl}
      <div className="h-full flex font-sans overflow-hidden p-6">
        {/* Left Area - Kanban Board */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <div className="mb-6 shrink-0 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/25">
              <ListTodo size={16} strokeWidth={2.2} />
            </span>
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
              {t("todoBoardTitle") || "TODO Board"}
            </span>
          </h1>
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus size={12} />
            {t("addTodoColumn") || "Add List"}
          </button>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-surface-600">
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
    </>
  );
}