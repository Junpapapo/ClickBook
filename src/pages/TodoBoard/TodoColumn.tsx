import React from "react";
import { Draggable, Droppable, DraggableProvided, DroppableProvided } from "@hello-pangea/dnd";
import { Check, Palette, Trash2, Plus } from "lucide-react";
import type { TodoColumn, TodoTask } from "@/shared/types";
import TodoCard from "./TodoCard";

const COLUMN_BG_COLORS: Record<string, string> = {
  default: "bg-gray-100 dark:bg-[#1A1A1C]",
  blue: "bg-blue-50/50 dark:bg-[#1A1E24]",
  emerald: "bg-emerald-50/50 dark:bg-[#1A221C]",
  amber: "bg-amber-50/50 dark:bg-[#24201A]",
  rose: "bg-rose-50/50 dark:bg-[#241A1C]",
  purple: "bg-purple-50/50 dark:bg-[#201A24]",
};

const COLOR_BTN_BG: Record<string, string> = {
  default: "bg-gray-300 dark:bg-gray-600",
  blue: "bg-blue-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  purple: "bg-purple-400",
};

interface TodoColumnViewProps {
  column: TodoColumn;
  index: number;
  tasks: TodoTask[];
  editingColumnId: string | null;
  editColumnTitle: string;
  setEditColumnTitle: (val: string) => void;
  setEditingColumnId: (val: string | null) => void;
  onSaveColumnTitle: (colId: string, newTitle: string) => void;
  deleteColumn: (colId: string) => void;
  showColorPickerForCol: string | null;
  setShowColorPickerForCol: (val: string | null) => void;
  changeColumnColor: (colId: string, color: string) => void;
  addingTaskToCol: string | null;
  setAddingTaskToCol: (val: string | null) => void;
  newTaskContent: string;
  setNewTaskContent: (val: string) => void;
  addTask: (colId: string, content: string) => void;
  onToggleComplete: (taskId: string, e: React.MouseEvent) => void;
  onOpenModal: (task: TodoTask) => void;
  onDeleteTask: (taskId: string, colId: string, e?: React.MouseEvent) => void;
  onOpenSpringNote: (taskId: string, e: React.MouseEvent) => void;
  t: any;
}



