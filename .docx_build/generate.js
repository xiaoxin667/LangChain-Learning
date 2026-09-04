/* Generate LangChain/LangGraph interview FAQ docx from markdown */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, SectionType, TableOfContents,
  PageBreak, ExternalHyperlink, TableLayoutType,
} = require("docx");

const MD_PATH = "F:/LangChain/LangChain_LangGraph_面试常见问题.md";
const OUT_PATH = "F:/LangChain/LangChain_LangGraph_面试常见问题.docx";

/* ---------- palette (CM-2 Blue Orange, light) ---------- */
const P = {
  bg: "FEFEFE", accent: "FF862F",
  titleColor: "1284BA", subtitleColor: "606060", metaColor: "707070", footerColor: "A0A0A0",
  primary: "0A1628", body: "1A2B40", secondary: "6878A0", link: "1284BA",
};

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

/* ---------- cover helpers (from design-system.md) ---------- */
function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([..."\uff0c\u3002\u3001\uff1b\uff1a\uff01\uff1f", ..."\u7684\u4e0e\u548c\u53ca\u4e4b\u5728\u4e8e\u4e3a", ..."-_\u2014\u2013\u00b7/", ..." \t"]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) {
      breakAt = charsPerLine;
      const prevChar = remaining[breakAt - 1], nextChar = remaining[breakAt];
      if (prevChar && nextChar && !breakAfter.has(prevChar) && !breakAfter.has(nextChar) &&
          /[\u4e00-\u9fff]/.test(prevChar) && /[\u4e00-\u9fff]/.test(nextChar)) breakAt -= 1;
    }
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / (pt * 20));
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    lines = splitTitleLines(title, charsPerLine(minPt));
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false,
    metaLineCount = 0, fixedHeight = 800, pageHeight = 16838, marginTop = 0, marginBottom = 0 } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const safeRemaining = Math.max(usableHeight - contentHeight, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  const midSpacing = Math.max(safeRemaining - topSpacing - bottomSpacing, 0);
  return { topSpacing, midSpacing, bottomSpacing };
}

function buildCoverR1(config) {
  const C = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: C.accent, space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "), size: 18, color: C.accent,
        font: { ascii: "Calibri", eastAsia: "SimHei" }, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true,
        color: C.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: C.subtitleColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: C.metaColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: C.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: C.footerColor, font: { ascii: "Arial", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: C.footerColor, font: { ascii: "Arial" } }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: config.paletteBg }, borders: noBorders,
        children,
      })],
    })],
  })];
}

/* ---------- markdown inline parser ---------- */
function parseInline(text, opts = {}) {
  const size = opts.size || 21;
  const runs = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
  let last = 0, m;
  const pushPlain = (t) => { if (t) runs.push(new TextRun({ text: t, size, color: opts.color || P.body })); };
  while ((m = pattern.exec(text)) !== null) {
    pushPlain(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      runs.push(new TextRun({ text: tok.slice(2, -2), bold: true, size, color: opts.color || P.body }));
    } else if (tok.startsWith("`")) {
      runs.push(new TextRun({ text: tok.slice(1, -1), size, color: opts.color || P.body, font: { ascii: "Consolas", eastAsia: "Microsoft YaHei" } }));
    } else {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lm) {
        runs.push(new ExternalHyperlink({
          children: [new TextRun({ text: lm[1], size, color: P.link, underline: {} })],
          link: lm[2],
        }));
      } else pushPlain(tok);
    }
    last = m.index + tok.length;
  }
  pushPlain(text.slice(last));
  return runs;
}

