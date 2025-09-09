# Price Predictor - Mimari ve Süreç Şeması

Bu doküman, Price Predictor projesinin **Domain-Driven Design (DDD)** prensiplerine dayalı mimarisini, katmanlarını, bileşenlerini ve temel iş akışlarını detaylı bir şekilde açıklamaktadır. Amacı, projeyi öğrenmek isteyen bir geliştirici için eğitici bir kaynak olmaktır.

## 1. Genel Mimari: Katmanlı Tasarım (DDD)

Proje, sorumlulukları net bir şekilde ayıran dört ana katmandan oluşur. Bu katmanlar, bağımlılıkların tek bir yönde (`Interfaces` -> `Application` -> `Domain` <- `Infrastructure`) akmasını sağlar.

```mermaid
graph TD
    subgraph "Kullanıcı & Dış Dünya"
        A[Kullanıcı/Client] --> B{REST API};
        C[Zamanlayıcı (Cron)] --> D{Scheduler};
    end

    subgraph "Uygulama Mimarisi"
        B --> E[Interfaces Katmanı];
        D --> F[Infrastructure Katmanı];
        E --> G[Application Katmanı];
        G --> H[Domain Katmanı];
        F --> H;
    end

    style H fill:#f9f,stroke:#333,stroke-width:2px
```

-   **`Domain` (Çekirdek):** Projenin kalbidir. Saf iş kurallarını, varlıkları (Entities) ve değer nesnelerini (Value Objects) içerir. Diğer katmanlara bağımlılığı yoktur.
-   **`Application` (Orkestrasyon):** İş akışlarını (Use Cases) yönetir. Domain katmanındaki nesneleri kullanarak belirli görevleri yerine getirir.
-   **`Infrastructure` (Altyapı):** Dış dünya ile ilgili teknik detayları barındırır: Veritabanı bağlantısı (Prisma), dış API istemcileri (Coingecko), zamanlanmış görevler vb. Domain katmanındaki arayüzleri (repositories) implemente eder.
-   **`Interfaces` (Arayüz):** Dış dünyanın uygulamayla iletişim kurduğu noktadır. Bizim projemizde bu, REST API kontrolcüleridir (Controllers).

---

## 2. Ana İş Akışları

Projede iki temel iş akışı bulunmaktadır.

### Akış 1: Fiyat Verisinin Otomatik Olarak Çekilmesi ve Kaydedilmesi

Bu akış, zamanlanmış bir görevle periyodik olarak çalışır ve sisteme ham fiyat verisi sağlar.

**Süreç Adımları:**

1.  **Tetikleme (`@nestjs/schedule`):**
    -   **Bileşen:** `PriceFetchScheduler` (`src/infrastructure/schedulers/`)
    -   **Açıklama:** NestJS'in `ScheduleModule`'ü, `@Cron()` dekoratörü ile belirtilen zamanda (her 5 dakikada bir) `handleCron()` metodunu otomatik olarak tetikler.

2.  **Dış API'den Veri Çekme:**
    -   **Bileşen:** `CoingeckoClient` (`src/infrastructure/clients/`)
    -   **Açıklama:** `PriceFetchScheduler`, `CoingeckoClient`'ın `getPrice()` metodunu çağırır. Bu client, `axios` kullanarak CoinGecko API'sine bir HTTP isteği gönderir ve güncel fiyat bilgisini alır.

3.  **İş Akışını Başlatma (Use Case):**
    -   **Bileşen:** `SavePriceUseCase` (`src/application/use-cases/`)
    -   **Açıklama:** `PriceFetchScheduler`, aldığı fiyat ve sembol bilgisiyle `SavePriceUseCase`'in `execute()` metodunu çağırır. Bu, altyapı katmanından uygulama katmanına geçiş noktasıdır.

4.  **Domain Nesnelerini Oluşturma:**
    -   **Bileşenler:** `Symbol`, `Price` (Value Objects), `PriceHistory` (Entity) (`src/domain/`)
    -   **Açıklama:** `SavePriceUseCase`, gelen ham verilerden (`'BTC'`, `60000`) domain'in anladığı, kuralları olan nesneler oluşturur. Bu, verinin sisteme girmeden önce doğrulanmasını ve zenginleştirilmesini sağlar.

5.  **Veritabanına Kaydetme (Repository Prensibi):**
    -   **Arayüz:** `PriceHistoryRepository` (`src/domain/repositories/`)
    -   **Implementasyon:** `PrismaPriceHistoryRepository` (`src/infrastructure/repositories/`)
    -   **Açıklama:** `SavePriceUseCase`, oluşturduğu `PriceHistory` nesnesini kaydetmek için `priceHistoryRepository.save()` metodunu çağırır. Burada soyut bir arayüzle konuşur. NestJS'in Dependency Injection sistemi, bu arayüzün somut implementasyonu olan `PrismaPriceHistoryRepository`'yi arka planda sağlar. Bu repository, `PrismaClient`'ı kullanarak veriyi PostgreSQL veritabanına yazar.

