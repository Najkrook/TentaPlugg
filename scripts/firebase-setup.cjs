// Uses the already authenticated Firebase CLI account. Never prints credentials.
const auth = require('C:/Users/Najk/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth.js');
const project = 'tentaplugg-japanska-2026';
(async () => {
  const account = auth.getGlobalDefaultAccount();
  const token = await auth.getAccessToken(account.tokens.refresh_token, [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/firebase',
  ]);
  async function api(url, method = 'GET', body) {
    const r = await fetch(url, {
      method,
      headers: {
        Authorization: 'Bearer ' + token.access_token,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json();
    if (!r.ok) throw new Error(r.status + ' ' + JSON.stringify(j));
    return j;
  }
  if (process.argv[2] === 'config') {
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    cfg.auth = {
      providers: {
        googleSignIn: {
          oAuthBrandDisplayName: 'TentaPlugg Japanska',
          supportEmail: account.user.email,
          authorizedRedirectUris: [
            `https://${project}.firebaseapp.com/__/auth/handler`,
            `https://${project}.web.app/__/auth/handler`,
          ],
        },
      },
    };
    fs.writeFileSync('firebase.json', JSON.stringify(cfg, null, 2));
    console.log('Auth deployment configuration saved');
  } else if (process.argv[2] === 'enable') {
    for (const service of ['firestore.googleapis.com', 'identitytoolkit.googleapis.com']) {
      await api(
        `https://serviceusage.googleapis.com/v1/projects/${project}/services/${service}:enable`,
        'POST',
        {},
      );
      console.log('Enabled ' + service);
    }
  } else if (process.argv[2] === 'auth') {
    await api(
      `https://identitytoolkit.googleapis.com/v2/projects/${project}/identityPlatform:initializeAuth`,
      'POST',
      {},
    ).catch((e) => {
      if (!e.message.includes('ALREADY_EXISTS')) throw e;
    });
    const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}`;
    await api(base + '/config?updateMask=authorizedDomains', 'PATCH', {
      authorizedDomains: ['localhost', `${project}.firebaseapp.com`, `${project}.web.app`],
    });
    await api(base + '/defaultSupportedIdpConfigs?idpId=google.com', 'POST', {
      enabled: true,
      clientId: '',
      clientSecret: '',
    });
    console.log('Google provider configured');
  } else {
    const billing = await api(
      `https://cloudbilling.googleapis.com/v1/projects/${project}/billingInfo`,
    );
    console.log(JSON.stringify({ billingEnabled: billing.billingEnabled }));
    const cfg = await api(
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`,
    );
    console.log(JSON.stringify({ authorizedDomains: cfg.authorizedDomains }));
    const ids = await api(
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/defaultSupportedIdpConfigs`,
    );
    console.log(
      JSON.stringify(
        (ids.defaultSupportedIdpConfigs || []).map((x) => ({ name: x.name, enabled: x.enabled })),
      ),
    );
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