/* ---------- markdown block parser ---------- */
const md = fs.readFileSync(MD_PATH, "utf-8");
const lines = md.split(/\r?\n/);
const body = [];
let seenH1 = 0;
let introNoteDone = false;
for (let i = 0; i < lines.length; i++) {
  const raw = lines[i];
  const line = raw.trimEnd();
  const t = line.trim();
  if (!t) continue;
  if (t.startsWith("# ") && !t.startsWith("##")) continue; // doc title -> cover
  if (t === "---") continue;
  if (t.startsWith("### ")) {
    body.push(new Paragraph({
      heading: HeadingLevel.HEADING_2, keepNext: true,
      spacing: { before: 240, after: 100, line: 312 },
      children: [new TextRun({ text: t.slice(4).trim(), bold: true, color: P.primary, font: { ascii: "Calibri", eastAsia: "SimHei" } })],
    }));
    continue;
  }
  if (t.startsWith("## ")) {
    body.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 160, line: 312 },
      children: [new TextRun({ text: t.slice(3).trim(), bold: true, color: P.primary, font: { ascii: "Calibri", eastAsia: "SimHei" } })],
    }));
    continue;
  }
  if (t.startsWith("> ")) {
    body.push(new Paragraph({
      spacing: { before: 120, after: 120, line: 312 },
      indent: { left: 240 },
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: P.link, space: 10 } },
      children: parseInline(t.slice(2).trim(), { size: 18, color: P.secondary }),
    }));
    continue;
  }
  if (t.startsWith("- ")) {
    body.push(new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 60, line: 312 },
      children: parseInline(t.slice(2).trim()),
    }));
    continue;
  }
  const numMatch = t.match(/^(\d+)\.\s+(.*)$/);
  if (numMatch) {
    body.push(new Paragraph({
      spacing: { before: 60, after: 60, line: 312 },
      indent: { left: 420, hanging: 420 },
      children: [
        new TextRun({ text: numMatch[1] + ". ", bold: true, size: 21, color: P.body }),
        ...parseInline(numMatch[2]),
      ],
    }));
    continue;
  }
  if (t.startsWith("\u6765\u6e90\uff1a")) { // 来源：...
    body.push(new Paragraph({
      spacing: { before: 60, after: 200, line: 312 },
      children: [
        new TextRun({ text: "\u6765\u6e90\uff1a", size: 18, color: P.secondary }),
        ...parseInline(t.slice(3).trim(), { size: 18, color: P.secondary }),
      ],
    }));
    continue;
  }
  // normal body paragraph
  body.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 420 },
    spacing: { after: 120, line: 312 },
    children: parseInline(t),
  }));
}

/* ---------- footers ---------- */
const pageFooter = () => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: P.secondary })],
  })],
});
const bodyHeader = new Header({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "D8E4EC", space: 4 } },
    children: [new TextRun({ text: "LangChain / LangGraph \u5b9e\u4e60\u9762\u8bd5\u5e38\u89c1\u95ee\u9898", size: 16, color: P.secondary })],
  })],
});

/* ---------- document ---------- */
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 21, color: P.body },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 30, bold: true, color: P.primary },
        paragraph: { spacing: { before: 360, after: 160, line: 312 } },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 24, bold: true, color: P.primary },
        paragraph: { spacing: { before: 240, after: 100, line: 312 } },
      },
    },
  },
  sections: [
    { // Section 1: cover
      properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1({
        title: "LangChain / LangGraph \u5b9e\u4e60\u9762\u8bd5\u5e38\u89c1\u95ee\u9898",
        subtitle: "31 \u9053\u9ad8\u9891\u9898 \u00b7 \u53c2\u8003\u7b54\u6848\u4e0e\u8003\u5bdf\u610f\u56fe\u89e3\u6790",
        englishLabel: "INTERVIEW HANDBOOK",
        metaLines: [
          "\u65b9\u5411\uff1a\u5927\u6a21\u578b\u5e94\u7528\u5f00\u53d1 / AI \u5e94\u7528\u5de5\u7a0b\u5b9e\u4e60",
          "\u8303\u56f4\uff1a\u57fa\u7840\u6982\u5ff5 \u00b7 RAG \u00b7 Memory \u00b7 Agent \u00b7 LangGraph \u00b7 \u5de5\u7a0b\u5b9e\u8df5",
          "\u6574\u7406\u65e5\u671f\uff1a2026 \u5e74 9 \u6708",
        ],
        footerLeft: "LangChain \u5b66\u4e60\u7b14\u8bb0",
        footerRight: "2026.09",
        palette: { titleColor: P.titleColor, subtitleColor: P.subtitleColor, metaColor: P.metaColor, accent: P.accent, footerColor: P.footerColor },
        paletteBg: P.bg,
      }),
    },
    { // Section 2: TOC (front matter, Roman)
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } },
      },
      footers: { default: pageFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 360 },
          children: [new TextRun({ text: "\u76ee  \u5f55", bold: true, size: 32, font: { eastAsia: "SimHei", ascii: "Calibri" } })],
        }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({
            text: "\u6ce8\uff1a\u672c\u76ee\u5f55\u7531\u57df\u4ee3\u7801\u751f\u6210\uff0c\u7f16\u8f91\u540e\u8bf7\u53f3\u952e\u70b9\u51fb\u76ee\u5f55\u5e76\u9009\u62e9\u201c\u66f4\u65b0\u57df\u201d\u4ee5\u5237\u65b0\u9875\u7801\u3002",
            italics: true, size: 18, color: "888888",
          })],
        }),
      ],
    },
    { // Section 3: body (Arabic from 1)
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: bodyHeader },
      footers: { default: pageFooter() },
      children: body,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT_PATH, buf);
  console.log("written:", OUT_PATH, buf.length, "bytes");
});
