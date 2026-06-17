/**
 * WhatsApp Cloud provider factory.
 *
 * WABA_STUB=true ortamında StubWhatsAppCloud döner (local dev).
 * Aksi halde gerçek MetaWhatsAppCloud.
 */

import { MetaWhatsAppCloud, type MetaCloudConfig } from './meta-cloud';
import { StubWhatsAppCloud } from './stub';

export * from './meta-cloud';
export { StubWhatsAppCloud } from './stub';

export type WhatsAppProvider = MetaWhatsAppCloud | StubWhatsAppCloud;

export function getWhatsAppProvider(config: MetaCloudConfig): WhatsAppProvider {
    if (process.env.WABA_STUB === 'true') {
        return new StubWhatsAppCloud(config);
    }
    return new MetaWhatsAppCloud(config);
}
