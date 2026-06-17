# Playwright Accessibility Check — Focus Visible (WCAG 2.4.7)

A keyboard-accessibility test written in Playwright. It Tabs through a homepage
and flags any link that has **no visible focus indicator** — i.e. you can't tell
where you are when navigating by keyboard. This is [WCAG 2.4.7 "Focus
Visible"](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html).

> ⚠️ **This test is _expected to fail_ against `gohome.io`.**
> The failure **is** the result — it's catching a real accessibility bug: the
> homepage links don't change style when focused by keyboard. Point the same
> test at an accessible site and it passes. The screenshots in
> [`a11y-proof/`](./a11y-proof) are the visual evidence (FOCUSED vs UNFOCUSED).

## How it works

1. Open the homepage (`baseURL` is set in `playwright.config.js`).
2. Capture each link's **unfocused** style up front, before any focus moves —
   a clean baseline that never mutates the live page.
3. Tab through the page; for each link, compare its **focused** style to that
   baseline. A real focus indicator means the style changes
   (outline, outline colour, box-shadow, background, or border).
4. Fail loudly if no links were reached (so the test can't pass on zero
   evidence), then assert every link changed style on focus.

## Run it

```bash
npm install
npx playwright install   # downloads the browser binaries (one-time)
npm test                 # or: npx playwright test accessibility-focus
```

On failure, Playwright saves a screenshot under `test-results/`, and the
console lists exactly which links are missing a focus indicator.

## Scope / honest limitations

- Checks `<a>` links only; a fuller version would cover buttons, inputs, and
  any `tabindex` element (2.4.7 applies to all focusable elements).
- Compares whether the focus style *changes*, not whether the change meets the
  contrast/visibility thresholds in WCAG.
- Single browser (Chromium) for a fast, simple check.
