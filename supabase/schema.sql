-- QRECO veritabanı şeması
-- Supabase Dashboard > SQL Editor içine yapıştırıp çalıştırın.

create table if not exists employees (
  id text primary key,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  "position" text not null default '',
  phone text not null default '',
  website text not null default '',
  photo_url text not null default '',
  address text not null default '',
  en_position text not null default '',
  en_address text not null default '',
  social jsonb not null default '{"linkedin":"","instagram":"","twitter":"","facebook":""}'::jsonb,
  bg_color_start text not null default '#f5f5f5',
  bg_color_end text not null default '#e0e0e0',
  text_color text not null default '#1f1f1f',
  qr jsonb not null default '{"fgColor":"#000000","bgColor":"#ffffff","logoUrl":"","logoSize":40,"bordered":true,"shape":"square"}'::jsonb,
  scan_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS'i kapatıyoruz: tüm erişim yalnızca sunucu tarafındaki (Vercel) API
-- fonksiyonları üzerinden SUPABASE_SERVICE_ROLE_KEY ile yapılır; tarayıcı
-- doğrudan bu tabloya erişmez.
alter table employees disable row level security;

-- (İsteğe bağlı) örnek/demo kayıt:
insert into employees (
  id, first_name, last_name, email, "position", phone, website, address,
  social, bg_color_start, bg_color_end, text_color, qr
) values (
  'demo001',
  'Ayşe', 'Yılmaz', 'ayse.yilmaz@sirket.com', 'Yazılım Mühendisi',
  '+90 555 123 45 67', 'https://www.sirket.com',
  'Levent Mah. Buyukdere Cad. No:100 Sisli Istanbul',
  '{"linkedin":"https://linkedin.com/in/ayseyilmaz","instagram":"https://instagram.com/ayseyilmaz","twitter":"","facebook":""}'::jsonb,
  '#eb0045', '#a9163a', '#ffffff',
  '{"fgColor":"#000000","bgColor":"#ffffff","logoUrl":"","logoSize":40,"bordered":true,"shape":"square"}'::jsonb
)
on conflict (id) do nothing;
