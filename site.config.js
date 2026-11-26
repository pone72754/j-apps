/**
 * ============================================================================
 * ملف الإعدادات الرئيسي لموقع J.apps
 * ============================================================================
 * عدّل القيم أدناه لتخصيص رابط الموقع، الأقسام، أو مدة عداد التحميل،
 * ثم شغّل الأمر: node build.js لإعادة بناء جميع الصفحات وملف sitemap.xml.
 */

module.exports = {
  // اسم الموقع الظاهر في الشعار والعناوين
  siteName: 'J.apps',

  // رابط الموقع النهائي بدون شرطة مائلة في النهاية (يُستخدم في sitemap.xml ووسوم Canonical و OpenGraph)
  // استبدله بدومينك الحقيقي عند الرفع على Cloudflare Pages أو Netlify
  siteUrl: 'https://j-apps.pages.dev',

  // اللغة الافتراضية في ملفات HTML الثابتة المؤرشفة في محركات البحث ('ar' أو 'en')
  defaultLang: 'ar',

  // وصف الموقع العام لمحركات البحث
  siteDescriptionAr: 'متجر ودليل J.apps لتحميل أحدث الألعاب والتطبيقات بروابط مباشرة وآمنة ومعلومات كاملة.',
  siteDescriptionEn: 'J.apps directory and store to download the latest Android games and apps with direct cloud links.',

  // مدة عداد الثواني الاختياري قبل فتح رابط التحميل الخارجي (اجعلها 0 للتحميل المباشر الفوري)
  downloadCountdownSeconds: 3,

  // عدد التطبيقات الظاهرة في كل قسم داخل الصفحة الرئيسية
  homeLimits: {
    latest: 6,
    games: 6,
    apps: 6
  },

  /**
   * ============================================================================
   * الأقسام والتصنيفات (Categories / Sections)
   * ============================================================================
   * لإضافة قسم جديد مستقبلاً:
   * 1. أضف كائناً جديداً هنا بنفس البنية (id, page, title_ar, title_en, description_ar, description_en).
   * 2. أضف اسم التصنيف (id) إلى قائمة الخيارات في ملف .pages.yml ليظهر في لوحة Pages CMS.
   * 3. شغّل node build.js ليتم توليد صفحة القسم وإضافتها تلقائياً للقائمة و sitemap.xml.
   */
  categories: [
    {
      id: 'games',
      page: 'games.html',
      title_ar: 'الألعاب',
      title_en: 'Games',
      nav_ar: 'ألعاب',
      nav_en: 'Games',
      description_ar: 'أفضل وأحدث ألعاب الأندرويد بروابط تحميل سحابية سريعة ومباشرة.',
      description_en: 'Best and latest Android games with fast direct cloud download links.'
    },
    {
      id: 'apps',
      page: 'apps.html',
      title_ar: 'التطبيقات',
      title_en: 'Apps',
      nav_ar: 'تطبيقات',
      nav_en: 'Apps',
      // التصنيفات الفرعية التي تظهر أيضاً ضمن قسم التطبيقات في الرئيسية وصفحة التطبيقات
      includeCategories: ['apps', 'store', 'social'],
      description_ar: 'تطبيقات مميزة للأندرويد تشمل الأدوات والتواصل والمتاجر البديلة.',
      description_en: 'Featured Android apps including utilities, social apps, and app stores.'
    },
    {
      id: 'store',
      page: 'store.html',
      title_ar: 'متجر',
      title_en: 'Store',
      nav_ar: 'متجر',
      nav_en: 'Store',
      description_ar: 'أدوات المتاجر وحزم التثبيت وإدارة التطبيقات للأندرويد.',
      description_en: 'Store tools, package installers, and app management utilities for Android.'
    },
    {
      id: 'social',
      page: 'social.html',
      title_ar: 'التواصل الاجتماعي',
      title_en: 'Social',
      nav_ar: 'تواصل اجتماعي',
      nav_en: 'Social',
      hiddenInNav: true, // يظهر في التصنيفات والصفحة المستقلة دون إطالة القائمة الرئيسية
      description_ar: 'تطبيقات الدردشة والتواصل الاجتماعي والمجتمعات.',
      description_en: 'Chat, messaging, and social community applications.'
    }
  ],

  // معلومات صفحة تواصل معنا (Contact)
  contact: {
    email: 'support@j-apps.example',
    telegram: 'https://t.me/j_apps_official'
  }
};
