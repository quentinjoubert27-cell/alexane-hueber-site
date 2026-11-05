// Charge les projets, les articles et les textes depuis Supabase, puis lance le site.
// Si la base est vide ou injoignable, le site garde les contenus de projects.js, articles.js et le texte provisoire des pages.
const LOAD_TIMEOUT = 4000;

const loadRows = async (table, query) => {
  try {
    const response = await fetch(`${window.SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: window.SUPABASE_KEY },
      signal: AbortSignal.timeout(LOAD_TIMEOUT)
    });
    if (!response.ok) throw new Error(`Réponse ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`Contenu de secours affiché pour ${table} :`, error.message);
    return [];
  }
};

// Remplace les textes et les images marqués dans les pages : data-image pour une image, data-text pour un texte simple,
// data-text-paragraphs pour des paragraphes séparés par une ligne vide, data-text-list pour un élément par ligne
const fillElements = (element, tag, parts) => element.replaceChildren(...parts.map(part => {
  const child = document.createElement(tag);
  child.textContent = part.trim();
  return child;
}));

const applyTexts = texts => {
  document.querySelectorAll('[data-image]').forEach(image => {
    const key = image.dataset.image;
    if (texts[key]) image.src = texts[key];
    if (texts[`${key}_alt`]) image.alt = texts[`${key}_alt`];
  });
  document.querySelectorAll('[data-text]').forEach(element => {
    const value = texts[element.dataset.text];
    if (value) {
      element.textContent = value;
      element.classList.remove('lg-todo');
    }
  });
  document.querySelectorAll('[data-text-paragraphs]').forEach(element => {
    const value = texts[element.dataset.textParagraphs];
    if (value) fillElements(element, 'p', value.split(/\n\s*\n/).filter(part => part.trim()));
  });
  document.querySelectorAll('[data-text-list]').forEach(element => {
    const value = texts[element.dataset.textList];
    if (value) fillElements(element, 'li', value.split('\n').filter(part => part.trim()));
  });
};

const loadScript = src => new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = src;
  script.async = false;
  script.onload = resolve;
  script.onerror = reject;
  document.body.append(script);
});

const startSite = async () => {
  const [projects, articles, texts] = await Promise.all([
    loadRows('projects', 'select=slug,title,category,location,year,area,images,texts&published=eq.true&order=position,created_at'),
    loadRows('articles', 'select=slug,title,date,tag,excerpt,images,texts&published=eq.true&order=date.desc'),
    loadRows('site_texts', 'select=key,value')
  ]);
  if (projects.length) window.PROJECTS = projects;
  window.SITE_TEXTS = Object.fromEntries(texts.map(({ key, value }) => [key, value]));
  if (window.SITE_TEXTS['site.categories']) window.CATEGORIES = JSON.parse(window.SITE_TEXTS['site.categories']);
  applyTexts(window.SITE_TEXTS);
  document.documentElement.classList.add('texts-ready');
  await loadScript('articles.js');
  if (articles.length) window.ARTICLES = articles;
  await loadScript('site.js');
};

startSite();
