// 목업 도서 표지(SVG)를 public/mock-covers에 생성한다. 파일명은 fixture의 thumbnail 경로를 그대로 따른다.
// 실행: node scripts/generate-mock-covers.mjs (Node 22.18+ 의 타입 스트리핑으로 .ts fixture를 직접 import)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BOOK_FIXTURES } from "../src/lib/kakao/fixtures/books.ts";

const WIDTH = 210;
const HEIGHT = 280;
const CHARS_PER_LINE = 9;
const MAX_LINES = 5;
const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const escapeXml = (text) =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function wrapTitle(title) {
  const lines = [];
  for (let i = 0; i < title.length; i += CHARS_PER_LINE) {
    lines.push(title.slice(i, i + CHARS_PER_LINE));
  }
  if (lines.length > MAX_LINES) {
    lines.length = MAX_LINES;
    lines[MAX_LINES - 1] = `${lines[MAX_LINES - 1].slice(0, -1)}…`;
  }
  return lines;
}

function coverSvg(index, title) {
  const hue = (index * 47) % 360;
  const lineHeight = 26;
  const lines = wrapTitle(title);
  const startY = HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2;
  const text = lines
    .map(
      (line, i) =>
        `<text x="${WIDTH / 2}" y="${startY + i * lineHeight}" text-anchor="middle" font-size="20" font-weight="700" fill="#fff">${escapeXml(line)}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="sans-serif"><rect width="${WIDTH}" height="${HEIGHT}" fill="hsl(${hue} 45% 38%)"/>${text}</svg>\n`;
}

mkdirSync(join(publicDir, "mock-covers"), { recursive: true });
BOOK_FIXTURES.forEach(({ title, thumbnail }, i) => {
  if (thumbnail)
    writeFileSync(join(publicDir, thumbnail), coverSvg(i + 1, title));
});
