'use strict';

/*
 * English_GA — application logic.
 * Learning content lives in content/*.json; this file only loads, validates,
 * and presents it. Do not put grammar content here.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SESSION_SIZE = 20;
const DAILY_GOAL = 20;            // questions answered per day
const MIN_BANK_SIZE = 50;
const MAX_BANK_SIZE = 100;
const MAX_EXPLANATION_LENGTH = 300;
const STORE_KEY = 'englishGA.progress.v1';

// Fixed category registry. Only files listed here are ever fetched.
// `short` and `tagline` are interface labels, not grammar content.
const CATEGORIES = [
  { id: 'verb-tenses-aspect', title: 'Verb Tenses/Aspect', short: 'Verb tenses', tagline: 'Show when things happen.', file: 'content/verb-tenses-aspect.json', active: true },
  { id: 'auxiliary-verbs-questions', title: 'Auxiliary Verbs + Questions', short: 'Auxiliary verbs', tagline: 'Build clear questions.', file: 'content/auxiliary-verbs-questions.json', active: true },
  { id: 'prepositions', title: 'Prepositions', short: 'Prepositions', tagline: 'Place words precisely.', file: 'content/prepositions.json', active: true },
  { id: 'articles', title: 'Definite, Indefinite, and Zero Articles', short: 'Articles', tagline: 'Know what is specific.', file: 'content/articles.json', active: true },
  { id: 'sentence-structure', title: 'Sentence Structure/Word Order', short: 'Sentence structure', tagline: 'Make your meaning flow.', file: 'content/sentence-structure.json', active: true },
  { id: 'quantifiers', title: 'Quantifiers', short: 'Quantifiers', tagline: 'Say how much and how many.', file: 'content/quantifiers.json', active: true },
  { id: 'subject-verb-agreement', title: 'Subject–Verb Agreement', short: 'Subject–verb agreement', tagline: 'Keep subjects and verbs in step.', file: 'content/subject-verb-agreement.json', active: true },
  { id: 'relative-clauses', title: 'Relative Clauses', short: 'Relative clauses', tagline: 'Add detail to your nouns.', file: 'content/relative-clauses.json', active: true },
];

// ---------------------------------------------------------------------------
// Content validation
// ---------------------------------------------------------------------------

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Validates a category question bank. Errors make the bank unusable;
 * warnings flag content the project owner should review.
 */
