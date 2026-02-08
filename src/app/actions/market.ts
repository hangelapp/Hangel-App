'use server';

/**
 * ReklamAction API'sinden teklifleri çeken sunucu eylemi.
 * CORS sorunlarını aşmak ve API anahtarını güvenli tutmak için sunucu tarafında çalışır.
 */
export async function getApiOffers() {
    const API_KEY = "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54";
    const url = "https://api.reklamaction.com/v1/offer?network=reklamaction";

    try {
        console.log("ReklamAction API isteği başlatılıyor...");
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`
            },
            cache: 'no-store' // Canlı veri için cache devre dışı
        });

        if (!response.ok) {
            console.error(`API Hatası: ${response.status} - ${response.statusText}`);
            return null;
        }

        const result = await response.json();
        console.log("API verisi başarıyla çekildi:", result.data?.length, "teklif bulundu.");
        
        return result.data || [];
    } catch (e) {
        console.error("ReklamAction API Fetch Hatası:", e);
        return null;
    }
}
