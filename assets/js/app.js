/**
 * ============================================================================
 * J.apps Client Script (Theme Toggle, Auto AR/EN & RTL/LTR, Instant Search,
 * Navigation Drawer, Lightbox, and Download Countdown)
 * ============================================================================
 */
(function () {
  'use strict';

  var THEME_KEY = 'japps_theme';
  var LANG_KEY = 'japps_lang';

  var I18N = {
    ar: {
      searchPlaceholder: 'ابحث عن تطبيق أو لعبة...',
      searchEmpty: 'لا توجد نتائج مطابقة.',
      langToggleText: 'EN',
      langToggleTitle: 'Switch to English',
      themeToggleTitle: 'تبديل الوضع الليلي والنهاري',
      menuTitle: 'أقسام الموقع',
      openMenuLabel: 'فتح القائمة',
      closeMenuLabel: 'إغلاق القائمة',
      navHome: 'الرئيسية',
      navGames: 'ألعاب',
      navApps: 'تطبيقات',
      navStore: 'متجر',
      navContact: 'تواصل',
      latestTitle: 'آخر التطبيقات المضافة',
      gamesTitle: 'الألعاب',
      appsTitle: 'التطبيقات',
      similarTitle: 'تطبيقات مشابهة',
      viewMore: 'عرض المزيد',
      screenshotsTitle: 'صور من داخل التطبيق',
      descriptionTitle: 'وصف التطبيق',
      appInfoTitle: 'معلومات التطبيق',
      downloadBtn: 'تحميل التطبيق',
      downloadingWait: 'جاري تجهيز رابط التحميل خلال {sec} ثوانٍ...',
      downloadReady: 'رابط التحميل جاهز! تم فتح صفحة التحميل أو اضغط هنا.',
      directCloudNote: 'رابط تحميل خارجي مباشر من التخزين السحابي',
      sizeLabel: 'الحجم',
      versionLabel: 'الإصدار',
      osLabel: 'النظام',
      licenseLabel: 'الترخيص',
      categoryLabel: 'التصنيف',
      updatedLabel: 'تاريخ التحديث',
      adLabel: 'مساحة إعلانية',
      cat_games: 'الألعاب',
      cat_apps: 'التطبيقات',
      cat_store: 'متجر',
      cat_social: 'التواصل الاجتماعي',
      noSimilar: 'لا توجد تطبيقات أخرى في هذا القسم حالياً.',
      browseAll: 'تصفح جميع التطبيقات',
      footerRights: 'جميع الحقوق محفوظة © J.apps',
      lightboxPrev: 'السابق',
      lightboxNext: 'التالي',
      contactHeading: 'تواصل معنا',
      contactDesc: 'للاستفسارات، الإبلاغ عن رابط معطّل، أو طلب إضافة تطبيق جديد يمكنك مراسلتنا عبر القنوات التالية:'
    },
    en: {
      searchPlaceholder: 'Search apps or games...',
      searchEmpty: 'No matching apps or games found.',
      langToggleText: 'عربي',
      langToggleTitle: 'التبديل إلى العربية',
      themeToggleTitle: 'Toggle Light / Dark Mode',
      menuTitle: 'Site Sections',
      openMenuLabel: 'Open Menu',
      closeMenuLabel: 'Close Menu',
      navHome: 'Home',
      navGames: 'Games',
      navApps: 'Apps',
      navStore: 'Store',
      navContact: 'Contact',
      latestTitle: 'Latest Apps',
      gamesTitle: 'Games',
      appsTitle: 'Apps',
      similarTitle: 'Similar Apps',
      viewMore: 'View More',
      screenshotsTitle: 'Screenshots',
      descriptionTitle: 'App Description',
      appInfoTitle: 'App Info',
      downloadBtn: 'Download App',
      downloadingWait: 'Preparing download link in {sec}s...',
      downloadReady: 'Download ready! Click here if it did not open.',
      directCloudNote: 'Direct download via external cloud storage',
      sizeLabel: 'Size',
      versionLabel: 'Version',
      osLabel: 'OS',
      licenseLabel: 'License',
      categoryLabel: 'Category',
      updatedLabel: 'Updated',
      adLabel: 'Advertisement',
      cat_games: 'Games',
      cat_apps: 'Apps',
      cat_store: 'Store',
      cat_social: 'Social',
      noSimilar: 'No other items in this category yet.',
      browseAll: 'Browse All Apps',
      footerRights: 'All rights reserved © J.apps',
      lightboxPrev: 'Previous',
      lightboxNext: 'Next',
      contactHeading: 'Contact Us',
      contactDesc: 'For inquiries, broken link reports, or app submission requests, reach out through the channels below:'
    }
  };

  function getSavedTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'light';
  }

  function detectInitialLang() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved === 'ar' || saved === 'en') return saved;
    } catch (e) {}
    var navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return navLang.indexOf('ar') === 0 ? 'ar' : 'en';
  }

  var currentTheme = getSavedTheme();
  var currentLang = detectInitialLang();

  function applyTheme(theme) {
    currentTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    try {
      localStorage.setItem(THEME_KEY, currentTheme);
    } catch (e) {}
  }

  function applyLanguage(lang) {
    currentLang = lang === 'ar' ? 'ar' : 'en';
    var isAr = currentLang === 'ar';
    var dict = I18N[currentLang];

    document.documentElement.lang = currentLang;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(LANG_KEY, currentLang);
    } catch (e) {}

    // Update static text nodes marked with data-i18n
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        nodes[i].textContent = dict[key];
      }
    }

    // Update bilingual dynamic data attributes (data-ar / data-en)
    var biNodes = document.querySelectorAll('[data-ar][data-en]');
    for (var j = 0; j < biNodes.length; j++) {
      var val = biNodes[j].getAttribute(isAr ? 'data-ar' : 'data-en');
      if (val !== null) {
        biNodes[j].textContent = val;
      }
    }

    // Update placeholders
    var searchInput = document.getElementById('site-search-input');
    if (searchInput) {
      searchInput.placeholder = dict.searchPlaceholder;
      searchInput.setAttribute('aria-label', dict.searchPlaceholder);
    }

    // Update lang toggle button
    var langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.textContent = dict.langToggleText;
      langBtn.title = dict.langToggleTitle;
      langBtn.setAttribute('aria-label', dict.langToggleTitle);
    }

    // Update theme button tooltip
    var themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.title = dict.themeToggleTitle;
      themeBtn.setAttribute('aria-label', dict.themeToggleTitle);
    }

    // Update page title if bilingual meta exists
    var titleEl = document.querySelector('title[data-title-ar][data-title-en]');
    if (titleEl) {
      document.title = titleEl.getAttribute(isAr ? 'data-title-ar' : 'data-title-en');
    }
  }

  function initHeaderControls() {
    var themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
      });
    }

    var langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', function () {
        applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
      });
    }

    // Navigation Drawer
    var menuBtn = document.getElementById('menu-toggle-btn');
    var closeBtn = document.getElementById('nav-close-btn');
    var drawer = document.getElementById('nav-drawer');
    var backdrop = document.getElementById('nav-backdrop');

    function setDrawer(open) {
      if (!drawer || !backdrop) return;
      drawer.classList.toggle('open', open);
      backdrop.classList.toggle('open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    if (menuBtn) menuBtn.addEventListener('click', function () { setDrawer(true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
    if (backdrop) backdrop.addEventListener('click', function () { setDrawer(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setDrawer(false);
    });
  }

  function resolveAssetSrc(assetPath, rootPrefix) {
    var val = String(assetPath || '').trim();
    if (!val) return rootPrefix + 'assets/images/default-icon.svg';
    if (/^(?:https?:)?\/\//i.test(val) || /^data:/i.test(val) || val.charAt(0) === '/') {
      return val;
    }
    return rootPrefix + val.replace(/^\.\//, '');
  }

  function initInstantSearch() {
    var input = document.getElementById('site-search-input');
    var resultsBox = document.getElementById('site-search-results');
    if (!input || !resultsBox) return;

    var rootPrefix = document.documentElement.getAttribute('data-root') || './';
    var fallbackIcon = rootPrefix + 'assets/images/default-icon.svg';

    function renderResults(query) {
      var list = window.JAPPS_INDEX || [];
      var q = query.trim().toLowerCase();
      if (!q) {
        resultsBox.classList.remove('open');
        resultsBox.innerHTML = '';
        return;
      }

      var matches = [];
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var hay = (
          (item.name_ar || '') + ' ' +
          (item.name_en || '') + ' ' +
          (item.category || '') + ' ' +
          (item.slug || '')
        ).toLowerCase();
        if (hay.indexOf(q) !== -1) {
          matches.push(item);
        }
      }

      resultsBox.innerHTML = '';
      if (matches.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'search-empty';
        empty.textContent = I18N[currentLang].searchEmpty;
        resultsBox.appendChild(empty);
      } else {
        var limit = Math.min(matches.length, 8);
        for (var j = 0; j < limit; j++) {
          var app = matches[j];
          var link = document.createElement('a');
          link.className = 'search-result-item';
          link.href = rootPrefix + 'apps/' + app.slug + '.html';

          var img = document.createElement('img');
          img.className = 'search-result-icon';
          img.src = resolveAssetSrc(app.icon, rootPrefix);
          img.referrerPolicy = 'no-referrer';
          img.alt = currentLang === 'ar' ? app.name_ar : app.name_en;
          img.onerror = function () {
            this.onerror = null;
            this.src = fallbackIcon;
          };

          var info = document.createElement('div');
          info.className = 'search-result-info';

          var title = document.createElement('div');
          title.className = 'search-result-title';
          title.textContent = currentLang === 'ar' ? app.name_ar : app.name_en;

          var meta = document.createElement('div');
          meta.className = 'search-result-meta';
          meta.textContent = app.size + ' • v' + app.version + ' • ' + app.os;

          info.appendChild(title);
          info.appendChild(meta);
          link.appendChild(img);
          link.appendChild(info);
          resultsBox.appendChild(link);
        }
      }
      resultsBox.classList.add('open');
    }

    input.addEventListener('input', function () {
      renderResults(input.value);
    });

    input.addEventListener('focus', function () {
      if (input.value.trim()) renderResults(input.value);
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.header-search')) {
        resultsBox.classList.remove('open');
      }
    });
  }

  function initLightbox() {
    var modal = document.getElementById('screenshots-lightbox');
    if (!modal) return;

    var triggers = document.querySelectorAll('[data-lightbox-src]');
    var modalImg = document.getElementById('lightbox-img');
    var closeBtn = document.getElementById('lightbox-close');
    var prevBtn = document.getElementById('lightbox-prev');
    var nextBtn = document.getElementById('lightbox-next');
    var counter = document.getElementById('lightbox-counter');

    var items = [];
    for (var i = 0; i < triggers.length; i++) {
      items.push(triggers[i].getAttribute('data-lightbox-src'));
    }
    var activeIndex = 0;

    function show(index) {
      if (!items.length) return;
      var rootPrefix = document.documentElement.getAttribute('data-root') || './';
      activeIndex = (index + items.length) % items.length;
      modalImg.referrerPolicy = 'no-referrer';
      modalImg.onerror = function () {
        this.onerror = null;
        this.src = rootPrefix + 'assets/images/default-icon.svg';
      };
      modalImg.src = items[activeIndex];
      counter.textContent = (activeIndex + 1) + ' / ' + items.length;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }

    function hide() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    for (var k = 0; k < triggers.length; k++) {
      (function (idx) {
        triggers[idx].addEventListener('click', function () {
          show(idx);
        });
      })(k);
    }

    if (closeBtn) closeBtn.addEventListener('click', hide);
    if (prevBtn) prevBtn.addEventListener('click', function () { show(activeIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(activeIndex + 1); });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) hide();
    });

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowLeft') show(currentLang === 'ar' ? activeIndex + 1 : activeIndex - 1);
      if (e.key === 'ArrowRight') show(currentLang === 'ar' ? activeIndex - 1 : activeIndex + 1);
    });
  }

  function initDownloadButton() {
    var btn = document.getElementById('download-cta-btn');
    if (!btn) return;

    var statusEl = document.getElementById('download-status');
    var directLink = document.getElementById('download-direct-link');
    var url = btn.getAttribute('data-download-url');
    var countdown = parseInt(btn.getAttribute('data-countdown') || '0', 10);
    var timer = null;

    btn.addEventListener('click', function () {
      if (!url) return;

      if (!countdown || countdown <= 0) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      if (timer) return;
      var remaining = countdown;
      btn.disabled = true;

      function tick() {
        var dict = I18N[currentLang];
        if (remaining > 0) {
          if (statusEl) {
            statusEl.textContent = dict.downloadingWait.replace('{sec}', String(remaining));
          }
          remaining -= 1;
          timer = setTimeout(tick, 1000);
        } else {
          timer = null;
          btn.disabled = false;
          if (statusEl) statusEl.textContent = dict.downloadReady;
          if (directLink) {
            directLink.href = url;
            directLink.hidden = false;
          }
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }

      tick();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(currentTheme);
    applyLanguage(currentLang);
    initHeaderControls();
    initInstantSearch();
    initLightbox();
    initDownloadButton();
  });
})();
