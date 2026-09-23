/**
 * Functional browser checks against the built site in dist/.
 *
 * Covers the behaviour the handoff calls out: mobile navigation (keyboard, Esc,
 * focus return), same-route language switching, ProjectFlow progression, pause
 * and reduced motion, product filtering, proposal form validation and failure
 * states, the logo hover interaction, the once-per-session proposal loader,
 * product card sizing and screenshots, and that the pages still work with
 * JavaScript disabled.
 *
 * Run: npm run build && npm run test:browser
 */
import { launch, serveDist } from './browser-lib.mjs';

const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` :: ${detail}` : ''}`);
};

const server = await serveDist(4322);
const browser = await launch();

try {
  // ---------- mobile navigation ----------
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${server.origin}/`);
    const toggle = page.locator('.menu__toggle');
    record('mobile menu toggle is visible at 390px', await toggle.isVisible());

    await page.keyboard.press('Tab'); // skip link
    await toggle.click();
    await page.waitForTimeout(150);
    const panelVisible = await page.locator('.menu__panel').isVisible();
    const focusInPanel = await page.evaluate(
      () => !!document.activeElement?.closest('.menu__panel'),
    );
    record('menu opens and moves focus into the panel', panelVisible && focusInPanel);

    const minTap = await page.evaluate(() => {
      const box = document.querySelector('.menu__toggle')?.getBoundingClientRect();
      return box ? Math.min(box.width, box.height) : 0;
    });
    record('menu toggle hit area is at least 44px', minTap >= 44, `${minTap}px`);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const closed = !(await page.locator('.menu__panel').isVisible());
    const focusBack = await page.evaluate(
      () => document.activeElement?.classList.contains('menu__toggle') ?? false,
    );
    record('Esc closes the menu and returns focus to the toggle', closed && focusBack);

    // Tab containment while open.
    await toggle.click();
    await page.waitForTimeout(100);
    const reachable = await page.evaluate(() => {
      const panel = document.querySelector('.menu__panel');
      return panel ? panel.querySelectorAll('a[href], button').length : 0;
    });
    record('menu panel exposes its links and CTA', reachable >= 6, `${reachable} controls`);
    // The panel is position:fixed and must cover the viewport below the header.
    // It collapsed to its own padding when an ancestor established a containing
    // block for fixed descendants, which clipped every link but the first.
    const coverage = await page.evaluate(() => {
      const panel = document.querySelector('.menu__panel');
      const header = document.querySelector('.nav');
      const box = panel.getBoundingClientRect();
      const headerBox = header.getBoundingClientRect();
      const links = Array.from(panel.querySelectorAll('a, button'));
      const last = links[links.length - 1]?.getBoundingClientRect();
      return {
        panelHeight: Math.round(box.height),
        expected: Math.round(window.innerHeight - headerBox.height),
        lastControlInsidePanel: !!last && last.bottom <= box.bottom + 1,
        opaque: getComputedStyle(panel).backgroundColor,
      };
    });
    record(
      'menu panel fills the viewport below the header',
      Math.abs(coverage.panelHeight - coverage.expected) <= 2,
      `${coverage.panelHeight}px of ${coverage.expected}px`,
    );
    record(
      'every menu control fits inside the panel rather than being clipped',
      coverage.lastControlInsidePanel,
    );
    record(
      'menu panel is opaque so the page cannot show through it',
      /rgb\(/.test(coverage.opaque) && !/rgba\([^)]*,\s*0(\.\d+)?\)/.test(coverage.opaque),
      coverage.opaque,
    );

    await page.close();
  }

  // ---------- language switching, same route ----------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const routes = ['/services', '/process', '/products', '/about', '/blog', '/contact', '/privacy'];
    let ok = true;
    let detail = '';
    for (const route of routes) {
      await page.goto(`${server.origin}${route}`);
      const href = await page.locator('.nav__lang').getAttribute('href');
      if (href !== `/pt${route}`) {
        ok = false;
        detail += `${route}->${href} `;
      }
      await page.goto(`${server.origin}/pt${route}`);
      const back = await page.locator('.nav__lang').getAttribute('href');
      if (back !== route) {
        ok = false;
        detail += `/pt${route}->${back} `;
      }
    }
    record('language switch links to the equivalent route in both directions', ok, detail);

    await page.goto(`${server.origin}/pt`);
    const ptHome = await page.locator('.nav__lang').getAttribute('href');
    record('PT home switches to EN home', ptHome === '/', String(ptHome));
    await page.close();
  }

  // ---------- browser language: PT visitors land on PT ----------
  {
    const goto = async (context, url) => {
      const page = await context.newPage();
      await page.goto(`${server.origin}${url}`);
      await page.waitForLoadState('load');
      const finalUrl = new URL(page.url());
      const where = `${finalUrl.pathname}${finalUrl.hash}`;
      await page.close();
      return where;
    };

    const ptPT = await browser.newContext({ locale: 'pt-PT', viewport: { width: 1440, height: 900 } });
    record('a pt-PT browser opening / is sent to /pt', (await goto(ptPT, '/')) === '/pt');
    record(
      'a pt-PT browser keeps the route and hash when redirected',
      (await goto(ptPT, '/services#custom-software')) === '/pt/services#custom-software',
    );
    record('a pt-PT browser opening /pt stays on /pt', (await goto(ptPT, '/pt')) === '/pt');
    record('a pt-PT browser is not redirected away from the 404 page', (await goto(ptPT, '/404.html')) === '/404.html');

    // Choosing EN with the language switch is remembered; choosing PT again undoes it.
    const page = await ptPT.newPage();
    await page.goto(`${server.origin}/pt/about`);
    await page.locator('.nav__lang').click();
    await page.waitForLoadState('load');
    const afterSwitch = new URL(page.url()).pathname;
    await page.close();
    record('switching to EN from a PT page lands on the EN page', afterSwitch === '/about', afterSwitch);
    record('after choosing EN, a pt-PT browser stays on EN pages', (await goto(ptPT, '/')) === '/');
    const back = await ptPT.newPage();
    await back.goto(`${server.origin}/about`);
    await back.locator('.nav__lang').click();
    await back.waitForLoadState('load');
    await back.close();
    record('choosing PT again restores the redirect', (await goto(ptPT, '/')) === '/pt');
    await ptPT.close();

    const ptBR = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 900 } });
    record('a pt-BR browser opening /process is sent to /pt/process', (await goto(ptBR, '/process')) === '/pt/process');
    await ptBR.close();

    const enGB = await browser.newContext({ locale: 'en-GB', viewport: { width: 1440, height: 900 } });
    record('an en-GB browser opening / stays on /', (await goto(enGB, '/')) === '/');
    record('an en-GB browser opening /pt stays on /pt', (await goto(enGB, '/pt')) === '/pt');
    await enGB.close();

    const noJs = await browser.newContext({ locale: 'pt-PT', javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    record('without JavaScript, a pt-PT browser gets the EN page it asked for', (await goto(noJs, '/')) === '/');
    await noJs.close();
  }

  // Image decoding must not change the loop length, even while paused midway.
  for (const route of ['/', '/pt']) {
    for (const width of [1440, 1024, 768, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      let releaseImages;
      const imagesReady = new Promise((resolve) => { releaseImages = resolve; });
      await page.route('**/*.webp', async (request) => {
        await imagesReady;
        await request.continue();
      });
      await page.goto(`${server.origin}${route}`, { waitUntil: 'domcontentloaded' });
      await page.locator('.logos').scrollIntoViewIfNeeded();
      await page.locator('.logos__label').hover();
      await page.evaluate(() => {
        document.querySelector('.logos__track').getAnimations()[0].currentTime = 30000;
      });
      const geometry = () => page.evaluate(() => {
        const track = document.querySelector('.logos__track');
        return [track.getBoundingClientRect().width,
          ...Array.from(track.querySelectorAll('li'), (item) => item.getBoundingClientRect().x)];
      });
      const before = await geometry();
      // Lazy logos scrolled off the side of the strip may never load, and
      // decode() on them would wait forever. Force every copy to load, which is
      // also the worst case for the loop length changing under the pointer.
      await page.evaluate(() => {
        document.querySelectorAll('.logos__item img').forEach((img) => { img.loading = 'eager'; });
      });
      releaseImages();
      await page.evaluate(() => Promise.all(Array.from(
        document.querySelectorAll('.logos__item img'), (img) => img.decode(),
      )));
      const after = await geometry();
      const viewport = await page.locator('.logos__viewport').boundingBox();
      await page.mouse.click(width / 2, viewport.y + viewport.height / 2);
      const clicked = await geometry();
      const drift = Math.max(...before.map((value, i) => Math.max(
        Math.abs(value - after[i]), Math.abs(value - clicked[i]),
      )));
      record(`logo positions survive delayed loading, hover and click: ${route} at ${width}px`,
        drift < 1, `${drift.toFixed(3)}px maximum drift`);
      await page.close();
    }
  }

  // ---------- company logo strip ----------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${server.origin}/`);
    await page.locator('.logos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const row = await page.evaluate(() => {
      const section = document.querySelector('.logos');
      if (!section) return null;
      const hero = document.querySelector('.hero');
      const sets = Array.from(section.querySelectorAll('.logos__set'));
      const first = Array.from(sets[0]?.querySelectorAll('img') ?? []);
      const rest = sets.slice(1);
      const all = Array.from(section.querySelectorAll('img'));
      const track = section.querySelector('.logos__track');
      return {
        afterHero: !!hero && (hero.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
        firstCount: first.length,
        firstNamed: first.filter((img) => (img.getAttribute('alt') ?? '').trim().length > 0).length,
        // Repeats far off to the side stay lazy until the strip brings them
        // near; what matters is that they already hold their width.
        firstLoaded: first.filter((img) => img.naturalWidth > 0).length,
        reserved: all.filter((img) => img.getBoundingClientRect().width > 0).length,
        total: all.length,
        repeatsHidden: rest.length > 0 && rest.every((set) => set.getAttribute('aria-hidden') === 'true'),
        trackWidth: track.scrollWidth,
        viewportWidth: section.querySelector('.logos__viewport').clientWidth,
        label: section.querySelector('.logos__label')?.textContent?.trim() ?? '',
      };
    });

    record('logo strip renders directly after the hero', !!row?.afterHero);
    record(
      'the first set names and loads every company, and every copy reserves its space',
      !!row && row.firstCount >= 4 && row.firstNamed === row.firstCount
        && row.firstLoaded === row.firstCount && row.reserved === row.total,
      row ? `${row.firstNamed}/${row.firstCount} named, ${row.firstLoaded}/${row.firstCount} loaded, ${row.reserved}/${row.total} sized` : 'no row',
    );
    record('repeated copies are hidden from assistive technology', !!row?.repeatsHidden);
    record(
      'the track is wide enough that the loop cannot show a gap',
      !!row && row.trackWidth >= row.viewportWidth * 2,
      row ? `${row.trackWidth}px track, ${row.viewportWidth}px viewport` : '',
    );
    record('the strip carries its label', !!row && row.label.length > 0, row?.label ?? '');

    const offset = () =>
      page.evaluate(
        () => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.logos__track')).transform).m41,
      );
    const start = await offset();
    await page.waitForTimeout(1200);
    const later = await offset();
    record('the strip scrolls to the left on its own', start - later > 5, `${Math.round(start - later)}px in 1.2s`);

    // Hovering the label is still hovering the section. The current frame
    // should stay put, then continue from that frame when the pointer leaves.
    await page.mouse.move(5, 5);
    const beforeHover = await offset();
    await page.locator('.logos__label').hover();
    const atHover = await offset();
    await page.waitForTimeout(500);
    const heldOnHover = await offset();
    record(
      'hovering the Trusted by section holds the current logo position',
      Math.abs(atHover - beforeHover) < 3 && Math.abs(heldOnHover - atHover) < 1,
      `${Math.round(beforeHover)}px to ${Math.round(atHover)}px to ${Math.round(heldOnHover)}px`,
    );
    await page.mouse.move(5, 5);
    await page.waitForTimeout(500);
    const afterHover = await offset();
    record('leaving the section resumes from the held position', heldOnHover - afterHover > 5);

    // WCAG 2.2.2: the pause control is reachable and actually stops it.
    const pause = page.locator('[data-marquee-pause]');
    await pause.focus();
    const visibleWhenFocused = (await pause.boundingBox())?.width ?? 0;
    await pause.click();
    const pressed = await pause.getAttribute('aria-pressed');
    const pausedAt = await offset();
    await page.waitForTimeout(1000);
    const stillPaused = await offset();
    record(
      'the pause control appears on focus and stops the strip',
      visibleWhenFocused > 20 && pressed === 'true' && Math.abs(pausedAt - stillPaused) < 1,
      `${Math.round(visibleWhenFocused)}px wide when focused`,
    );
    await pause.click();
    await page.waitForTimeout(600);
    const resumed = await offset();
    record('pressing it again resumes the strip', Math.abs(resumed - stillPaused) > 1);
    await page.close();

    const ptPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await ptPage.goto(`${server.origin}/pt`);
    const ptLabel = await ptPage.locator('.logos__label').innerText();
    record('logo strip label is localised', /CONFIAM/i.test(ptLabel), ptLabel);
    await ptPage.close();

    const reduced = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const rp = await reduced.newPage();
    await rp.goto(`${server.origin}/`);
    await rp.locator('.logos').scrollIntoViewIfNeeded();
    await rp.waitForTimeout(400);
    const reducedState = await rp.evaluate(() => ({
      animation: getComputedStyle(document.querySelector('.logos__track')).animationName,
      pauseHidden: document.querySelector('[data-marquee-pause]').hasAttribute('hidden'),
      logosVisible: document.querySelector('.logos__item img').getBoundingClientRect().width > 0,
    }));
    record(
      'under reduced motion the strip is static and still readable',
      reducedState.animation === 'none' && reducedState.pauseHidden && reducedState.logosVisible,
      JSON.stringify(reducedState),
    );
    await rp.close();
    await reduced.close();
  }

  // ---------- ProjectFlow ----------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${server.origin}/`);
    await page.waitForTimeout(200);
    const first = await page.locator('[data-flow-counter]').innerText();
    await page.waitForTimeout(2100);
    const second = await page.locator('[data-flow-counter]').innerText();
    record('ProjectFlow advances on its own', first !== second, `${first} then ${second}`);

    const pause = page.locator('[data-flow-pause]');
    // The control is deliberately not visible on the page: it carries no visual
    // weight until someone tabs to it, then it appears so it can be operated.
    const restingBox = await pause.boundingBox();
    await pause.focus();
    const focusedBox = await pause.boundingBox();
    record(
      'ProjectFlow pause control is out of sight until focused, then visible',
      (restingBox?.width ?? 0) <= 2 && (focusedBox?.width ?? 0) > 20,
      `${Math.round(restingBox?.width ?? 0)}px at rest, ${Math.round(focusedBox?.width ?? 0)}px focused`,
    );
    record(
      'ProjectFlow pause control stays in the tab order',
      (await pause.getAttribute('hidden')) === null &&
        (await page.evaluate(() => document.activeElement?.hasAttribute('data-flow-pause') ?? false)),
    );
    await pause.click();
    const pressed = await pause.getAttribute('aria-pressed');
    const pausedCounter = await page.locator('[data-flow-counter]').innerText();
    await page.waitForTimeout(2100);
    const stillPaused = await page.locator('[data-flow-counter]').innerText();
    record(
      'pause stops the sequence and shows every step complete',
      pressed === 'true' && pausedCounter === stillPaused && pausedCounter.trim() === '04 / 04',
      pausedCounter,
    );
    await page.close();
  }

  // ---------- reduced motion ----------
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    await page.goto(`${server.origin}/`);
    await page.waitForTimeout(600);
    const counter = (await page.locator('[data-flow-counter]').innerText()).trim();
    const done = await page.locator('.flow__step.is-done').count();
    const active = await page.locator('.flow__step.is-active').count();
    const pauseHidden = await page.locator('[data-flow-pause]').isHidden();
    await page.waitForTimeout(2000);
    const after = (await page.locator('[data-flow-counter]').innerText()).trim();
    record(
      'reduced motion shows all four steps complete and does not animate',
      counter === '04 / 04' && after === counter && done === 4 && active === 0 && pauseHidden,
      `${counter}, done=${done}, active=${active}`,
    );

    const transition = await page.evaluate(() => {
      const dot = document.querySelector('.flow__dot');
      return dot ? getComputedStyle(dot).transitionDuration : '';
    });
    const transitionSeconds = Number.parseFloat(transition);
    record('reduced motion collapses transitions', transitionSeconds <= 0.01, transition);
    await page.close();
  }

  // ---------- logo hover ----------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${server.origin}/`);
    const before = await page.evaluate(
      () => getComputedStyle(document.querySelector('.nav__logo .lockup__mark')).transform,
    );
    await page.locator('.nav__brand').hover();
    await page.waitForTimeout(900);
    const after = await page.evaluate(
      () => getComputedStyle(document.querySelector('.nav__logo .lockup__mark')).transform,
    );
    record('logo mark rotates on hover', before !== after, `${before} then ${after}`);

    const reduced = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    await reduced.goto(`${server.origin}/`);
    await reduced.locator('.nav__brand').hover();
    await reduced.waitForTimeout(700);
    const reducedTransform = await reduced.evaluate(
      () => getComputedStyle(document.querySelector('.nav__logo .lockup__mark')).transform,
    );
    record(
      'logo hover rotation is off under reduced motion',
      reducedTransform === 'none' || reducedTransform === 'matrix(1, 0, 0, 1, 0, 0)',
      reducedTransform,
    );
    await reduced.close();
    await page.close();
  }

  // ---------- product filtering ----------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${server.origin}/products`);
    const total = await page.locator('.catalogue__item').count();
    await page.locator('[data-filter-value="live"]').click();
    const liveVisible = await page.locator('.catalogue__item:not([hidden])').count();
    await page.locator('[data-filter-value="in-development"]').click();
    const devVisible = await page.locator('.catalogue__item:not([hidden])').count();
    await page.locator('[data-filter-value="all"]').click();
    const allVisible = await page.locator('.catalogue__item:not([hidden])').count();
    record(
      'product filter matches the data counts',
      total === 6 && liveVisible === 4 && devVisible === 2 && allVisible === 6,
      `total ${total}, live ${liveVisible}, dev ${devVisible}`,
    );

    const pressed = await page.locator('[data-filter-value="all"]').getAttribute('aria-pressed');
    record('filter state is exposed with aria-pressed', pressed === 'true');
    await page.close();
  }

  // ---------- proposal form ----------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${server.origin}/contact`);

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(150);
    const summary = await page.locator('[data-form-summary]').innerText();
    const nameError = await page.locator('[data-error-for="name"]').innerText();
    const invalid = await page.locator('input[name="name"]').getAttribute('aria-invalid');
    record(
      'empty submit reports field errors without sending',
      summary.length > 0 && nameError.length > 0 && invalid === 'true',
      nameError,
    );

    await page.fill('input[name="name"]', 'Test Person');
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('textarea[name="message"]', 'We need an internal tool for scheduling.');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(150);
    const emailError = await page.locator('[data-error-for="email"]').innerText();
    record('invalid email is rejected in the browser', emailError.length > 0, emailError);

    // Provider failure: the static preview has no /api/proposal endpoint, so
    // this exercises the real failure path.
    await page.fill('input[name="email"]', 'test@example.com');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(500);
    const failure = await page.locator('[data-form-summary]').innerText();
    const stillThere = await page.locator('input[name="name"]').inputValue();
    const noSuccess = (await page.locator('.form__success').count()) === 0;
    record(
      'delivery failure is reported, input is preserved and no success is faked',
      failure.length > 0 && stillThere === 'Test Person' && noSuccess,
      failure,
    );

    const honeypot = await page.locator('input[name="website"]').count();
    record('form carries a honeypot field', honeypot === 1);

    const labelled = await page.evaluate(() => {
      const fields = Array.from(document.querySelectorAll('form input:not([type=hidden]), form textarea'));
      return fields.every((field) => !!document.querySelector(`label[for="${field.id}"]`));
    });
    record('every form control has an associated label', labelled);
    await page.close();
  }

  // ---------- contact page shows the form on mobile ----------
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${server.origin}/contact`);
    const formVisible = await page.locator('form').first().isVisible();
    const selfLink = await page.locator('.cta__link').count();
    record('contact page shows the actual form at 390px', formVisible && selfLink === 0);

    await page.goto(`${server.origin}/pt/contact`);
    const ptFormVisible = await page.locator('form').first().isVisible();
    record('PT contact page shows the actual form at 390px', ptFormVisible);

    await page.goto(`${server.origin}/`);
    const homeFormHidden = !(await page.locator('.cta__form form').isVisible());
    const homeLink = await page.locator('.cta__link a').getAttribute('href');
    record(
      'home CTA falls back to the contact link on mobile',
      homeFormHidden && homeLink === '/contact',
      String(homeLink),
    );
    await page.close();
  }

  // ---------- no JavaScript ----------
  {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${server.origin}/`);
    const services = await page.locator('.service').count();
    const products = await page.locator('.product').count();
    const steps = await page.locator('.flow__step').count();
    const allDone = await page.locator('.flow__step.is-done').count();
    record(
      'homepage content is complete without JavaScript',
      services === 4 && products === 6 && steps === 4 && allDone === 4,
      `${services} services, ${products} products, ${allDone}/4 flow steps complete`,
    );

    await page.locator('.menu__toggle').click();
    await page.waitForTimeout(100);
    const menuWorks = await page.locator('.menu__panel').isVisible();
    record('mobile menu opens without JavaScript', menuWorks);

    await page.goto(`${server.origin}/products`);
    const visibleProducts = await page.locator('.catalogue__item:not([hidden])').count();
    record('all products are listed without JavaScript', visibleProducts === 6, `${visibleProducts}`);

    await page.goto(`${server.origin}/process`);
    const faq = await page.locator('.faq__item').count();
    await page.locator('.faq__item summary').first().click();
    const opened = await page.locator('.faq__item[open]').count();
    record('FAQ accordion works without JavaScript', faq === 8 && opened === 1, `${faq} questions`);
    await context.close();
  }

  // ---------- responsive layout sanity ----------
  {
    for (const width of [1440, 1024, 768, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const overflow = [];
      for (const route of ['/', '/services', '/process', '/products', '/about', '/contact', '/pt', '/pt/products']) {
        await page.goto(`${server.origin}${route}`);
        // The page must not scroll sideways. documentElement.scrollWidth is not
        // a reliable signal here: the mobile product row is a scroll-snap
        // container, and Chromium counts its content in that figure even though
        // the page itself does not move.
        const result = await page.evaluate(() => {
          window.scrollTo({ left: 9999, top: 0, behavior: 'instant' });
          const scrolled = window.scrollX;
          window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
          return { scrolled, body: document.body.scrollWidth };
        });
        if (result.scrolled > 0 || result.body > width + 1) {
          overflow.push(`${route}: scrollX ${result.scrolled}, body ${result.body}`);
        }
      }
      record(`no horizontal overflow at ${width}px`, overflow.length === 0, overflow.join(' '));
      await page.close();
    }
  }

  // ---------- first-visit proposal loader ----------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${server.origin}/`);

    const started = Date.now();
    await page.locator('.nav__cta').click();
    await page.waitForTimeout(150);
    const shown = (await page.locator('[data-page-loader].is-active').count()) === 1;
    const stillHome = new URL(page.url()).pathname === '/';
    await page.waitForURL('**/contact', { timeout: 5000 });
    const firstClickMs = Date.now() - started;
    record(
      'first proposal click shows the loader, then navigates to /contact',
      shown && stillHome && firstClickMs > 1500,
      `${firstClickMs}ms`,
    );

    // Same session: the loader must not appear again.
    await page.goto(`${server.origin}/`);
    const repeat = Date.now();
    await page.locator('.nav__cta').click();
    await page.waitForURL('**/contact', { timeout: 5000 });
    const repeatMs = Date.now() - repeat;
    record('the loader is shown once per session, not on later clicks', repeatMs < 1000, `${repeatMs}ms`);
    await context.close();

    // A fresh session gets it again.
    const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const freshPage = await fresh.newPage();
    await freshPage.goto(`${server.origin}/`);
    await freshPage.locator('.nav__cta').click();
    await freshPage.waitForTimeout(150);
    const freshShown = (await freshPage.locator('[data-page-loader].is-active').count()) === 1;
    record('a new session sees the loader again', freshShown);
    await fresh.close();

    // Reduced motion skips it entirely: no overlay, no delay.
    const reduced = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const reducedPage = await reduced.newPage();
    await reducedPage.goto(`${server.origin}/`);
    const reducedStart = Date.now();
    await reducedPage.locator('.nav__cta').click();
    await reducedPage.waitForURL('**/contact', { timeout: 5000 });
    const reducedMs = Date.now() - reducedStart;
    const overlayNeverShown = (await reducedPage.locator('[data-page-loader].is-active').count()) === 0;
    record(
      'reduced motion skips the loader and navigates straight away',
      reducedMs < 1000 && overlayNeverShown,
      `${reducedMs}ms`,
    );
    await reduced.close();

    // Without JavaScript the link is still an ordinary anchor.
    const noJs = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      javaScriptEnabled: false,
    });
    const noJsPage = await noJs.newPage();
    await noJsPage.goto(`${server.origin}/`);
    await noJsPage.locator('.nav__cta').click();
    await noJsPage.waitForURL('**/contact', { timeout: 5000 });
    record('proposal link still navigates without JavaScript', noJsPage.url().endsWith('/contact'));
    await noJs.close();
  }

  // ---------- product cards ----------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    await page.goto(`${server.origin}/products`);
    await page.waitForTimeout(300);

    const heights = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.catalogue .product')).map((card) =>
        Math.round(card.getBoundingClientRect().height),
      ),
    );
    record(
      'every product card is the same size',
      heights.length === 6 && new Set(heights).size === 1,
      heights.join(', '),
    );

    const shots = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.catalogue .product__shot')).map((img) => ({
        src: img.getAttribute('src') ?? '',
        alt: img.getAttribute('alt') ?? '',
        loaded: img.naturalWidth > 0,
      })),
    );
    record(
      'every product card shows a real screenshot with alt text',
      shots.length === 6 && shots.every((shot) => shot.loaded && shot.alt.length > 0),
      `${shots.filter((shot) => shot.loaded).length}/6 loaded`,
    );

    await page.goto(`${server.origin}/pt/products`);
    const ptAlt = await page.locator('.catalogue .product__shot').first().getAttribute('alt');
    record('product screenshot alt text is localised', (ptAlt ?? '').startsWith('Captura'), String(ptAlt));
    await page.close();
  }

  // ---------- keyboard focus visibility ----------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${server.origin}/`);
    await page.keyboard.press('Tab');
    const skip = await page.evaluate(() => document.activeElement?.className ?? '');
    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement);
      return `${style.outlineWidth} ${style.outlineStyle}`;
    });
    record('first Tab reaches the skip link with a visible focus ring', skip.includes('skip-link') && /2px solid/.test(outline), outline);
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} browser checks passed`);
if (failed.length > 0) process.exit(1);
