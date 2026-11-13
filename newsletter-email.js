// Mise en page de la newsletter, utilisée par l'admin pour l'aperçu et pour l'envoi.
// Les messageries ignorent souvent le CSS moderne : tableaux et styles en ligne, polices de secours classiques.
(() => {
  const SITE_URL = /^(localhost|127\.|\[::1\])/.test(location.hostname) ? 'https://alexane-hueber-site.vercel.app' : location.origin;
  const INK = '#0f0f0f';
  const GREY = '#6b6864';
  const CREAM = '#fffdfa';
  const SERIF = "'Instrument Serif', Georgia, 'Times New Roman', serif";
  const BODY = "'EB Garamond', Georgia, 'Times New Roman', serif";
  const MONO = "'DM Mono', 'Courier New', monospace";
  const WIDE = "Archivo, 'Arial Black', Helvetica, Arial, sans-serif";

  // Les accolades sont échappées : Brevo les lirait comme des variables
  const escape = value => String(value ?? '').replace(/[&<>"'{}]/g, char => `&#${char.charCodeAt(0)};`);
  const absolute = src => new URL(src, `${SITE_URL}/`).href;

  const image = (src, alt, href) => {
    if (!src || /\.(mp4|webm|mov)$/i.test(src)) return '';
    const tag = `<img src="${escape(absolute(src))}" alt="${escape(alt)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;">`;
    return href ? `<a href="${escape(href)}" style="display:block;">${tag}</a>` : tag;
  };

  const row = (content, padding = '0 20px') => `<tr><td style="padding:${padding};">${content}</td></tr>`;

  const sectionTitle = label => row(`<p style="margin:0;padding:14px 0 0;border-top:1px solid ${INK};font:400 11px/1.4 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${INK};">${escape(label)}</p>`, '48px 20px 24px');

  const card = item => row(`
    ${image(item.image, item.alt, item.url)}
    ${item.meta ? `<p style="margin:16px 0 0;font:400 11px/1.4 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${GREY};">${escape(item.meta)}</p>` : ''}
    <h3 style="margin:8px 0 0;font:400 30px/1.1 ${SERIF};color:${INK};"><a href="${escape(item.url)}" style="color:${INK};text-decoration:none;">${escape(item.title)}</a></h3>
    ${item.text ? `<p style="margin:10px 0 0;font:400 17px/1.5 ${BODY};color:${INK};">${escape(item.text)}</p>` : ''}
    <p style="margin:12px 0 0;font:italic 400 18px/1.4 ${SERIF};"><a href="${escape(item.url)}" style="color:${INK};">${escape(item.more)}</a></p>
  `, '0 20px 40px');

  window.NEWSLETTER_SITE_URL = SITE_URL;

  window.buildNewsletterEmail = ({ subject = '', title = '', text = '', image: hero = null, articles = [], projects = [] }) => {
    const paragraphs = text.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean);
    const body = [
      row(`<a href="${SITE_URL}/" style="color:${INK};text-decoration:none;font:800 22px/1 ${WIDE};font-stretch:125%;letter-spacing:.04em;text-transform:uppercase;">Studio AH</a>`, '40px 20px 32px'),
      hero?.src ? row(image(hero.src, hero.alt), '0 20px 36px') : '',
      title ? row(`<h1 style="margin:0;font:400 44px/1.05 ${SERIF};color:${INK};">${escape(title)}</h1>`, '0 20px 20px') : '',
      ...paragraphs.map(paragraph => row(`<p style="margin:0;font:400 18px/1.55 ${BODY};color:${INK};">${escape(paragraph).replace(/\n/g, '<br>')}</p>`, '0 20px 16px')),
      articles.length ? sectionTitle('The AH Edit') : '',
      ...articles.map(card),
      projects.length ? sectionTitle('Projects') : '',
      ...projects.map(card),
      row(`
        <p style="margin:0;padding-top:28px;border-top:1px solid ${INK};font:italic 400 30px/1.1 ${SERIF};color:${INK};">a little more <span style="font-family:'Bodoni Moda', Didot, 'Bodoni 72', Georgia, serif;font-weight:500;">AH.</span></p>
        <p style="margin:10px 0 0;font:400 15px/1.5 ${BODY};color:${GREY};">Design notes, creative discoveries &amp; studio news.</p>
        <p style="margin:24px 0 0;font:400 11px/1.8 ${MONO};letter-spacing:.1em;text-transform:uppercase;color:${GREY};">
          <a href="${SITE_URL}/" style="color:${INK};">Website</a> &nbsp;·&nbsp; <a href="${SITE_URL}/contact.html" style="color:${INK};">Contact</a> &nbsp;·&nbsp; <a href="{{ unsubscribe }}" style="color:${GREY};">Unsubscribe</a>
        </p>
      `, '24px 20px 48px')
    ].join('');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,800&family=EB+Garamond&family=Bodoni+Moda:ital,opsz,wght@1,6..96,500&family=DM+Mono&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${CREAM};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
${body}
</table>
</td></tr>
</table>
</body>
</html>`;
  };
})();
