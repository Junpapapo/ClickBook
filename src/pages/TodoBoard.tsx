import React from "react";
import { DragDropContext, Droppable, DroppableProvided } from "@hello-pangea/dnd";
import { Plus, Check, Loader2 } from "lucide-react";
import type { AppSettings } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
import TodoColumn from "./TodoBoard/TodoColumn";
import TaskDetailsModal from "./TodoBoard/TaskDetailsModal";
import { useTodoState } from "./TodoBoard/hooks/useTodoState";

export default function TodoBoard({ settings }: { settings?: AppSettings }) {
  const { t, lang } = useLang();
  const { showConfirm, DialogEl } = useDialog();

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
      <div className="h-full flex flex-col font-sans">
        <div className="mb-6 shrink-0 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <Check size={16} strokeWidth={3} />
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
    </>
  );
}