# English_GA — Product and Coding-Agent Specification

**Document status:** Authoritative working specification (revised 2026-09-28)
**Application type:** Mobile-first static web app, published with GitHub Pages
**Current release:** All eight grammar categories active, 520 approved questions
**Primary audience:** The project owner and a small group of English learners

## 1. Purpose

English_GA is a lightweight grammar-learning web application for practicing English grammar through short interactive sessions. Vocabulary learning is outside the product scope.

The app should feel immediate, friendly, and encouraging on a phone: a learner chooses a topic, answers a question, submits the answer, and receives useful feedback without creating an account or waiting for a server.

The application is intentionally small. It must be easy to publish on GitHub Pages, easy to use on a phone, and easy for a coding agent to extend without disturbing working features.

## 2. Product principles

1. **Keep the architecture simple.** No framework, backend, database, package manager, or build step for the runtime app.
2. **Mobile first, always.** Design and test at phone width first (320–430 px); desktop is a secondary layout of the same page.
3. **GitHub Pages first.** Everything must work as plain static files served from a sub-folder URL such as `https://<user>.github.io/<repo>/`.
4. **Separate content from behavior.** Questions, answers, and explanations live in JSON; rendering, navigation, and checking live in `app.js`.
5. **Accuracy over quantity.** Every question must have exactly one defensible answer. Changes to learning content must be verified against reliable sources and recorded (section 6.4).
6. **Prefer incremental changes.** Preserve existing behavior and make the smallest change that satisfies the request.
7. **Explain architectural changes first.** Before changing structure, dependencies, storage, or hosting assumptions, describe the reason, impact, and simpler alternatives.

## 3. Resolved requirements and decisions

This section is self-contained. A coding agent must be able to maintain English_GA using this document alone.

| Topic | Authoritative decision |
|---|---|
| File structure | `index.html` (shell), `styles.css` (all styling), `app.js` (all behavior), `sw.js` (offline cache), one JSON bank per category in `content/`, one Markdown guide per category in `guides/`. |
| Styling | A local stylesheet with color tokens (section 8). No CSS framework or CDN stylesheet. Tailwind CDN is no longer used. |
| Fonts | Fraunces (headings) and DM Sans (text) from Google Fonts, with system-font fallbacks so the app stays usable offline or if the font service is blocked. |
| Hosting | GitHub Pages from the repository root. All paths are relative; a `.nojekyll` file makes GitHub serve files as-is. |
| Navigation | Hash routes (`#/`, `#/practice`, `#/quiz/<category-id>`, `#/validate`). They need no server configuration and make the phone's Back button work. |
| Offline use | Supported after the first visit through `sw.js` (network first, cached copy when offline). Opening `index.html` directly from disk (`file://`) is not supported and does not need to be: browsers block JSON loading there, and the published site is the product. |
| Categories | All eight grammar areas are active (section 4). |
| Session length | 20 questions per session, chosen at random without replacement from the category bank. |
| Answer options | Every question has exactly 4 options (the validator accepts 3–4). Two-option true/false or yes/no items are not allowed; convert them into 4-option items whose options state the reason or the correction. |
| Progress | Streak, daily practice (goal: 20 answered questions per day), and per-topic scores are stored in the browser with `localStorage` on each device. No accounts, no sync. |
| English variety | American English is the default. An item whose answer differs in British English must either be rewritten so both varieties agree or be labeled, for example "(British English)". |
| Learning content governance | Supplied content is the starting point. The owner has authorized AI-assisted corrections when they are verified against reliable sources and recorded in the question's `revision` field (section 6.4). No unrecorded or unsourced changes. |
| Feedback | Every question gives a clear correct/incorrect result, shows the correct answer when wrong, and shows a concise explanation. |

If a future request conflicts with this table, stop and explain the conflict before implementation.

## 4. Scope

### 4.1 Implemented

- Home screen (Overview), Practice list, quiz, results with a review of mistakes, and a developer validation page.
- Eight active categories:
  1. Verb Tenses/Aspect
  2. Auxiliary Verbs + Questions
  3. Prepositions
  4. Definite, Indefinite, and Zero Articles
  5. Sentence Structure/Word Order
  6. Quantifiers
  7. Subject–Verb Agreement
  8. Relative Clauses
- 50–80 questions per category (520 in total), each with 4 options, one correct answer, and an explanation.
- Local progress: day streak, daily practice counter, best and last score per topic.
- Offline cache, hash routing, content validation.
- Installable app: `manifest.webmanifest` (standalone display) with 192 px, 512 px, and maskable icons, plus iOS home-screen tags.

### 4.2 Next — add only after the current release is stable

- Grow each bank toward 100 questions, following section 6.
- Optional per-topic study view that renders the Markdown guide.
- Optional "practice my mistakes" session built from the local review data.

