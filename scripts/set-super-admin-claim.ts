/**
 * scripts/set-super-admin-claim.ts
 *
 * One-shot CLI to set the `role: 'super-admin'` Firebase custom claim on a user.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/service-account.json \
 *     npx tsx scripts/set-super-admin-claim.ts <uid>
 *
 * Refuses to run if GOOGLE_APPLICATION_CREDENTIALS is unset.
 *
 * After running, the target user MUST sign out + sign in (or force-refresh
 * their ID token) before the new claim takes effect in security rules.
 *
 * Exit codes:
 *   0  success
 *   1  any error (missing env, bad uid, admin SDK failure, etc.)
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

async function main(): Promise<void> {
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credsPath || credsPath.trim() === '') {
    console.error(
      '[set-super-admin-claim] HATA: GOOGLE_APPLICATION_CREDENTIALS env var ' +
        'tanımlı değil. Service account JSON dosyasının mutlak yolunu verin.',
    );
    process.exit(1);
  }

  const uid = process.argv[2];
  if (!uid || uid.trim() === '') {
    console.error(
      '[set-super-admin-claim] HATA: UID gerekli.\n' +
        'Kullanım: npx tsx scripts/set-super-admin-claim.ts <uid>',
    );
    process.exit(1);
  }

  // Initialize admin SDK using ADC (reads GOOGLE_APPLICATION_CREDENTIALS).
  if (getApps().length === 0) {
    initializeApp({ credential: applicationDefault() });
  }

  const auth = getAuth();

  // Print BEFORE state.
  let beforeClaims: Record<string, unknown> | undefined;
  try {
    const userBefore = await auth.getUser(uid);
    beforeClaims = userBefore.customClaims;
    console.log(
      `[set-super-admin-claim] BEFORE  uid=${uid}  claims=`,
      beforeClaims ?? '(none)',
    );
  } catch (err) {
    console.error(
      `[set-super-admin-claim] HATA: UID ${uid} için kullanıcı bulunamadı.`,
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  }

  // Merge into existing claims so we don't clobber unrelated ones.
  const nextClaims: Record<string, unknown> = {
    ...(beforeClaims ?? {}),
    role: 'super-admin',
  };

  try {
    await auth.setCustomUserClaims(uid, nextClaims);
  } catch (err) {
    console.error(
      '[set-super-admin-claim] HATA: setCustomUserClaims çağrısı başarısız.',
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  }

  // Print AFTER state (re-read to confirm propagation).
  const userAfter = await auth.getUser(uid);
  console.log(
    `[set-super-admin-claim] AFTER   uid=${uid}  claims=`,
    userAfter.customClaims,
  );
  console.log(
    '[set-super-admin-claim] OK. Kullanıcı çıkış-giriş yaptıktan sonra ' +
      'token claim refresh olur ve rules.token.role == "super-admin" kontrolü geçer.',
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[set-super-admin-claim] Beklenmeyen hata:', err);
  process.exit(1);
});
