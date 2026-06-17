// tests/accessibility-focus.spec.js
//
// Simple keyboard accessibility check (WCAG 2.4.7 "Focus Visible").
//
// What it does: presses Tab through the homepage and, for each link, compares
// its style WHEN FOCUSED vs WHEN NOT FOCUSED. A real focus indicator means the
// outline or shadow CHANGES when the link is selected by keyboard, so a user can
// see where they are. On gohome.io the links don't change, so this test FAILS
// and lists them - which is the test correctly catching a real accessibility bug.
//
// Note: this is a quick first-pass check. It compares outline/shadow on focus;
// it does not check colour contrast or judge how visible the change is.

const { test, expect } = require('@playwright/test');

// Site-specific knobs. To retarget at another site, change baseURL in
// playwright.config.js and adjust these to match it.
const HOME_HEADING = /home/i;                  // heading proving the homepage rendered
const COOKIE_ACCEPT_LABELS = ['Accepteren', 'Accept', 'Akkoord', 'Alles accepteren'];
const MAX_TAB_STOPS = 60;                      // how far to Tab before giving up

test('homepage links should show a visible focus indicator', async ({ page }) => {
  // Arrange: open the homepage and wait for it to render.
  // baseURL is set in playwright.config.js, so '/' resolves to https://gohome.io.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: HOME_HEADING }).first()).toBeVisible();

  // Dismiss a cookie banner if one appears, so it can't trap our Tab presses
  // and stop us ever reaching the real page links.
  for (const label of COOKIE_ACCEPT_LABELS) {
    const btn = page.getByRole('button', { name: label });
    if (await btn.count()) {
      try { await btn.first().click({ timeout: 1500 }); } catch {}
      break;
    }
  }

  // Capture each link's UNFOCUSED style up front, before any Tab moves focus.
  // Nothing is focused at page load, so this is a clean baseline - and it means
  // we never have to blur the live element later (which would fire the site's
  // real focus/blur listeners on every check). We stash the fingerprint on each
  // element and expose the fingerprint helper so the focused read reuses it.
  await page.evaluate(() => {
    window.__focusFingerprint = (el) => {
      const s = getComputedStyle(el);
      // Common focus styles: outline (incl. a colour-only change), shadow,
      // background, and border.
      return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow,
              s.backgroundColor, s.borderColor].join('|');
    };
    document.querySelectorAll('a').forEach((el) => {
      el.dataset.a11yBaseline = window.__focusFingerprint(el);
    });
  });

  const linksMissingFocusStyle = new Set();
  let linksChecked = 0;

  // Act: Tab through the page and check each link we land on.
  for (let i = 0; i < MAX_TAB_STOPS; i++) {
    await page.keyboard.press('Tab');

    const link = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el.tagName !== 'A') return null;     // only check links
      const baseline = el.dataset.a11yBaseline;
      if (baseline === undefined) return null;        // link added after load - can't judge it

      const focused = window.__focusFingerprint(el);  // style while keyboard-focused
      return {
        name: (el.innerText || el.getAttribute('href') || '').trim(),
        changed: focused !== baseline,                // a real focus indicator = the style changes
      };
    });

    if (link) {
      linksChecked++;
      if (!link.changed) linksMissingFocusStyle.add(link.name);
    }
  }

  console.log('Links checked            :', linksChecked);
  console.log('Links with no focus style:', [...linksMissingFocusStyle]);

  // Guard: if we never reached any links, the test proved nothing - fail loudly
  // rather than passing silently on zero evidence.
  expect(linksChecked, 'no links were reached - the test checked nothing').toBeGreaterThan(0);

  // Assert: every link should change style on focus, so this list should be empty.
  expect([...linksMissingFocusStyle]).toEqual([]);
});
