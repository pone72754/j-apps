# J.apps — متجر ودليل تحميل الألعاب والتطبيقات (Static SEO Website)

موقع ويب ثابت (HTML5 / CSS3 / Vanilla JS) سريع ومتجاوب ثنائي اللغة (**العربية RTL** / **الإنجليزية LTR**) مع وضع ليلي ونهاري، مصمم للأرشفة القوية في جوجل وجاهز للرفع المباشر على **Cloudflare Pages** و **Netlify**.

## هيكل المشروع
- `data/apps.json`: قاعدة بيانات التطبيقات والألعاب.
- `site.config.js`: إعدادات الموقع والرابط الرئيسي والأقسام.
- `build.js`: سكربت البناء (Node.js) الذي يولّد صفحات `apps/*.html` و `index.html` وصفحات الأقسام و `sitemap.xml` و `robots.txt`.
- `.pages.yml`: ملف ربط لوحة التحكم السحابية **Pages CMS** لإضافة التطبيقات من المتصفح أو الجوال.
- `admin.html` و `admin-server.js`: لوحة تحكم محلية مرئية لإضافة وتعديل وحذف التطبيقات وبناء الموقع بضغطة زر.
- `assets/`: ملفات التصميم والبرمجة والصور والأيقونات.

## لوحة التحكم المحلية المرئية (Admin)
لتشغيل لوحة التحكم محلياً (تتطلب Node.js):
```bash
npm run admin
```
ثم افتح المتصفح على: `http://127.0.0.1:4321/admin.html`

## إضافة تطبيق جديد يدوياً
1. أضف كائناً جديداً داخل مصفوفة `apps` في `data/apps.json` (أو عبر واجهة **Pages CMS**).
2. نفّذ الأمر:
   ```bash
   node build.js
   ```
3. عند النشر على **Cloudflare Pages** أو **Netlify**:
   - **Build command**: `node build.js`
   - **Build output directory**: `/` (أو `.`)