6.  **Olay (Event) Yayınlama:**
    -   **Bileşen:** `PriceSavedEvent` (`src/domain/events/`) ve `EventEmitterModule`
    -   **Açıklama:** Veri başarıyla kaydedildikten sonra, `SavePriceUseCase`, `eventEmitter.emit()` metodunu çağırarak "bir fiyat kaydedildi" olayını sisteme duyurur. Bu, sistemin diğer parçalarının (örneğin, alarm kontrolü) bu olaydan haberdar olup kendi görevlerini yapmalarını sağlar (Decoupling).

### Akış 2: Kullanıcının İstatistik İsteği Yapması

Bu akış, bir kullanıcının REST API aracılığıyla belirli bir sembol ve periyot için istatistik talep etmesiyle başlar.

**Süreç Adımları:**

1.  **HTTP İsteği (`REST API`):**
    -   **Bileşen:** `StatsController` (`src/interfaces/controllers/`)
    -   **Açıklama:** Kullanıcı, `GET /stats/BTC/7d` gibi bir istek gönderir. `@Controller('stats')` ve `@Get(':symbol/:period')` dekoratörleri sayesinde NestJS, bu isteği `StatsController`'ın `getStats()` metoduna yönlendirir.

2.  **Önbellek Kontrolü (Cache Check):**
    -   **Bileşen:** `PrismaPriceStatsRepository` (`src/infrastructure/repositories/`)
    -   **Açıklama:** `StatsController`, önce veritabanında bu istatistiğin daha önce hesaplanıp hesaplanmadığını ve yeterince güncel olup olmadığını kontrol etmek için `priceStatsRepository.findLatestBySymbolAndPeriod()` metodunu çağırır. Eğer güncel bir kayıt varsa, hesaplama yapmadan doğrudan bu kaydı döndürür.

3.  **İş Akışını Başlatma (Use Case):**
    -   **Bileşen:** `CalculateStatsUseCase` (`src/application/use-cases/`)
    -   **Açıklama:** Eğer önbellekte güncel bir kayıt yoksa, `StatsController` `CalculateStatsUseCase`'in `execute()` metodunu çağırır.

4.  **Geçmiş Veriyi Çekme:**
    -   **Bileşen:** `PrismaPriceHistoryRepository`
    -   **Açıklama:** `CalculateStatsUseCase`, istatistik hesaplamak için gerekli olan ham veriyi (`son 7 günlük fiyatlar`) almak üzere `priceHistoryRepository.findBySymbolAndTimeRange()` metodunu çağırır. Bu metot, veritabanından ilgili zaman aralığındaki tüm `PriceHistory` kayıtlarını çeker.

5.  **İstatistik Hesaplama (Domain Service):**
    -   **Bileşen:** `StatsCalculatorService` (`src/domain/services/`)
    -   **Açıklama:** `CalculateStatsUseCase`, veritabanından çektiği fiyat listesini, saf iş mantığını barındıran `StatsCalculatorService`'in `calculateStats()` metoduna verir. Bu servis, ortalama, volatilite ve trend gibi hesaplamaları yapar ve yeni bir `PriceStats` nesnesi döndürür.

6.  **Sonucu Kaydetme ve Döndürme:**
    -   **Bileşen:** `PrismaPriceStatsRepository`
    -   **Açıklama:** `CalculateStatsUseCase`, hesaplanan yeni `PriceStats` nesnesini, gelecekteki istekler için önbellek görevi görmesi amacıyla `priceStatsRepository.save()` metodu ile veritabanına kaydeder.
    -   Son olarak, yeni oluşturulan `PriceStats` nesnesi, katmanlar arasında yukarı doğru geri döndürülür ve `StatsController` tarafından kullanıcıya HTTP yanıtı olarak gönderilir.

---
## 3. Bileşenlerin Sorumlulukları

-   **Value Objects (`/domain/value-objects`):** Değiştirilemez, kimliği olmayan ve kendi kurallarını uygulayan nesneler (`Symbol`, `Price`, `Period`, `Trend`). Veri bütünlüğünü sağlarlar.
-   **Entities (`/domain/entities`):** Kimliği olan (`id`) ve yaşam döngüsü boyunca durumu değişebilen nesneler (`PriceHistory`, `PriceStats`).
-   **Repositories (`/domain/repositories`):** Veri erişim operasyonları için sözleşmeleri (arayüzleri) tanımlar. Domain'in altyapıdan bağımsız kalmasını sağlar.
-   **Domain Services (`/domain/services`):** Tek bir varlığa ait olmayan, karmaşık ve saf iş mantığını barındırır (`StatsCalculatorService`).
-   **Use Cases (`/application/use-cases`):** Belirli bir iş akışını baştan sona yönetir. Domain nesnelerini ve servislerini orkestra eder.
-   **Controllers (`/interfaces/controllers`):** HTTP isteklerini alır, gerekli Use Case'leri tetikler ve HTTP yanıtları döndürür.
-   **Infrastructure Components (`/infrastructure`):** Domain arayüzlerini implemente eder (`Prisma...Repository`), dış servislerle konuşur (`CoingeckoClient`) ve arka plan görevlerini çalıştırır (`PriceFetchScheduler`).
-   **Module (`app.module.ts`):** Tüm bu parçaları birbirine bağlayan, bağımlılıkları yöneten ana yapılandırma dosyasıdır.