### 4.3 Later — requires explicit approval

- Any server, API, authentication, analytics, cloud sync, or native packaging.
- Automatically generated questions without human review.

## 5. User experience requirements

### 5.1 Overview (home screen)

From top to bottom:

1. Top bar: the English_GA logo (icon plus the wordmark `English_` in navy and `GA` in logo blue) and the day-streak counter.
2. Today's date, the greeting **"Have a great session."**, a short encouraging line, and the plant illustration.
   The date, daily practice, and streak must always reflect the current day, including when the installed app stays open past midnight or resumes from the background (the app re-checks on return to the screen and at midnight, without interrupting a quiz).
3. **Your next step** card: suggests the topic practiced least recently, with a "Start 20-question session" button.
4. **Your learning path — Eight places to grow**: a two-column grid of eight topic cards (number, short name, tagline). One tap starts a session.
5. **Daily practice** card: answered today out of 20, a progress bar, and "Practice now".
6. Quote card.
7. Fixed bottom navigation: **Overview** and **Practice**.

### 5.2 Practice list

All eight topics with their full titles and saved stats (best score, last score, number of sessions), each starting a session with one tap.

### 5.3 Quiz

1. Show the question number, score, a progress bar, the topic label, and the prompt.
2. Show four answer options labeled A–D. The whole option row is the tap target.
3. Prevent submission without a selection, with a clear message.
4. On submission, lock the answers, mark the chosen and correct options with color **and** text (✓ Correct, ✗ Your answer, ✓ Correct answer), and show the explanation.
5. "Next question" moves on; the last question shows "See results".
6. "‹ Topics" and the phone's Back button leave the quiz. The bottom navigation is hidden during a quiz.

### 5.4 Results

Score out of 20 and percentage, "Practice again" (a new random 20), "Back to overview", and a list of the questions answered wrongly with the correct answer and explanation.

### 5.5 Tone

Friendly, encouraging, and brief. Never shame mistakes; always show how to get it right.

## 6. Content model and governance

### 6.1 Bank format

```json
{
  "id": "verb-tenses-aspect",
  "title": "Verb Tenses/Aspect",
  "status": "active",
  "source": "content-source/verb_tenses_and_aspect_practice_questions.json",
  "questions": [
    {
      "id": "vta-001",
      "topic": "Present Tenses",
      "prompt": "She usually _____ (walk) to work, but today she _____ (take) the bus.",
      "options": [
        { "id": "a", "text": "walks / is taking" },
        { "id": "b", "text": "is walking / takes" },
        { "id": "c", "text": "walks / takes" },
        { "id": "d", "text": "is walking / is taking" }
      ],
      "correctOptionId": "a",
      "explanation": "Use present simple for habits ('walks') and present continuous for temporary actions happening today ('is taking')."
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `id`, `title`, `status`, `questions` | Yes | The bank `id` must match the registry in `app.js`. |
| `question.id` | Yes | Stable and unique, `<prefix>-<3 digits>` (vta, aux, prep, art, ss, qnt, sva, rc). Never reuse an ID. |
| `prompt` | Yes | Self-contained; use `_____` for the blank. |
| `options` | Yes | Exactly 4, each with a stable `id` (`a`–`d`) and unique `text`. |
| `correctOptionId` | Yes | Must match one option `id` (never an array position). |
| `explanation` | Yes | One or two sentences, at most 300 characters. |
| `topic` | No | Sub-topic label shown above the prompt. |
| `revision` | When changed | `{ "date", "reason", "sources": [urls] }`: required for any change to supplied wording, options, or answers. |
| `options[].added` | When added | `true` on options written after the content was supplied. |

### 6.2 Question quality rules

1. **Exactly one defensible answer.** Read the sentence with every option in place. If any wrong option also produces an acceptable sentence (in American or British English), the item is ambiguous and must be fixed.
2. **Distractors must be clearly wrong in context,** not merely less common, and should test the same grammar point where possible (for example a verb with the wrong number).
3. **Avoid distractors that form a fragment that can read like a heading or title** (for example "Reading books to improve your vocabulary").
4. **Label variety-specific items** or rewrite them so all varieties agree.
5. **Keep explanations consistent** with the key and the guide for the category.
6. **Do not change the meaning** of a question when fixing it; prefer replacing a bad distractor or adding minimal context.

### 6.3 Reliable sources

Use at least one of these for every content change:

- British Council LearnEnglish (learnenglish.britishcouncil.org)
- Cambridge Dictionary and Cambridge Grammar (dictionary.cambridge.org)
- Longman Dictionary of Contemporary English (ldoceonline.com)
- Oxford Learner's Dictionaries (oxfordlearnersdictionaries.com)
- Merriam-Webster (merriam-webster.com)

Question-and-answer sites, forums, and general blogs are not acceptable as the only source.

### 6.4 Change procedure

1. Identify the problem and quote the ambiguous or wrong sentence.
2. Verify the grammar point in a reliable source.
3. Make the smallest fix (replace a distractor, add context, or correct the key).
4. Record `revision` with the date, a one-sentence reason, and the source URLs.
5. Run the validator (`#/validate`) and a session in the affected category.

