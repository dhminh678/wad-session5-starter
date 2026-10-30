# IA#3 - Three answers to one brief
## rubric
**CSC13008 individual assignment · 3% of the course · 100 points**

The session 5 activity, finished at home and handed in. Start from the Session 5 starter files (Classroom → Slides). The starter's `README.md` says *nothing to hand in, not graded* - for this class that line is replaced by this rubric. Everything else in it still applies: `brief.md`, the five test conditions, the Done means table, the verdict sheet and the CSR vs SSR questions.

You may have started in pairs in class. What you hand in is yours alone: your own runs, your own screenshots, your own assistant's review.

Use your assistant. Nothing here asks you to type code yourself: it scores what you observed, what you told the assistant, and whether the result passes every row.

---

### What you do

1. Commit the untouched starter first: `git init && git add . && git commit -m starter`.
2. Predict, then run. For each version, read it beside `brief.md` and write your prediction in `VERDICTS.md`. Commit. Then run every row of Done means plus the empty row against every version, and fill in what you saw.
3. Ask an assistant to review the three original files against `brief.md` before you tell it your verdicts and check each of its claims with a row.
4. Fix every version you did not mark *keep*: give your assistant your one sentence, let it change that version file, rerun the whole table. One commit per fixed version.
5. Answer the five CSR vs SSR questions in the README.

---

### What is scored

| # | Criterion | Points |
|---|---|---|
| 1 | Verdicts and evidence<br>`VERDICTS.md`, `evidence/` | 30 |
| 2 | After your fixes, every version passes every row | 25 |
| 3 | The assistant's review, checked<br>`ASSISTANT-REVIEW.md` | 15 |
| 4 | CSR vs SSR `CSR-SSR.md` | 10 |
| 5 | `AI-LOG.md` | 10 |
| 6 | Scope and commit history | 10 |

---

### 1. Verdicts and evidence (30 points)

`VERDICTS.md` holds, for each original version A, B and C:
* your prediction from reading alone, committed before the results;
* a line for every row 1 to 8 and empty saying PASS or FAIL and what you saw ("row 6: Loading products... still on screen at 15 s; Network shows /api/products Pending");
* for each FAIL, the line(s) of code responsible;
* the verdict — *keep*, *fix* or *reject* — and the row that decided it;
* the one sentence you would tell the assistant, as the README describes: the row, the evidence, the constraint.

Every row you mark FAIL has a screenshot in `evidence/`, named `<version>-row<N>.png` (for example `a-row2.png`), showing the page and the DevTools panel or terminal that proves it.

| Points | What it looks like |
|---|---|
| 26–30 | All 27 lines present (9 rows × 3 versions). Every failing row is found, with a screenshot and the responsible line of code. No version is failed on a row it passes. Each sentence names a row, what was seen and the constraint to keep — specific enough to act on. |
| 18–25 | Every failing row found, but evidence is thin: a screenshot missing, "row 2 fails" with no number seen, or a sentence an assistant could misread (for example "fix the total" with no word about keeping the requests parallel). |
| 8–17 | One failing row missed — usually the one only a single condition shows — or a version failed on a row it passes, without evidence. |
| 0–7 | Verdicts with no rows run, or copied from someone else's sheet. |

The prediction is not scored for being right. A wrong prediction that the table then corrected is the point of the exercise — say so.

---

### 2. Every version passes every row (25 points)

Marked by running your three files in `public/versions/` in a browser script against the starter's own `server.mjs`, under all five conditions: the Done means rows 1–7, the empty row, row 8 with `tsc` and the starter's `jsconfig.json`, and brief item 5: the stock requests go out in parallel (the script records when each `/api/stock/...` request starts; a staircase in the Network waterfall is a fail).

| Points | What it looks like |
|---|---|
| 25 | All three versions pass every row and the parallel check. |
| 18–24 | One row or the parallel check fails in one version — typically a fix that makes the total right by sending the stock requests one after another. |
| 8–17 | A version you marked *fix* still fails the row that decided your verdict, or two rows fail. |
| 0–7 | No fix attempted, or the page throws on load. |

A version you marked *keep* and left untouched counts if it passes. A version you marked *reject* must still pass in the end: write what you would ask for instead, then have the assistant rewrite it.

---