function validateBank(bank, category) {
  const errors = [];
  const warnings = [];

  if (!bank || typeof bank !== 'object' || Array.isArray(bank)) {
    errors.push('Bank must be a JSON object with "id", "title", "status", and "questions".');
    return { errors, warnings, questionCount: 0 };
  }
  if (bank.id !== category.id) {
    errors.push(`Bank id "${bank.id}" does not match registry id "${category.id}".`);
  }
  if (!isNonEmptyString(bank.title)) errors.push('Bank is missing a "title".');
  if (!isNonEmptyString(bank.status)) errors.push('Bank is missing a "status".');
  if (!Array.isArray(bank.questions)) {
    errors.push('Bank "questions" must be an array.');
    return { errors, warnings, questionCount: 0 };
  }

  const count = bank.questions.length;
  if (count < SESSION_SIZE) {
    errors.push(`Bank has ${count} questions; a session needs at least ${SESSION_SIZE}.`);
  } else if (count < MIN_BANK_SIZE || count > MAX_BANK_SIZE) {
    warnings.push(`Bank has ${count} questions; the target is ${MIN_BANK_SIZE}–${MAX_BANK_SIZE}.`);
  }

  const seenIds = new Set();
  bank.questions.forEach((q, index) => {
    const label = q && isNonEmptyString(q.id) ? q.id : `question #${index + 1}`;
    const fail = (msg) => errors.push(`${label}: ${msg}`);

    if (!q || typeof q !== 'object') {
      fail('must be an object.');
      return;
    }
    if (!isNonEmptyString(q.id)) fail('missing "id".');
    else if (seenIds.has(q.id)) fail('duplicate question id.');
    else seenIds.add(q.id);

    if (!isNonEmptyString(q.prompt)) fail('missing "prompt".');
    if (!isNonEmptyString(q.explanation)) fail('missing "explanation".');
    else if (q.explanation.length > MAX_EXPLANATION_LENGTH) {
      warnings.push(`${label}: explanation is longer than ${MAX_EXPLANATION_LENGTH} characters.`);
    }

    if (!Array.isArray(q.options)) {
      fail('"options" must be an array.');
      return;
    }
    if (q.options.length < 3 || q.options.length > 4) {
      fail(`has ${q.options.length} options; 3–4 are required.`);
    }
    const optionIds = new Set();
    const optionTexts = new Set();
    q.options.forEach((opt, i) => {
      if (!opt || typeof opt !== 'object') {
        fail(`option #${i + 1} must be an object.`);
        return;
      }
      if (!isNonEmptyString(opt.id)) fail(`option #${i + 1} is missing "id".`);
      else if (optionIds.has(opt.id)) fail(`duplicate option id "${opt.id}".`);
      else optionIds.add(opt.id);

      if (!isNonEmptyString(opt.text)) fail(`option #${i + 1} is missing "text".`);
      else {
        const key = opt.text.trim().toLowerCase();
        if (optionTexts.has(key)) fail(`duplicate option text "${opt.text}".`);
        optionTexts.add(key);
      }
    });

    if (!isNonEmptyString(q.correctOptionId)) fail('missing "correctOptionId".');
    else if (!optionIds.has(q.correctOptionId)) {
      fail(`correctOptionId "${q.correctOptionId}" does not match any option.`);
    }
  });

  return { errors, warnings, questionCount: count };
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

const bankCache = new Map();

async function fetchJson(file) {
  const response = await fetch(file, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadBank(category) {
  if (bankCache.has(category.id)) return bankCache.get(category.id);

  let bank;
  try {
    bank = await fetchJson(category.file);
  } catch (err) {
    console.error(`[English_GA] Failed to load ${category.file}:`, err);
    throw new Error(
      location.protocol === 'file:'
        ? 'English_GA must be opened from its website (for example GitHub Pages), not directly from your files.'
        : 'The questions could not be loaded. Check your connection and try again.'
    );
  }

  const result = validateBank(bank, category);
  result.warnings.forEach((w) => console.warn(`[English_GA] ${category.id}: ${w}`));
  if (result.errors.length) {
    result.errors.forEach((e) => console.error(`[English_GA] ${category.id}: ${e}`));
    throw new Error(`This question bank failed validation (${result.errors.length} problem(s)). Details are in the browser console.`);
  }

  bankCache.set(category.id, bank);
  return bank;
}

// ---------------------------------------------------------------------------
// Progress (stored only in this browser)
// ---------------------------------------------------------------------------

function dayKey(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved && typeof saved === 'object') {
      const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
      return { days: isObject(saved.days) ? saved.days : {}, categories: isObject(saved.categories) ? saved.categories : {} };
    }
  } catch (err) { /* storage unavailable or corrupt: start fresh */ }
  return { days: {}, categories: {} };
}

function saveProgress() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (err) { /* ignore */ }
}

const progress = loadProgress();

function answeredToday() {
  return progress.days[dayKey(new Date())] || 0;
}