The original supplied files stay unchanged in `content-source/`. `content/*.json` is the source of truth; `tools/convert-legacy-content.py` documents how it was produced and holds the recorded fixes.

## 7. Technical architecture

```text
index.html                 page shell and accessible regions
styles.css                 all styling (color tokens in :root)
app.js                     registry, validation, routing, quiz, progress
sw.js                      offline cache
logo.svg                   full logo (mark + wordmark)
icon.svg                   app icon and favicon (logo mark on a white rounded tile)
apple-touch-icon.png       180 px iPhone home-screen icon rendered from icon.svg
icon-192.png, icon-512.png installed-app icons rendered from icon.svg
icon-maskable-512.png      Android adaptive icon (logo inside the 80% safe zone)
manifest.webmanifest       install metadata (name, icons, standalone display, colors)
.nojekyll                  serve files as-is on GitHub Pages
README.md                  run and deploy instructions
content/
  verb-tenses-aspect.json
  auxiliary-verbs-questions.json
  prepositions.json
  articles.json
  sentence-structure.json
  quantifiers.json
  subject-verb-agreement.json
  relative-clauses.json
guides/
  <same eight names>.md    authoring references
content-source/            original supplied banks (unchanged)
tools/
  convert-legacy-content.py
```

- **Registry.** `app.js` holds a fixed list of categories with `id`, `title`, `short`, `tagline`, and `file`. Only files in the registry are fetched; never build a file path from user input.
- **Validation.** `validateBank()` checks the bank ID, required fields, unique IDs, 3–4 options with unique IDs and texts, a valid `correctOptionId`, explanation length, and bank size (error below 20, warning outside 50–100). A bank with errors does not load.
- **Routing.** Hash routes only (section 3). Unknown routes go to `#/`.
- **Storage.** One `localStorage` key, `englishGA.progress.v1`, holding `days` (answers per date) and `categories` (sessions, best, last, total, lastPlayed). Every read and write is wrapped so the app works when storage is blocked.
- **Offline cache.** `sw.js` pre-caches the shell, icons, manifest, and all eight banks. Requests are network first with `cache: 'no-cache'` (always revalidated, so releases appear immediately) and fall back to the cache offline. When a file is added to or removed from the app, update the `CORE` list and increase the `CACHE` version.
- **Installability.** Requires HTTPS (GitHub Pages provides it), the registered service worker, and `manifest.webmanifest` with `start_url`/`scope` `./`, `display: standalone`, and 192 px and 512 px icons.
- **No runtime dependencies** other than the optional Google Fonts stylesheet.

## 8. Visual design system

Modern, bright, and encouraging, with an educational feel, built on the colors of the English_GA logo (navy, blue, teal). All colors are tokens in `styles.css`; do not hard-code new colors in rules.

**Logo.** `logo.svg` is the master artwork: a navy E, a blue G/A ligature, a teal check mark, and an open book. Use `icon.svg` wherever the logo appears at small sizes; do not recolor or stretch it. If the logo changes, regenerate every PNG icon from `icon.svg` on an opaque white background: `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` (512, logo scaled to about 78% so it fits the maskable safe zone).

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f6f7fb` | Page background |
| `--ink` | `#0b2a5b` (logo navy) | Main text |
| `--muted` / `--label` | `#4a5877` / `#5b6887` | Secondary text, small labels |
| `--brand-blue` | `#1570ef` (logo blue) | Logo, large fills, gradients |
| `--primary` | `#1463d6` (logo blue, darkened for text contrast) | Links, selection, primary buttons |
| `--hero` | logo blue → indigo gradient | "Your next step" card |
| `--sun` | `#ffc93c` | Main call-to-action buttons, logo |
| `--pink` | `#ff6b8b` | Streak and warm accents |
| `--growth` | green → logo teal gradient | Daily-practice progress |
| `--ok` / `--no` | `#15803d` / `#b42318` with light tints | Correct / incorrect feedback |
| `--t1`…`--t8` | mint, sun, lavender, sky, rose, lime, aqua, orchid | Topic cards |

Rules:

- Text contrast at least 4.5:1 (WCAG AA). Check any new color pair before use.
- Correct/incorrect is never shown by color alone: always include ✓/✗ and words.
- Headings use Fraunces; everything else uses DM Sans.
- Rounded cards (14–18 px radius), soft shadows, generous spacing.

