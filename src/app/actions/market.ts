'use server';

/**
 * ReklamAction API'sinden teklifleri (markaları) çeken sunucu eylemi.
 * Kullanıcı tarafından sağlanan Express mantığı Next.js Server Action olarak yapılandırılmıştır.
 */
export async function getApiOffers() {
    const API_KEY = "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54";
    const url = "https://api.reklamaction.com/v1/offer?network=reklamaction";

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`
            },
            cache: 'no-store' // Canlı veri için önbelleği devre dışı bırakıyoruz
        });

        if (!response.ok) {
            console.error(`API Error: ${response.status}`);
            return null;
        }

        const result = await response.json();
        
        // API'den gelen ham veri içindeki 'data' dizisini döndürüyoruz
        return result.data || [];
    } catch (e) {
        console.error("Fetch failed:", e);
        return null;
    }
}
