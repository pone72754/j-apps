/**
 * ============================================================================
 * سكربت البناء التلقائي لموقع J.apps (Static Site & SEO Generator)
 * ============================================================================
 * الاستخدام:
 *   node build.js
 *
 * ماذا يفعل هذا السكربت؟
 * 1. يقرأ الإعدادات من site.config.js والبيانات من data/apps.json.
 * 2. ينظّف ويعيد توليد جميع صفحات التطبيقات المستقلة داخل مجلد apps/[slug].html
 *    مع وسوم SEO و OpenGraph وبيانات JSON-LD (SoftwareApplication).
 * 3. يولّد الصفحة الرئيسية index.html وصفحات الأقسام (games.html, apps.html, store.html, ...)
 *    وصفحة أحدث التطبيقات latest.html وصفحة تواصل contact.html وصفحة 404.html.
 * 4. يحدّث فهرس البحث الفوري assets/js/search-index.js.
 * 5. يولّد sitemap.xml و robots.txt تلقائياً.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./site.config.js');

const ROOT_DIR = __dirname;
const DATA_PATH = path.join(ROOT_DIR, 'data', 'apps.json');
const ADS_PATH = path.join(ROOT_DIR, 'data', 'ads.json');
const APPS_DIR = path.join(ROOT_DIR, 'apps');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SEARCH_INDEX_PATH = path.join(ROOT_DIR, 'assets', 'js', 'search-index.js');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function buildDistFolder() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  ensureDir(DIST_DIR);

  const rootFiles = [
    'index.html',
    'latest.html',
    'contact.html',
    '404.html',
    'sitemap.xml',
    'robots.txt',
    '_headers',
    ...config.categories.map((c) => c.page)
  ];

  for (const file of rootFiles) {
    const src = path.join(ROOT_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST_DIR, file));
    }
  }

  copyRecursive(APPS_DIR, path.join(DIST_DIR, 'apps'));
  copyRecursive(path.join(ROOT_DIR, 'assets'), path.join(DIST_DIR, 'assets'));
  copyRecursive(path.join(ROOT_DIR, 'img'), path.join(DIST_DIR, 'img'));
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanTextForMeta(str, maxLen) {
  const cleaned = String(str || '').replace(/\s+/g, ' ').trim();
  if (!maxLen || cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen - 1).trim() + '…';
}

function isExternalUrl(url) {
  const val = String(url || '').trim();
  return /^(?:https?:)?\/\//i.test(val) || /^data:/i.test(val);
}

function resolveAssetSrc(assetPath, rootPrefix, fallbackRel = 'assets/images/default-icon.svg') {
  const val = String(assetPath || '').trim();
  if (!val) return `${rootPrefix}${fallbackRel}`;
  if (isExternalUrl(val) || val.startsWith('/')) return val;
  return `${rootPrefix}${val.replace(/^\.\//, '')}`;
}

function normalizeUrl(base, relPath) {
  const val = String(relPath || '').trim();
  if (isExternalUrl(val)) return val;
  const cleanBase = String(base || '').replace(/\/+$/, '');
  const cleanRel = val.replace(/^\/+/, '');
  return cleanRel ? `${cleanBase}/${cleanRel}` : `${cleanBase}/`;
}

function loadApps() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed) ? parsed : (parsed.apps || []);

  // Validate required fields and sort newest first
  const valid = list.filter((item) => item && item.slug);
  valid.sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
  return valid;
}

let cachedAdsConfig = null;

function loadAdsConfig() {
  if (cachedAdsConfig) return cachedAdsConfig;
  const fallback = { headCode: '', slots: {} };
  try {
    if (!fs.existsSync(ADS_PATH)) {
      cachedAdsConfig = fallback;
      return cachedAdsConfig;
    }
    const raw = fs.readFileSync(ADS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    cachedAdsConfig = {
      headCode: String(parsed.headCode || '').trim(),
      slots: parsed.slots && typeof parsed.slots === 'object' ? parsed.slots : {}
    };
  } catch (e) {
    cachedAdsConfig = fallback;
  }
  return cachedAdsConfig;
}

function getCategoryMeta(catId) {
  const found = config.categories.find((c) => c.id === catId);
  if (found) return found;
  return {
    id: catId || 'apps',
    page: 'apps.html',
    title_ar: catId || 'تطبيقات',
    title_en: catId || 'Apps',
    nav_ar: catId || 'تطبيقات',
    nav_en: catId || 'Apps',
    description_ar: '',
    description_en: ''
  };
}

function renderEarlyThemeLangScript() {
  return `<script>
(function(){
  try{
    var t=localStorage.getItem('japps_theme');
    if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}
    var l=localStorage.getItem('japps_lang');
    if(l!=='ar'&&l!=='en'){
      var n=(navigator.language||navigator.userLanguage||'en').toLowerCase();
      l=n.indexOf('ar')===0?'ar':'en';
    }
    document.documentElement.lang=l;
    document.documentElement.dir=l==='ar'?'rtl':'ltr';
  }catch(e){}
})();
</script>`;
}

function renderHeader(rootPrefix, activeNav) {
  const navItems = [
    { id: 'home', href: `${rootPrefix}index.html`, i18n: 'navHome', ar: 'الرئيسية', en: 'Home' },
    { id: 'games', href: `${rootPrefix}games.html`, i18n: 'navGames', ar: 'ألعاب', en: 'Games' },
    { id: 'apps', href: `${rootPrefix}apps.html`, i18n: 'navApps', ar: 'تطبيقات', en: 'Apps' },
    { id: 'store', href: `${rootPrefix}store.html`, i18n: 'navStore', ar: 'متجر', en: 'Store' },
    { id: 'contact', href: `${rootPrefix}contact.html`, i18n: 'navContact', ar: 'تواصل', en: 'Contact' }
  ];

  const navLinksHtml = navItems
    .map((item) => {
      const activeClass = activeNav === item.id ? ' active' : '';
      return `      <li>
        <a class="nav-link${activeClass}" href="${item.href}" data-i18n="${item.i18n}">${item.ar}</a>
      </li>`;
    })
    .join('\n');

  return `<div class="brand-top-bar"></div>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand-link" href="${rootPrefix}index.html" aria-label="${escapeHtml(config.siteName)}">
      <div class="brand-logo">
        <img src="${rootPrefix}assets/images/logo.svg" alt="${escapeHtml(config.siteName)} logo" width="40" height="40">
      </div>
      <span class="brand-name">J<span class="brand-dot">.</span>apps</span>
    </a>

    <!-- الترتيب المطلوب في RTL (من اليمين لليسار): بحث ← لغة ← وضع ليلي ← قائمة -->
    <div class="header-controls">
      <div class="header-search">
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input id="site-search-input" class="search-input" type="search" autocomplete="off" placeholder="ابحث عن تطبيق أو لعبة..." aria-label="ابحث عن تطبيق أو لعبة...">
        </div>
        <div id="site-search-results" class="search-results" role="listbox" aria-live="polite"></div>
      </div>

      <button id="lang-toggle-btn" class="icon-btn lang-btn" type="button" title="Switch to English" aria-label="Switch to English">EN</button>

      <button id="theme-toggle-btn" class="icon-btn" type="button" title="تبديل الوضع الليلي والنهاري" aria-label="تبديل الوضع الليلي والنهاري">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="5"></circle>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
        </svg>
      </button>

      <button id="menu-toggle-btn" class="icon-btn icon-btn--menu" type="button" aria-expanded="false" aria-controls="nav-drawer" aria-label="فتح القائمة">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18"></path>
        </svg>
      </button>
    </div>
  </div>
</header>

<div id="nav-backdrop" class="nav-backdrop" aria-hidden="true"></div>
<nav id="nav-drawer" class="nav-drawer" aria-hidden="true" aria-label="Site Navigation">
  <div class="nav-drawer-header">
    <span class="nav-drawer-title" data-i18n="menuTitle">أقسام الموقع</span>
    <button id="nav-close-btn" class="icon-btn" type="button" aria-label="إغلاق القائمة">✕</button>
  </div>
  <ul class="nav-list">
${navLinksHtml}
  </ul>
</nav>`;
}

function renderFooter(rootPrefix) {
  return `<footer class="site-footer">
  <div class="container footer-inner">
    <span data-i18n="footerRights">جميع الحقوق محفوظة © ${escapeHtml(config.siteName)}</span>
    <div class="footer-links">
      <a href="${rootPrefix}index.html" data-i18n="navHome">الرئيسية</a>
      <a href="${rootPrefix}games.html" data-i18n="navGames">ألعاب</a>
      <a href="${rootPrefix}apps.html" data-i18n="navApps">تطبيقات</a>
      <a href="${rootPrefix}store.html" data-i18n="navStore">متجر</a>
      <a href="${rootPrefix}contact.html" data-i18n="navContact">تواصل</a>
    </div>
  </div>
</footer>`;
}

function renderAdSlot(commentTag, extraClass, rootPrefix = './') {
  const ads = loadAdsConfig();
  const slot = (ads.slots && ads.slots[commentTag]) || { mode: 'placeholder' };
  const mode = slot.mode || 'placeholder';

  if (mode === 'hidden') {
    return `<!-- ${commentTag}: hidden -->`;
  }

  const baseCls = extraClass ? `ad-slot ${extraClass}` : 'ad-slot';

  if (mode === 'html' && String(slot.htmlCode || '').trim()) {
    return `<div class="${baseCls} ad-slot--live" role="region" aria-label="Advertisement">
  <!-- ${commentTag} -->
  ${String(slot.htmlCode).trim()}
</div>`;
  }

  if (mode === 'direct_link' && /^https?:\/\//i.test(String(slot.linkUrl || '').trim())) {
    const href = escapeHtml(String(slot.linkUrl).trim());
    const label = escapeHtml(String(slot.linkTitle || 'إعلان مموّل — اضغط هنا').trim() || 'إعلان مموّل — اضغط هنا');
    const imgUrl = String(slot.imageUrl || '').trim();

    if (imgUrl) {
      const resolvedImg = escapeHtml(resolveAssetSrc(imgUrl, rootPrefix));
      return `<div class="${baseCls} ad-slot--live" role="region" aria-label="Advertisement">
  <!-- ${commentTag} -->
  <a class="ad-banner-link" href="${href}" target="_blank" rel="nofollow sponsored noopener noreferrer" aria-label="${label}">
    <img src="${resolvedImg}" alt="${label}" loading="lazy" referrerpolicy="no-referrer">
  </a>
</div>`;
    }

    return `<div class="${baseCls} ad-slot--live" role="region" aria-label="Advertisement">
  <!-- ${commentTag} -->
  <a class="ad-direct-link-box" href="${href}" target="_blank" rel="nofollow sponsored noopener noreferrer">
    <span>${label}</span>
  </a>
</div>`;
  }

  return `<div class="${baseCls}" role="region" aria-label="Advertisement">
  <!-- ${commentTag} -->
  <span data-i18n="adLabel">مساحة إعلانية</span>
</div>`;
}

function renderAppCard(app, rootPrefix) {
  const href = `${rootPrefix}apps/${app.slug}.html`;
  const iconSrc = resolveAssetSrc(app.icon, rootPrefix);
  const fallbackIcon = `${rootPrefix}assets/images/default-icon.svg`;

  return `<a class="app-card" href="${href}">
  <div class="app-card-icon-wrap">
    <img class="app-card-icon" src="${escapeHtml(iconSrc)}" alt="${escapeHtml(app.name_ar)}" loading="lazy" referrerpolicy="no-referrer" width="72" height="72" onerror="this.onerror=null;this.src='${fallbackIcon}';">
  </div>
  <div class="app-card-body">
    <h3 class="app-card-title" data-ar="${escapeHtml(app.name_ar)}" data-en="${escapeHtml(app.name_en)}">${escapeHtml(app.name_ar)}</h3>
    <div class="app-card-badges">
      <span class="meta-badge meta-badge--blue">${escapeHtml(app.size)}</span>
      <span class="meta-badge meta-badge--red">v${escapeHtml(app.version)}</span>
      <span class="meta-badge meta-badge--neutral">${escapeHtml(app.os)}</span>
    </div>
  </div>
</a>`;
}

function renderPageShell({
  rootPrefix,
  activeNav,
  titleAr,
  titleEn,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage = 'assets/images/logo.svg',
  jsonLd = null,
  bodyContent
}) {
  const canonicalUrl = normalizeUrl(config.siteUrl, canonicalPath);
  const fullOgImage = normalizeUrl(config.siteUrl, ogImage);
  const ads = loadAdsConfig();
  const headAdBlock = ads.headCode ? `  ${ads.headCode}\n` : '';
  const jsonLdBlock = jsonLd
    ? `  <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n  </script>\n`
    : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light" data-root="${rootPrefix}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title data-title-ar="${escapeHtml(titleAr)}" data-title-en="${escapeHtml(titleEn)}">${escapeHtml(titleAr)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <!-- OpenGraph -->
  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:site_name" content="${escapeHtml(config.siteName)}">
  <meta property="og:title" content="${escapeHtml(titleAr)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${escapeHtml(fullOgImage)}">
  <meta property="og:locale" content="ar_AR">
  <meta property="og:locale:alternate" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(titleAr)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(fullOgImage)}">

  <link rel="icon" type="image/svg+xml" href="${rootPrefix}assets/images/logo.svg">
  ${renderEarlyThemeLangScript()}
  <link rel="stylesheet" href="${rootPrefix}assets/css/style.css">
${headAdBlock}${jsonLdBlock}</head>
<body>
${renderHeader(rootPrefix, activeNav)}

<main class="main-content">
  <div class="container">
${bodyContent}
  </div>
</main>

${renderFooter(rootPrefix)}

<script src="${rootPrefix}assets/js/search-index.js" defer></script>
<script src="${rootPrefix}assets/js/app.js" defer></script>
</body>
</html>
`;
}

function buildHomePage(apps) {
  const latestApps = apps.slice(0, config.homeLimits.latest);
  const gameApps = apps.filter((a) => a.category === 'games').slice(0, config.homeLimits.games);
  const regularApps = apps
    .filter((a) => ['apps', 'store', 'social'].includes(a.category))
    .slice(0, config.homeLimits.apps);

  const bodyContent = `
    <!-- 1. مربع إعلان رئيسي (1) -->
    ${renderAdSlot('AD_MAIN_1')}

    <!-- 2. قسم آخر التطبيقات المضافة -->
    <section class="section-block" aria-labelledby="sec-latest">
      <div class="section-header">
        <h2 id="sec-latest" class="section-title" data-i18n="latestTitle">آخر التطبيقات المضافة</h2>
        <a class="view-more-btn" href="./latest.html" data-i18n="viewMore">عرض المزيد</a>
      </div>
      <div class="apps-grid">
        ${latestApps.map((app) => renderAppCard(app, './')).join('\n        ')}
      </div>
    </section>

    <!-- 3. قسم الألعاب -->
    <section class="section-block" aria-labelledby="sec-games">
      <div class="section-header">
        <h2 id="sec-games" class="section-title" data-i18n="gamesTitle">الألعاب</h2>
        <a class="view-more-btn" href="./games.html" data-i18n="viewMore">عرض المزيد</a>
      </div>
      <div class="apps-grid">
        ${gameApps.map((app) => renderAppCard(app, './')).join('\n        ')}
      </div>
    </section>

    <!-- 4. مربع إعلان رئيسي (2) -->
    ${renderAdSlot('AD_MAIN_2')}

    <!-- 5. قسم التطبيقات -->
    <section class="section-block" aria-labelledby="sec-apps">
      <div class="section-header">
        <h2 id="sec-apps" class="section-title" data-i18n="appsTitle">التطبيقات</h2>
        <a class="view-more-btn" href="./apps.html" data-i18n="viewMore">عرض المزيد</a>
      </div>
      <div class="apps-grid">
        ${regularApps.map((app) => renderAppCard(app, './')).join('\n        ')}
      </div>
    </section>

    <!-- 6. مربع إعلان رئيسي (3) -->
    ${renderAdSlot('AD_MAIN_3')}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName,
    url: normalizeUrl(config.siteUrl, ''),
    description: config.siteDescriptionAr,
    inLanguage: ['ar', 'en']
  };

  return renderPageShell({
    rootPrefix: './',
    activeNav: 'home',
    titleAr: `${config.siteName} - متجر ودليل تحميل الألعاب والتطبيقات`,
    titleEn: `${config.siteName} - Android Apps & Games Directory`,
    description: config.siteDescriptionAr,
    canonicalPath: '',
    jsonLd,
    bodyContent
  });
}

function buildCategoryPage(category, apps) {
  const allowed = category.includeCategories || [category.id];
  const filtered = apps.filter((a) => allowed.includes(a.category));

  const cardsHtml = filtered.length
    ? filtered.map((app) => renderAppCard(app, './')).join('\n      ')
    : `<p data-i18n="noSimilar">لا توجد تطبيقات أخرى في هذا القسم حالياً.</p>`;

  const bodyContent = `
    <div class="page-banner">
      <h1 data-ar="${escapeHtml(category.title_ar)}" data-en="${escapeHtml(category.title_en)}">${escapeHtml(category.title_ar)}</h1>
      <p data-ar="${escapeHtml(category.description_ar)}" data-en="${escapeHtml(category.description_en)}">${escapeHtml(category.description_ar)}</p>
    </div>

    ${renderAdSlot('AD_MAIN_1')}

    <section class="section-block">
      <div class="apps-grid">
        ${cardsHtml}
      </div>
    </section>

    ${renderAdSlot('AD_MAIN_2')}`;

  return renderPageShell({
    rootPrefix: './',
    activeNav: category.id,
    titleAr: `${category.title_ar} - ${config.siteName}`,
    titleEn: `${category.title_en} - ${config.siteName}`,
    description: category.description_ar || config.siteDescriptionAr,
    canonicalPath: category.page,
    bodyContent
  });
}

function buildLatestPage(apps) {
  const bodyContent = `
    <div class="page-banner">
      <h1 data-i18n="latestTitle">آخر التطبيقات المضافة</h1>
      <p data-ar="تصفح جميع الألعاب والتطبيقات المضافة حديثاً في ${escapeHtml(config.siteName)}." data-en="Browse all recently added games and apps on ${escapeHtml(config.siteName)}.">تصفح جميع الألعاب والتطبيقات المضافة حديثاً في ${escapeHtml(config.siteName)}.</p>
    </div>

    ${renderAdSlot('AD_MAIN_1')}

    <section class="section-block">
      <div class="apps-grid">
        ${apps.map((app) => renderAppCard(app, './')).join('\n        ')}
      </div>
    </section>`;

  return renderPageShell({
    rootPrefix: './',
    activeNav: 'home',
    titleAr: `آخر التطبيقات المضافة - ${config.siteName}`,
    titleEn: `Latest Apps - ${config.siteName}`,
    description: config.siteDescriptionAr,
    canonicalPath: 'latest.html',
    bodyContent
  });
}

function buildContactPage() {
  const bodyContent = `
    <div class="page-banner">
      <h1 data-i18n="contactHeading">تواصل معنا</h1>
      <p data-i18n="contactDesc">للاستفسارات، الإبلاغ عن رابط معطّل، أو طلب إضافة تطبيق جديد يمكنك مراسلتنا عبر القنوات التالية:</p>
    </div>

    <div class="contact-grid">
      <div class="contact-card">
        <h2 data-ar="البريد الإلكتروني" data-en="Email">البريد الإلكتروني</h2>
        <a href="mailto:${escapeHtml(config.contact.email)}">${escapeHtml(config.contact.email)}</a>
      </div>
      <div class="contact-card">
        <h2 data-ar="قناة تيليجرام" data-en="Telegram">قناة تيليجرام</h2>
        <a href="${escapeHtml(config.contact.telegram)}" target="_blank" rel="noopener noreferrer">${escapeHtml(config.contact.telegram)}</a>
      </div>
    </div>`;

  return renderPageShell({
    rootPrefix: './',
    activeNav: 'contact',
    titleAr: `تواصل معنا - ${config.siteName}`,
    titleEn: `Contact - ${config.siteName}`,
    description: 'تواصل مع إدارة متجر J.apps للاستفسارات والدعم الفني.',
    canonicalPath: 'contact.html',
    bodyContent
  });
}

function build404Page() {
  const bodyContent = `
    <div class="page-banner">
      <h1 data-ar="الصفحة غير موجودة (404)" data-en="Page Not Found (404)">الصفحة غير موجودة (404)</h1>
      <p data-ar="عذراً، الرابط الذي طلبته غير متوفر أو تم نقله." data-en="Sorry, the page you requested could not be found.">عذراً، الرابط الذي طلبته غير متوفر أو تم نقله.</p>
    </div>
    <a class="view-more-btn" href="./index.html" data-i18n="navHome">الرئيسية</a>`;

  return renderPageShell({
    rootPrefix: './',
    activeNav: 'home',
    titleAr: `404 - ${config.siteName}`,
    titleEn: `404 - ${config.siteName}`,
    description: config.siteDescriptionAr,
    canonicalPath: '404.html',
    bodyContent
  });
}

function buildAppDetailPage(app, allApps) {
  const rootPrefix = '../';
  const cat = getCategoryMeta(app.category);
  const similarApps = allApps
    .filter((item) => item.category === app.category && item.slug !== app.slug)
    .slice(0, 6);

  const fallbackIcon = `${rootPrefix}assets/images/default-icon.svg`;
  const heroIconSrc = resolveAssetSrc(app.icon, rootPrefix);
  const screenshots = Array.isArray(app.screenshots) ? app.screenshots : [];
  const screenshotsHtml = screenshots.length
    ? screenshots
        .map((shot, idx) => {
          const shotSrc = resolveAssetSrc(shot, rootPrefix);
          return `<button class="screenshot-btn" type="button" data-lightbox-src="${escapeHtml(shotSrc)}" aria-label="${escapeHtml(app.name_ar)} screenshot ${idx + 1}">
          <img class="screenshot-img" src="${escapeHtml(shotSrc)}" alt="${escapeHtml(app.name_ar)} - ${idx + 1}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallbackIcon}';">
        </button>`;
        })
        .join('\n        ')
    : '';

  const similarHtml = similarApps.length
    ? similarApps.map((item) => renderAppCard(item, rootPrefix)).join('\n        ')
    : `<p data-i18n="noSimilar">لا توجد تطبيقات أخرى في هذا القسم حالياً.</p>`;

  const bodyContent = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${rootPrefix}index.html" data-i18n="navHome">الرئيسية</a>
      <span aria-hidden="true">/</span>
      <a href="${rootPrefix}${escapeHtml(cat.page)}" data-ar="${escapeHtml(cat.title_ar)}" data-en="${escapeHtml(cat.title_en)}">${escapeHtml(cat.title_ar)}</a>
      <span aria-hidden="true">/</span>
      <span data-ar="${escapeHtml(app.name_ar)}" data-en="${escapeHtml(app.name_en)}">${escapeHtml(app.name_ar)}</span>
    </nav>

    <!-- 1. القسم العلوي (عمودان: الاسم + AD_POST_1 / الأيقونة) -->
    <section class="app-hero">
      <div class="app-hero-main">
        <h1 class="app-hero-title" data-ar="${escapeHtml(app.name_ar)}" data-en="${escapeHtml(app.name_en)}">${escapeHtml(app.name_ar)}</h1>
        <div class="app-hero-subtitle">
          <span data-ar="${escapeHtml(cat.title_ar)}" data-en="${escapeHtml(cat.title_en)}">${escapeHtml(cat.title_ar)}</span>
          <span>•</span>
          <span>v${escapeHtml(app.version)}</span>
          <span>•</span>
          <span>${escapeHtml(app.size)}</span>
        </div>
        ${renderAdSlot('AD_POST_1', 'ad-slot--compact', rootPrefix)}
      </div>
      <div class="app-hero-icon-box">
        <img src="${escapeHtml(heroIconSrc)}" alt="${escapeHtml(app.name_ar)}" width="132" height="132" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallbackIcon}';">
      </div>
    </section>

    <!-- 2. مربع صور من داخل التطبيق -->
    ${
      screenshotsHtml
        ? `<section class="detail-box" aria-labelledby="sec-screenshots">
      <h2 id="sec-screenshots" class="detail-box-title" data-i18n="screenshotsTitle">صور من داخل التطبيق</h2>
      <div class="screenshots-strip">
        ${screenshotsHtml}
      </div>
    </section>`
        : ''
    }

    <!-- 3. مربع إعلان داخلي (2) يعلو صندوق الوصف مباشرة -->
    ${renderAdSlot('AD_POST_2', '', rootPrefix)}

    <!-- 4. مربع وصف التطبيق -->
    <section class="detail-box" aria-labelledby="sec-desc">
      <h2 id="sec-desc" class="detail-box-title" data-i18n="descriptionTitle">وصف التطبيق</h2>
      <div class="app-description" data-ar="${escapeHtml(app.description_ar)}" data-en="${escapeHtml(app.description_en)}">${escapeHtml(app.description_ar)}</div>
    </section>

    <!-- 5. قسم التحميل والمعلومات (عمودان متجاوران) -->
    <section class="download-info-grid" aria-label="Download and Application Details">
      <div class="download-box">
        <button id="download-cta-btn" class="download-cta-btn" type="button" data-download-url="${escapeHtml(app.download_url)}" data-countdown="${Number(config.downloadCountdownSeconds || 0)}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span data-i18n="downloadBtn">تحميل التطبيق</span>
        </button>
        <div id="download-status" class="download-status" data-i18n="directCloudNote">رابط تحميل خارجي مباشر من التخزين السحابي</div>
        <a id="download-direct-link" class="download-direct-link" href="${escapeHtml(app.download_url)}" target="_blank" rel="noopener noreferrer" hidden data-i18n="downloadBtn">تحميل التطبيق</a>
      </div>

      <div class="info-box">
        <h2 class="detail-box-title" data-i18n="appInfoTitle">معلومات التطبيق</h2>
        <ul class="info-list">
          <li class="info-row">
            <span class="info-label" data-i18n="sizeLabel">الحجم</span>
            <span class="info-value">${escapeHtml(app.size)}</span>
          </li>
          <li class="info-row">
            <span class="info-label" data-i18n="versionLabel">الإصدار</span>
            <span class="info-value">${escapeHtml(app.version)}</span>
          </li>
          <li class="info-row">
            <span class="info-label" data-i18n="osLabel">النظام</span>
            <span class="info-value">${escapeHtml(app.os)}</span>
          </li>
          <li class="info-row">
            <span class="info-label" data-i18n="licenseLabel">الترخيص</span>
            <span class="info-value">${escapeHtml(app.license || 'مجاني')}</span>
          </li>
          <li class="info-row">
            <span class="info-label" data-i18n="categoryLabel">التصنيف</span>
            <span class="info-value">
              <a href="${rootPrefix}${escapeHtml(cat.page)}" data-ar="${escapeHtml(cat.title_ar)}" data-en="${escapeHtml(cat.title_en)}">${escapeHtml(cat.title_ar)}</a>
            </span>
          </li>
          <li class="info-row">
            <span class="info-label" data-i18n="updatedLabel">تاريخ التحديث</span>
            <span class="info-value">${escapeHtml(app.updated_at)}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- 6. مربع إعلان داخلي (3) أسفل قسم التحميل -->
    ${renderAdSlot('AD_POST_3', '', rootPrefix)}

    <!-- 7. قسم تطبيقات مشابهة -->
    <section class="section-block" aria-labelledby="sec-similar">
      <div class="section-header">
        <h2 id="sec-similar" class="section-title" data-i18n="similarTitle">تطبيقات مشابهة</h2>
        <a class="view-more-btn" href="${rootPrefix}${escapeHtml(cat.page)}" data-i18n="viewMore">عرض المزيد</a>
      </div>
      <div class="apps-grid">
        ${similarHtml}
      </div>
    </section>

    <!-- Lightbox Modal لتكبير الصور -->
    <div id="screenshots-lightbox" class="lightbox" aria-hidden="true" role="dialog" aria-label="Screenshot Preview">
      <button id="lightbox-close" class="lightbox-close" type="button" aria-label="Close">✕</button>
      <div class="lightbox-content">
        <img id="lightbox-img" class="lightbox-img" src="" alt="${escapeHtml(app.name_ar)}">
        <div class="lightbox-controls">
          <button id="lightbox-prev" class="lightbox-btn" type="button" data-i18n="lightboxPrev">السابق</button>
          <span id="lightbox-counter" style="color:#f0f6fc;font-weight:700;">1 / 1</span>
          <button id="lightbox-next" class="lightbox-btn" type="button" data-i18n="lightboxNext">التالي</button>
        </div>
      </div>
    </div>`;

  const appPageUrl = normalizeUrl(config.siteUrl, `apps/${app.slug}.html`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name_en || app.name_ar,
    alternateName: app.name_ar,
    operatingSystem: app.os,
    applicationCategory: app.category === 'games' ? 'GameApplication' : 'UtilitiesApplication',
    softwareVersion: app.version,
    fileSize: app.size,
    dateModified: app.updated_at,
    image: normalizeUrl(config.siteUrl, app.icon),
    description: cleanTextForMeta(app.description_ar, 300),
    url: appPageUrl,
    downloadUrl: app.download_url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };

  return renderPageShell({
    rootPrefix,
    activeNav: cat.id,
    titleAr: `تحميل ${app.name_ar} v${app.version} - ${config.siteName}`,
    titleEn: `Download ${app.name_en} v${app.version} - ${config.siteName}`,
    description: cleanTextForMeta(app.description_ar, 155),
    canonicalPath: `apps/${app.slug}.html`,
    ogType: 'article',
    ogImage: app.icon,
    jsonLd,
    bodyContent
  });
}

function buildSitemapXml(apps) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: normalizeUrl(config.siteUrl, ''), lastmod: today, priority: '1.0' },
    { loc: normalizeUrl(config.siteUrl, 'latest.html'), lastmod: today, priority: '0.9' },
    { loc: normalizeUrl(config.siteUrl, 'contact.html'), lastmod: today, priority: '0.5' }
  ];

  for (const cat of config.categories) {
    urls.push({
      loc: normalizeUrl(config.siteUrl, cat.page),
      lastmod: today,
      priority: '0.8'
    });
  }

  for (const app of apps) {
    urls.push({
      loc: normalizeUrl(config.siteUrl, `apps/${app.slug}.html`),
      lastmod: app.updated_at || today,
      priority: '0.9'
    });
  }

  const items = urls
    .map(
      (u) => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <lastmod>${escapeHtml(u.lastmod)}</lastmod>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
}

function buildRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin.html

Sitemap: ${normalizeUrl(config.siteUrl, 'sitemap.xml')}
`;
}

function buildSearchIndex(apps) {
  const slim = apps.map((a) => ({
    slug: a.slug,
    name_ar: a.name_ar,
    name_en: a.name_en,
    category: a.category,
    size: a.size,
    version: a.version,
    os: a.os,
    icon: a.icon
  }));
  return `window.JAPPS_INDEX = ${JSON.stringify(slim)};\n`;
}

function main() {
  const apps = loadApps();
  ensureDir(APPS_DIR);
  ensureDir(path.dirname(SEARCH_INDEX_PATH));

  // Clean previously generated app HTML files so deleted slugs don't linger
  for (const file of fs.readdirSync(APPS_DIR)) {
    if (file.endsWith('.html')) {
      fs.unlinkSync(path.join(APPS_DIR, file));
    }
  }

  // 1. Generate individual app pages
  for (const app of apps) {
    const outPath = path.join(APPS_DIR, `${app.slug}.html`);
    fs.writeFileSync(outPath, buildAppDetailPage(app, apps), 'utf8');
  }

  // 2. Generate index, category, latest, contact, and 404 pages
  fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), buildHomePage(apps), 'utf8');
  for (const cat of config.categories) {
    fs.writeFileSync(path.join(ROOT_DIR, cat.page), buildCategoryPage(cat, apps), 'utf8');
  }
  fs.writeFileSync(path.join(ROOT_DIR, 'latest.html'), buildLatestPage(apps), 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, 'contact.html'), buildContactPage(), 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, '404.html'), build404Page(), 'utf8');

  // 3. Generate search index, sitemap.xml, and robots.txt
  fs.writeFileSync(SEARCH_INDEX_PATH, buildSearchIndex(apps), 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), buildSitemapXml(apps), 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), buildRobotsTxt(), 'utf8');

  // 4. Assemble clean deployment bundle in dist/ (for Cloudflare Workers/Pages & Netlify)
  buildDistFolder();

  console.log(`Built J.apps successfully: ${apps.length} app pages, ${config.categories.length} categories, sitemap.xml, robots.txt, and dist/ bundle.`);
}

main();
