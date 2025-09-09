# DDD Öğrenme Günlüğü: Olaylar (Events) ve İstisnalar (Exceptions)

Bu günlük, Domain-Driven Design (DDD) mimarisindeki iki güçlü kavram olan **Olaylar (Events)** ve **İstisnalar (Exceptions)**'ın neden ve nasıl kullanıldığını anlamak için oluşturulmuştur.

## Bölüm 1: Olaylar (Events) - Kasabadaki Tellal

DDD'de "Olay", sisteminizde gerçekleşen ve iş açısından önemli olan bir durumu ifade eder. Bunu anlamanın en kolay yolu "kasaba tellalı" benzetmesidir.

Eski bir kasaba düşünün. Kasabada önemli bir şey olduğunda (örneğin, "Kralın yeni bir emri var!" veya "Bu akşam pazar yerinde şenlik var!"), bir **tellal** meydana çıkar ve bunu bağırarak herkese duyurur.

- **Tellalın görevi:** Sadece haberi duyurmaktır.
- **Tellal kimin dinlediğini umursar mı?** Hayır. Fırıncı mı dinliyor, demirci mi, yoksa evindeki teyze mi, hiç umrunda değildir. O sadece "OLAYI" duyurur.
- **Dinleyenler ne yapar?** Herkes bu habere göre kendi işini yapar. Fırıncı şenlik için daha çok ekmek yapar, demirci dükkanını erken kapatır, teyze pencereden izler.

Bizim projemizdeki sistem de tam olarak böyle çalışır.

### `PriceSavedEvent.ts` Neden **Domain** Katmanında?

Bu dosya, **duyurulacak haberin kendisidir**. Yani tellalın bağıracağı metindir: "Bir fiyat kaydedildi! İşte detayları..."

`PriceSavedEvent.ts` dosyasının `domain` katmanında olmasının sebebi şudur:

**"Bir fiyatın kaydedilmesi" olayı, projenin temel bir iş kuralıdır. Teknik bir detay değildir.**

Bu, projenin "ortak dilinin" (Ubiquitous Language) bir parçasıdır. Tıpkı `PriceHistory` veya `Symbol` gibi, `PriceSavedEvent` de işimizin temel bir kavramıdır. Domain katmanı, bu temel kavramların ve kuralların yaşadığı yerdir. Bu dosya sadece şunu söyler: "Eğer bir fiyat kaydedilirse, bu olayın içinde kaydedilen fiyatın bilgisi (`PriceHistory`) bulunmalıdır." Bu kadar. Nasıl duyurulacağıyla veya kimin dinleyeceğiyle ilgilenmez.

### `EventEmitter` Library'si Neden **Domain**'de Değil?

`EventEmitter`, bizim **kasaba tellalımızın ta kendisidir**. O, haberi (event'i) alıp bağıran **araçtır**.

- **`PriceSavedEvent` (Domain'de):** Duyurulacak haberin ne olduğu (**WHAT**).
- **`EventEmitter` (Altyapı/Uygulama'da):** Haberin nasıl duyurulacağı (**HOW**).

`EventEmitter` yerine başka bir teknoloji de kullanabilirdik (örn: `RabbitMQ`, `Kafka`). Araçlar (teknoloji) değişebilir, ama duyurulan haberin (iş olayının) kendisi değişmez. İşte bu yüzden teknolojiye bağımlı olan `EventEmitter`'ı domain katmanına asla sokmayız. Domain katmanı saf ve temiz kalmalıdır.

### Olayların DDD'deki Önemi: Ayrıştırma (Decoupling)

Bu yapının en büyük avantajı, sistemin parçalarını birbirinden ayırmasıdır.

`SavePriceUseCase`'in tek bir sorumluluğu vardır: **Fiyatı kaydetmek.**

Fiyat kaydedildikten sonra yapılması gereken diğer işleri (istatistik hesaplama, alarm kontrolü, bildirim gönderme vb.) düşünmek zorunda kalmaz. O sadece haberini duyurur ve çekilir.

Diğer servisler (`CalculateStatsUseCase`, `CheckAlertsUseCase` vb.) bu haberi dinler ve kendi görevlerini bağımsız olarak yaparlar. Bu, sistemin parçalarının birbirine spagetti gibi dolanmasını engeller, kodun daha temiz, test edilebilir ve yönetilebilir olmasını sağlar.

## Bölüm 2: İstisnalar (Exceptions) - İş Kurallarının Bekçileri

DDD'de `domain` katmanına özel istisna (exception) sınıfları oluşturmak da çok önemlidir.

Örnek: `InvalidSymbolException.ts`

### Neden Standart `Error` Kullanmıyoruz?

Elbette `throw new Error('Geçersiz sembol');` de diyebilirdik. Ancak özel bir sınıf oluşturmamızın sebepleri var:

1.  **Anlam Yüklemek:** `InvalidSymbolException` adı, hatanın ne olduğunu standart `Error`'dan çok daha net bir şekilde ifade eder. Bu, yine "ortak dil" prensibinin bir parçasıdır. Kodu okuyan biri, hatanın türünü anında anlar.

2.  **Programatik Olarak Yakalamak:** Uygulamanın üst katmanlarında (örneğin API Controller'da), hataları türüne göre yakalayıp farklı tepkiler verebiliriz.

    ```typescript
    try {
    	// ... bir işlem yap ...
    } catch (error) {
    	if (error instanceof InvalidSymbolException) {
    		// Kullanıcıya 400 Bad Request hatası dön ve "Lütfen geçerli bir sembol girin" de.
    	} else if (error instanceof DatabaseConnectionException) {
    		// Kullanıcıya 500 Internal Server Error hatası dön ve "Sistemde bir sorun oluştu" de.
    	} else {
    		// Bilinmeyen bir hata, logla.
    	}
    }
    ```

    Eğer sadece `new Error()` kullansaydık, hatanın içeriğini (mesaj metnini) kontrol etmek zorunda kalırdık ki bu çok kırılgan ve kötü bir yöntemdir.

3.  **İş Kuralını Vurgulamak:** "Bir sembolün geçersiz olması", bir yazılım hatasından (null pointer gibi) ziyade, bir **iş kuralının ihlalidir**. Özel exception sınıfları, bu iş kurallarını kodun içinde birinci sınıf vatandaş yapar.

Özetle, hem **Domain Events** hem de **Custom Domain Exceptions**, domain katmanının daha anlamlı, daha temiz ve dış dünyadan daha bağımsız olmasını sağlayan, DDD'nin temel yapı taşlarıdır. Olaylar sistemin farklı parçalarının gevşek bir şekilde iletişim kurmasını sağlarken, istisnalar iş kurallarının ihlal edildiğini anlamlı bir şekilde bildirir.
