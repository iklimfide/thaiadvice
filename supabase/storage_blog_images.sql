-- ThaiAdvice: moderasyon sayfasından yüklenen görseller (blog-images).
-- Supabase → SQL Editor’de çalıştırın. Bucket zaten varsa INSERT atlanabilir.

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Herkese okuma (public URL)
DROP POLICY IF EXISTS "public_read_blog_images" ON storage.objects;
CREATE POLICY "public_read_blog_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'blog-images');

-- Not: Yükleme uygulama tarafında SUPABASE_SERVICE_ROLE_KEY ile yapılır; ek storage INSERT politikası şart değildir.
-- İsterseniz service role yerine authenticated + RLS ile yükleme için ayrı politika tanımlanabilir.
