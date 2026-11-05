// Reçoit les formulaires du site (contact et newsletter) et envoie la demande par mail au studio, avec Brevo.
// À configurer dans Supabase (Edge Functions > Secrets), jamais dans le code :
// BREVO_API_KEY, MAIL_TO (adresse qui reçoit les demandes), MAIL_FROM (expéditeur validé dans Brevo).
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info'
};
const BREVO_API = 'https://api.brevo.com/v3';
const SENDER_NAME = 'Alexane Hueber';
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_MAX = 200;
const MESSAGE_MAX = 5000;

const reply = (status: number, body: object) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS, 'Content-Type': 'application/json' }
});

const clean = (value: unknown, max = FIELD_MAX) => typeof value === 'string' ? value.trim().slice(0, max) : '';

const brevo = (path: string, body: object) => fetch(`${BREVO_API}${path}`, {
  method: 'POST',
  headers: { 'api-key': Deno.env.get('BREVO_API_KEY') ?? '', 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const sendMail = (to: string, subject: string, textContent: string, replyTo: string) => brevo('/smtp/email', {
  sender: { name: SENDER_NAME, email: Deno.env.get('MAIL_FROM') },
  to: [{ email: to }],
  subject,
  textContent,
  replyTo: { email: replyTo }
});

const readRequest = (data: Record<string, unknown>) => {
  const email = clean(data.email);
  if (!EMAIL_FORMAT.test(email)) return null;
  if (data.kind === 'newsletter') {
    return { kind: 'newsletter' as const, email, subscribes: true, subject: 'Nouvelle inscription à la newsletter', text: `Nouvelle inscription à la newsletter : ${email}` };
  }
  const firstName = clean(data.first_name);
  const lastName = clean(data.last_name);
  const inquiry = clean(data.inquiry_type);
  const phone = clean(data.phone);
  const message = clean(data.message, MESSAGE_MAX);
  if (data.kind !== 'contact' || !firstName || !lastName || !inquiry || !phone || !message) return null;
  const subscribes = data.newsletter === true;
  return {
    kind: 'contact' as const,
    email,
    subscribes,
    subject: `Nouvelle demande : ${inquiry} — ${firstName} ${lastName}`,
    text: [
      `Nom : ${firstName} ${lastName}`,
      `Profil : ${clean(data.client_type)}`,
      `E-mail : ${email}`,
      `Téléphone : ${phone}`,
      `Demande : ${inquiry}`,
      `Newsletter : ${subscribes ? 'oui' : 'non'}`,
      '',
      message
    ].join('\n')
  };
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return reply(400, { error: 'Invalid request' });
  }
  // Case invisible pour un humain : si elle est cochée, c'est un robot, à qui on répond comme si tout allait bien
  if (data.botcheck) return reply(200, { ok: true });

  const form = readRequest(data);
  if (!form) return reply(400, { error: 'Invalid request' });

  const notified = await sendMail(Deno.env.get('MAIL_TO') ?? '', form.subject, form.text, form.email);
  if (!notified.ok) {
    console.error('Mail au studio refusé', notified.status, await notified.text());
    return reply(502, { error: 'Email could not be sent' });
  }

  if (form.subscribes) {
    const added = await brevo('/contacts', { email: form.email, updateEnabled: true });
    if (!added.ok) console.error('Contact Brevo refusé', added.status, await added.text());
  }
  return reply(200, { ok: true });
});
