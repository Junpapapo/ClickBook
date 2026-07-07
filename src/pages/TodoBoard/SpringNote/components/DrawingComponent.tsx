import React, { useRef, useState, useEffect } from "react";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { Trash2, AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
  color: string;
  size: number;
}

export default function DrawingComponent({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // 에디터 속성 데이터
  const lines: Line[] = node.attrs.lines || [];
  const bgColor = node.attrs.backgroundColor || "transparent";
  const align = node.attrs.align || "center";
  const widthClass = node.attrs.width || "max-w-xl"; // max-w-md, max-w-lg, max-w-xl, max-w-full
  const height = node.attrs.height || 256; // 세로 높이 px 단위
  
  // 그리기 설정 로컬 상태
  const [penColor, setPenColor] = useState(node.attrs.color || "#6366f1");
  const [penSize, setPenSize] = useState(node.attrs.size || 4);
  
  // 실시간 그리기 궤적용 로컬 상태
  const [localLines, setLocalLines] = useState<Line[]>(lines);
  const [currentLine, setCurrentLine] = useState<Point[] | null>(null);

  useEffect(() => {
    setLocalLines(lines);
  }, [lines]);

  // 마우스 상대 좌표 구하기
  const getCoordinates = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>): Point | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    const coord = getCoordinates(e);
    if (!coord) return;

    setIsDrawing(true);
    setCurrentLine([coord]);
  };

  const draw = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentLine) return;
    e.preventDefault();
    const coord = getCoordinates(e);
    if (!coord) return;

    setCurrentLine((prev) => (prev ? [...prev, coord] : [coord]));
  };

  const endDrawing = () => {
    if (!isDrawing || !currentLine) return;
    setIsDrawing(false);

    const newLine: Line = {
      points: currentLine,
      color: penColor,
      size: penSize,
    };
    const updatedLines = [...localLines, newLine];
    
    setLocalLines(updatedLines);
    setCurrentLine(null);

    updateAttributes({
      lines: updatedLines,
      color: penColor,
      size: penSize,
    });
  };

  const clearDrawing = () => {
    setLocalLines([]);
    setCurrentLine(null);
    updateAttributes({
      lines: [],
    });
  };

  // 높이 가감 조절 (+50px, -50px)
  const adjustHeight = (delta: number) => {
    const nextHeight = Math.max(150, Math.min(600, height + delta));
    updateAttributes({ height: nextHeight });
  };

  // SVG Path 생성기
  const getSvgPath = (points: Point[]) => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  // 정렬 flex 클래스
  const getJustifyClass = () => {
    if (align === "left") return "justify-start";
    if (align === "right") return "justify-end";
    return "justify-center";
  };

  const bgColorsList = [
    { key: "transparent", val: "transparent", label: "지면" },
    { key: "#ffffff", val: "#ffffff", label: "흰색" },
    { key: "#1e1e20", val: "#1e1e20", label: "검은색" },
    { key: "#f4ecd8", val: "#f4ecd8", label: "세피아" },
    { key: "#fff9db", val: "#fff9db", label: "메모지" },
  ];

  return (
    <NodeViewWrapper className={`my-3 mx-auto w-full flex ${getJustifyClass()}`}>
      {/* 
        Tailwind dark:bg 가상 클래스 간섭 전면 차단 (지면 라이트 모드와의 충돌로 투명일 때 시커멓게 나오던 현상 완벽 패치).
        기본 배경을 부드러운 스케치북 투명/내츄럴 톤으로 고정합니다.
      */}
      <div className={`w-full border border-gray-300 rounded-xl overflow-hidden shadow-sm bg-transparent select-none transition-all ${widthClass}`}>
        
        {/* 1. 드로잉 조작 바 (어두운 가상 다크 모드 제거하고 산뜻하고 직관적인 라이트 모던 톤으로 고정) */}
        <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-gray-100 border-b border-gray-300 gap-2 text-xs text-gray-800">
          <div className="flex items-center gap-3">
            {/* 펜 색상 칩 */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-600 uppercase">PEN</span>
              <input 
                type="color" 
                value={penColor}
                onChange={(e) => {
                  setPenColor(e.target.value);
                  updateAttributes({ color: e.target.value });
                }}
                className="w-6 h-5 border border-gray-350 rounded cursor-pointer bg-transparent"
                title="Pen Color"
              />
            </div>

            {/* 펜 두께 조절 */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-600 uppercase">Size</span>
              <input 
                type="number" 
                min="1" 
                max="20"
                value={penSize}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                  setPenSize(val);
                  updateAttributes({ size: val });
                }}
                className="w-9 px-1 py-0.5 border border-gray-300 rounded bg-white text-gray-800 font-mono text-center focus:outline-none"
              />
            </div>

            {/* 배경색 선택 */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-gray-600 uppercase mr-0.5">BG</span>
              <div className="flex items-center gap-1 bg-gray-200 p-0.5 rounded">
                {bgColorsList.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => updateAttributes({ backgroundColor: c.key })}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      bgColor === c.key 
                        ? "border-amber-500 scale-110 ring-1 ring-amber-500/30" 
                        : "border-gray-300 hover:scale-105"
                    }`}
                    style={{ 
                      backgroundColor: c.val === "transparent" ? "rgba(255,255,255,0.05)" : c.val,
                      backgroundImage: c.val === "transparent" ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)" : "none",
                      backgroundSize: "4px 4px"
                    }}
                    title={`Background: ${c.label}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 조작 바 우측 */}
          <div className="flex items-center gap-2">
            {/* W: 가로 크기 리사이징 단추 세트 */}
            <div className="flex items-center bg-gray-200 p-0.5 rounded gap-0.5 text-[9px] font-extrabold text-gray-600">
              <span className="px-1 text-[8.5px] uppercase mr-0.5 select-none">W</span>
              {(["max-w-md", "max-w-lg", "max-w-xl", "max-w-full"] as const).map((w, idx) => {
                const labels = ["S", "M", "L", "Full"];
                const isSelected = widthClass === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => updateAttributes({ width: w })}
                    className={`px-1 py-0.5 rounded transition-all ${
                      isSelected ? "bg-amber-500/25 text-amber-600 font-extrabold" : "hover:text-gray-900"
                    }`}
                  >
                    {labels[idx]}
                  </button>
                );
              })}
            </div>

            {/* H: 세로 높이 리사이징 단추 */}
            <div className="flex items-center bg-gray-200 p-0.5 rounded gap-0.5 text-[9px] font-extrabold text-gray-600">
              <span className="px-1 text-[8.5px] uppercase mr-0.5 select-none">H</span>
              <button
                type="button"
                onClick={() => adjustHeight(-50)}
                className="p-0.5 hover:text-gray-900 rounded"
                title="Decrease Height (-50px)"
              >
                <ZoomOut size={11} />
              </button>
              <span className="px-1 text-[8.5px] font-mono select-none">{height}</span>
              <button
                type="button"
                onClick={() => adjustHeight(50)}
                className="p-0.5 hover:text-gray-900 rounded"
                title="Increase Height (+50px)"
              >
                <ZoomIn size={11} />
              </button>
            </div>

            {/* 정렬 배치 도구 */}
            <div className="flex items-center bg-gray-200 p-0.5 rounded gap-0.5">
              <button
                type="button"
                onClick={() => updateAttributes({ align: "left" })}
                className={`p-0.5 rounded transition-all ${
                  align === "left" ? "bg-amber-500/20 text-amber-600 font-bold" : "text-gray-400 hover:text-gray-600"
                }`}
                title="Align Left"
              >
                <AlignLeft size={12} />
              </button>
              <button
                type="button"
                onClick={() => updateAttributes({ align: "center" })}
                className={`p-0.5 rounded transition-all ${
                  align === "center" ? "bg-amber-500/20 text-amber-600 font-bold" : "text-gray-400 hover:text-gray-600"
                }`}
                title="Align Center"
              >
                <AlignCenter size={12} />
              </button>
              <button
                type="button"
                onClick={() => updateAttributes({ align: "right" })}
                className={`p-0.5 rounded transition-all ${
                  align === "right" ? "bg-amber-500/20 text-amber-600 font-bold" : "text-gray-400 hover:text-gray-600"
                }`}
                title="Align Right"
              >
                <AlignRight size={12} />
              </button>
            </div>

            {/* 모두 지우기 버튼 */}
            <button
              type="button"
              onClick={clearDrawing}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-gray-200/50 hover:bg-gray-300 text-gray-500 font-bold rounded transition-all active:scale-95 text-[10px]"
              title="Clear Sketchpad"
            >
              <span>Clear</span>
            </button>

            <div className="w-px h-3 bg-gray-300 mx-0.5" />

            {/* 그림판 블록 전체 삭제 버튼 */}
            <button
              type="button"
              onClick={() => deleteNode()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-bold rounded transition-all active:scale-95 text-[10px]"
              title="Delete Sketchpad Block"
            >
              <Trash2 size={10} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* 2. 그리기 지면 영역 (부모의 bg-transparent에 따라 투명일 때는 실제 책장의 미색 줄무늬가 투과되어 보이게 조치) */}
        <div 
          className="relative w-full cursor-crosshair transition-colors"
          style={{ 
            backgroundColor: bgColor === "transparent" ? "transparent" : bgColor,
            height: `${height}px`
          }}
        >
          <svg
            ref={svgRef}
            className="w-full h-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          >
            {/* 이미 완료된 선 획들 */}
            {localLines.map((line, idx) => (
              <path
                key={idx}
                d={getSvgPath(line.points)}
                stroke={line.color}
                strokeWidth={line.size}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}

            {/* 현재 그리고 있는 실시간 선 획 */}
            {isDrawing && currentLine && (
              <path
                d={getSvgPath(currentLine)}
                stroke={penColor}
                strokeWidth={penSize}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </svg>

          {/* 캔버스 팁 안내 */}
          {localLines.length === 0 && !isDrawing && (
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] font-medium italic ${
              bgColor === "#1e1e20" ? "text-gray-500" : "text-gray-400"
            }`}>
              Draw something with your mouse or finger here...
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
