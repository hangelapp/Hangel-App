const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const serviceAccount = {
  "type": "service_account",
  "project_id": "hangel-new-v18-87297865-9bcc3",
  "private_key_id": "821aee5c5f15d6abaf3bbda068a501b299c55827",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDnkvRuXxqZQptD\nlSzk2ZcE6qqz63gKQGm4Evld+LI6+hQ6Zjmp+nVTicnk5rjnPczuQIuvXN3DvxL0\n3u7bF0l15vo1GPzeSqP51QdpmL3sH22uwBpt7rFeS6nwjDNj4Auypt6PdOab8MN8\nfqTUNngl+Vc22OGiEnfv96YkzkW7M89ArONdzIadayV2i9putBOKdQw9zxfnQsKx\n+D2SujutqXpSVl1I2j+7zuV61+LDBGC2DJEUnczPKYq8lcNRToIoarMdaare4w8G\ngfp6ccb/dax+7KQt3NEtJ7nQG08rMXlB4jYeRwBLtwYMPORfV4EUpGZZV93mIjoS\nSpjNeRH9AgMBAAECggEAT/mjHAkRTRPBPnZi8kgpTUPkH033f4beW/mFkIwmtZKP\ncNnEGW2LnoWsKbb67bWctD2rYC1Q010GZXYmhJjGwIa8K6FNF1Iszkfhjvj2wnja\nLuteVVAFhnzYHGC3EMucDp9tppqnV/yu7qxoLXgAR5EUqzb8ubXqIQBkqzpnv64N\nGOYjZoRZ9COz7KbSY/qm0sIDfmWCgIHnYc1SCtyZqHYtNGXlh+KHAfWrPZ2DeKxD\nWSNbxEEdfdZ/g6okgBPJzJLErLtB1XGhhfbPdehkyWykq90zm1sNfNDg3Q2itaaJ\nVvZpMPVS073jKSlsCGJCNwFK+Ttx8Hdf6LAeDxlMmwKBgQD9n/qiBbKY7FL3CPMz\ntmaONKIMXCdnW712u4H4tauHbN59Hju6j7qsqky/fyv/IcCT7veIZu+HRtu9r+GR\nekQIgsYDVpl8/XNC9+UWX5a6Fz4d9UlDrkcDMdvgMWe3NCtAkXN2AGlP149vGrRC\nlYc6g4aaNiICdc8bPjYrOk3lnwKBgQDpvhzZaJ4fS3jUjiDu2a4cS0pI3sbET2lF\nKDQ6Tv/etP1B6MpzD/0VdToV+awXf6FCfSixYxgI7i9TeCuguL31vOoL5unkrm0N\n/GM5dVkq9itlkI5cr6AcQ6WAhs1W4U+JjJYWU/tQeH1nnn1naRe/JCkgEt9/kC7s\nCvbqa2nK4wKBgQC+ArvX5OLf1LV3ZBooVO/SfDYngmb29XElYedGuHxQkkzBegQP\nihy1vUSQdys0Ekpfyjli1JOBSqHYI8ufnPUZVzgYSinlzVAsDOJxd53Jvx4Hfbus\n3AVRrGnpNbpZM9lvn0jcUASWD43jFCOWesX8HYubPxENvMszwtD8Y8r2SwKBgHbq\nr8a0AO4u+XQ6MusReBERBOP54unw9L+oapnXozlsnwQvKQBM/Bc0oq6XbUQvPJ2V\nC2Tj41B3zUAL/TYxhwNEb1ZKzmf3jaf15Y1P9GN1BjMPzj29ZBm9GLBA5Kr0ygBS\ns/D8HPmdsz9KVMaNovUtsnaM44QEmLqiAWjV6Oa9AoGBAIYniserCVcAEPBpjmil\nJBdEeV+aP44Oh+uDfoFRTvsgHykIzlnEe7B2lknDLmiPszMi0WdWDy3pA4cQ/Jwk\nCey9aedAw5Z1gi7Ie54m65O6GcZkPID0FSEFoA28hIMTgL8jCTTGOXOdjBm8ZFCj\n8BBTvcLtJn9cM2ElyyfW9QFv\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@hangel-new-v18-87297865-9bcc3.iam.gserviceaccount.com",
  "client_id": "108395402860958622735",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40hangel-new-v18-87297865-9bcc3.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

async function deployRules() {
  try {
    // Get access token
    const token = jwt.sign(
      {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase',
        aud: 'https://oauth2.googleapis.com/token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      },
      serviceAccount.private_key,
      { algorithm: 'RS256' }
    );

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token
    });

    const accessToken = tokenRes.data.access_token;

    // Read rules
    const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

    // Deploy rules
    const deployRes = await axios.post(
      `https://firebaserules.googleapis.com/v1/projects/hangel-new-v18-87297865-9bcc3/releases`,
      {
        rulesetId: 'cloud:firestore:rules'
      },
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    console.log('✓ Rules deployed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

deployRules();