## 9. Mobile and accessibility requirements

- Viewport: `width=device-width, initial-scale=1, viewport-fit=cover`; respect `env(safe-area-inset-bottom)` for the bottom bar.
- Layout must work from **320 px** wide with **no horizontal scrolling** on any screen, for every question and answer state.
- Touch targets at least 44 × 44 px (buttons and options are 48–56 px tall).
- Body text at least 16 px; no zoom needed for normal use.
- Semantic headings, a `fieldset`/`legend` for each question, real radio inputs, visible focus outlines, and full keyboard use (Tab to the answers, arrow keys to choose, Enter to submit).
- Screen-reader announcements for correct/incorrect and session results.
- Respect `prefers-reduced-motion`.
- Primary targets: current Safari on iOS and Chrome on Android. Desktop browsers are secondary.

## 10. Publishing on GitHub Pages

1. Push the project to a GitHub repository (files at the repository root).
2. In **Settings → Pages**, choose **Deploy from a branch**, select the branch and `/ (root)`, and save.
3. Open `https://<user>.github.io/<repo>/`, then `#/validate`, and confirm all eight banks pass.

Checklist before every publish:

- All links and fetches are relative (no leading `/`).
- `.nojekyll` is present.
- `sw.js` `CORE` list matches the files, and `CACHE` was bumped if the list changed.
- Validation passes and a session in each changed category completes.

To test locally, serve the folder (`python -m http.server 8765`) and open `http://localhost:8765`. To imitate a GitHub Pages project URL, serve the parent folder and open the app from its sub-folder.

## 11. Coding-agent operating procedure

**Inspect → Plan → Implement → Verify → Report.**

1. **Inspect:** read this document, the relevant files, and the current content before editing.
2. **Plan:** state what will change, which files, how existing behavior is preserved, and any decision needed from the owner.
3. **Implement:** smallest appropriate change; keep content out of `app.js`; follow sections 6 and 8.
4. **Verify** at minimum:
   - The page loads without JavaScript errors.
   - `#/validate` shows all banks passing.
   - Each affected category starts, answers can be submitted, feedback and explanations appear, the final question leads to results, "Practice again" and Back work.
   - No horizontal overflow at 320 px and 375 px; the layout also works on desktop.
   - Keyboard-only use works.
   - For content changes: each changed question read aloud with every option; exactly one is acceptable.
   - For file changes: the app still works offline after one visit, and from a sub-folder URL.
5. **Report:** what changed, files changed, tests and results, sources used, remaining limitations, and decisions needed from the owner. Never report a task as complete while a known failure is unmentioned.

## 12. Acceptance criteria

The current release is acceptable when:

- The app opens from its GitHub Pages URL and works on a phone without horizontal scrolling.
- The home screen follows section 5.1, including "Have a great session."
- All eight categories are active, each with 50–100 questions, 4 options per question, one valid `correctOptionId`, and an explanation.
- Validation passes for every bank.
- A session is 20 random questions, gives clear feedback, and ends with results and a mistake review.
- Streak, daily practice, and topic scores persist on the device.
- The app works offline after the first visit.
- The app can be installed to the home screen (Chrome "Install app", Safari "Add to Home Screen") and opens full-screen.
- The Back button moves between screens.
- No account, backend, database, or native-app dependency is required.

## 13. Known limitations (accepted)

- Progress is stored per browser and device; clearing site data resets it, and it does not sync between devices.
- Fonts come from Google Fonts; offline or when blocked, system fonts are used instead.
- The app must be opened through a web address (GitHub Pages or a local server), not by double-clicking `index.html`.
- Real-device testing on iOS Safari and Android Chrome should be repeated after each release; development testing uses browser emulation.

## 14. Decision log

| Date | Decision |
|---|---|
| Initial | Grammar-only app; Vanilla JavaScript; static hosting; separate JSON content and Markdown guides. |
| 2026-09-28 | All eight categories activated after converting the supplied banks to the section 6.1 format. |
| 2026-09-28 | Sessions set to 20 random questions. |
| 2026-09-28 | Two-option items expanded to four options; 4 options is the standard. |
| 2026-09-28 | Ambiguous items fixed with reliable sources; every change recorded in `revision`. |
| 2026-09-28 | Tailwind CDN replaced by a local stylesheet with color tokens. |
| 2026-09-28 | Owner's English_GA logo redrawn as SVG and added to the app; palette aligned to the logo colors. |
| 2026-09-28 | Hash routing, local progress, and offline cache added; GitHub Pages confirmed as the hosting target. |
| 2026-09-28 | Published at https://saintfranckinder.github.io/English_GA/ ; web app manifest added so the app can be installed on phones. |

This document is the working source of truth for English_GA unless the project owner approves a replacement decision.
