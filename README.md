# QRECO

Çalışanlar için QR kodlu dijital kartvizit / profil sayfası ve mail imzası yöneticisi.
Frontend: React + TypeScript + Vite + Ant Design. Backend: Cloudflare Pages
Functions (`/functions`, ortak kod `/server`). Veri ve dosyalar: Supabase
(Postgres + Storage).

Mail imzalarındaki QR görseli, çalışan kaydedilirken admin panelinde
(tarayıcıda) bir kez üretilir ve Supabase Storage'a `uploads/qr/<id>.png`
olarak kaydedilir. İmzalar bu dosyayı doğrudan Supabase'den yükler, yani
uygulama sunucusuna bağlı değildir. Eski imzalardaki
`/api/users/<id>/qr-png` adresi bu dosyaya yönlendirir.

## Kurulum

1. **Supabase projesi oluşturun** ([supabase.com](https://supabase.com) → New Project).
2. Supabase Dashboard → **SQL Editor** içine [`supabase/schema.sql`](supabase/schema.sql) dosyasının içeriğini yapıştırıp çalıştırın.
3. Supabase Dashboard → **Storage** → yeni bir bucket oluşturun: adı `uploads`, **Public bucket** seçeneğini açın.
4. Supabase Dashboard → **Project Settings → API** sayfasından `Project URL` ve `service_role` anahtarını alın.
5. Proje kök dizininde `.dev.vars` dosyası oluşturup şu değerleri girin (git'e eklenmez):
   ```
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ADMIN_PASSWORD=...
   ```
6. Bağımlılıkları kurun:
   ```bash
   npm install
   ```
7. Yerel geliştirme:
   - Sadece arayüz: `npm run dev`
   - API dahil (Cloudflare ortamında): `npm run dev:cf`

## Dağıtım (Cloudflare Pages)

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** ile bu repoyu bağlayın.
2. Build ayarları: Framework preset **None**, build command `npm run build`, output directory `dist`.
3. **Settings → Variables and Secrets** kısmına `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ve `ADMIN_PASSWORD` ekleyin (Secret olarak).
4. **Custom domains** kısmından alan adını bağlayın.
5. İlk kurulumdan sonra admin panelinde **"İmza QR'larını Yenile"** butonuna basarak mevcut tüm çalışanların imza QR'larını oluşturun.
