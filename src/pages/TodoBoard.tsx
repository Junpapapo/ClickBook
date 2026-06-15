import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, DropResult, DroppableProvided } from "@hello-pangea/dnd";
import { Plus, Check, Loader2 } from "lucide-react";
import type { TodoBoardData, TodoColumn as TodoColType, TodoTask, MessageResponse, AppSettings } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
import TodoColumn from "./TodoBoard/TodoColumn";
import TaskDetailsModal from "./TodoBoard/TaskDetailsModal";

export default function TodoBoard({ settings }: { settings?: AppSettings }) {
  const { t, lang } = useLang();
  const { showConfirm, DialogEl } = useDialog();

  const [data, setData] = useState<TodoBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const activeSettings = settings || localSettings;

  // Focus management
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");
  const [addingTaskToCol, setAddingTaskToCol] = useState<string | null>(null);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [showColorPickerForCol, setShowColorPickerForCol] = useState<string | null>(null);

  // Task Modal management
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = (await chrome.runtime.sendMessage({ type: "GET_TODO_BOARD" })) as MessageResponse;
    if (res.success && res.data) {
      setData(res.data as TodoBoardData);
    }
    const settingsRes = (await chrome.runtime.sendMessage({ type: "GET_SETTINGS" })) as MessageResponse;
    if (settingsRes.success && settingsRes.data) {
      setLocalSettings(settingsRes.data as AppSettings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveData = useCallback(async (newData: TodoBoardData) => {
    setData(newData); // Optimistic UI update
    await chrome.runtime.sendMessage({ type: "SAVE_TODO_BOARD", data: newData });
  }, []);

  // --- Handlers ---
  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (!data) return;

    // Moving a column
    if (type === "column") {
      const newColumnOrder = Array.from(data.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);

      saveData({
        ...data,
        columnOrder: newColumnOrder,
      });
      return;
    }

    // Moving a task
    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    // Moving within the same column
    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      };

      saveData({
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      });
      return;
    }

    // Moving from one column to another
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = {
      ...startColumn,
      taskIds: startTaskIds,
    };

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finishColumn,
      taskIds: finishTaskIds,
    };

    saveData({
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    });
  }, [data, saveData]);

  const addColumn = useCallback(() => {
    if (!data) return;
    const newColId = `col-${Date.now()}`;
    const newColumn: TodoColType = {
      id: newColId,
      title: "New List",
      taskIds: [],
    };
    saveData({
      ...data,
      columns: {
        ...data.columns,
        [newColId]: newColumn,
      },
      columnOrder: [...data.columnOrder, newColId],
    });
    setEditingColumnId(newColId);
    setEditColumnTitle("New List");
  }, [data, saveData]);

  const deleteColumn = useCallback(async (colId: string) => {
    if (!data) return;
    const col = data.columns[colId];
    if (col.taskIds.length > 0) {
      const confirmed = await showConfirm(t("deleteColumnConfirm") || "Delete this list?", "Delete", "Cancel", "warn");
      if (!confirmed) return;
    }

    const newColumnOrder = data.columnOrder.filter((id) => id !== colId);
    const newColumns = { ...data.columns };
    delete newColumns[colId];

    // Cleanup orphaned tasks
    const newTasks = { ...data.tasks };
    col.taskIds.forEach((taskId) => {
      delete newTasks[taskId];
    });

    saveData({
      tasks: newTasks,
      columns: newColumns,
      columnOrder: newColumnOrder,
    });
  }, [data, saveData, showConfirm, t]);

  const saveColumnTitle = useCallback((colId: string, newTitle: string) => {
    if (!data) return;
    const title = newTitle.trim() || "Untitled List";
    const column = data.columns[colId];
    if (!column) return;
    saveData({
      ...data,
      columns: {
        ...data.columns,
        [colId]: { ...column, title },
      },
    });
    setEditingColumnId(null);
  }, [data, saveData]);

  const changeColumnColor = useCallback((colId: string, color: string) => {
    if (!data) return;
    const column = data.columns[colId];
    saveData({
      ...data,
      columns: {
        ...data.columns,
        [colId]: { ...column, color: color === "default" ? undefined : color },
      },
    });
    setShowColorPickerForCol(null);
  }, [data, saveData]);

  const addTask = useCallback((colId: string, content: string) => {
    if (!data) return;
    const trimmed = content.trim();
    if (!trimmed) {
      setAddingTaskToCol(null);
      return;
    }

    const taskId = `task-${Date.now()}`;
    const newTask: TodoTask = {
      id: taskId,
      content: trimmed,
      createdAt: Date.now(),
    };

    const column = data.columns[colId];
    saveData({
      ...data,
      tasks: {
        ...data.tasks,
        [taskId]: newTask,
      },
      columns: {
        ...data.columns,
        [colId]: {
          ...column,
          taskIds: [...column.taskIds, taskId],
        },
      },
    });
    setNewTaskContent("");
    setAddingTaskToCol(null);
  }, [data, saveData]);

  const deleteTask = useCallback(async (taskId: string, colId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!data) return;
    const confirmed = await showConfirm(t("deleteTaskConfirm") || "Delete this task?", "Delete", "Cancel", "warn");
    if (!confirmed) return;

    const column = data.columns[colId];
    const newTaskIds = column.taskIds.filter((id) => id !== taskId);

    const newTasks = { ...data.tasks };
    delete newTasks[taskId];

    saveData({
      ...data,
      tasks: newTasks,
      columns: {
        ...data.columns,
        [colId]: { ...column, taskIds: newTaskIds },
      },
    });
  }, [data, saveData, showConfirm, t]);

  const toggleTaskCompletion = useCallback((taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data) return;
    const task = data.tasks[taskId];
    if (!task) return;
    
    const nextCompleted = !task.completed;
    saveData({
      ...data,
      tasks: {
        ...data.tasks,
        [taskId]: {
          ...task,
          completed: nextCompleted,
          progress: nextCompleted ? 100 : task.progress
        }
      }
    });
  }, [data, saveData]);

  const openTaskModal = useCallback((task: TodoTask) => {
    setEditingTask(task);
  }, []);

  const saveTaskModal = useCallback((updatedTask: TodoTask) => {
    if (!data || !editingTask) return;
    saveData({
      ...data,
      tasks: {
        ...data.tasks,
        [editingTask.id]: updatedTask
      }
    });
    setEditingTask(null);
  }, [data, editingTask, saveData]);

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
                        deleteColumn={deleteColumn}
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
                        onDeleteTask={deleteTask}
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