function currentStreak() {
  const d = new Date();
  if (!progress.days[dayKey(d)]) d.setDate(d.getDate() - 1); // today not started yet
  let streak = 0;
  while (progress.days[dayKey(d)]) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function recordAnswer() {
  const key = dayKey(new Date());
  progress.days[key] = (progress.days[key] || 0) + 1;
  // Keep roughly the last year of daily counts.
  const keys = Object.keys(progress.days).sort();
  keys.slice(0, Math.max(0, keys.length - 400)).forEach((k) => delete progress.days[k]);
  saveProgress();
  renderStreak();
}

function recordSession(categoryId, score, total) {
  const prev = progress.categories[categoryId] || { sessions: 0, best: 0 };
  progress.categories[categoryId] = {
    sessions: prev.sessions + 1,
    best: Math.max(prev.best, score),
    last: score,
    total,
    lastPlayed: Date.now(),
  };
  saveProgress();
}

// The topic practiced least recently (never-practiced topics first, in registry order).
function nextCategory() {
  return CATEGORIES.filter((c) => c.active).reduce((best, c) => {
    const t = (progress.categories[c.id] || {}).lastPlayed || 0;
    const bestT = (progress.categories[best.id] || {}).lastPlayed || 0;
    return t < bestT ? c : best;
  });
}

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

const state = {
  category: null,
  bank: null,
  questions: [],   // the current session's questions
  answers: [],     // selected option id per question
  index: 0,
  selectedOptionId: null,
  submitted: false,
  score: 0,
};

// Picks up to `size` questions without replacement (Fisher–Yates on a copy).
function pickSession(questions, size) {
  const pool = questions.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(size, pool.length));
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

const app = document.getElementById('app');
const announcer = document.getElementById('announcer');

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function announce(message) {
  announcer.textContent = '';
  setTimeout(() => { announcer.textContent = message; }, 50);
}

function focusElement(el) {
  if (el) el.focus();
}

function colorClass(category) {
  return `c${CATEGORIES.indexOf(category) + 1}`;
}

function number(category) {
  return String(CATEGORIES.indexOf(category) + 1).padStart(2, '0');
}

const STEAM_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d63" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
  <path d="M8 3c-1.5 1.5 1.5 3 0 4.5M12 3c-1.5 1.5 1.5 3 0 4.5M16 3c-1.5 1.5 1.5 3 0 4.5"/><path d="M4 12h16c0 4.4-3.6 8-8 8s-8-3.6-8-8z"/></svg>`;

const POT_ART = `<svg class="pot" viewBox="0 0 76 84" aria-hidden="true">
  <g fill="none" stroke="#f5b700" stroke-width="1.6" stroke-linecap="round"><circle cx="63" cy="12" r="5"/><path d="M63 2v2.5M63 19.5V22M53 12h2.5M70.5 12H73M56 5l1.8 1.8M68.2 17.2 70 19M56 19l1.8-1.8M68.2 6.8 70 5"/></g>
  <path d="M40 58 44 14" stroke="#059669" stroke-width="3" stroke-linecap="round"/>
  <path d="M48 58c2-10 8-17 16-20" stroke="#10b981" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M52 44c3-4 8-6 12-6-1 4-5 8-12 6z" fill="#34d399"/>
  <ellipse cx="28" cy="44" rx="12" ry="4" fill="#7fb3ff" transform="rotate(-8 28 44)"/>
  <rect x="12" y="54" width="60" height="7" rx="3" fill="#0b4fb8"/>
  <path d="M16 61h52l-5 21H21z" fill="#1570ef"/></svg>`;

function renderStreak() {
  const el = document.getElementById('streak');
  const n = currentStreak();
  el.innerHTML = n
    ? `${STEAM_ICON}<strong>${n}</strong>&nbsp;day streak`
    : `${STEAM_ICON}Start a streak today`;
}

function setChrome(view) {
  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.tab === view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  // The quiz uses the whole screen; the tab bar returns afterwards.
  document.querySelector('.tabbar').hidden = view === 'quiz';
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

function renderOverview() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const next = nextCategory();
  const done = answeredToday();
  const pct = Math.min(100, Math.round((done / DAILY_GOAL) * 100));
  const dailyMessage = done >= DAILY_GOAL
    ? 'Lovely work — your daily practice is complete.'
    : done > 0
      ? `${DAILY_GOAL - done} more ${DAILY_GOAL - done === 1 ? 'question' : 'questions'} to complete today’s practice.`
      : `Answer ${DAILY_GOAL} questions today to complete your daily practice.`;

  const tiles = CATEGORIES.map((cat) => `
    <li>
      <button type="button" class="tile ${colorClass(cat)}" data-start="${escapeHtml(cat.id)}" aria-label="${escapeHtml(cat.title)}: start a ${SESSION_SIZE}-question session">
        <span class="num">${number(cat)}</span>
        <span class="name">${escapeHtml(cat.short)}</span>
        <span class="tag">${escapeHtml(cat.tagline)}</span>
        <span class="arrow" aria-hidden="true">↗</span>
      </button>
    </li>`).join('');

  app.innerHTML = `
    <p class="eyebrow">${escapeHtml(today)}</p>
    <div class="greeting">
      <h1 class="serif">Have a great <span>session.</span></h1>
      ${POT_ART}
    </div>
    <p class="lede">A little practice today makes tomorrow’s English feel more natural.</p>

    <section class="hero" aria-labelledby="hero-title">
      <p class="eyebrow">Your next step</p>
      <h2 id="hero-title" class="serif">${escapeHtml(next.tagline)}</h2>
      <p>Today’s session: ${escapeHtml(next.title)} — ${SESSION_SIZE} questions picked at random.</p>
      <button type="button" class="btn btn-sun" data-start="${escapeHtml(next.id)}">Start ${SESSION_SIZE}-question session <span aria-hidden="true">→</span></button>
      <svg class="hero-deco" viewBox="0 0 300 64" preserveAspectRatio="none" aria-hidden="true">
        <g fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"><circle cx="120" cy="10" r="36"/><circle cx="292" cy="10" r="30"/></g>
        <line x1="0" y1="22" x2="300" y2="22" stroke="rgba(255,255,255,.28)" stroke-width="1"/>
        <circle cx="40" cy="22" r="8" fill="none" stroke="rgba(255,255,255,.35)"/><circle cx="40" cy="22" r="5" fill="#ffc93c"/>
        <circle cx="250" cy="22" r="8" fill="none" stroke="rgba(255,255,255,.35)"/><circle cx="250" cy="22" r="5" fill="#ff8fa3"/>
        <text x="40" y="52" fill="rgba(255,255,255,.45)" font-size="9" letter-spacing="2" text-anchor="middle" font-family="DM Sans, sans-serif">START</text>
        <text x="250" y="52" fill="rgba(255,255,255,.45)" font-size="9" letter-spacing="2" text-anchor="middle" font-family="DM Sans, sans-serif">FINISH</text>
      </svg>
    </section>

    <div class="section-head">
      <div>
        <p class="eyebrow">Your learning path</p>
        <h2 class="serif">Eight places to grow</h2>
      </div>
      <a class="link" href="#/practice">See all topics <span aria-hidden="true">↗</span></a>
    </div>
    <ul class="grid">${tiles}</ul>

    <section class="card" aria-labelledby="daily-title">
      <div class="card-row">
        <div>
          <p class="eyebrow">Keep going</p>
          <h2 id="daily-title" class="serif">Daily practice</h2>
        </div>
        <p class="count"><span class="sr-only">Answered today: </span>${Math.min(done, DAILY_GOAL)} / ${DAILY_GOAL}</p>
      </div>
      <div class="bar" aria-hidden="true"><span data-width="${pct}"></span></div>
      <p>${escapeHtml(dailyMessage)}</p>
      <button type="button" class="textlink" data-start="${escapeHtml(next.id)}">Practice now <span aria-hidden="true">→</span></button>
    </section>

    <figure class="quote">
      <span class="mark" aria-hidden="true">“</span>
      <blockquote>Clarity comes from noticing patterns, not memorizing every rule.</blockquote>
      <figcaption><cite>— your future fluent self</cite></figcaption>
    </figure>`;

  bindStartButtons();
  applyWidths();
}

function renderPractice() {
  const rows = CATEGORIES.map((cat) => {
    const p = progress.categories[cat.id];
    const meta = p
      ? `Best ${p.best}/${p.total} · last ${p.last}/${p.total} · ${p.sessions} ${p.sessions === 1 ? 'session' : 'sessions'}`
      : 'Not started yet';
    return `
      <li>
        <button type="button" class="row" data-start="${escapeHtml(cat.id)}">
          <span class="chip ${colorClass(cat)}" aria-hidden="true">${number(cat)}</span>
          <span class="body">
            <span class="title">${escapeHtml(cat.title)}</span>
            <span class="meta">${escapeHtml(meta)}</span>
          </span>
          <span class="go" aria-hidden="true">→</span>
        </button>
      </li>`;
  }).join('');

  app.innerHTML = `
    <p class="eyebrow">All topics</p>
    <h1 class="page-title serif">Practice</h1>
    <p class="lede">Pick a topic. Each session has ${SESSION_SIZE} questions chosen at random. Your scores are saved on this device only.</p>
    <ul class="list">${rows}</ul>`;

  bindStartButtons();
}

// Applies progress-bar widths after rendering. Inline style attributes are blocked by the
// Content Security Policy in index.html, but setting element.style from script is allowed.
function applyWidths() {
  app.querySelectorAll('[data-width]').forEach((el) => { el.style.width = `${Number(el.dataset.width) || 0}%`; });
}

function bindStartButtons() {
  app.querySelectorAll('[data-start]').forEach((btn) => {
    btn.addEventListener('click', () => { location.hash = `#/quiz/${btn.dataset.start}`; });
  });
}

