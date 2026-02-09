import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const statePath = path.join(repoRoot, 'data', 'state.json');
const daysDir = path.join(repoRoot, 'days');
const indexPath = path.join(repoRoot, 'index.md');

function readJson(p){
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(p, obj){
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}
function pad3(n){
  return String(n).padStart(3,'0');
}

const state = readJson(statePath);
const nextDay = (state.lastDay ?? 1) + 1;
const nextId = pad3(nextDay);
const outFile = path.join(daysDir, `day-${nextId}.md`);

if (fs.existsSync(outFile)) {
  console.log(`Already exists: ${outFile}`);
  process.exit(0);
}

const template = `---\nlayout: none\ntitle: "Day ${nextId}"\n---\n<link rel="stylesheet" href="{{ '/assets/style.css' | relative_url }}">\n\n<div class="container">\n  <header>\n    <h1>${nextDay}일차</h1>\n    <p>오늘은 '히라가나/가타카나'를 계속 익히면서, 바로 쓰는 문장 1개를 더 추가한다.</p>\n  </header>\n\n  <hr>\n\n  <h2>오늘의 목표 (추천 60~90분)</h2>\n  <ul>\n    <li>가나 20~30개 추가 암기(소리 중심)</li>\n    <li>핵심 표현 10개 추가</li>\n    <li>문장 패턴 1개 추가 + 예문 5개</li>\n  </ul>\n\n  <h2>1) 오늘의 핵심 표현 10개</h2>\n  <ol>\n    <li><b>(여기에 표현)</b> / (읽기) / 뜻\n      <ul><li>기억법: (연상/연결)</li></ul>\n    </li>\n  </ol>\n\n  <h2>2) 문장 패턴</h2>\n  <pre><code>(패턴)\n(발음)\n(뜻)</code></pre>\n\n  <h2>3) 복습 (SRS)</h2>\n  <ul>\n    <li><b>D+1</b>: 어제 표현/패턴 복습</li>\n    <li><b>D+3</b>: 3일 전 콘텐츠 복습</li>\n  </ul>\n\n  <hr>\n  <p class="note">자동 생성된 뼈대 페이지. 오늘 공부 후 내용을 채워 넣자.</p>\n</div>\n`;

fs.writeFileSync(outFile, template);

// Update index.md: insert a new card after the last card in the grid.
let index = fs.readFileSync(indexPath, 'utf8');
const card = `\n    <div class="card">\n      <span class="badge">DAY ${nextId}</span>\n      <a href="{{ '/days/day-${nextId}.html' | relative_url }}"><b>${nextDay}일차</b> — (제목을 오늘 공부 후 수정)</a>\n      <div class="note">(요약)</div>\n    </div>\n`;

const marker = '  </div>\n\n  <hr>';
if (!index.includes(marker)) {
  throw new Error('index.md marker not found; cannot auto-insert card');
}
index = index.replace(marker, `${card}  </div>\n\n  <hr>`);
fs.writeFileSync(indexPath, index);

state.lastDay = nextDay;
writeJson(statePath, state);

console.log(`Created: days/day-${nextId}.md`);
console.log(`Updated: index.md (added DAY ${nextId})`);
console.log(`Updated: data/state.json (lastDay=${nextDay})`);
