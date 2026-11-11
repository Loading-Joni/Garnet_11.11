// Сборка трёх однофайловых страниц из общего каркаса и персонального контента.
// Источник каркаса: deploy/project/design/home.html, вырезанный в shared/.
// Ассеты инлайнятся как data-URI, поэтому страница открывается без сервера.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DEPLOY = path.resolve(ROOT, '..', '..', '..');
const STATIC = path.join(DEPLOY, 'project/internal/transport/web/static');
const ASSETS = path.join(STATIC, 'landing');
const SHARED = path.join(ROOT, 'shared');
const OUT = path.join(ROOT, 'out');

const MIME = {
  '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon',
};

const read = (p) => fs.readFileSync(p, 'utf8');
const shared = (name) => read(path.join(SHARED, name));
const content = (dir, name) => read(path.join(ROOT, 'content', dir, name));

const PAGES = [
  { key: 'all-on-4', file: 'all-on-4.html', dir: 'all-on-4', panel: 'all', radio: 'dir-all' },
  { key: 'implants', file: 'implants.html', dir: 'implants', panel: 'implant', radio: 'dir-implant' },
  { key: 'veneers', file: 'veneers.html', dir: 'veneers', panel: 'veneer', radio: 'dir-veneer' },
];

// Каркас: порядок блоков одинаковый для всех трёх страниц.
function shell(page) {
  const c = (n) => content(page.dir, n);
  return [
    shared('head.html'),
    shared('top.html'),
    c('nav.html'),
    '<main>',
    c('hero.html'),
    c('fears.html'),
    c('calc.html'),
    c('steps.html'),
    shared('scan-section.html'),
    c('gallery.html'),
    c('brands.html'),
    c('services.html'),
    c('pink.html'),
    shared('doctors.html'),
    shared('trust.html'),
    c('prices.html'),
    c('faq.html'),
    shared('contacts.html'),
    '</main>',
    shared('footer.html'),
    '</body>',
    '</html>',
  ].join('\n');
}

function inlineAssets(html) {
  let count = 0;
  const out = html.replace(/\/static\/landing\/([A-Za-z0-9._-]+)/g, (m, file) => {
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext];
    if (!type) throw new Error('нет mime для ' + file);
    const buf = fs.readFileSync(path.join(ASSETS, file));
    count++;
    return 'data:' + type + ';base64,' + buf.toString('base64');
  });
  return { html: out, count };
}

function buildPage(page) {
  const meta = JSON.parse(content(page.dir, 'meta.json'));
  let html = shell(page);

  html = html.replace(/<title>[^<]*<\/title>/,
    `<title>${meta.title}</title>`);
  html = html.replace('<meta charset="utf-8">',
    `<meta charset="utf-8"><meta name="description" content="${meta.description}">` +
    `<meta property="og:title" content="${meta.title}">` +
    `<meta property="og:description" content="${meta.description}">` +
    `<meta property="og:type" content="website">`);

  // Общие токены в каркасе.
  html = html.replace(/\{\{doctorsSub\}\}/g, meta.doctorsSub);
  html = html.replace(/\{\{formTitle\}\}/g, meta.formTitle);
  html = html.replace(/\{\{formText\}\}/g, meta.formText);
  html = html.replace(/\{\{formButton\}\}/g, meta.formButton);
  html = html.replace(/\{\{contactText\}\}/g, meta.contactText);

  // Панель калькулятора — своя у каждого направления.
  html = html.replace('{{PANEL}}', read(path.join(ROOT, 'panels', page.panel + '.html')));
  html = html.replace('{{IMPLANT_STORY}}', shared('implant-story.html'));

  // Дополнительные стили: общие для трёх страниц и свои для каждой.
  const extra = read(path.join(SHARED, 'extra.css')) + '\n' +
    read(path.join(ROOT, 'content', page.dir, 'extra.css'));
  html = html.replace('</style>', extra + '\n</style>');

  // Скрипты: калькулятор, анимация, приём заявки.
  const landingJs = read(path.join(STATIC, 'landing.js'));
  const motionCss = read(path.join(STATIC, 'landing-motion.css'));
  if (/<\/script/i.test(landingJs)) throw new Error('landing.js содержит </script>');

  const formScript = read(path.join(SHARED, 'form.js'));
  const calcInit = read(path.join(SHARED, 'calc-init.js'));
  html = html.replace('</head>', '<style>' + motionCss + '</style></head>');
  html = html.replace('</body>',
    '<script>' + landingJs + '</script><script>' + calcInit + '</script><script>' + formScript + '</script></body>');

  const inlined = inlineAssets(html);
  fs.mkdirSync(OUT, { recursive: true });
  const dest = path.join(OUT, page.file);
  fs.writeFileSync(dest, inlined.html);
  return { file: page.file, bytes: Buffer.byteLength(inlined.html), assets: inlined.count };
}

const results = PAGES.map(buildPage);
for (const r of results) {
  console.log(r.file.padEnd(16), (r.bytes / 1024 / 1024).toFixed(2) + ' МБ', '| ассетов: ' + r.assets);
}
