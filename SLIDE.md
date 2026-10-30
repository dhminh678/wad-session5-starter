# Your turn

- one brief, three versions
- 60 minutes
- Classroom $\rightarrow$ Session 5 — starter files
- Unzip, node server.mjs (Node 18+, no npm install), open localhost:5050
- brief.md is what the assistant was given
- versions/a.js, b.js, c.js are three answers it produced
- Switch version with the links at the top; switch the server's behaviour with Test conditions
- Start in pairs, hand in alone
- For each version: read it against the brief first and predict — then run every row of Done means
- Write a verdict for each: keep, fix, or reject, the row that decided it, and the one sentence you would tell the assistant
- Ask your own assistant to review the three versions too. Does it find what the rows found?

This is IA#3 — finish it at home, individually. Due Wednesday, November 4, 22:00. Rubric in the Classroom assignment

# Test conditions

| CONDITION | WHAT THE SERVER DOES | WHAT THE BRIEF SAYS THE PAGE MUST DO |
|-----------|-----------------------|-------------------------------------- |
| **normal** | answers at once | 8 cards and the stock values |
| **slow** | answers after 3 s | Loading products..., then the cards |
| **error** | HTTP 500 | Could not load products. and Retry |
| **hang** | does not answer | give up after 5 s: the error and Retry |
| **empty** | answers [] | No products yet. and 0 đ |

DevTools $\rightarrow$ Network $\rightarrow$ throttling Slow 4G and Disable cache — the same idea, from the browser side

Done means

- normal: 8 cards, in the order the API sends them; the status line empty
- normal: the stock value is 12.360.000 đ
- The last card reads Scarf <i>limited</i> — brackets visible, nothing in italics
- slow: Loading products... for about 3 s, then the cards
- error: Could not load products. and Retry, switch to normal, Retry loads the cards
- hang: count to 7 — after about 5 s, the error and Retry, not Loading for half a minute
- Console during rows 1–6: no Uncaught … errors
- VS Code, folder open, // @ts-check as the first line of the version: nothing underlined
- The full table, the empty row and the verdict sheet are in the starter's README.md.

# The verdict sheet

| VERSION | ROWS THAT FAILED | VERDICT | EVIDENCE | WHAT I TELL THE ASSISTANT |
|---------|------------------|---------|----------|--------------------------- |
| a, b, c | (rows here) | keep / fix / reject | bcEvidence is a row number and what you saw — "row 4: still Loading after 20 s" | What I tell the assistant is one precise sentence — the kind your AI-LOG.md needs under Changed |

Two versions may pass every row you ran. Did you run every row?