# Makale gövdesi kaynakları (kalıcı metin)

Bu klasördeki `.md` dosyaları, Supabase `questions` tablosundaki **content** alanı için **tek doğruluk kaynağı**dır. Site şablonu (`article-detail-body` CSS) `##` / `###` başlıkları ve listelerle en iyi görünümü verir.

## Tayland vize rehberi

- Kaynak dosya: `tr/tayland-vize-muafiyeti-giris-rehberi.md`
- Uygulama: Supabase SQL Editor’da `supabase/patches/update_question_vize_rehberi.sql` dosyasını çalıştırın (slug + dil eşleşmesi güncellenir).

İçeriği elle değiştirecekseniz: dosyayı düzenleyin → aynı SQL’i güncelleyin veya Master arayüzünden gövdeyi yapıştırın.
