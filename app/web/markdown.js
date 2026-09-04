/* 轻量 Markdown 渲染器（无外部依赖）
 * 覆盖综测回答模板用到的语法：标题、加粗、行内代码、链接、引用块、
 * 有序/无序列表、表格、分隔线、代码块、段落。
 * 所有文本先经 HTML 转义再渲染，避免注入。
 */
(function (global) {
  "use strict";

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderInline(text) {
    let html = escapeHtml(text);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );
    return html;
  }

  // 会被识别为块级新起点的行，用于段落合并的终止判断
  var BLOCK_START = /^(#{1,6}\s|>|\s*[-*]\s|\s*\d+\.\s|\||```)/;

  function splitTableRow(row) {
    return row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map(function (cell) {
        return cell.trim();
      });
  }

  function render(markdown) {
    var lines = String(markdown || "")
      .replace(/\r\n/g, "\n")
      .split("\n");
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) {
        i++;
        continue;
      }

      // 代码块 ```...```
      if (line.trim().indexOf("```") === 0) {
        var code = [];
        i++;
        while (i < lines.length && lines[i].trim().indexOf("```") !== 0) {
          code.push(lines[i]);
          i++;
        }
        i++; // 跳过结束围栏
        out.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
        continue;
      }

      // 标题
      var heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        var level = heading[1].length;
        out.push("<h" + level + ">" + renderInline(heading[2]) + "</h" + level + ">");
        i++;
        continue;
      }

      // 分隔线
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
        out.push("<hr>");
        i++;
        continue;
      }

      // 引用块（连续 > 行合并）
      if (line.trim().charAt(0) === ">") {
        var quote = [];
        while (i < lines.length && lines[i].trim().charAt(0) === ">") {
          quote.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        out.push("<blockquote>" + renderInline(quote.join("<br>")) + "</blockquote>");
        continue;
      }

      // 无序列表
      if (/^\s*[-*]\s+/.test(line)) {
        var ulItems = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          ulItems.push("<li>" + renderInline(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>");
          i++;
        }
        out.push("<ul>" + ulItems.join("") + "</ul>");
        continue;
      }

      // 有序列表
      if (/^\s*\d+\.\s+/.test(line)) {
        var olItems = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          olItems.push("<li>" + renderInline(lines[i].replace(/^\s*\d+\.\s+/, "")) + "</li>");
          i++;
        }
        out.push("<ol>" + olItems.join("") + "</ol>");
        continue;
      }

      // 表格：当前行以 | 开头，且下一行是 |---|---| 形式的分隔行
      if (
        line.trim().charAt(0) === "|" &&
        i + 1 < lines.length &&
        /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])
      ) {
        var headers = splitTableRow(line);
        i += 2; // 跳过表头与分隔行
        var rows = [];
        while (i < lines.length && lines[i].trim().charAt(0) === "|") {
          rows.push(splitTableRow(lines[i]));
          i++;
        }
        var thead =
          "<thead><tr>" +
          headers.map(function (h) { return "<th>" + renderInline(h) + "</th>"; }).join("") +
          "</tr></thead>";
        var tbody =
          "<tbody>" +
          rows
            .map(function (r) {
              return (
                "<tr>" +
                r.map(function (c) { return "<td>" + renderInline(c) + "</td>"; }).join("") +
                "</tr>"
              );
            })
            .join("") +
          "</tbody>";
        out.push('<div class="table-wrap"><table>' + thead + tbody + "</table></div>");
        continue;
      }

      // 普通段落：合并连续的普通行
      var para = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      out.push("<p>" + para.map(renderInline).join("<br>") + "</p>");
    }

    return out.join("\n");
  }

  global.ZongceMarkdown = { render: render, escapeHtml: escapeHtml };
})(window);
