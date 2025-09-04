# Proje Mimarisi ve Mantığı: Price Predictor

Bu doküman, **Price Predictor** projesinin **Domain-Driven Design (DDD)** prensiplerine göre nasıl yapılandırıldığını, her katmanın ve bileşenin sorumluluklarını ve kodun arkasındaki mantığı detaylı bir şekilde açıklamaktadır.

## 📂 1. Proje Yapısı (DDD)

Proje, sorumlulukları net bir şekilde ayırmak için dört ana katmana bölünmüştür: `domain`, `application`, `infrastructure` ve `interfaces`.

```
src/
├── domain/
│   ├── entities/         # İş varlıkları (kimliği olan nesneler)
│   ├── value-objects/    # Değer nesneleri (kimliği olmayan, değiştirilemez nesneler)
│   ├── repositories/     # Veri erişim arayüzleri
│   ├── services/         # Saf iş mantığı servisleri
│   ├── exceptions/       # Domine özgü hatalar
│   └── events/           # Domain olayları
├── application/
│   ├── use-cases/        # Uygulama senaryoları
│   └── dtos/             # Veri transfer nesneleri
├── infrastructure/
│   ├── repositories/     # Repository arayüzlerinin somut implementasyonları (Prisma)
│   ├── clients/          # Dış API istemcileri (CoinGecko)
│   └── schedulers/       # Zamanlanmış görevler (Cron jobs)
└── interfaces/
    └── controllers/      # API endpoint'leri (REST)
```

---

## 🧠 2. Domain Katmanı

