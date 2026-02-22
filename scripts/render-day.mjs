import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const vocabPath = path.join(repoRoot, 'data', 'plan', 'vocab.json');
const grammarPath = path.join(repoRoot, 'data', 'plan', 'grammar.json');
const daysDir = path.join(repoRoot, 'days');
const daysDataDir = path.join(repoRoot, 'data', 'days');

function pad3(n) {
  return String(n).padStart(3, '0');
}
function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function srsDueDays(day) {
  // Due review: D+1, D+3, D+7, D+14
  const offsets = [1, 3, 7, 14];
  return offsets
    .map((d) => day - d)
    .filter((d) => d >= 1);
}

function pickSlice(arr, start, count) {
  return arr.slice(start, start + count);
}

function renderVocabItem(v) {
  return `    <li><b>${v.jp}</b> <span class="badge">${v.pos}</span><br>
      <div class="note">가나: <b>${v.kana}</b> · 로마자(발음): <b>${v.romaji}</b> · 뜻: <b>${v.ko}</b></div>
      <ul>
        <li>기억법: ${v.mn}</li>
      </ul>
    </li>`;
}

function renderGrammar(g) {
  const notesHtml = (g.notes ?? [])
    .map((n) => `      <li>${n}</li>`)
    .join('\n');

  const exHtml = (g.examples ?? [])
    .map(
      (e) => `    <li>
      <b>${e.jp}</b><br>
      <span class="note">가나: <b>${e.kana}</b> · 발음(로마자): <b>${e.romaji}</b> · 뜻: <b>${e.ko}</b></span>
    </li>`,
    )
    .join('\n');

  return `  <div class="card">
    <h3>${g.title}</h3>
    <p class="note"><b>패턴</b>: <code>${g.pattern}</code><br>
    <b>읽기(로마자)</b>: ${g.reading}<br>
    <b>뜻</b>: ${g.ko}</p>

    <h4>포인트</h4>
    <ul>
${notesHtml || '      <li>(포인트)</li>'}
    </ul>

    <h4>예문</h4>
    <ol>
${exHtml || '    <li>(예문)</li>'}
    </ol>
  </div>`;
}

function renderDay({ day, vocab, grammar, reviewSets }) {
  const id = pad3(day);
  const prevId = pad3(day - 1);
  const nextId = pad3(day + 1);

  const vocabHtml = vocab.map(renderVocabItem).join('\n');

  const reviewHtml = reviewSets
    .map(({ label, dayNum, items }) => {
      const lines = items
        .map((v) => `        <li><b>${v.jp}</b> (${v.kana}) — ${v.ko}</li>`)
        .join('\n');
      return `    <li><b>${label}</b> (Day ${pad3(dayNum)})
      <ul>\n${lines}\n      </ul>
    </li>`;
    })
    .join('\n');

  const grammarHtml = grammar.map(renderGrammar).join('\n');

  const navTopPrev = day === 1 ? '<a class="disabled" href="#">← 이전</a>' : `<a href="{{ '/days/day-${prevId}.html' | relative_url }}">← 이전</a>`;

  return `---
layout: none
title: "Day ${id}"
---
<link rel="stylesheet" href="{{ '/assets/style.css' | relative_url }}">

<div class="container">
  <header>
    <h1>${day}일차</h1>
    <p class="note">오늘 할 것: 단어 ${vocab.length}개 + 문법 ${grammar.length}개 + 복습(SRS).</p>
  </header>

  <div class="nav">
    ${navTopPrev}
    <a href="{{ '/index.html' | relative_url }}">목록</a>
    <a href="{{ '/days/day-${nextId}.html' | relative_url }}">다음 →</a>
  </div>

  <hr>

  <h2>1) 오늘의 단어/표현 (${vocab.length}개)</h2>
  <ol>
${vocabHtml}
  </ol>

  <h2>2) 오늘의 문법 (${grammar.length}개)</h2>
${grammarHtml}

  <h2>3) 복습 (SRS)</h2>
  <p class="note">원칙: ‘뜻 → 일본어’ 역방향으로 먼저 떠올리고, 그 다음에 확인.</p>
  <ol>
${reviewHtml || '    <li>오늘은 첫날이라 복습 없음</li>'}
  </ol>

  <hr>

  <div class="nav">
    ${navTopPrev}
    <a href="{{ '/index.html' | relative_url }}">목록</a>
    <a href="{{ '/days/day-${nextId}.html' | relative_url }}">다음 →</a>
  </div>
</div>
`;
}

// CLI
const day = Number(process.argv[2]);
if (!Number.isFinite(day) || day < 1) {
  console.error('Usage: node scripts/render-day.mjs <dayNumber>');
  process.exit(1);
}

ensureDir(daysDir);
ensureDir(daysDataDir);

const vocabAll = loadJson(vocabPath);
const grammarAll = loadJson(grammarPath);

// Plan: 30 vocab per day (as requested)
const vocabPerDay = 30;

const vocabStart = (day - 1) * vocabPerDay;
const vocabToday = pickSlice(vocabAll, vocabStart, vocabPerDay);
if (vocabToday.length < vocabPerDay) {
  throw new Error(`Not enough vocab in data/plan/vocab.json for Day ${day} (need ${vocabPerDay}, have ${vocabToday.length}). Expand vocab.json.`);
}

// Grammar progression: 1~2 items early. Simple mapping for now.
const grammarToday = day === 1 ? grammarAll.slice(0, 2) : day === 2 ? grammarAll.slice(2, 4) : grammarAll.slice(0, 1);

// Save day data for review usage
const dayDataPath = path.join(daysDataDir, `day-${pad3(day)}.json`);
const dayData = {
  day,
  vocabIds: vocabToday.map((v) => v.id),
  grammarIds: grammarToday.map((g) => g.id),
};
saveJson(dayDataPath, dayData);

// Build review sets
const due = srsDueDays(day);
const vocabById = new Map(vocabAll.map((v) => [v.id, v]));

const reviewSets = due.map((d) => {
  const p = path.join(daysDataDir, `day-${pad3(d)}.json`);
  if (!fs.existsSync(p)) return null;
  const dd = loadJson(p);
  const items = (dd.vocabIds ?? []).slice(0, 10).map((id) => vocabById.get(id)).filter(Boolean);
  const label = day - d === 1 ? 'D+1' : day - d === 3 ? 'D+3' : day - d === 7 ? 'D+7' : 'D+14';
  return { label, dayNum: d, items };
}).filter(Boolean);

const html = renderDay({ day, vocab: vocabToday, grammar: grammarToday, reviewSets });
const outFile = path.join(daysDir, `day-${pad3(day)}.md`);
fs.writeFileSync(outFile, html);
console.log(`Rendered: ${outFile}`);
console.log(`Wrote: ${dayDataPath}`);
