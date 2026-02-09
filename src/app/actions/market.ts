
'use server';

import { fetchAllAgencyOffers } from '@/lib/api-clients';
import type { Brand } from '@/lib/types';

/**
 * Server Action wrapper for fetching marketplace offers.
 */
export async function getApiOffers(): Promise<Brand[]> {
    return fetchAllAgencyOffers();
}
