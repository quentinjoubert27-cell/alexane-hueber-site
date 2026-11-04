// Charge les projets publiés depuis Supabase, puis lance le site.
// Si la base est vide ou injoignable, le site garde les projets de projects.js.
const LOAD_TIMEOUT = 4000;

const loadProjects = async () => {
  try {
    const fields = 'slug,title,category,location,year,area,images,texts';
    const response = await fetch(`${window.SUPABASE_URL}/rest/v1/projects?select=${fields}&published=eq.true&order=position,created_at`, {
      headers: { apikey: window.SUPABASE_KEY },
      signal: AbortSignal.timeout(LOAD_TIMEOUT)
    });
    if (!response.ok) throw new Error(`Réponse ${response.status}`);
    const projects = await response.json();
    if (projects.length) window.PROJECTS = projects;
  } catch (error) {
    console.warn('Projets de secours affichés :', error.message);
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

loadProjects()
  .then(() => loadScript('articles.js'))
  .then(() => loadScript('site.js'));