function renderMessage(title, message) {
  app.innerHTML = `
    <div class="notice" role="alert">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
    </div>
    <button type="button" id="home-btn" class="btn btn-ghost btn-block">Back to overview</button>`;
  document.getElementById('home-btn').addEventListener('click', leaveQuiz);
  focusElement(app);
}

function renderQuestion() {
  const q = state.questions[state.index];
  const total = state.questions.length;
  const num = state.index + 1;
  const isLast = num === total;
  const letters = 'ABCD';

  const options = q.options.map((opt, i) => {
    const checked = state.selectedOptionId === opt.id;
    let cls = checked ? 'is-selected' : '';
    let verdict = '';
    if (state.submitted) {
      cls = 'is-locked';
      if (opt.id === q.correctOptionId) {
        cls += ' is-correct';
        verdict = checked ? '✓ Correct' : '✓ Correct answer';
      } else if (checked) {
        cls += ' is-wrong';
        verdict = '✗ Your answer';
      } else {
        cls += ' is-dim';
      }
    }
    return `
      <label class="option ${cls}">
        <input type="radio" name="answer" value="${escapeHtml(opt.id)}" ${checked ? 'checked' : ''} ${state.submitted ? 'disabled' : ''}>
        <span class="letter" aria-hidden="true">${letters[i]}</span>
        <span class="text">${escapeHtml(opt.text)}${verdict ? `<span class="verdict">${verdict}</span>` : ''}</span>
      </label>`;
  }).join('');

  let feedback = '';
  if (state.submitted) {
    const correct = state.selectedOptionId === q.correctOptionId;
    const correctText = q.options.find((o) => o.id === q.correctOptionId).text;
    feedback = `
      <section id="feedback" tabindex="-1" class="feedback ${correct ? 'ok' : 'no'}" aria-labelledby="feedback-title">
        <h2 id="feedback-title">${correct ? '✓ Correct!' : '✗ Not quite.'}</h2>
        ${correct ? '' : `<p>The correct answer is <strong>${escapeHtml(correctText)}</strong>.</p>`}
        <p>${escapeHtml(q.explanation)}</p>
      </section>
      <div class="actions">
        <button type="button" id="next-btn" class="btn btn-primary btn-block">${isLast ? 'See results' : 'Next question'} <span aria-hidden="true">→</span></button>
      </div>`;
  }

  app.innerHTML = `
    <div class="quiz">
      <div class="quiz-top">
        <button type="button" class="back" id="home-btn"><span aria-hidden="true">‹</span> Topics</button>
        <span class="quiz-cat">${escapeHtml(state.category.title)}</span>
      </div>
      <div class="progress-meta"><span>Question <strong>${num}</strong> of ${total}</span><span>Score: <strong>${state.score}</strong></span></div>
      <div class="bar" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${state.index}">
        <span data-width="${Math.round((state.index / total) * 100)}"></span>
      </div>

      <form id="question-form" class="question" novalidate>
        <fieldset>
          <legend>
            ${q.topic ? `<span class="eyebrow topic">${escapeHtml(q.topic)}</span>` : ''}
            <span id="question-prompt" class="prompt" tabindex="-1">${escapeHtml(q.prompt)}</span>
          </legend>
          <div class="options">${options}</div>
        </fieldset>
        ${state.submitted ? '' : `
          <p id="select-error" class="hint" role="alert"></p>
          <button type="submit" class="btn btn-sun btn-block">Check answer</button>`}
      </form>
      ${feedback}
    </div>`;

  applyWidths();
  document.getElementById('home-btn').addEventListener('click', leaveQuiz);
  const form = document.getElementById('question-form');
  form.addEventListener('change', (e) => {
    if (e.target.name !== 'answer' || state.submitted) return;
    state.selectedOptionId = e.target.value;
    document.getElementById('select-error').textContent = '';
    // Update the highlight without re-rendering, so keyboard focus stays put.
    form.querySelectorAll('.option').forEach((label) => {
      label.classList.toggle('is-selected', label.querySelector('input').checked);
    });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitAnswer();
  });
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
}

