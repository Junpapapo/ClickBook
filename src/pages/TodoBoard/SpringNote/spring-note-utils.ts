/**
 * 붙여넣은 이미지를 Canvas API를 이용하여 최대 1200px 너비의 WebP(quality 0.7)로 압축 및 축소합니다.
 */
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // 최대 너비 1200px 기준 비율 조절
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          "image/webp",
          0.7
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// 마크다운 표(Delimited Markdown Table)를 HTML Table 태그로 변환해 주는 헬퍼 함수
export function parseMarkdownTables(text: string): string {
  const lines = text.split("\n");
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  const resultLines: string[] = [];

  const buildHtmlTable = (headers: string[], rows: string[][]): string => {
    let htmlTable = '<div class="buddy-table-wrapper"><table><thead><tr>';
    headers.forEach(h => {
      htmlTable += `<th>${h}</th>`;
    });
    htmlTable += "</tr></thead><tbody>";
    rows.forEach(row => {
      htmlTable += "<tr>";
      row.forEach(cell => {
        htmlTable += `<td>${cell}</td>`;
      });
      htmlTable += "</tr>";
    });
    htmlTable += "</tbody></table></div>";
    return htmlTable;
  };

  const isTableLine = (line: string) => {
    const trimmed = line.trim();
    return trimmed.includes("|") && (trimmed.startsWith("|") || trimmed.endsWith("|") || (trimmed.match(/\|/g) || []).length >= 2);
  };

  const isDelimiterLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.includes("|")) return false;
    // 구분선은 -, |, :, 공백으로만 구성됨
    return /^[|:\s-]+$/.test(trimmed) && trimmed.includes("-");
  };

  const extractCells = (line: string): string[] => {
    let trimmed = line.trim();
    if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
    if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
    return trimmed.split("|").map(c => c.trim());
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isTableLine(line)) {
      const cells = extractCells(line);
      
      if (!inTable) {
        // 다음 줄이 테이블 구분선인지 체크
        const nextLine = lines[i + 1] ? lines[i + 1] : "";
        if (isDelimiterLine(nextLine)) {
          inTable = true;
          tableHeaders = cells;
          i++; // 구분선행 건너뜀
        } else {
          resultLines.push(lines[i]);
        }
      } else {
        tableRows.push(cells);
      }
    } else {
      if (inTable) {
        resultLines.push(buildHtmlTable(tableHeaders, tableRows));
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }
      resultLines.push(lines[i]);
    }
  }

  if (inTable) {
    resultLines.push(buildHtmlTable(tableHeaders, tableRows));
  }

  return resultLines.join("\n");
}

// 공통 Markdown -> HTML 파서
export function markdownToHtml(md: string): string {
  if (!md) return "";

  // 1. 마크다운 표(Table) 파싱 (이미 <table> 태그가 완벽히 들어있지 않은 경우 수행)
  let html = md.includes("<table") ? md : parseMarkdownTables(md);

  // 2. table 태그 가로 스크롤 & MD 표 래퍼 자동 감싸기
  if (html.includes("<table") && !html.includes("buddy-table-wrapper")) {
    html = html.replace(/(<table[\s\S]*?<\/table>)/gi, '<div class="buddy-table-wrapper">$1</div>');
  }

  // 2. 인라인 마크다운 요소(링크, 볼드, 이탤릭, 인라인 코드) 치환
  // Link: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="spring-note-link">$1</a>');
  
  // Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
  // Italic: *text* -> <em>text</em>
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Code: `code` -> <code>code</code>
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");

  // 3. 블록 단위 마크다운(리스트, 제목) 변환
  const lines = html.split("\n");
  let inList = false;
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const itemContent = trimmed.slice(2);
      let prefix = "";
      if (!inList) {
        inList = true;
        prefix = "<ul>";
      }
      return `${prefix}<li>${itemContent}</li>`;
    } else {
      let suffix = "";
      if (inList) {
        inList = false;
        suffix = "</ul>";
      }
      return `${suffix}${line}`;
    }
  });
  if (inList) {
    processedLines.push("</ul>");
  }
  
  html = processedLines.join("\n");
  
  // Headers
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

  return html;
}


