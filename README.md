# Session 5 — three answers to one brief

**CSC13008 · in-class activity · individual · use your assistant**
**Nothing to hand in, not graded.**

An assistant was given [`brief.md`](brief.md) three times: load the catalogue
from an API, show a loading line, give up after 5 seconds, offer Retry, and
add up the stock value from a second endpoint. It produced three versions —
`public/versions/a.js`, `b.js` and `c.js`. All three look clean. All three
run.

Your job is to give each version a verdict — **keep**, **fix** or
**reject** — and back it with evidence: the row of the *Done means* table it
fails, and what you saw. "It looks fine" and "the assistant said it works" are
not evidence.

## Run it

You need **Node 18 or newer** (`node --version`). No `npm install`: the
server uses only Node's built-in modules.

```bash
node server.mjs
```

Then open <http://localhost:5050>. (Port taken? `PORT=5051 node server.mjs`;
on Windows PowerShell `$env:PORT=5051; node server.mjs`.)

Do **not** open `public/index.html` by double-clicking it: from a `file://`
address, `fetch('/api/products')` has no server to talk to. Always go through
`http://localhost:5050`.

- **Version** in the header loads one version: `?v=a`, `?v=b`, `?v=c`.
- **Test conditions** tells the server how `GET /api/products` behaves from
  the next request on. After you switch, reload the page (or press Retry).

| Mode | What `GET /api/products` does |
|---|---|
| `normal` | Answers at once with 8 products |
| `slow` | Answers after 3 seconds |
| `error` | Answers `500` with a JSON error body |
| `hang` | Sends nothing for 30 seconds (then `504`) |
| `empty` | Answers at once with `[]` |

The terminal running `node server.mjs` prints one line per request, with the
mode it arrived under — watch it next to the browser. Before you start, run
`git init && git add . && git commit -m starter`, so that `git diff` shows
exactly what changes if you later let an assistant fix something.

## DevTools you will need

Open DevTools with `F12` (`Cmd+Option+I` on macOS).

- **Network** tab: tick **Disable cache**. Each row is one request — look at
  *Status*, *Time*, and the waterfall: requests sent **in parallel** start at
  the same moment, requests sent one after another form a staircase.
  *Throttling* (`No throttling` → `Slow 4G`) slows every request down, which
  makes ordering bugs easier to see.
- **Console** tab: red text means something threw. The browser also prints a
  red `GET … 500 (Internal Server Error)` line by itself whenever a request
  gets a 500 — that line is the browser reporting the network, not the page's
  code failing. What counts as an error here is `Uncaught …` or anything the
  version printed itself.
- **Disable JavaScript**, for the CSR vs SSR part below: inside DevTools press
  `Ctrl+Shift+P` (`Cmd+Shift+P`), type `Disable JavaScript`, Enter — or
  Settings (`F1`, or the gear icon) → *Preferences* → *Debugger*. It stays off
  only while DevTools is open; run `Enable JavaScript` the same way to undo.

## Done means

Run every row against every version. Expected stock value with the data in
`server.mjs`: **`12.360.000 đ`**.

| # | Do this | You should see |
|---|---|---|
| 1 | Mode `normal`, reload | 8 cards, in the order the API sends them, prices like `180.000 đ`. Status line empty |
| 2 | Mode `normal`, reload, wait a second | Stock value: `12.360.000 đ` |
| 3 | Look at the last card | Its name reads `Scarf <i>limited</i>` — the angle brackets visible, nothing in italics |
| 4 | Mode `slow`, reload | `Loading products…` for about 3 seconds, then the 8 cards; the status line clears |
| 5 | Mode `error`, reload; then mode `normal`, press Retry | First `Could not load products.` and a Retry button, no cards. After Retry: 8 cards, the message and the button gone |
| 6 | Mode `hang`, reload, count to 7 | After about 5 seconds: `Could not load products.` and Retry. Not `Loading products…` for half a minute |
| 7 | Watch the Console during rows 1–6 | No `Uncaught …` errors, nothing red apart from the browser's own `GET … 500` line |
| 8 | In VS Code, open this folder, add `// @ts-check` as the **first line** of the version file | Nothing underlined in red. Hover anything underlined to read why. Remove the line afterwards |

Also try mode `empty`: the brief says `No products yet.` and `0 đ`.

For row 8, open the **folder** (`File → Open Folder…`), not the single file,
so VS Code picks up `jsconfig.json`. `// @ts-check` asks VS Code's built-in
TypeScript checker to type-check a plain JavaScript file against what it knows
about the browser's APIs.

## Verdict sheet

Copy this into your notes and fill one block per version.

```markdown
### Version A

- Rows that failed: 
- What I saw (the screen, the Network tab, the Console, the terminal):
- The line(s) of code responsible:
- Verdict: keep / fix / reject
- The one sentence I would tell the assistant:
```

The last line is the skill this session practises. "It doesn't work" gives an
assistant nothing to go on. A good sentence names the row, the evidence and
the constraint — for example (about none of these three): *"With the server
in `error` mode the Retry button never appears; `#retry` stays `hidden`
because the `catch` block returns before setting it — show it in `catch`."*

If you have time, give the assistant your sentence for a version you marked
**fix**, then run the table again on its answer. Did it fix the row without
breaking another? `git diff` shows what it touched.

## CSR vs SSR — the same catalogue, built in two places

`http://localhost:5050/ssr` shows the same products. This time the **server**
builds the HTML (see `renderSsrPage` in `server.mjs`); the version pages build
it in the **browser**, from JSON.

1. On `/?v=` any version and on `/ssr`, right-click → **View page source**
   (`Ctrl+U`). Where are the product names in each? Where is the stock
   value?
2. In `/ssr`'s source, find the scarf. Why does it read `&lt;i&gt;` there,
   and what does that have in common with `textContent` in the browser?
3. Disable JavaScript (DevTools settings, above) and reload both pages. What
   is left of each?
4. In the Network tab, count the requests each page makes before the stock
   value appears. Which page would a search engine, or a user on a slow
   phone, see first?
5. One sentence: when would you want the server to render, and when the
   browser?

## Shared by two classes

24KTPM1 — Tue Oct 27, 2026 · CQ2024/31 — Thu Oct 29, 2026.
