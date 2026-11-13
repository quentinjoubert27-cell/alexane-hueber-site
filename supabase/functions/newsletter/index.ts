// Envoi de la newsletter depuis l'admin, avec Brevo. Seul un compte admin connecté peut s'en servir.
// Secrets utilisés (Supabase > Edge Functions > Secrets), les mêmes que pour la fonction contact :
// BREVO_API_KEY, MAIL_FROM (expéditeur validé dans Brevo), BREVO_LIST_ID (liste des abonnés).
// À déployer avec « Verify JWT » désactivé : la fonction vérifie elle-même que l'appel vient d'un admin.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info'
};
const BREVO_API = 'https://api.brevo.com/v3';
const SENDER_NAME = 'Studio AH';
const SUBJECT_MAX = 150;
const HTML_MAX = 400_000;
const HISTORY_SIZE = 10;

const reply = (status: number, body: object) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS, 'Content-Type': 'application/json' }
});

const brevo = (path: string, method = 'GET', body?: object) => fetch(`${BREVO_API}${path}`, {
  method,
  headers: { 'api-key': Deno.env.get('BREVO_API_KEY') ?? '', 'Content-Type': 'application/json', Accept: 'application/json' },
  body: body ? JSON.stringify(body) : undefined
});

// Renvoie l'e-mail du compte connecté s'il est admin, sinon null
const adminEmail = async (request: Request) => {
  const headers = {
    apikey: request.headers.get('apikey') ?? '',
    Authorization: request.headers.get('authorization') ?? '',
    'Content-Type': 'application/json'
  };
  const base = Deno.env.get('SUPABASE_URL');
  const [user, admin] = await Promise.all([
    fetch(`${base}/auth/v1/user`, { headers }),
    fetch(`${base}/rest/v1/rpc/is_admin`, { method: 'POST', headers, body: '{}' })
  ]);
  if (!user.ok || !admin.ok || (await admin.json()) !== true) return null;
  return (await user.json()).email ?? null;
};

const brevoError = async (label: string, response: Response) => {
  const detail = await response.text();
  console.error(label, response.status, detail);
  let message = '';
  try { message = JSON.parse(detail).message ?? ''; } catch { /* réponse non JSON */ }
  return reply(502, { error: message ? `${label} : ${message}` : label });
};

const status = async (listId: number) => {
  const [list, campaigns] = await Promise.all([
    brevo(`/contacts/lists/${listId}`),
    brevo(`/emailCampaigns?type=classic&status=sent&limit=50&sort=desc&statistics=globalStats`)
  ]);
  if (!list.ok) return brevoError('Liste Brevo introuvable', list);
  const { totalSubscribers = 0 } = await list.json();
  const sent = campaigns.ok ? (await campaigns.json()).campaigns ?? [] : [];
  const history = sent
    .filter((campaign: any) => campaign.recipients?.lists?.includes(listId))
    .slice(0, HISTORY_SIZE)
    .map((campaign: any) => ({
      subject: campaign.subject,
      sentDate: campaign.sentDate,
      sent: campaign.statistics?.globalStats?.sent ?? null
    }));
  return reply(200, { subscribers: totalSubscribers, history });
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });

  const email = await adminEmail(request);
  if (!email) return reply(403, { error: 'Réservé aux comptes admin.' });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return reply(400, { error: 'Requête invalide.' });
  }

  const listId = Number(Deno.env.get('BREVO_LIST_ID'));
  if (!listId) return reply(500, { error: 'Le secret BREVO_LIST_ID manque dans Supabase.' });
  if (data.action === 'status') return status(listId);

  const subject = typeof data.subject === 'string' ? data.subject.trim() : '';
  const html = typeof data.html === 'string' ? data.html : '';
  if (!subject || subject.length > SUBJECT_MAX || !html || html.length > HTML_MAX) return reply(400, { error: 'Objet ou contenu invalide.' });
  const sender = { name: SENDER_NAME, email: Deno.env.get('MAIL_FROM') };

  if (data.action === 'test') {
    const sent = await brevo('/smtp/email', 'POST', {
      sender,
      to: [{ email }],
      subject: `[Test] ${subject}`,
      htmlContent: html.replaceAll('{{ unsubscribe }}', '#')
    });
    return sent.ok ? reply(200, { ok: true, to: email }) : brevoError("L'e-mail de test n'a pas pu partir", sent);
  }

  if (data.action === 'send') {
    const day = new Date().toISOString().slice(0, 10);
    const created = await brevo('/emailCampaigns', 'POST', {
      name: `Newsletter ${day} — ${subject}`.slice(0, 250),
      subject,
      sender,
      htmlContent: html,
      recipients: { listIds: [listId] }
    });
    if (!created.ok) return brevoError("La newsletter n'a pas pu être créée", created);
    const { id } = await created.json();
    const sent = await brevo(`/emailCampaigns/${id}/sendNow`, 'POST');
    return sent.ok ? reply(200, { ok: true }) : brevoError("La newsletter n'a pas pu partir", sent);
  }

  return reply(400, { error: 'Action inconnue.' });
});