### 3. The assistant's review, checked (15 points)

`ASSISTANT-REVIEW.md`: the tool and model you asked, your prompt, and its answer pasted unedited. Below it, a table: each problem the assistant claimed, and the row that confirmed it or the run that showed it was not real; then each failing row your table found that the assistant missed.

| Points | What it looks like |
|---|---|
| 13–15 | The full answer is there, every claim is checked against a row or a run, and you say plainly where it was wrong — a missed bug or an invented one. |
| 8–12 | Claims checked, but some only by reading ("looks right") rather than a row. |
| 3–7 | The answer is pasted with no checking, or a summary replaces the answer. |
| 0–2 | Missing. |

An assistant that found everything is a fine result — if your table shows it.

---

### 4. CSR vs SSR (10 points)

`CSR-SSR.md`: the five questions at the end of the starter's `README.md`, each answered with what you saw — what *View source* showed, what was left with JavaScript off, the number of requests you counted.

| Points | What it looks like |
|---|---|
| 9–10 | All five answered from your own observation, including why `/ssr` reads `<i>` and what that shares with `textContent`. |
| 5–8 | All five answered, one or two from definitions rather than observation. |
| 1–4 | Fewer than four answered. |
| 0 | Missing. |

---

### 5. AI-LOG.md (10 points)

One entry per time you used the assistant: the review in step 3, and each fix.

| Points | What it looks like |
|---|---|
| 9–10 | Each entry names the tool, the request and the result. *Changed* or *Rejected* records at least one thing the assistant got wrong and the row that caught it — including a fix that broke another row, if one did. |
| 5–8 | Honest, but *Changed*/*Rejected* are empty or vague. |
| 1–4 | One entry for everything, or written after the fact. |
| 0 | Missing, or contradicted by the history. |

---

### 6. Scope and commit history (10 points)

| Points | What it looks like |
|---|---|
| 9–10 | The untouched starter is the first commit. The predictions are committed before the results. Each fix is its own commit, and its diff touches only that version file. No starter file other than `public/versions/*.js` differs from the starter commit. |
| 5–8 | Starter commit present; predictions and results, or several fixes, share one commit. |
| 0–4 | One commit with everything, no `.git` in the zip, or `server.mjs`, `panel.js`, `index.html` or `jsconfig.json` changed — the quickest way to make a row pass is to change what it measures. |

---

### How to submit

Zip your session 5 folder including its hidden `.git` folder. At the top of that folder: `VERDICTS.md`, `evidence/`, `ASSISTANT-REVIEW.md`, `CSR-SSR.md`, `AI-LOG.md` and `SELF_ASSESSMENT_REPORT.md`. Name the zip after your student ID and the total you give yourself:  
`<StudentID>_<total>.zip`, for example `24127001_82.zip`

**Due Wednesday, November 4, 2026, 22:00.**

The zip must contain `SELF_ASSESSMENT_REPORT.md`: one row per criterion in this rubric, the marks you claim, and evidence pointing at a file, a row, a screenshot or a commit — plus a short *what I did not manage*. The total in that table is the number in the file name. Template in Course documents on Classroom.

A wrong file name costs no marks but delays your result — the grading script matches submissions to the class list by that name.

Turn in from your `<StudentID>@student.hcmus.edu.vn` Google account.

---

### Honesty adjustment

Your self-assessment is compared with the mark you actually earn. The gap is your total minus the mark, on the same 100-point scale.

| Gap | Adjustment |
|---|---|
| within ±10 | this is normal calibration — none |
| +11 to +20 | -3 |
| +21 to +30 | -6 |
| more than +30 | -10 |
| -21 or worse | read the rubric before you score yourself down: -3 |
| no `SELF_ASSESSMENT_REPORT.md` | -10, and the file-name total is ignored |

A criterion you claim with no evidence line counts as claimed-and-not-done for this comparison. The adjustment never takes a submission below 0.

---

### Notes

* Run the whole table yourself, on every version, before you score criteria 1 and 2. The marking script runs the same rows.
* Go through `http://localhost:5050`, never `file://`. Switch the condition, then reload or press Retry.
* You may be asked to explain any line in class — including lines your assistant wrote. Explaining what a line does and how you checked it is enough; nobody will ask you to write it from memory.