export default React.memo(function TodoColumn({
  column,
  index,
  tasks,
  editingColumnId,
  editColumnTitle,
  setEditColumnTitle,
  setEditingColumnId,
  onSaveColumnTitle,
  deleteColumn,
  showColorPickerForCol,
  setShowColorPickerForCol,
  changeColumnColor,
  addingTaskToCol,
  setAddingTaskToCol,
  newTaskContent,
  setNewTaskContent,
  addTask,
  onToggleComplete,
  onOpenModal,
  onDeleteTask,
  onOpenSpringNote,
  t,
}: TodoColumnViewProps) {


  const colorVariants = [
    "border-t-emerald-400",
    "border-t-blue-400",
    "border-t-purple-400",
    "border-t-rose-400",
    "border-t-amber-400"
  ];
  const colColor = colorVariants[index % colorVariants.length];
  const currentBgClass = COLUMN_BG_COLORS[column.color || "default"];

  return (
    <Draggable key={column.id} draggableId={column.id} index={index}>
      {(provided: DraggableProvided) => (
        <div
          {...provided.draggableProps}
          ref={provided.innerRef}
          className={`${currentBgClass} rounded-2xl w-[85vw] sm:w-auto sm:flex-1 sm:min-w-[300px] sm:max-w-[400px] shrink-0 flex flex-col max-h-full border border-gray-200/60 dark:border-white/[0.05] shadow-sm relative overflow-hidden transition-colors`}
        >
          <div className={`absolute top-0 left-0 w-full h-1 ${colColor} opacity-70`} />
          <div
            {...provided.dragHandleProps}
            className="px-4 pt-5 pb-3 flex items-center justify-between group/col"
          >
            {editingColumnId === column.id ? (
              <div className="flex items-center gap-1 w-full bg-white dark:bg-surface-900 rounded-lg border-2 border-indigo-500 px-2 py-1 shadow-sm">
                <input
                  autoFocus
                  value={editColumnTitle}
                  onChange={(e) => setEditColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveColumnTitle(column.id, editColumnTitle);
                    if (e.key === "Escape") setEditingColumnId(null);
                  }}
                  className="flex-1 bg-transparent text-sm font-semibold outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  placeholder={t("columnTitlePlaceholder") || "List Title"}
                />
                <button 
                  onClick={() => onSaveColumnTitle(column.id, editColumnTitle)} 
                  className="text-indigo-500 p-0.5 hover:bg-indigo-55 dark:hover:bg-surface-800 rounded-md"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-1 truncate">
                  <h3
                    onClick={() => {
                      setEditingColumnId(column.id);
                      setEditColumnTitle(column.title);
                    }}
                    className="font-bold text-gray-900 dark:text-gray-100 cursor-pointer truncate text-[15px] tracking-tight"
                  >
                    {column.title}
                  </h3>
                  <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 transition-opacity">
                  <button
                    onClick={() => setShowColorPickerForCol(showColorPickerForCol === column.id ? null : column.id)}
                    className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    <Palette size={14} />
                  </button>
                  <button
                    onClick={() => deleteColumn(column.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>

          {showColorPickerForCol === column.id && (
            <div className="px-4 pb-3 flex gap-2 justify-end animate-in fade-in slide-in-from-top-1 duration-200">
              {Object.keys(COLUMN_BG_COLORS).map(colorKey => {
                const isActive = column.color === colorKey || (!column.color && colorKey === 'default');
                return (
                  <button
                    key={colorKey}
                    onClick={() => changeColumnColor(column.id, colorKey)}
                    className={`w-5 h-5 rounded-full ${COLOR_BTN_BG[colorKey]} shadow-sm transition-transform hover:scale-110 flex items-center justify-center ${
                      isActive ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#1A1A1C] scale-105' : ''
                    }`}
                  >
                    {isActive && <Check size={10} className="text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          )}

          <Droppable droppableId={column.id} type="task">
            {(provided: DroppableProvided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex-1 overflow-y-auto px-3 pb-2 min-h-[60px] transition-colors scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-surface-600 ${
                  snapshot.isDraggingOver ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                }`}
              >
                {tasks.map((task, index) => (
                  <TodoCard
                    key={task.id}
                    task={task}
                    index={index}
                    columnId={column.id}
                    onToggleComplete={onToggleComplete}
                    onOpenModal={onOpenModal}
                    onDeleteTask={onDeleteTask}
                    onOpenSpringNote={onOpenSpringNote}
                  />
                ))}
                {provided.placeholder}
                
                {addingTaskToCol === column.id && (
                  <div className="bg-white dark:bg-[#2C2C2E] p-3 rounded-xl shadow-md mb-2 border-2 border-indigo-500 flex flex-col gap-2 relative animate-in fade-in slide-in-from-top-2 duration-200">
                    <textarea
                      autoFocus
                      value={newTaskContent}
                      onChange={(e) => setNewTaskContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addTask(column.id, newTaskContent);
                        }
                        if (e.key === "Escape") setAddingTaskToCol(null);
                      }}
                      placeholder={t("taskContentPlaceholder") || "Enter task..."}
                      className="w-full text-[14px] bg-transparent outline-none resize-none text-gray-800 dark:text-gray-200 min-h-[70px] placeholder-gray-400"
                    />
                    <div className="flex gap-2 justify-end mt-1">
                      <button 
                        onClick={() => setAddingTaskToCol(null)} 
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        disabled={!newTaskContent.trim()}
                        onClick={() => addTask(column.id, newTaskContent)} 
                        className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-550 text-white disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-surface-800 dark:disabled:text-gray-505 disabled:cursor-not-allowed disabled:shadow-none rounded-lg font-medium transition-colors shadow-sm shadow-indigo-500/20 active:scale-95"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Droppable>

          {addingTaskToCol !== column.id && (
            <div className="p-3 shrink-0 pt-1">
              <button
                onClick={() => {
                  setAddingTaskToCol(column.id);
                  setNewTaskContent("");
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-surface-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all hover:shadow-sm"
              >
                <Plus size={16} />
                {t("addTodoTask") || "Add Task"}
              </button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
});
