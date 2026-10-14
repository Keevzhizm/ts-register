Bu mevcut projeyi incele ve yapısını koruyarak GitHub’da paylaşılmaya uygun, discord.js v14 ve TypeScript ile çalışan bir kayıt botu haline getir. Projeyi baştan yazma; mevcut komutları, sistemleri ve veri yapısını inceleyip eksikleri tamamla. Kullanıcıya görünen tüm metinleri Türkçe yaz.

Kayıt sistemi:
- Kullanıcı /kayit komutuyla kendi sunucu içi adını ve yaşını gönüllü olarak bir form üzerinden bildirebilsin.
- Kayıt bilgileri yalnızca botun davet edildiği sunucuda saklansın.
- Yaş ve kayıt bilgileri herkese açık mesajlarda gösterilmesin; yalnızca yetkili komutlarıyla erişilebilsin.
- Yetkili kişiler kayıtları görüntüleyebilsin ve JSON olarak dışa aktarabilsin.
- Kullanıcının kaydını sildirebilmesi için /kayit-sil komutu ekle.
- Yetkisiz kullanımda Türkçe ve anlaşılır hata mesajı göster.
- Mevcut projede bu özelliklerin karşılığı zaten varsa tekrar oluşturma; mevcut sistemi düzelt veya tamamla.

Güvenlik ve gizlilik:
- Normal Discord hesabı tokeni kullanma; self-bot, kullanıcı hesabı otomasyonu veya kullanıcının üye olduğu tüm sunucuları tarama özelliği ekleme.
- Bot yalnızca kurulduğu sunucularda çalışsın. Yaş bilgisini Discord’dan almaya çalışma; bu bilgi yalnızca kullanıcının kendi kayıt formunda verdiği değer olabilir.
- Bot tokeni .env dosyasından okunsun. Gerçek tokeni, sunucu ID’lerini veya gerçek kullanıcı verilerini kaynak koda ya da GitHub’a yazma.
- .env.example dosyasına yalnızca örnek değişken adları ve boş/değiştirilmiş örnek değerler koy. .env ve kullanıcı kayıt verilerini .gitignore içine ekle.
- JSON dışa aktarma komutunu yalnızca uygun yetkisi olan sunucu yöneticileri kullanabilsin.

GitHub hazırlığı:
- Projeye Türkçe bir README.md hazırla: botun amacı, özellikleri, gereksinimler, kurulum, Discord Developer Portal ayarları, ortam değişkenleri, komutlar, botu sunucuya davet etme, çalıştırma ve veri gizliliği bölümleri olsun.
- package.json betiklerini ve TypeScript yapılandırmasını mevcut projeye uygun şekilde düzenle.
- Kurulum adımlarını gerçek dosya ve komut adlarıyla eşleştir; olmayan özellikleri varmış gibi yazma.
- Sonuçta değiştirdiğin/eklediğin dosyaları ve kullanıcının Discord Developer Portal’da yapması gereken adımları kısaca listele.
