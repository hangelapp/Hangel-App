'use server';

/**
 * ReklamAction API'sinden teklifleri (markaları) çeken sunucu eylemi.
 * API Anahtarı ve Network bilgileri burada güvenli bir şekilde işlenir.
 */
export async function getApiOffers() {
    const API_KEY = "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54";
    const url = "https://api.reklamaction.com/v1/offer?network=reklamaction";

    try {
        console.log("ReklamAction API bağlantısı kuruluyor...");
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`API Bağlantı Hatası: ${response.status}`);
            return null;
        }

        const result = await response.json();
        
        // Log ham verileri kontrol etmek için (Server konsolunda görünür)
        if (result.data && result.data.length > 0) {
            console.log("Örnek Payout Verisi:", result.data[0].payout);
        }
        
        console.log("Canlı veri akışı sağlandı:", result.data?.length, "yeni marka bulundu.");
        
        return result.data || [];
    } catch (e) {
        console.error("Fetch işlemi başarısız oldu:", e);
        return null;
    }
}