function renderComplete() {
  const total = state.questions.length;
  const pct = total ? Math.round((state.score / total) * 100) : 0;
  const missed = state.questions
    .map((q, i) => ({ q, chosen: state.answers[i] }))
    .filter(({ q, chosen }) => chosen !== q.correctOptionId);

  const review = missed.map(({ q, chosen }) => {
    const text = (id) => escapeHtml(q.options.find((o) => o.id === id).text);
    return `
      <li>
        <p class="q">${escapeHtml(q.prompt)}</p>
        <p class="a">Your answer: ${text(chosen)}</p>
        <p class="a">Correct answer: <strong>${text(q.correctOptionId)}</strong></p>
        <p class="a">${escapeHtml(q.explanation)}</p>
      </li>`;
  }).join('');

  app.innerHTML = `
    <section class="card result">
      <p class="eyebrow">${escapeHtml(state.category.title)}</p>
      <h1 id="complete-title" class="serif result-title" tabindex="-1">Session complete</h1>
      <p class="score">${state.score}<small> / ${total}</small></p>
      <p>${pct}% correct</p>
    </section>
    <div class="actions">
      <button type="button" id="restart-btn" class="btn btn-sun btn-block">Practice again</button>
      <button type="button" id="home-btn" class="btn btn-ghost btn-block">Back to overview</button>
    </div>
    ${missed.length ? `
      <div class="section-head"><div><p class="eyebrow">Review</p><h2 class="serif">Your ${missed.length} ${missed.length === 1 ? 'mistake' : 'mistakes'}</h2></div></div>
      <ul class="review">${review}</ul>` : ''}`;

  document.getElementById('restart-btn').addEventListener('click', startSession);
  document.getElementById('home-btn').addEventListener('click', leaveQuiz);
  focusElement(document.getElementById('complete-title'));
  announce(`Session complete. You scored ${state.score} out of ${total}.`);
}

