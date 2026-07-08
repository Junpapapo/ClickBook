import React, { useState, useEffect, useRef } from "react";
import { X, Maximize2, Move, Trash2, Plus, Type, RotateCcw, RotateCw, Undo2 } from "lucide-react";
import type { NoteObject, SpringNoteCanvasProps } from "../spring-note-types";
import { getSpringNoteImage } from "@/utils/springNoteDb";

export default function SpringNoteCanvas({
  pageId,
  objects,
  onUpdateObjects,
  t,
  theme,
  selectedObjId,
  setSelectedObjId,
  scrollHeight = 500,
}: SpringNoteCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // 테이블 셀 글자색을 지면 테마에 확실히 맞추기 위한 전용 헬퍼
  const getTableTextColorClass = () => {
    if (theme === "light" || theme === "grid") return "!text-black";
    if (theme === "sepia") return "!text-[#4A3728]";
    return "!text-gray-200"; // dark 테마
  };
  const [activeImageUrls, setActiveImageUrls] = useState<Record<string, string>>({});
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  
  // dragStart 레퍼런스는 드래그/리사이즈/자유회전에 멀티로 활용
  const dragStart = useRef({ x: 0, y: 0, objX: 0, objY: 0, objW: 0, objH: 0 });

  // 1. IndexedDB에서 이미지 Blob 로드
  // 이미지 내용 정보만을 결합한 고유 식별자 키 생성 (위치, 크기, 회전 변화 시 재로딩 차단)
  const imageContentsKey = objects
    .filter((obj) => obj.type === "image")
    .map((obj) => `${obj.id}-${obj.content}`)
    .join(",");

  useEffect(() => {
    const urlsToCleanup: string[] = [];
    
    const loadImages = async () => {
      const newUrls: Record<string, string> = {};
      for (const obj of objects) {
        if (obj.type === "image" && obj.content) {
          try {
            const blob = await getSpringNoteImage(obj.content);
            if (blob) {
              const url = URL.createObjectURL(blob);
              newUrls[obj.id] = url;
              urlsToCleanup.push(url);
            }
          } catch (err) {
            console.warn("Failed to load image blob from DB:", err);
          }
        }
      }
      setActiveImageUrls(newUrls);
    };

    loadImages();

    return () => {
      urlsToCleanup.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageContentsKey, pageId]);

  // 2. 드래그 앤 리사이즈 로직
  const handleDragStart = (e: React.MouseEvent, obj: NoteObject) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(obj.id);
    setSelectedObjId(obj.id);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      objX: obj.x,
      objY: obj.y,
      objW: obj.width,
      objH: obj.height,
    };
  };

  const handleResizeStart = (e: React.MouseEvent, obj: NoteObject) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingId(obj.id);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      objX: obj.x,
      objY: obj.y,
      objW: obj.width,
      objH: obj.height,
    };
  };

  // 3. 포토샵 스타일 자유 회전 핸들 드래그 시작
  const handleRotateStart = (e: React.MouseEvent, obj: NoteObject) => {
    e.preventDefault();
    e.stopPropagation();

    const targetEl = document.getElementById(`obj-${obj.id}`);
    if (!targetEl) return;

    // 객체의 브라우저상 중심점 좌표 구하기
    const rect = targetEl.getBoundingClientRect();
    const cX = rect.left + rect.width / 2;
    const cY = rect.top + rect.height / 2;

    setRotatingId(obj.id);
    setSelectedObjId(obj.id);

    // 첫 마우스 클릭 시점의 아크탄젠트 각도 계산 (도 단위)
    const dx = e.clientX - cX;
    const dy = e.clientY - cY;
    const startAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    dragStart.current = {
      x: startAngle,          // x자리에 드래그 시작 각도 저장
      y: 0,
      objX: cX,               // objX자리에 중심점 X 보관
      objY: cY,               // objY자리에 중심점 Y 보관
      objW: obj.rotation || 0,// objW자리에 기존 오브젝트 회전각 보관
      objH: 0,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    if (draggingId) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const dxPercent = (dx / canvasRect.width) * 100;
      
      const newX = Math.max(0, Math.min(100 - (dragStart.current.objW / canvasRect.width) * 100, dragStart.current.objX + dxPercent));
      const newY = Math.max(0, dragStart.current.objY + dy);

      onUpdateObjects(
        objects.map((obj) => (obj.id === draggingId ? { ...obj, x: newX, y: newY } : obj))
      );
    } else if (resizingId) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const newWidth = Math.max(80, dragStart.current.objW + dx);
      const newHeight = Math.max(50, dragStart.current.objH + dy);

      onUpdateObjects(
        objects.map((obj) => (obj.id === resizingId ? { ...obj, width: newWidth, height: newHeight } : obj))
      );
    } else if (rotatingId) {
      // 마우스 상대 회전 변화량(Delta) 계산
      const cX = dragStart.current.objX;
      const cY = dragStart.current.objY;
      const dx = e.clientX - cX;
      const dy = e.clientY - cY;

      // 현재 마우스 각도
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // 직전 마우스 각도와의 편차 연산 (직전 각도는 dragStart.current.x 에 보관되어 있음)
      let angleDiff = currentAngle - dragStart.current.x;

      // 360도 경계선 튐 방지
      if (angleDiff > 180) {
        angleDiff -= 360;
      } else if (angleDiff < -180) {
        angleDiff += 360;
      }

      // 대상 오브젝트의 현재 회전 각도 획득
      const targetObj = objects.find((o) => o.id === rotatingId);
      const currentRotation = targetObj ? targetObj.rotation || 0 : 0;

      // 새로운 회전각 산출 및 각도 정제
      let newRotation = Math.round(currentRotation + angleDiff);
      newRotation = (newRotation + 360) % 360;

      // 다음 무브 계산을 위해 직전 각도 좌표를 현재 각도로 실시간 갱신
      dragStart.current.x = currentAngle;

      onUpdateObjects(
        objects.map((obj) => (obj.id === rotatingId ? { ...obj, rotation: newRotation } : obj))
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
    setRotatingId(null);
  };

  useEffect(() => {
    if (draggingId || resizingId || rotatingId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingId, resizingId, rotatingId, objects]);

  // 4. 오브젝트 삭제
  const handleDeleteObject = (objId: string) => {
    onUpdateObjects(objects.filter((obj) => obj.id !== objId));
    if (selectedObjId === objId) setSelectedObjId(null);
  };

  // 5. 테이블 데이터 편집 바인딩 (contentEditable)
  const handleCellBlur = (obj: NoteObject, rIdx: number, cIdx: number, text: string) => {
    const currentTable = obj.metadata?.tableData ? [...obj.metadata.tableData] : [];
    if (currentTable[rIdx]) {
      currentTable[rIdx] = [...currentTable[rIdx]];
      currentTable[rIdx][cIdx] = text;
    }
    onUpdateObjects(
      objects.map((o) =>
        o.id === obj.id
          ? {
              ...o,
              metadata: {
                ...o.metadata,
                tableData: currentTable,
              },
            }
          : o
      )
    );
  };

  // 6. 테이블 구조 추가 (행/열 증가)
  const handleTableRowAdd = (obj: NoteObject) => {
    const rows = obj.metadata?.tableRows || 3;
    const cols = obj.metadata?.tableCols || 3;
    const data = obj.metadata?.tableData ? [...obj.metadata.tableData] : [];

    const newRow = Array(cols).fill("");
    data.push(newRow);

    onUpdateObjects(
      objects.map((o) =>
        o.id === obj.id
          ? {
              ...o,
              height: o.height + 32,
              metadata: {
                ...o.metadata,
                tableRows: rows + 1,
                tableData: data,
              },
            }
          : o
      )
    );
  };

  const handleTableColAdd = (obj: NoteObject) => {
    const rows = obj.metadata?.tableRows || 3;
    const cols = obj.metadata?.tableCols || 3;
    const data = obj.metadata?.tableData ? [...obj.metadata.tableData] : [];

    const updatedData = data.map((row) => [...row, ""]);

    onUpdateObjects(
      objects.map((o) =>
        o.id === obj.id
          ? {
              ...o,
              width: o.width + 65,
              metadata: {
                ...o.metadata,
                tableCols: cols + 1,
                tableData: updatedData,
              },
            }
          : o
      )
    );
  };

  // 7. 개별 오브젝트 전용 폰트 제어
  const handleObjFontSizeChange = (obj: NoteObject, delta: number) => {
    const currentSize = obj.metadata?.fontSize || 12;
    const nextSize = Math.max(9, Math.min(24, currentSize + delta));
    onUpdateObjects(
      objects.map((o) =>
        o.id === obj.id
          ? {
              ...o,
              metadata: {
                ...o.metadata,
                fontSize: nextSize,
              },
            }
          : o
      )
    );
  };

  const handleObjFontFamilyChange = (obj: NoteObject) => {
    const currentFont = obj.metadata?.fontFamily || "sans";
    const nextFont = currentFont === "sans" ? "serif" : currentFont === "serif" ? "mono" : "sans";
    onUpdateObjects(
      objects.map((o) =>
        o.id === obj.id
          ? {
              ...o,
              metadata: {
                ...o.metadata,
                fontFamily: nextFont,
              },
            }
          : o
      )
    );
  };

  // 8. 이미지 회전 각도 제어 (초기화 전용으로 단순화)
  const handleRotateReset = (obj: NoteObject) => {
    onUpdateObjects(
      objects.map((o) => (o.id === obj.id ? { ...o, rotation: 0 } : o))
    );
  };

  // 9. 이미지 테두리 두께 제어 (0 ~ 8px)
  const handleBorderWidthChange = (obj: NoteObject, delta: number) => {
    const currentWidth = obj.metadata?.borderWidth || 0;
    const nextWidth = Math.max(0, Math.min(8, currentWidth + delta));
    onUpdateObjects(
      objects.map((o) =>
        o.id === obj.id
          ? {
              ...o,
              metadata: {
                ...o.metadata,
                borderWidth: nextWidth,
              },
            }
          : o
      )
    );
  };

  // 10. 이미지 테두리 색상 변경
  const handleBorderColorChange = (obj: NoteObject, color: string) => {
    onUpdateObjects(
      objects.map((o) =>
        o.id === obj.id
          ? {
              ...o,
              metadata: {
                ...o.metadata,
                borderColor: color === "default" ? undefined : color,
              },
            }
          : o
      )
    );
  };

  return (
    <div
      ref={canvasRef}
      style={{
        height: `${Math.max(500, scrollHeight)}px`,
      }}
      className="absolute inset-x-0 top-0 z-20 pointer-events-none"
      onClick={() => setSelectedObjId(null)}
    >
      {objects.map((obj) => {
        const isSelected = selectedObjId === obj.id;
        const isTable = obj.type === "table";
        
        // 테이블은 글자 기입을 위해 회전 0도 강제
        const rotationStyle = isTable ? "rotate(0deg)" : (obj.rotation ? `rotate(${obj.rotation}deg)` : "rotate(0deg)");
        
        const oFontSize = obj.metadata?.fontSize || 12;
        const oFontFamily = obj.metadata?.fontFamily || "sans";
        const oBorderWidth = obj.metadata?.borderWidth ?? 0;
        const oBorderColor = obj.metadata?.borderColor;

        const borderColorsMap: Record<string, string> = {
          indigo: "border-indigo-500 dark:border-indigo-400",
          rose: "border-rose-500 dark:border-rose-400",
          amber: "border-amber-500 dark:border-amber-400",
          emerald: "border-emerald-500 dark:border-emerald-400",
          gray: "border-gray-500 dark:border-gray-400",
        };

        // 테이블은 기본 테두리 제거, 호버 또는 선택 시에만 연하게 안내 테두리 제공
        const borderClass = isTable
          ? isSelected
            ? "border border-indigo-400 dark:border-indigo-400/50 shadow-sm ring-1 ring-indigo-400/10 z-30"
            : "border border-transparent hover:border-gray-250/50 dark:hover:border-surface-700/50"
          : (oBorderWidth > 0 && oBorderColor && borderColorsMap[oBorderColor]
            ? borderColorsMap[oBorderColor]
            : isSelected
            ? "border-2 border-indigo-500 ring-2 ring-indigo-500/10 shadow-lg z-30"
            : "border-dashed border-indigo-400/40 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md");

        const borderCustomStyle = !isTable && oBorderWidth > 0
          ? { borderStyle: "solid" as const, borderWidth: `${oBorderWidth}px` }
          : {};

        // 테이블은 카드 상자처럼 둥둥 떠있지 않도록 배경을 투명 처리
        const containerBg = isTable ? "bg-transparent" : "bg-white dark:bg-surface-800";

        const fontClass =
          oFontFamily === "serif"
            ? "font-serif"
            : oFontFamily === "mono"
            ? "font-mono"
            : "font-sans";

        return (
          <div
            key={obj.id}
            id={`obj-${obj.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedObjId(obj.id);
            }}
            style={{
              position: "absolute",
              left: `${obj.x}%`,
              top: `${obj.y}px`,
              width: `${obj.width}px`,
              height: `${obj.height}px`,
              transform: rotationStyle,
              ...borderCustomStyle,
            }}
            className={`pointer-events-auto border rounded-lg flex flex-col p-1 animate-in zoom-in-95 duration-200 transition-all group ${containerBg} ${borderClass}`}
          >
            {/* 포토샵/PPT 스타일 이미지 자유 회전 핸들 조절 점 (선택된 이미지 하단에 표시하여 상단 툴바와 겹치지 않게 조율) */}
            {isSelected && obj.type === "image" && (
              <>
                {/* 핸들 연결 수직선 */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full h-5 w-0.5 bg-indigo-500 dark:bg-indigo-400 z-30 pointer-events-none" />
                {/* 둥근 회전 조절 버튼 */}
                <div
                  onMouseDown={(e) => handleRotateStart(e, obj)}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-5 w-4 h-4 bg-indigo-600 hover:bg-indigo-500 rounded-full border-2 border-white dark:border-surface-800 shadow-md cursor-alias flex items-center justify-center z-40 transition-colors pointer-events-auto"
                  title="Drag to rotate image freely (Photoshop style)"
                >
                  <RotateCw size={8} className="text-white" />
                </div>
              </>
            )}

            {/* 개별 오브젝트용 상단 플로팅 미니 툴바 */}
            {isSelected && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900/95 dark:bg-surface-950/95 text-white flex items-center gap-1.5 p-1 rounded-lg shadow-xl text-[10px] whitespace-nowrap border border-white/10 z-40 animate-in fade-in slide-in-from-bottom-1 duration-150">
                
                {/* 이미지 타입이 아닐 때만 폰트 제어 노출 */}
                {obj.type !== "image" && (
                  <>
                    {/* 폰트 크기 변경 */}
                    <button
                      type="button"
                      onClick={() => handleObjFontSizeChange(obj, -1)}
                      className="px-1.5 py-0.5 hover:bg-white/20 rounded font-bold"
                      title="Text Smaller"
                    >
                      A-
                    </button>
                    <span className="font-mono text-gray-400 select-none">{oFontSize}</span>
                    <button
                      type="button"
                      onClick={() => handleObjFontSizeChange(obj, 1)}
                      className="px-1.5 py-0.5 hover:bg-white/20 rounded font-bold"
                      title="Text Larger"
                    >
                      A+
                    </button>

                    <div className="w-px h-3 bg-white/20" />

                    {/* 폰트 페밀리 토글 */}
                    {obj.type !== "table" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleObjFontFamilyChange(obj)}
                          className="p-1 hover:bg-white/20 rounded capitalize flex items-center gap-0.5"
                          title="Toggle Font Family"
                        >
                          <Type size={11} />
                          <span>{oFontFamily}</span>
                        </button>
                        <div className="w-px h-3 bg-white/20" />
                      </>
                    )}
                  </>
                )}

                {/* 이미지 오브젝트일 경우에만 회전 초기화 리셋 버튼 노출 */}
                {obj.type === "image" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRotateReset(obj)}
                      className="px-2 py-0.5 hover:bg-white/20 rounded text-gray-300 hover:text-white flex items-center gap-1 font-semibold"
                      title="Reset Rotation (0°)"
                    >
                      <Undo2 size={11} />
                      <span>Reset</span>
                    </button>
                    <div className="w-px h-3 bg-white/20" />
                  </>
                )}

                {/* 이미지 또는 테이블 오브젝트일 경우 테두리 두께 및 색상 제어기 노출 */}
                {(obj.type === "image" || obj.type === "table") && (
                  <>
                    {/* 테두리 두께 조절 */}
                    <span className="text-[9px] text-gray-400 select-none">Border:</span>
                    <button
                      type="button"
                      onClick={() => handleBorderWidthChange(obj, -1)}
                      className="px-1 py-0.5 hover:bg-white/20 rounded font-bold text-gray-300 hover:text-white"
                      title="Decrease Border Width"
                    >
                      -
                    </button>
                    <span className="font-mono text-gray-300 select-none">{oBorderWidth}px</span>
                    <button
                      type="button"
                      onClick={() => handleBorderWidthChange(obj, 1)}
                      className="px-1 py-0.5 hover:bg-white/20 rounded font-bold text-gray-300 hover:text-white"
                      title="Increase Border Width"
                    >
                      +
                    </button>

                    <div className="w-px h-3 bg-white/20" />

                    {/* 테두리 색상 서브 토큰 리스트 */}
                    <div className="flex items-center gap-1.5">
                      {(["default", "gray", "indigo", "emerald", "amber", "rose"] as const).map((colorKey) => {
                        const bgMap: Record<string, string> = {
                          default: "bg-transparent border border-white/40",
                          gray: "bg-gray-500",
                          indigo: "bg-indigo-500",
                          emerald: "bg-emerald-500",
                          amber: "bg-amber-500",
                          rose: "bg-rose-500",
                        };
                        const isActive = (oBorderColor || "default") === colorKey;

                        return (
                          <button
                            key={colorKey}
                            type="button"
                            onClick={() => handleBorderColorChange(obj, colorKey)}
                            className={`w-3 h-3 rounded-full ${bgMap[colorKey]} transition-all ${
                              isActive ? "ring-2 ring-white scale-110 font-bold" : "hover:scale-110"
                            }`}
                            title={`Border Color: ${colorKey}`}
                          />
                        );
                      })}
                    </div>

                    <div className="w-px h-3 bg-white/20" />
                  </>
                )}

                {/* 테이블용 특수 버튼 (행/열 증가) */}
                {obj.type === "table" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTableRowAdd(obj)}
                      className="px-1.5 py-0.5 hover:bg-white/20 rounded font-semibold flex items-center gap-0.5"
                      title="Add Row"
                    >
                      <Plus size={9} />
                      <span>Row</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTableColAdd(obj)}
                      className="px-1.5 py-0.5 hover:bg-white/20 rounded font-semibold flex items-center gap-0.5"
                      title="Add Column"
                    >
                      <Plus size={9} />
                      <span>Col</span>
                    </button>
                    <div className="w-px h-3 bg-white/20" />
                  </>
                )}

                {/* 삭제 */}
                <button
                  type="button"
                  onClick={() => handleDeleteObject(obj.id)}
                  className="p-1 hover:bg-red-650/40 hover:text-red-300 rounded"
                  title="Delete Object"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}

            {/* 드래그용 상단 영역 (테이블 및 북마크 카드는 공간을 절약하고 미려하게 가리기 위해 평소 투명화 처리) */}
            <div 
              className={`flex items-center justify-between p-0.5 px-1.5 rounded-t cursor-move shrink-0 select-none transition-all duration-150 ${
                isTable || obj.type === "bookmark-memo"
                  ? "bg-transparent border-b border-transparent opacity-0 group-hover:opacity-100 group-hover:bg-black/[0.04] dark:group-hover:bg-white/[0.04] group-hover:border-black/[0.05] dark:group-hover:border-white/[0.05] h-4.5"
                  : "bg-gray-50 dark:bg-surface-900 border-b border-gray-150 dark:border-surface-700/60 h-5"
              }`}
              onMouseDown={(e) => handleDragStart(e, obj)}
            >
              <Move size={(isTable || obj.type === "bookmark-memo") ? 8 : 10} className="text-gray-400" />
              <span className="text-[8px] font-mono text-gray-400 truncate flex-1 pl-1">
                {(isTable || obj.type === "bookmark-memo") ? "" : obj.type.toUpperCase()}
              </span>
            </div>

            {/* 오브젝트 바디 렌더링 */}
            <div className="flex-1 overflow-auto relative mt-1 flex">
              {obj.type === "image" ? (
                activeImageUrls[obj.id] ? (
                  <img
                    src={activeImageUrls[obj.id]}
                    alt="Pasted Content"
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                ) : (
                  <div className="text-[10px] text-gray-400 m-auto">Loading...</div>
                )
              ) : obj.type === "table" ? (
                (() => {
                  const borderColorsHexMap: Record<string, string> = {
                    default: "rgba(209, 213, 219, 0.8)",
                    gray: "rgba(107, 114, 128, 0.8)",
                    indigo: "rgba(99, 102, 241, 0.8)",
                    emerald: "rgba(16, 185, 129, 0.8)",
                    amber: "rgba(245, 158, 11, 0.8)",
                    rose: "rgba(244, 63, 94, 0.8)",
                  };
                  const tdBorderColor = oBorderColor ? borderColorsHexMap[oBorderColor] : borderColorsHexMap.default;
                  const tdBorderWidth = oBorderWidth > 0 ? `${oBorderWidth}px` : "1px";

                  return (
                    /* contentEditable로 기입 가능한 Dynamic Table (상하 여백 없이 w-full h-full) */
                    <table className="w-full h-full text-[11px] border-collapse bg-white/70 dark:bg-surface-850/70 select-text shadow-sm rounded">
                      <tbody>
                        {(obj.metadata?.tableData || []).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cellText, cIdx) => (
                              <td
                                key={cIdx}
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleCellBlur(obj, rIdx, cIdx, e.target.innerText)}
                                style={{ 
                                  fontSize: `${oFontSize}px`,
                                  borderWidth: tdBorderWidth,
                                  borderColor: tdBorderColor,
                                  borderStyle: "solid"
                                }}
                                className={`p-1.5 min-w-[45px] min-h-[26px] break-all leading-normal outline-none ${getTableTextColorClass()} transition-colors border ${fontClass}`}
                              >
                                {cellText}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()
              ) : (obj.type === "bookmark-memo" && !obj.metadata?.url) ? (
                /* Post-it Style Memo Card */
                (() => {
                  const mColor = obj.metadata?.memoColor || "yellow";
                  // 테마별 색상 매핑
                  const memoBgClasses: Record<string, string> = {
                    pink: "bg-rose-50/95 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/30 text-rose-900 dark:text-rose-200",
                    blue: "bg-blue-50/95 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/30 text-blue-900 dark:text-blue-200",
                    green: "bg-emerald-50/95 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-200",
                    purple: "bg-purple-50/95 dark:bg-purple-950/30 border-purple-200/60 dark:border-purple-900/30 text-purple-900 dark:text-purple-200",
                    yellow: "bg-amber-50/95 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/30 text-amber-900 dark:text-amber-200",
                  };
                  const colorClass = memoBgClasses[mColor] || memoBgClasses.yellow;

                  return (
                    <div 
                      className={`w-full h-full flex flex-col justify-between p-2.5 pt-2 text-left select-text overflow-hidden rounded-lg border shadow-sm relative ${colorClass}`}
                    >
                      {/* 포스트잇 데코레이션 (상단 테이프 느낌 연출) */}
                      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white/20 dark:bg-black/10 backdrop-blur-[1px] rotate-1 select-none pointer-events-none rounded-[1px] shadow-sm"></div>

                      <div className="flex-1 flex flex-col gap-1 min-w-0 mt-1 overflow-hidden select-text">
                        {/* 메모 본문 내용 (더블클릭/클릭으로 인라인 편집 가능) */}
                        <p 
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const newContent = e.currentTarget.innerText;
                            if (newContent !== obj.content) {
                              onUpdateObjects(
                                objects.map((o) => o.id === obj.id ? { ...o, content: newContent } : o)
                              );
                            }
                          }}
                          style={{ fontSize: `${oFontSize - 1.5}px` }}
                          className={`font-semibold leading-normal whitespace-pre-wrap select-text break-all overflow-y-auto scrollbar-thin outline-none focus:bg-black/5 dark:focus:bg-white/5 p-1 rounded transition-colors ${fontClass}`}
                        >
                          {obj.content || "No content"}
                        </p>
                      </div>

                      {/* 하단 출처 및 메타데이터 */}
                      <div className="pt-1.5 mt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2 shrink-0 select-none">
                        {obj.metadata?.bookmarkTitle ? (
                          <a
                            href={obj.metadata.bookmarkUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 min-w-0 hover:underline opacity-80 hover:opacity-100"
                          >
                            {obj.metadata.favicon && (
                              <img
                                src={obj.metadata.favicon}
                                alt=""
                                className="w-2.5 h-2.5 shrink-0 rounded-sm object-contain"
                              />
                            )}
                            <span 
                              style={{ fontSize: `${Math.max(8, oFontSize - 4.5)}px` }}
                              className="font-bold truncate"
                            >
                              {obj.metadata.bookmarkTitle}
                            </span>
                          </a>
                        ) : (
                          <span 
                            style={{ fontSize: `${Math.max(8, oFontSize - 4.5)}px` }}
                            className="font-bold opacity-65"
                          >
                            📝 Memo
                          </span>
                        )}

                        <span 
                          style={{ fontSize: `${Math.max(7.5, oFontSize - 5)}px` }}
                          className="opacity-50 font-mono text-right select-none shrink-0"
                        >
                          {/* 현재 오브젝트가 생성된 간략 날짜 표시 */}
                          {(() => {
                            const timestampStr = obj.id.replace("obj-", "");
                            const timestamp = parseInt(timestampStr, 10);
                            if (isNaN(timestamp)) return "";
                            const date = new Date(timestamp);
                            return `${date.getFullYear() % 100}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* Bookmark Tag Card (Clean style) */
                <a
                  href={obj.metadata?.url || "#"}
                  target={obj.metadata?.url ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="w-full h-full flex flex-col justify-between p-2 text-left no-underline select-text overflow-hidden bg-amber-50/15 dark:bg-surface-800/15 hover:bg-amber-50/30 dark:hover:bg-surface-800/30 border border-amber-200/40 dark:border-surface-700/40 rounded-lg shadow-sm group/bookmark transition-colors"
                  onClick={(e) => {
                    if (!obj.metadata?.url) e.preventDefault();
                  }}
                >
                  <div className="flex-1 flex flex-col gap-1 min-w-0 select-text justify-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {obj.metadata?.favicon && (
                        <img
                          src={obj.metadata.favicon}
                          alt=""
                          className="w-3.5 h-3.5 shrink-0 rounded-sm object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <span 
                        style={{ fontSize: `${oFontSize - 1}px` }}
                        className={`font-extrabold text-gray-800 dark:text-gray-100 line-clamp-1 leading-snug flex-1 select-text ${fontClass}`}
                        title={obj.metadata?.title}
                      >
                        {obj.metadata?.title || "Bookmark"}
                      </span>
                    </div>
                  </div>

                  {/* 하단 깔끔한 도메인 뱃지 */}
                  <div className="pt-1.5 border-t border-dashed border-amber-200/25 dark:border-surface-700/40 flex items-center gap-1 shrink-0 select-none">
                    {(() => {
                      try {
                        if (!obj.metadata?.url) return null;
                        const urlObj = new URL(obj.metadata.url);
                        const host = urlObj.hostname.replace("www.", "");
                        return (
                          <div 
                            style={{ fontSize: `${Math.max(7.5, oFontSize - 5.5)}px` }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100/40 dark:bg-surface-900/50 text-amber-800/80 dark:text-gray-400 font-mono"
                          >
                            <span>🔗</span>
                            <span className="truncate max-w-[200px]">{host}</span>
                          </div>
                        );
                      } catch (err) {
                        return null;
                      }
                    })()}
                  </div>
                </a>
              )}
            </div>

            {/* 우하단 리사이즈 핸들 (테이블일 경우 호버 시에만 노출) */}
            <div
              className={`absolute right-0 bottom-0 w-3.5 h-3.5 cursor-se-resize rounded-tl flex items-center justify-center shrink-0 z-20 pointer-events-auto transition-opacity duration-150 ${
                isTable
                  ? "bg-indigo-500/10 hover:bg-indigo-500 opacity-0 group-hover:opacity-100"
                  : "bg-indigo-500/10 hover:bg-indigo-500"
              }`}
              onMouseDown={(e) => handleResizeStart(e, obj)}
              title="Drag to resize"
            >
              <Maximize2 size={7} className="text-indigo-600 dark:text-indigo-300" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
