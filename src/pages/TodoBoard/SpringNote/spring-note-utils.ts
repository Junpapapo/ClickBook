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

// 안전한 HTML 이스케이프 헬퍼
function escapeHtmlTags(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// 공통 Markdown -> HTML 파서
export function markdownToHtml(md: string): string {
  if (!md) return "";

  // 1. 코드 블록(```...```) 임시 치환 보존
  const codeBlocks: string[] = [];
  let processed = md.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const idx = codeBlocks.length;
    const escapedCode = escapeHtmlTags(code.trimEnd());
    const langLabel = lang ? `<span class="buddy-code-lang">${escapeHtmlTags(lang)}</span>` : "";
    codeBlocks.push(`<pre class="buddy-code-block">${langLabel}<code>${escapedCode}</code></pre>`);
    return `%%CODEBLOCK_${idx}%%`;
  });

  // 2. 인라인 코드(`` `...` ``) 임시 치환 보존
  const inlineCodes: string[] = [];
  processed = processed.replace(/`([^`\n]+)`/g, (_match, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code class="buddy-inline-code">${escapeHtmlTags(code)}</code>`);
    return `%%INLINECODE_${idx}%%`;
  });

  // 3. 마크다운 표(Table) 파싱
  let html = processed.includes("<table") ? processed : parseMarkdownTables(processed);

  // 4. Table 태그 가로 스크롤 & MD 표 래퍼 자동 감싸기
  if (html.includes("<table") && !html.includes("buddy-table-wrapper")) {
    html = html.replace(/(<table[\s\S]*?<\/table>)/gi, '<div class="buddy-table-wrapper">$1</div>');
  }

  // 5. 마크다운 링크: [text](url)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="buddy-md-link">$1</a>');

  // 6. 독립된 Raw URL 자동 하이퍼링크 변환 (이미 a 태그 내부나 placeholder가 아닌 경우)
  html = html.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="buddy-md-link">$2</a>');

  // 7. 인라인 텍스트 서식 (Bold, Italic, Strikethrough)
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  // 8. 블록 단위 마크다운 (인용구, 리스트, 제목, 수평선)
  const lines = html.split("\n");
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;

  const resultLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // 수평선 (--- 또는 ***)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      if (inUl) { resultLines.push("</ul>"); inUl = false; }
      if (inOl) { resultLines.push("</ol>"); inOl = false; }
      if (inBlockquote) { resultLines.push("</blockquote>"); inBlockquote = false; }
      resultLines.push("<hr class='buddy-md-hr' />");
      continue;
    }

    // 제목 (Headers)
    if (trimmed.startsWith("#### ")) {
      if (inUl) { resultLines.push("</ul>"); inUl = false; }
      if (inOl) { resultLines.push("</ol>"); inOl = false; }
      if (inBlockquote) { resultLines.push("</blockquote>"); inBlockquote = false; }
      resultLines.push(`<h4 class="buddy-md-h4">${trimmed.slice(5)}</h4>`);
      continue;
    }
    if (trimmed.startsWith("### ")) {
      if (inUl) { resultLines.push("</ul>"); inUl = false; }
      if (inOl) { resultLines.push("</ol>"); inOl = false; }
      if (inBlockquote) { resultLines.push("</blockquote>"); inBlockquote = false; }
      resultLines.push(`<h3 class="buddy-md-h3">${trimmed.slice(4)}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      if (inUl) { resultLines.push("</ul>"); inUl = false; }
      if (inOl) { resultLines.push("</ol>"); inOl = false; }
      if (inBlockquote) { resultLines.push("</blockquote>"); inBlockquote = false; }
      resultLines.push(`<h2 class="buddy-md-h2">${trimmed.slice(3)}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      if (inUl) { resultLines.push("</ul>"); inUl = false; }
      if (inOl) { resultLines.push("</ol>"); inOl = false; }
      if (inBlockquote) { resultLines.push("</blockquote>"); inBlockquote = false; }
      resultLines.push(`<h1 class="buddy-md-h1">${trimmed.slice(2)}</h1>`);
      continue;
    }

    // 인용구 (> text)
    if (trimmed.startsWith("> ")) {
      if (inUl) { resultLines.push("</ul>"); inUl = false; }
      if (inOl) { resultLines.push("</ol>"); inOl = false; }
      if (!inBlockquote) {
        resultLines.push("<blockquote class='buddy-md-quote'>");
        inBlockquote = true;
      }
      resultLines.push(`<p>${trimmed.slice(2)}</p>`);
      continue;
    } else if (inBlockquote) {
      resultLines.push("</blockquote>");
      inBlockquote = false;
    }

    // 순서 없는 리스트 (- 또는 * 또는 •)
    if (/^[-*•]\s+/.test(trimmed) || /^•\s*/.test(trimmed)) {
      if (inOl) { resultLines.push("</ol>"); inOl = false; }
      if (!inUl) {
        resultLines.push("<ul class='buddy-md-ul'>");
        inUl = true;
      }
      resultLines.push(`<li>${trimmed.replace(/^[-*•]\s*/, "")}</li>`);
      continue;
    } else if (inUl) {
      resultLines.push("</ul>");
      inUl = false;
    }

    // 순서 있는 리스트 (1. 2. 등)
    if (/^\d+\.\s+/.test(trimmed)) {
      if (inUl) { resultLines.push("</ul>"); inUl = false; }
      if (!inOl) {
        resultLines.push("<ol class='buddy-md-ol'>");
        inOl = true;
      }
      resultLines.push(`<li>${trimmed.replace(/^\d+\.\s+/, "")}</li>`);
      continue;
    } else if (inOl) {
      resultLines.push("</ol>");
      inOl = false;
    }

    // 일반 문장 라인
    resultLines.push(line);
  }

  if (inUl) resultLines.push("</ul>");
  if (inOl) resultLines.push("</ol>");
  if (inBlockquote) resultLines.push("</blockquote>");

  html = resultLines.join("\n");

  // 9. 임시 치환된 코드 블록 및 인라인 코드 복원
  codeBlocks.forEach((block, idx) => {
    html = html.replace(`%%CODEBLOCK_${idx}%%`, block);
  });
  inlineCodes.forEach((code, idx) => {
    html = html.replace(`%%INLINECODE_${idx}%%`, code);
  });

  return html;
}