Bu katman, projenin kalbidir. Sadece iş kurallarını ve iş mantığını içerir. Diğer katmanlara (veritabanı, API'ler vb.) bağımlılığı yoktur.

### `value-objects` - Değer Nesneleri

Bunlar, bir değeri temsil eden küçük, değiştirilemez nesnelerdir. Kimlikleri yoktur, sadece taşıdıkları değerle anlam kazanırlar. Bu, kodun daha okunaklı ve güvenli olmasını sağlar.

- **`symbol.value-object.ts`**: Kripto para sembollerini (`BTC`, `ETH`) temsil eder. Kendi içinde geçerlilik kontrolü yapar (örn: sembol boş olamaz, belirli bir uzunlukta olmalı).
- **`price.value-object.ts`**: Bir fiyat değerini temsil eder. Fiyatın negatif olamayacağı gibi kuralları içerir.
- **`period.value-object.ts`**: İstatistik periyotlarını (`1d`, `7d`, `30d`) temsil eder. Sadece geçerli periyotların kullanılmasına izin verir.
- **`trend.value-object.ts`**: Fiyat trendini (`UP`, `DOWN`, `STABLE`) temsil eder.

### `entities` - Varlıklar

Bunlar, sistem içinde bir kimliğe (`id`) sahip olan ve zaman içinde durumu değişebilen nesnelerdir.

- **`price-history.entity.ts`**: Belirli bir sembolün, belirli bir zamandaki fiyatını temsil eder. Veritabanındaki `PriceHistory` tablosunun bir yansımasıdır.
- **`price-stats.entity.ts`**: Belirli bir sembol ve periyot için hesaplanmış istatistikleri (ortalama, volatilite, trend) temsil eder.

### `repositories` - Repository Arayüzleri

Bu arayüzler, veritabanı gibi dış sistemlerle nasıl konuşulacağını tanımlar, ancak bunu nasıl yapacağını belirtmez. Bu, "Dependency Inversion" prensibinin bir parçasıdır ve domain katmanının altyapıdan bağımsız kalmasını sağlar.

- **`price-history.repository.ts`**: `PriceHistory` varlıklarını kaydetmek, bulmak ve sorgulamak için metodlar tanımlar.
- **`price-stats.repository.ts`**: `PriceStats` varlıklarını kaydetmek ve sorgulamak için metodlar tanımlar.

### `services` - Domain Servisleri

Tek bir varlığa veya değer nesnesine ait olmayan, saf iş mantığını içeren servislerdir.

- **`stats-calculator.service.ts`**: Bir dizi fiyat geçmişi verisinden yola çıkarak ortalama, volatilite ve trend gibi istatistikleri hesaplar. Bu mantık, bir varlığın sorumluluğu olmadığından ayrı bir serviste toplanmıştır.

### `exceptions` - Özel Hatalar

Domine özgü hata durumlarını temsil eden özel hata sınıflarıdır.

- **`invalid-symbol.exception.ts`**: Geçersiz bir sembol formatı kullanıldığında fırlatılır.
- **`invalid-price.exception.ts`**: Geçersiz bir fiyat değeri (örn: negatif) kullanıldığında fırlatılır.

### `events` - Domain Olayları

Domain içinde önemli bir olay gerçekleştiğinde bunu sistemin diğer kısımlarına bildirmek için kullanılır.

- **`price-saved.event.ts`**: Yeni bir fiyat verisi başarıyla kaydedildiğinde fırlatılır. Bu olay, gelecekte istatistik hesaplamalarını tetiklemek veya bildirim göndermek için kullanılabilir.

---

## ⚙️ 3. Application Katmanı

Bu katman, domain katmanındaki nesneleri kullanarak belirli uygulama senaryolarını (use case) yönetir. Dış dünyadan gelen istekleri alır ve domain mantığını orkestra eder.

### `use-cases` - Kullanım Senaryoları

- **`save-price.use-case.ts`**: Bir sembol ve fiyat bilgisini alarak yeni bir `PriceHistory` varlığı oluşturur, bunu repository aracılığıyla kaydeder ve `PriceSavedEvent` olayını fırlatır.
- **`calculate-stats.use-case.ts`**: Belirli bir sembol ve periyot için istatistik hesaplama işlemini yönetir. Gerekli fiyat verilerini repository'den çeker, `StatsCalculatorService`'i kullanarak hesaplamayı yapar ve sonucu yine repository aracılığıyla kaydeder.

### `dtos` - Veri Transfer Nesneleri

Bu nesneler, katmanlar arasında (özellikle `interfaces` ve `application` katmanları arasında) veri taşımak için kullanılır.

- **`price.dto.ts`**: Fiyat verisi girişi için kullanılır.
- **`stats.dto.ts`**: İstatistik verilerini dış dünyaya sunmak için kullanılır.

---

## 🏗️ 4. Infrastructure Katmanı

Bu katman, domain katmanında tanımlanan arayüzlerin somut implementasyonlarını ve dış dünya ile ilgili tüm teknik detayları içerir.

### `repositories` - Somut Repository'ler

- **`prisma-price-history.repository.ts`**: `PriceHistoryRepository` arayüzünü Prisma kullanarak implemente eder. Veritabanı sorgularını burada yapar.
- **`prisma-price-stats.repository.ts`**: `PriceStatsRepository` arayüzünü Prisma kullanarak implemente eder.

### `clients` - Dış API İstemcileri

- **`coingecko.client.I'sine bağlanarak ats`**: CoinGecko APnlık kripto para fiyatlarını çekmek için kullanılır. Bu, dış servislerle olan iletişimi tek bir yerde toplar.

### `schedulers` - Zamanlayıcılar

- **`price-fetch.scheduler.ts`**: `@nestjs/schedule` kullanarak belirli aralıklarla (örn: her 5 dakikada bir) otomatik olarak çalışır. `CoingeckoClient`'ı kullanarak fiyatları çeker ve `SavePriceUseCase`'i tetikleyerek bu fiyatları veritabanına kaydeder.

---

## 🔌 5. Interface Katmanı

Bu katman, uygulamanın dış dünya ile iletişim kurduğu noktadır. Bizim durumumuzda bu bir REST API'dir.

### `controllers` - API Kontrolcüleri

- **`prices.controller.ts`**: `/prices/:symbol` gibi endpoint'leri tanımlar ve bir sembole ait fiyat geçmişini döndürür.
- **`stats.controller.ts`**: `/stats/:symbol/:period` gibi endpoint'leri tanımlar. Önce veritabanında güncel bir istatistik arar, bulamazsa `CalculateStatsUseCase`'i tetikleyerek anlık olarak hesaplar ve sonucu döndürür.

---

## 🧩 6. Modül ve Bağımlılık Yönetimi

### `app.module.ts`

Bu dosya, NestJS'in Dependency Injection (DI) mekanizmasının merkezidir. Oluşturduğumuz tüm sınıfları (`use-cases`, `repositories`, `services`, `controllers` vb.) birbirine bağlar.

- **`imports`**: `ScheduleModule` (zamanlayıcı için) ve `EventEmitterModule` (olaylar için) gibi diğer NestJS modüllerini içeri aktarır.
- **`controllers`**: API kontrolcülerini kaydeder.
- **`providers`**: Uygulama genelinde kullanılacak servisleri ve diğer bileşenleri tanımlar. Burada en önemli kısım, repository arayüzlerini (`'PriceHistoryRepository'`) somut implementasyonlarına (`PrismaPriceHistoryRepository`) bağlamamızdır. Bu sayede, gelecekte Prisma yerine başka bir veritabanı teknolojisine geçmek istersek sadece bu modül dosyasını ve infrastructure katmanını değiştirmemiz yeterli olacaktır.

Bu yapı, projenin esnek, test edilebilir, bakımı kolay ve ölçeklenebilir olmasını sağlar. Her parçanın net bir sorumluluğu vardır ve bu da kod karmaşasını önler.

---

## 🚀 7. Sonraki Adımlar (MVP için Yol Haritası)

Projenin temel iskeleti hazır. İlk çalışan versiyonu (MVP) ayağa kaldırmak için izlenmesi gereken adımlar şunlardır:

1.  **Veritabanı Kurulumu ve Migration:**
    - Projenin ana dizininde bir `.env` dosyası oluşturun.
    - İçine `DATABASE_URL="postgresql://KULLANICI:SIFRE@localhost:5432/veritabani_adi?schema=public"` şeklinde kendi PostgreSQL bağlantı bilgilerinizi girin.
    - `prisma/schema.prisma` dosyasındaki modellerin doğruluğunu kontrol edin.
    - `npx prisma migrate dev --name initial-setup` komutunu çalıştırarak veritabanı şemasını oluşturun.

2.  **Testlerin Yazılması:**
    - **Birim Testleri:** Özellikle `domain/services` ve `application/use-cases` içindeki iş mantığını test eden birim testleri yazın. Bu, sistemin temel yapı taşlarının doğru çalıştığından emin olmanızı sağlar.
    - **Entegrasyon Testleri:** `infrastructure/repositories` katmanının veritabanı ile doğru iletişim kurup kurmadığını test eden entegrasyon testleri yazın.

3.  **Uygulamayı Çalıştırma ve Doğrulama:**
    - `npm run start:dev` komutu ile NestJS sunucusunu başlatın.
    - Bir API test aracı (Postman, Insomnia vb.) kullanarak aşağıdaki endpoint'leri test edin:
      - Scheduler'ın çalışıp `BTC` ve `ETH` fiyatlarını veritabanına kaydettiğini doğrulayın.
      - `GET http://localhost:3000/prices/BTC` isteği ile kaydedilen fiyat geçmişini alın.
      - `GET http://localhost:3000/stats/BTC/7d` isteği ile istatistiklerin hesaplandığını ve döndürüldüğünü kontrol edin.

---

## 🌟 8. Gelecek Geliştirmeler ve İyileştirmeler

MVP tamamlandıktan sonra proje aşağıdaki alanlarda geliştirilebilir:

### Veri ve Analiz

- **Veri Zenginleştirme:** Sadece CoinGecko değil, Binance, KuCoin gibi farklı borsalardan da veri toplayarak daha güvenilir bir fiyat ortalaması oluşturma.
- **Haber ve Duyarlılık Analizi:** Haber API'larını (örn: NewsAPI) entegre ederek ve doğal dil işleme (NLP) kullanarak belirli bir kripto para hakkındaki piyasa duyarlılığını (pozitif/negatif) analize dahil etme.
- **Gelişmiş Teknik Göstergeler:** Hareketli Ortalamalar (MA), Göreceli Güç Endeksi (RSI), MACD gibi popüler finansal teknik göstergeleri hesaplayan servisler ekleme.

### Makine Öğrenmesi

- **Fiyat Tahmin Modelleri:** Toplanan geçmiş verileri kullanarak basit zaman serisi tahmin modelleri (örn: ARIMA) veya daha karmaşık `TensorFlow.js` modelleri ile gelecekteki fiyat hareketlerini tahmin etme.
- **Anomali Tespiti:** Fiyat hareketlerinde ani ve beklenmedik sıçramaları tespit eden ve bildiren bir sistem kurma.

### Ölçeklenebilirlik ve Performans

- **Önbelleğe Alma (Caching):** Sık istenen verileri (örn: anasayfa istatistikleri) Redis gibi bir in-memory veritabanında önbelleğe alarak veritabanı yükünü azaltma ve yanıt sürelerini iyileştirme.
- **Mesaj Kuyrukları (Message Queues):** `PriceSavedEvent` gibi olayları RabbitMQ veya Kafka gibi bir mesaj kuyruğuna göndererek istatistik hesaplama gibi işlemleri asenkron hale getirme. Bu, ana uygulama akışının yavaşlamasını önler.
- **Mikroservis Mimarisi:** Proje büyüdüğünde, "veri toplama", "istatistik hesaplama", "tahmin" gibi servisleri ayrı mikroservislere bölme.

### Kullanıcı Özellikleri

- **Kimlik Doğrulama ve Yetkilendirme:** Kullanıcıların sisteme kaydolup giriş yapabilmesi için JWT tabanlı bir kimlik doğrulama sistemi ekleme.
- **Kullanıcı Profili ve Takip Listesi:** Kullanıcıların kendi portföylerini veya takip etmek istedikleri sembolleri kaydetmelerine olanak tanıma.
- **Bildirimler:** Kullanıcıların belirlediği fiyat alarmları veya önemli piyasa olayları için e-posta veya anlık bildirimler gönderme.

### API ve Güvenlik

- **API Güvenliği:** `helmet` ile güvenlik başlıkları ekleme, `class-validator` ile gelen verileri sıkı bir şekilde doğrulama ve `rate-limiting` ile API'ye gelen istekleri sınırlama.
- **GraphQL Arayüzü:** REST API'ye ek olarak, istemcilerin sadece ihtiyaç duydukları veriyi çekmelerine olanak tanıyan bir GraphQL arayüzü sunma.
- **WebSockets:** Fiyat değişikliklerini istemcilere gerçek zamanlı olarak iletmek için WebSocket entegrasyonu.
