/**
 * One-off: parse lib/data/_wiki_third_raw.txt → lib/data/wc2026-r32-third-matrix.json
 * Source: Wikipedia Template:2026 FIFA World Cup third-place_table (FIFA Annex C).
 */
import fs from "fs";

const raw = fs.readFileSync("lib/data/_wiki_third_raw.txt", "utf8");

/** Split a wikitext table row into cell strings (trimmed). */
function splitRow(line) {
  const s = line.replace(/^\|\s*/, "");
  return s.split(/\s*\|\s*/).map((c) => c.trim());
}

const rows = [];
const blocks = raw.split(/\r?\n\|-\r?\n/);

for (const block of blocks) {
  const rowMatch = block.match(/! scope="row"\s*\|\s*(\d+)/);
  if (!rowMatch) continue;
  const optionNo = parseInt(rowMatch[1], 10);
  if (optionNo < 1 || optionNo > 495) continue;

  let body = block.slice(rowMatch.index + rowMatch[0].length);
  body = body.replace(/!\s*rowspan="495"\s*\|\s*/g, "");
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));

  if (!lines.length) continue;

  /** Letters '''X''' or 3X in order of appearance across row lines */
  const groupCells = [];
  const mapCells = [];
  for (const line of lines) {
    const cells = splitRow(line);
    for (const c of cells) {
      const bold = c.match(/^'''([A-L])'''$/);
      if (bold) {
        groupCells.push(bold[1]);
        continue;
      }
      const third = c.match(/^3([A-L])$/);
      if (third) {
        mapCells.push(third[1]);
        continue;
      }
      if (c === "" || c === "||") continue;
    }
  }

  // Expect 8 third qualifiers + 8 slot assignments (group letters for 3rd playing vs 1A,1B,...)
  if (groupCells.length !== 8 || mapCells.length !== 8) {
    console.warn("option", optionNo, "groupCells", groupCells.length, "mapCells", mapCells.length);
    continue;
  }

  const sortedKey = [...groupCells].sort().join("");
  rows.push({
    optionNo,
    thirdsIn: groupCells.join(""),
    sortedKey,
    slotThirdLetters: mapCells.join(""),
  });
}

rows.sort((a, b) => a.optionNo - b.optionNo);
fs.mkdirSync("lib/data", { recursive: true });
fs.writeFileSync("lib/data/wc2026-r32-third-matrix.json", JSON.stringify(rows, null, 0));
console.log("wrote", rows.length, "rows to lib/data/wc2026-r32-third-matrix.json");
