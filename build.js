#!/usr/bin/env node
/**
 * Clarity Marketing — static site builder.
 *
 * Reads templates/*.html + i18n/{da,en}.json and writes
 * both language versions to disk.
 *
 * Usage:
 *   node build.js
 *   node build.js --watch   (rebuilds on save)
 *
 * Template syntax:
 *   {{key.path}}                     simple lookup against ctx
 *   {{.field}}                       lookup against current item in {{#each}}
 *   {{.}}                            current item itself (string)
 *   {{@index}}                       current loop index
 *   {{#each list}}...{{/each}}       iterate (nestable)
 *   {{#if key}}...{{/if}}            render if truthy (arrays must be non-empty)
 *   {{> partial}}                    include templates/_partial.html
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TEMPLATES = path.join(ROOT, 'templates');
const I18N = path.join(ROOT, 'i18n');
const DIST = path.join(ROOT, 'dist');
const STATIC_FILES = ['styles.css', 'script.js'];
const STATIC_DIRS = ['assets'];

// Sanity CMS — public read API for testimonials (and future content types)
const SANITY = {
  projectId: process.env.SANITY_PROJECT_ID || 'x97ym5fy',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01'
};

const PAGES = [
  { template: 'index',   da: 'index.html',             en: 'en/index.html',         active: 'home' },
  { template: 'service', da: 'service.html',           en: 'en/service.html',       active: 'service' },
  { template: 'contact', da: 'kontakt-os.html',        en: 'en/contact-us.html',    active: 'contact' },
  { template: 'work',    da: 'tidligere-arbejde.html', en: 'en/previous-work.html', active: 'work' }
];

function urlsFor(lang, page) {
  const isEn = lang === 'en';
  const pre = isEn ? '../' : '';
  // Path from current page's location to the other language's equivalent page
  // (strip .html so the URL bar stays clean; Vercel cleanUrls handles routing)
  const stripHtml = (s) => s.replace(/\.html$/, '').replace(/\/index$/, '/');
  const otherPath = isEn
    ? stripHtml(path.relative(path.dirname(page.en), page.da))
    : stripHtml(path.join('en', path.basename(page.en)));
  return {
    home:    isEn ? './'             : './',
    service: isEn ? 'service'        : 'service',
    contact: isEn ? 'contact-us'     : 'kontakt-os',
    work:    isEn ? 'previous-work'  : 'tidligere-arbejde',
    assets:  pre + 'assets/',
    styles:  pre + 'styles.css',
    script:  pre + 'script.js',
    logo:    pre + 'assets/logo.jpg',
    lang_toggle: otherPath
  };
}

function lookup(obj, dotted) {
  if (obj == null || dotted == null) return undefined;
  return String(dotted).split('.').reduce(
    (acc, k) => (acc == null ? acc : acc[k]),
    obj
  );
}

function findMatchingClose(str, startPos, openTagPrefix, closeTag) {
  let depth = 1;
  let i = startPos;
  while (i < str.length && depth > 0) {
    const nextOpen = str.indexOf(openTagPrefix, i);
    const nextClose = str.indexOf(closeTag, i);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + openTagPrefix.length;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      i = nextClose + closeTag.length;
    }
  }
  return -1;
}

function renderVars(str, ctx) {
  // {{.field.path}} -> lookup against current item (ctx.this)
  str = str.replace(/\{\{\s*\.([\w.]+)\s*\}\}/g, (_, key) => {
    const v = lookup(ctx.this, key);
    return v == null ? '' : v;
  });
  // {{.}} -> ctx.this itself
  str = str.replace(/\{\{\s*\.\s*\}\}/g, () => {
    const v = ctx.this;
    return v == null ? '' : v;
  });
  // {{@index}}
  str = str.replace(/\{\{\s*@index\s*\}\}/g, () =>
    String(ctx['@index'] == null ? '' : ctx['@index'])
  );
  // {{key.path}}
  str = str.replace(/\{\{\s*([\w][\w.]*)\s*\}\}/g, (_, key) => {
    const v = lookup(ctx, key);
    return v == null ? '' : v;
  });
  return str;
}

function render(tpl, ctx) {
  // 1. Expand partials — loop until stable so partials can include partials
  const partialRe = /\{\{>\s*([\w-]+)\s*\}\}/g;
  for (let pass = 0; pass < 8 && partialRe.test(tpl); pass++) {
    tpl = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
      const p = path.join(TEMPLATES, `_${name}.html`);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
    });
  }

  // 2. Process blocks with proper nesting
  const eachRe = /\{\{#each\s+(\.?[\w.]+)\s*\}\}/g;
  const ifRe = /\{\{#if\s+(\.?[\w.]+)\s*\}\}/g;

  let out = '';
  let i = 0;
  while (i < tpl.length) {
    eachRe.lastIndex = i;
    ifRe.lastIndex = i;
    const eachM = eachRe.exec(tpl);
    const ifM = ifRe.exec(tpl);

    let m = null, kind = null;
    if (eachM && (!ifM || eachM.index <= ifM.index)) {
      m = eachM; kind = 'each';
    } else if (ifM) {
      m = ifM; kind = 'if';
    }

    if (!m) {
      out += renderVars(tpl.slice(i), ctx);
      break;
    }

    // Render preceding text
    out += renderVars(tpl.slice(i, m.index), ctx);

    const key = m[1];
    const openTag = kind === 'each' ? '{{#each ' : '{{#if ';
    const closeTag = kind === 'each' ? '{{/each}}' : '{{/if}}';
    const innerStart = m.index + m[0].length;
    const closePos = findMatchingClose(tpl, innerStart, openTag, closeTag);
    if (closePos === -1) {
      // malformed; emit rest verbatim
      out += tpl.slice(m.index);
      break;
    }
    const inner = tpl.slice(innerStart, closePos);

    // Resolve key — dot prefix means "from current item"
    let val;
    if (key.startsWith('.')) {
      val = lookup(ctx.this, key.slice(1));
    } else {
      val = lookup(ctx, key);
    }

    if (kind === 'each') {
      if (Array.isArray(val)) {
        for (let idx = 0; idx < val.length; idx++) {
          const itemCtx = { ...ctx, this: val[idx], '@index': idx };
          out += render(inner, itemCtx);
        }
      }
    } else {
      const truthy = Array.isArray(val) ? val.length > 0 : !!val;
      if (truthy) out += render(inner, ctx);
    }

    i = closePos + closeTag.length;
  }

  return out;
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  }
}

async function fetchSanity(query) {
  const url = `https://${SANITY.projectId}.apicdn.sanity.io/v${SANITY.apiVersion}/data/query/${SANITY.dataset}?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`! Sanity fetch ${res.status}: ${res.statusText}`);
      return [];
    }
    const json = await res.json();
    return json.result || [];
  } catch (e) {
    console.warn(`! Sanity fetch error: ${e.message}`);
    return [];
  }
}

function applyTestimonials(t, lang, docs) {
  if (!docs.length) return t; // keep static fallback if Sanity is empty
  const featured = docs.filter((d) => d.featured !== false);
  const mapped = featured.map((d) => ({
    quote: lang === 'en' ? (d.quoteEn || d.quoteDa) : d.quoteDa,
    name: d.name,
    role: lang === 'en' ? (d.roleEn || d.roleDa || '') : (d.roleDa || '')
  }));
  return { ...t, home: { ...t.home, testimonials: mapped } };
}

async function buildOnce() {
  const da = JSON.parse(fs.readFileSync(path.join(I18N, 'da.json'), 'utf-8'));
  const en = JSON.parse(fs.readFileSync(path.join(I18N, 'en.json'), 'utf-8'));

  // Pull editable content from Sanity (testimonials for now; more types later)
  const testimonials = await fetchSanity(
    `*[_type == "testimonial"] | order(order asc, _createdAt asc) {
      _id, name, roleDa, roleEn, quoteDa, quoteEn, featured, order
    }`
  );
  console.log(`✓ Sanity: ${testimonials.length} testimonial(s)`);

  // Wipe + recreate dist/
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // Copy static files
  for (const f of STATIC_FILES) {
    fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
  }
  for (const d of STATIC_DIRS) {
    const src = path.join(ROOT, d);
    if (fs.existsSync(src)) copyDirSync(src, path.join(DIST, d));
  }

  let count = 0;
  for (const page of PAGES) {
    const tplPath = path.join(TEMPLATES, `${page.template}.html`);
    if (!fs.existsSync(tplPath)) {
      console.warn(`! missing template: ${tplPath}`);
      continue;
    }
    const tpl = fs.readFileSync(tplPath, 'utf-8');

    for (const lang of ['da', 'en']) {
      let t = lang === 'da' ? da : en;
      t = applyTestimonials(t, lang, testimonials);
      const url = urlsFor(lang, page);
      const active = {
        home:    page.active === 'home'    ? 'active' : '',
        service: page.active === 'service' ? 'active' : '',
        contact: page.active === 'contact' ? 'active' : '',
        work:    page.active === 'work'    ? 'active' : ''
      };
      const html = render(tpl, { t, url, active, lang });

      const out = path.join(DIST, lang === 'da' ? page.da : page.en);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
      console.log(`✓ ${path.relative(ROOT, out)}`);
      count++;
    }
  }
  console.log(`\nBuilt ${count} pages.`);
}

function watch() {
  buildOnce().catch((e) => console.error(e));
  console.log('\nWatching templates/ and i18n/ ... (Ctrl+C to stop)');
  let pending = false;
  const trigger = () => {
    if (pending) return;
    pending = true;
    setTimeout(async () => {
      pending = false;
      console.log('\n--- rebuild ---');
      try { await buildOnce(); } catch (e) { console.error(e); }
    }, 80);
  };
  fs.watch(TEMPLATES, { recursive: true }, trigger);
  fs.watch(I18N, { recursive: true }, trigger);
}

if (process.argv.includes('--watch')) {
  watch();
} else {
  buildOnce().catch((e) => { console.error(e); process.exit(1); });
}
