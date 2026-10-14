# QRECO

Çalışanlar için QR kodlu dijital kartvizit / profil sayfası yöneticisi.
Frontend: React + TypeScript + Vite + Ant Design. Backend: Vercel
Serverless Functions (`/api`). Veri ve dosyalar: Supabase (Postgres +
Storage).

## Kurulum

1. **Supabase projesi oluşturun** ([supabase.com](https://supabase.com) → New Project).
2. Supabase Dashboard → **SQL Editor** içine [`supabase/schema.sql`](supabase/schema.sql) dosyasının içeriğini yapıştırıp çalıştırın.
3. Supabase Dashboard → **Storage** → yeni bir bucket oluşturun: adı `uploads`, **Public bucket** seçeneğini açın.
4. Supabase Dashboard → **Project Settings → API** sayfasından `Project URL` ve `service_role` anahtarını alın.
5. Proje kök dizininde `.env.example` dosyasını `.env` olarak kopyalayıp bu değerleri girin:
   ```bash
   cp .env.example .env
   ```
6. Bağımlılıkları kurun:
   ```bash
   npm install
   ```
7. Vercel CLI ile yerel geliştirme (ilk seferinde `vercel link` ile projeyi bağlamanız istenecek):
   ```bash
   npm run dev
   ```

## Dağıtım (Deploy)

Proje bir Git reposuna push edildikten sonra Vercel'de "Import Project"
ile bağlanır. Vercel proje ayarlarından **Environment Variables**
kısmına `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` eklenmelidir.
Alt domain bağlamak için proje **Settings → Domains** kısmından
istenen alt domain eklenir.
