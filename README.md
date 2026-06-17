# Playwright Accessibility Check — Focus Visible (WCAG 2.4.7)

A keyboard-accessibility test written in Playwright. It Tabs through a homepage
and flags any link that has **no visible focus indicator** — i.e. you can't tell
where you are when navigating by keyboard. This is [WCAG 2.4.7 "Focus
Visible"](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html). A
second test runs a broad [axe-core](https://github.com/dequelabs/axe-core) scan
for the rest of the WCAG A/AA rules (see [Two tests](#two-tests-and-why) below).

> ⚠️ **Both tests are _expected to fail_ against `gohome.io`** — that failure
> **is** the result, catching real accessibility bugs (the homepage links don't
> change style on keyboard focus). They are annotated with Playwright's
> [`test.fail()`](https://playwright.dev/docs/api/class-test#test-fail), so the
> suite runs **green** while the bugs exist and turns **red** the day the site is
> fixed (an unexpected pass → drop the annotation) or a check regresses. That
> makes this a *regression tracker*, not a permanently-red build. The screenshots
> in [`a11y-proof/`](./a11y-proof) are the visual evidence (FOCUSED vs UNFOCUSED).

## How it works

1. Open the homepage (`baseURL` is set in `playwright.config.js`).
2. Capture each link's **unfocused** style up front, before any focus moves —
   a clean baseline that never mutates the live page.
3. Tab through the page; for each link, compare its **focused** style to that
   baseline. A real focus indicator means the style changes
   (outline, outline colour, box-shadow, background, or border).
4. Fail loudly if no links were reached (so the test can't pass on zero
   evidence), then assert every link changed style on focus.

## Two tests, and why

| Test | What it checks | Why it exists |
| --- | --- | --- |
| `accessibility-focus.spec.js` | WCAG 2.4.7 focus-visible on links | axe-core does **not** reliably detect a missing focus indicator, so this is hand-rolled to cover the gap. |
| `accessibility-axe.spec.js` | Broad WCAG 2.1 A/AA rules via axe-core | The industry-standard engine for the things it *is* good at — contrast, names/roles, landmarks, alt text. |

The split is deliberate: **axe for breadth, the focus test for the gap axe
leaves.** The axe test attaches its full violations report to the Playwright run
so you can see exactly which rules failed, not just a count.

## Run it

```bash
npm install
npx playwright install   # downloads the browser binaries (one-time)
npm test                 # runs both tests; or target one: npx playwright test focus
npx playwright show-report   # open the HTML report (screenshots + axe results)
```

The HTML report (written to `playwright-report/`) bundles the on-failure
screenshots and the attached axe report. CI runs the same `npm test` on every
push/PR via [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) and uploads
that report as an artifact.

## Scope / honest limitations

- The focus test checks `<a>` links only; a fuller version would cover buttons,
  inputs, and any `tabindex` element (2.4.7 applies to all focusable elements).
- It compares whether the focus style *changes*, not whether the change meets the
  contrast/visibility thresholds in WCAG.
- It reads `getComputedStyle` on the link itself, so a focus indicator drawn via
  a **pseudo-element** (`a:focus::after { … }`) or via **`:focus-within` on an
  ancestor** would not be detected — the test would *falsely fail* on an
  otherwise-accessible site built that way. So "point it at an accessible site
  and it passes" holds for the common case (focus styles on the element), not
  universally; a production version would also fingerprint `::before`/`::after`
  and walk up to a focusable ancestor.
- Single browser (Chromium) for a fast, simple check.
