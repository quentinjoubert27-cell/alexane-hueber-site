// Charge les projets et les articles publiés depuis Supabase, puis lance le site.
// Si la base est vide ou injoignable, le site garde les contenus de projects.js et articles.js.
const LOAD_TIMEOUT = 4000;

const loadRows = async (table, fields, order) => {
  try {
    const response = await fetch(`${window.SUPABASE_URL}/rest/v1/${table}?select=${fields}&published=eq.true&order=${order}`, {
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

const loadScript = src => new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = src;
  script.async = false;
  script.onload = resolve;
  script.onerror = reject;
  document.body.append(script);
});

const startSite = async () => {
  const [projects, articles] = await Promise.all([
    loadRows('projects', 'slug,title,category,location,year,area,images,texts', 'position,created_at'),
    loadRows('articles', 'slug,title,date,tag,excerpt,images,texts', 'date.desc')
  ]);
  if (projects.length) window.PROJECTS = projects;
  await loadScript('articles.js');
  if (articles.length) window.ARTICLES = articles;
  await loadScript('site.js');
};

startSite();
