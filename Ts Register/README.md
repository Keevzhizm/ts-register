# Shaneria Register Bot

Discord.js v14 tabanlı kayıt ve topluluk yönetimi botu. TypeScript, MongoDB ve Canvas kullanır.

## Özellikler

- Yetkili onaylı kayıt paneli, cinsiyet seçimi ve rol/takma ad güncelleme
- Kayıtsıza alma, kayıt geçmişi ve yeniden katılan üyeye otomatik kayıt
- Hoş geldin mesajı ve kayıt yetkilisi çağrısı
- Davet takibi, kayıt/davet sıralaması ve istatistik görselleri
- Audit Log üzerinden ban, unban ve kick takibi
- .sil <1-100> mesaj temizleme komutu

## Kurulum

1. Node.js 20+ ve MongoDB hazırlayın.
2. npm install çalıştırın.
3. .env.example dosyasını .env adıyla kopyalayıp bot tokenı, MongoDB URI, sunucu/kanal/rol ID değerlerini doldurun.
4. Discord Developer Portal içinde Server Members Intent, Message Content Intent ve Guild Moderation Intent seçeneklerini etkinleştirin.
5. Bot için mesaj gönderme, ek dosya, mesaj geçmişi, üyeleri yönetme, takma adları yönetme, davetleri görüntüleme, denetim kaydını görüntüleme ve mesajları yönetme izinlerini verin. Bot rolünü yöneteceği rollerin üstüne taşıyın.
6. npm run check ve npm run build ile doğrulayın.
7. npm start ile çalıştırın. Geliştirme için npm run dev kullanın.

PM2: npm run pm2:start. Loglar: npm run pm2:logs.

## Ayarlar

Sunucuya özel tüm değerler .env dosyasında tutulur. DISCORD_GUILD_ID ve rol ID değerleri zorunludur. İsteğe bağlı kanal alanları boş bırakılırsa ilgili çıktı kapalı olur. Panel yenileme aralığı STATS_UPDATE_INTERVAL_MS ile belirlenir.

.env dosyasını, bot tokenını veya MongoDB URI değerini Git'e eklemeyin. .gitignore bu dosyaları dışlar. Bir token veya parola daha önce GitHub'a gönderildiyse onu yenileyin; dosyadan silmek Git geçmişindeki kopyaları kaldırmaz.

## Komutlar

- .kayıt @üye İsim Yaş veya .kayıt ID İsim Yaş
- .kayıtsız @üye veya .kayıtsız ID
- .isimler @üye veya .isimler ID (kayıt yetkilileri)
- .modstat, .modstat @üye veya .modstat ID
- .sil 25