// Developer view (index.html#/validate): validates every registered bank.
async function renderValidation() {
  app.innerHTML = `
    <p class="eyebrow">Developer</p>
    <h1 class="page-title serif">Content validation</h1>
    <div id="report"><p>Checking…</p></div>`;
  const rows = [];
  for (const cat of CATEGORIES) {
    try {
      const bank = await fetchJson(cat.file);
      const result = validateBank(bank, cat);
      const revised = Array.isArray(bank.questions) ? bank.questions.filter((q) => q && q.revision).length : 0;
      rows.push({ cat, pass: !result.errors.length, ...result, revised });
    } catch (err) {
      rows.push({ cat, pass: false, errors: [`Could not load or parse ${cat.file}: ${err.message}`], warnings: [], questionCount: 0, revised: 0 });
    }
  }
  const report = document.getElementById('report');
  if (!report) return; // the user left the page while banks were loading
  const total = rows.reduce((n, r) => n + r.questionCount, 0);
  report.innerHTML = `
    <p class="lede">${total} questions in ${rows.length} banks · ${rows.filter((r) => r.pass).length} passing</p>
    ${rows.map((r) => `
      <section class="vrow" data-category-id="${escapeHtml(r.cat.id)}" data-status="${r.pass ? 'pass' : 'fail'}">
        <h2>${escapeHtml(r.cat.title)} <span class="badge ${r.pass ? 'pass' : 'fail'}">${r.pass ? 'PASS' : 'FAIL'}</span></h2>
        <p class="vmeta">${escapeHtml(r.cat.file)} · ${r.questionCount} questions · ${r.revised} revised</p>
        ${r.errors.length ? `<ul class="err">${r.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>` : ''}
        ${r.warnings.length ? `<ul class="warn">${r.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul>` : ''}
      </section>`).join('')}`;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

let inAppNavigations = 0;

// Returns to the previous screen, or to the overview if the quiz was opened directly.
function leaveQuiz() {
  if (inAppNavigations > 0) history.back();
  else location.hash = '#/';
}

async function startCategory(categoryId) {
  const category = CATEGORIES.find((c) => c.id === categoryId && c.active);
  if (!category) {
    location.replace('#/');
    return;
  }
  state.category = category;
  app.innerHTML = '<p role="status">Loading questions…</p>';
  try {
    state.bank = await loadBank(category);
  } catch (err) {
    renderMessage('Unable to start practice', err.message);
    return;
  }
  // Ignore a stale load if the user navigated away meanwhile.
  if (location.hash !== `#/quiz/${category.id}`) return;
  startSession();
}

function startSession() {
  state.questions = pickSession(state.bank.questions, SESSION_SIZE);
  state.answers = [];
  state.index = 0;
  state.score = 0;
  showQuestion();
}

function showQuestion() {
  state.selectedOptionId = null;
  state.submitted = false;
  renderQuestion();
  window.scrollTo(0, 0);
  focusElement(document.getElementById('question-prompt'));
}

function submitAnswer() {
  if (state.submitted) return;
  if (!state.selectedOptionId) {
    document.getElementById('select-error').textContent = 'Please choose an answer first.';
    return;
  }
  const q = state.questions[state.index];
  const correct = state.selectedOptionId === q.correctOptionId;
  state.submitted = true;
  state.answers[state.index] = state.selectedOptionId;
  if (correct) state.score += 1;
  recordAnswer();
  renderQuestion();
  focusElement(document.getElementById('feedback'));
  announce(correct ? 'Correct.' : 'Incorrect.');
}

function nextQuestion() {
  if (state.index + 1 < state.questions.length) {
    state.index += 1;
    showQuestion();
  } else {
    recordSession(state.category.id, state.score, state.questions.length);
    window.scrollTo(0, 0);
    renderComplete();
  }
}

// ---------------------------------------------------------------------------
// Routing (hash-based, so it works on GitHub Pages without server config)
// ---------------------------------------------------------------------------

function route() {
  const [view = '', arg] = location.hash.replace(/^#\/?/, '').split('/');
  if (view === 'quiz') {
    setChrome('quiz');
    startCategory(arg);
    return;
  }
  if (view === 'practice') {
    setChrome('practice');
    renderPractice();
  } else if (view === 'validate') {
    setChrome('validate');
    renderValidation();
  } else if (view === '') {
    setChrome('overview');
    renderOverview();
  } else {
    location.replace('#/');
    return;
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', () => {
  inAppNavigations += 1;
  route();
});

// Exposed for manual checks in the browser console.
window.EnglishGA = { CATEGORIES, validateBank };

renderStreak();
route();

// Offline support after the first visit (HTTPS or localhost only).
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[English_GA] Offline cache unavailable:', err));
  });
}
