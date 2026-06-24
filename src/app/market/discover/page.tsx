/**
 * /market/discover → /market kalıcı yönlendirmesi.
 *
 * Discover deneyimi (ürün vitrini) artık doğrudan /market'te. Eski /market/discover
 * bağlantıları/yer imleri çalışmaya devam etsin diye buradan /market'e yönlendirilir.
 */
import { redirect } from 'next/navigation';

export default function MarketDiscoverRedirect() {
  redirect('/market');
}
