import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const statePath = path.join(repoRoot, 'data', 'state.json');
const daysDir = path.join(repoRoot, 'days');
const indexPath = path.join(repoRoot, 'index.md');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}
function pad3(n) {
  return String(n).padStart(3, '0');
}

const state = readJson(statePath);
const nextDay = (state.lastDay ?? 1) + 1;
const nextId = pad3(nextDay);
const prevId = pad3(nextDay - 1);
const nextLinkId = pad3(nextDay + 1);

const outFile = path.join(daysDir, `day-${nextId}.md`);

if (fs.existsSync(outFile)) {
  console.log(`Already exists: ${outFile}`);
  process.exit(0);
}

const template = `---
layout: none
title: "Day ${nextId}"
---
<link rel="stylesheet" href="{{ '/assets/style.css' | relative_url }}">

<div class="container">
  <header>
    <h1>${nextDay}일차</h1>
    <p>(요약을 오늘 공부 후 수정)</p>
  </header>

  <div class="nav">
    <a href="{{ '/days/day-${prevId}.html' | relative_url }}">← 이전</a>
    <a href="{{ '/index.html' | relative_url }}">목록</a>
    <a href="{{ '/days/day-${nextLinkId}.html' | relative_url }}">다음 →</a>
  </div>

  <hr>

  <h2>오늘의 목표</h2>
  <p class="note">(공부량은 꽤 많이. 단, 매일 ‘복습(SRS)’은 반드시 포함)</p>
  <ul>
    <li>(오늘 목표 1)</li>
    <li>(오늘 목표 2)</li>
    <li>(오늘 목표 3)</li>
  </ul>

  <h2>1) 단어/표현</h2>
  <ol>
    <li><b>(표현)</b> / (가나 표기) / (읽기-로마자) / 뜻
      <ul>
        <li>음절(모라) 분해: (예: o-ne-ga-i)</li>
        <li>기억법: (연상/연결/그림/소리 고리)</li>
      </ul>
    </li>
  </ol>

  <h2>2) 문법/패턴</h2>
  <pre><code>(패턴)
(발음)
(뜻)
(예문 1)
(예문 2)
(예문 3)</code></pre>

  <h2>3) 복습 (SRS)</h2>
  <ul>
    <li><b>D+1</b>: 어제 내용(단어/패턴) — 뜻→일본어 역방향</li>
    <li><b>D+3</b>: 3일 전 내용 — 빈칸 채우기/말하기로</li>
    <li><b>D+7</b>: 7일 전 내용 — 짧은 글/자기소개로 재구성</li>
  </ul>

  <hr>

  <div class="nav">
    <a href="{{ '/days/day-${prevId}.html' | relative_url }}">← 이전</a>
    <a href="{{ '/index.html' | relative_url }}">목록</a>
    <a href="{{ '/days/day-${nextLinkId}.html' | relative_url }}">다음 →</a>
  </div>

  <p class="note">자동 생성된 뼈대 페이지. 오늘 공부 후 내용을 채워 넣자.</p>
</div>
`;

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
