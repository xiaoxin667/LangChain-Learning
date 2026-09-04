"""Post-process footers: explicit PAGE field format switches + strip empty pgNumType."""
import re
import shutil
import zipfile

DOCX = r"F:\LangChain\LangChain_LangGraph_面试常见问题.docx"
TMP = DOCX + ".tmp"

with zipfile.ZipFile(DOCX, "r") as z:
    names = z.namelist()
    data = {n: z.read(n) for n in names}

doc = data["word/document.xml"].decode("utf-8")

# 1. sectPr blocks in document order -> footerReference rIds
sect_blocks = re.findall(r"<w:sectPr[^>]*>.*?</w:sectPr>|<w:sectPr[^>]*/>", doc, re.S)
print("sections found:", len(sect_blocks))
sec_footers = []
for blk in sect_blocks:
    ids = re.findall(r'<w:footerReference[^>]*r:id="([^"]+)"', blk)
    fmt = re.search(r'<w:pgNumType[^>]*w:fmt="([^"]+)"', blk)
    sec_footers.append((ids, fmt.group(1) if fmt else None))
for i, (ids, fmt) in enumerate(sec_footers):
    print(f"  section {i+1}: footers={ids} fmt={fmt}")

# 2. rels map
rels = data["word/_rels/document.xml.rels"].decode("utf-8")
rid2target = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"', rels))

# 3. decide format per footer file: section with fmt=upperRoman -> ROMAN, else arabic
patch_map = {}  # footer filename -> switch
for ids, fmt in sec_footers:
    switch = "ROMAN" if fmt == "upperRoman" else "arabic"
    for rid in ids:
        target = rid2target.get(rid, "")
        if target.startswith("footer"):
            patch_map["word/" + target] = switch
print("patch plan:", patch_map)

# 4. patch footer instrText
for fname, switch in patch_map.items():
    xml = data[fname].decode("utf-8")
    xml, n = re.subn(
        r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
        rf"\1 PAGE \\* {switch} \\* MERGEFORMAT \2",
        xml,
    )
    print(f"  {fname}: patched {n} PAGE fields -> {switch}")
    data[fname] = xml.encode("utf-8")

# 5. strip empty pgNumType (cover section)
doc, n = re.subn(r"<w:pgNumType/>", "", doc)
print("removed empty pgNumType:", n)
data["word/document.xml"] = doc.encode("utf-8")

# 6. rewrite zip
with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as z:
    for n2 in names:
        z.writestr(n2, data[n2])
shutil.move(TMP, DOCX)
print("footer post-process done")
