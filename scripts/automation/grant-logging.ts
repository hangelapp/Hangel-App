/**
 * Service account'a roles/logging.viewer ekle (Owner SA üzerinden).
 */
import { google } from 'googleapis';
import { readFileSync } from 'fs';

const PROJECT = 'hangel-new-v18-87297865-9bcc3';
const SA_EMAIL = 'firebase-adminsdk-fbsvc@hangel-new-v18-87297865-9bcc3.iam.gserviceaccount.com';
const ROLE = 'roles/logging.viewer';

async function main() {
  const key = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS!, 'utf-8'));
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const crm = google.cloudresourcemanager({ version: 'v1', auth });
  const { data: policy } = await crm.projects.getIamPolicy({
    resource: PROJECT, requestBody: { options: { requestedPolicyVersion: 3 } },
  });
  const member = `serviceAccount:${SA_EMAIL}`;
  let binding = policy.bindings?.find(b => b.role === ROLE);
  if (binding) {
    if (binding.members?.includes(member)) {
      console.log('Already has role.'); return;
    }
    binding.members?.push(member);
  } else {
    policy.bindings = policy.bindings ?? [];
    policy.bindings.push({ role: ROLE, members: [member] });
  }
  await crm.projects.setIamPolicy({ resource: PROJECT, requestBody: { policy } });
  console.log(`Granted ${ROLE} to ${SA_EMAIL}`);
}
main().catch(e => { console.error(e?.errors ?? e.message); process.exit(1); });
