const { PROJECTS, CATEGORIES } = window;
const MEGA_PROJECTS = 6;
const SEARCH_SUGGESTIONS = 3;
// Tant qu'un projet n'a pas ses vrais textes et sa fiche, sa page affiche ce texte provisoire
const LOREM_SHORT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const LOREM_LONG = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';
const LOREM_PROJECT_TEXTS = [LOREM_LONG, LOREM_SHORT, LOREM_LONG];
// Texte saisi dans l'onglet Textes de l'admin, sinon le texte provisoire
const pageText = (key, fallback) => window.SITE_TEXTS?.[key] || fallback;
const HEADER_TOP_ZONE = .25;
const HERO_PARALLAX = .14;
const STUDIO_INTRO_END = .8;
const CAROUSEL_DELAY = 4000;

// Enchaînement des images d'une page projet, repris du modèle : il se répète tant qu'il reste des images
const LAYOUT = ['center', 'full', 'overlap', 'full', 'asym', 'pair', 'asym-reverse', 'overlap', 'pair', 'asym-reverse', 'full', 'center', 'full'];
const LAYOUT_IMAGES = { center: 1, full: 1, overlap: 2, asym: 2, 'asym-reverse': 2, pair: 2 };

const homeHref = document.body.dataset.page === 'home' ? '' : 'index.html';
const projectHref = project => `project.html?p=${encodeURIComponent(project.slug)}`;
const sortedArticles = () => [...(window.ARTICLES ?? [])].sort((a, b) => b.date.localeCompare(a.date));
const articleHref = article => `article.html?a=${encodeURIComponent(article.slug)}`;
const categoryLabel = id => CATEGORIES.find(category => category.id === id)?.label ?? '';

const escapeHTML = value => String(value).replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

// Une vraie image si elle a un « src », sinon l'aplat de couleur provisoire
const mediaHTML = image => image?.src
  ? `<span class="media"><img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt ?? '')}" loading="lazy"></span>`
  : `<span class="media ${image?.ph ?? 'ph-hero'}"></span>`;

const megaColumns = CATEGORIES.filter(category => PROJECTS.some(project => project.category === category.id)).length;
const megaHTML = CATEGORIES.map(category => {
  const projects = PROJECTS.filter(project => project.category === category.id);
  if (!projects.length) return '';
  return `
          <div>
            <a class="mega__img" href="${projectHref(projects[0])}" tabindex="-1" aria-hidden="true">${mediaHTML(projects[0].images[0])}</a>
            <h3 class="wide">${escapeHTML(category.label)}</h3>
            <ul>
              ${projects.slice(0, MEGA_PROJECTS).map(project => `<li><a href="${projectHref(project)}">${escapeHTML(project.title)}</a></li>`).join('\n              ')}
            </ul>
            ${projects.length > MEGA_PROJECTS ? `<a class="more" href="projects.html#${category.id}">View more</a>` : ''}
          </div>`;
}).join('');

// La recherche couvre les projets (proposés en premier) et les articles de HUEBERvibe
const searchEntries = [
  ...PROJECTS.map(project => ({ href: projectHref(project), image: project.images[0], title: project.title, label: categoryLabel(project.category) })),
  ...sortedArticles().map(article => ({ href: articleHref(article), image: article.images[0], title: article.title, label: `HUEBERvibe · ${article.tag}` }))
];
const searchItemsHTML = searchEntries.map(entry => `<a class="search__item" href="${entry.href}">
        <span class="search__img">${mediaHTML(entry.image)}</span>
        ${escapeHTML(entry.title)}
        <small>${escapeHTML(entry.label)}</small>
      </a>`).join('\n      ');

document.querySelector('.site-header').innerHTML = `
  <nav class="site-nav" aria-label="Main navigation">
    <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-main">
      <svg class="icon-open" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M1 5.5h22M1 12h22M1 18.5h22"/></svg>
      <svg class="icon-close" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="m4 4 16 16M20 4 4 20"/></svg>
    </button>
    <ul class="nav-main" id="nav-main">
      <li class="has-panel">
        <a class="projects-link" href="projects.html">Projects<svg class="nav-chevron" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></a>
        <div class="mega" style="--mega-cols: ${megaColumns}">${megaHTML}<a class="more mega__all" href="projects.html">All projects</a></div>
      </li>
      <li><a href="studio.html">Studio</a></li>
      <li class="nav-world-mobile"><a class="nav-world" href="vibe.html"><span class="wide">Hueber</span><em>vibe</em></a></li>
    </ul>
    <a class="site-logo wide" href="${homeHref || '#'}" aria-label="Alexane Hueber — home"><span>Alexane</span> <span>Hueber</span></a>
    <ul class="nav-side">
      <li class="nav-world-item"><a class="nav-world" href="vibe.html"><span class="wide">Hueber</span><em>vibe</em></a></li>
      <li>
        <button class="nav-icon search-toggle" type="button" aria-label="Search" aria-expanded="false" aria-controls="search">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
        </button>
      </li>
      <li>
        <a class="nav-icon" href="contact.html" aria-label="Contact">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13"/><path d="m3 6 9 7 9-7"/></svg>
        </a>
      </li>
    </ul>
  </nav>
  <div class="search" id="search" role="search">
    <div class="search__bar">
      <input type="search" placeholder="Search anything" aria-label="Search anything">
      <button class="search__close" type="button" aria-label="Close search">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 4 16 16M20 4 4 20"/></svg>
      </button>
    </div>
    <div class="search__results">
      ${searchItemsHTML}
      <p class="search__empty" hidden>No results</p>
    </div>
  </div>
`;

document.querySelector('.site-footer').innerHTML = `
  <div class="footer-top">
    <form class="newsletter">
      <h2>Sign up for our news<br>and invitations</h2>
      <div class="newsletter__field">
        <input type="email" name="email" autocomplete="email" placeholder="Email address*" aria-label="Email address" required>
        <button type="submit" aria-label="Subscribe"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 12h18M14 5l7 7-7 7"/></svg></button>
      </div>
      <label class="check"><input type="checkbox" required> I accept the terms and conditions*</label>
      <input class="form-trap" type="checkbox" name="botcheck" tabindex="-1" aria-hidden="true">
      <p class="newsletter__status" role="status" hidden></p>
    </form>
    <div class="footer-col">
      <h3 class="wide">Studio</h3>
      <ul>
        <li><a href="studio.html">About</a></li>
        <li><a href="projects.html">Projects</a></li>
        <li><a href="vibe.html">HUEBERvibe</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h3 class="wide">Support</h3>
      <ul>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="mentions-legales.html">Mentions légales</a></li>
        <li><a href="politique-de-confidentialite.html">Politique de confidentialité</a></li>
        <li><a href="politique-cookies.html">Politique de cookies</a></li>
        <li><a href="conditions-utilisation.html">Conditions d'utilisation</a></li>
      </ul>
    </div>
  </div>
  <span class="wordmark wide" aria-hidden="true"><span class="wordmark__inner">Alexane Hueber</span></span>
  <div class="footer-legal">
    <span>Alexane Hueber © 2026 — All rights reserved</span>
    <ul>
      <li><a href="mentions-legales.html">Mentions légales</a></li>
      <li><a href="politique-de-confidentialite.html">Confidentialité</a></li>
    </ul>
  </div>
`;

// Format d'une photo, quand ses dimensions sont connues
const isLandscape = image => image?.width > image?.height;
const isPortrait = image => image?.height > image?.width;

// Range les images selon LAYOUT en respectant leur format, puis glisse les textes à intervalles réguliers
const buildBlocks = (images, texts) => {
  const remaining = [...images];
  const imageBlocks = [];
  for (let step = 0; remaining.length; step++) {
    let type = LAYOUT[step % LAYOUT.length];
    // Une photo horizontale prend toute la largeur ; une verticale ne va jamais dans ce bloc, elle y serait trop coupée
    if (isLandscape(remaining[0])) type = 'full';
    else if (type === 'full' && isPortrait(remaining[0])) continue;
    // Pas assez de photos, ou une horizontale, pour remplir un bloc à deux : la photo s'affiche seule
    if (LAYOUT_IMAGES[type] === 2 && (remaining.length < 2 || isLandscape(remaining[1]))) type = isPortrait(remaining[0]) ? 'center' : 'full';
    imageBlocks.push({ type, images: remaining.splice(0, LAYOUT_IMAGES[type]) });
  }
  const blocks = [...imageBlocks];
  texts.forEach((text, index) => {
    const position = Math.round((index + 1) * imageBlocks.length / (texts.length + 1));
    blocks.splice(position + index, 0, { type: 'text', text });
  });
  return blocks;
};

const cellHTML = image => `<div class="pj-cell"><div class="pj-img">${mediaHTML(image)}</div></div>`;

const blockHTML = block => block.type === 'text'
  ? `<section class="pj-text"><p>${escapeHTML(block.text)}</p></section>`
  : `<section class="pj-block pj-${block.type}">${block.images.map(cellHTML).join('')}</section>`;

const renderProject = () => {
  const main = document.querySelector('main');
  const slug = new URLSearchParams(location.search).get('p');
  const project = PROJECTS.find(item => item.slug === slug);
  if (!project) {
    document.title = 'Project not found — Alexane Hueber';
    main.innerHTML = `<section class="pj-missing"><h1 class="wide">Project not found</h1><a class="more" href="index.html">Back to home</a></section>`;
    return;
  }
  const [cover, ...images] = project.images;
  const [intro, ...texts] = project.texts?.length ? project.texts : LOREM_PROJECT_TEXTS;
  document.title = `${project.title} — Alexane Hueber`;
  const facts = [['Location', project.location || 'Lorem ipsum'], ['Type', categoryLabel(project.category)], ['Year', project.year || 'Lorem'], ['Area', project.area || 'Lorem']];
  main.innerHTML = `
    <section class="pj-hero">${mediaHTML(cover)}</section>
    <section class="pj-info">
      <h1 class="wide">${escapeHTML(project.title)}</h1>
      <div>
        <dl>
          ${facts.map(([label, value]) => `<div><dt class="wide">${label}</dt><dd>${escapeHTML(value)}</dd></div>`).join('')}
        </dl>
        ${intro ? `<p>${escapeHTML(intro)}</p>` : ''}
      </div>
    </section>
    ${buildBlocks(images, texts).map(blockHTML).join('\n')}`;
};
// HUEBERvibe : liste des articles et page de lecture
const formatDate = date => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
const articleMetaHTML = article => `<p class="ar-meta"><time datetime="${escapeHTML(article.date)}">${formatDate(article.date)}</time> · ${escapeHTML(article.tag)}</p>`;
const articleCardHTML = article => `
      <a class="ar-card" href="${articleHref(article)}">
        <div class="pj-cell"><div class="pj-img">${mediaHTML(article.images[0])}</div></div>
        <div class="ar-card__text st-reveal">
          ${articleMetaHTML(article)}
          <h3 class="wide">${escapeHTML(article.title)}</h3>
          <p>${escapeHTML(article.excerpt)}</p>
        </div>
      </a>`;

const renderWorld = () => {
  const [featured, ...others] = sortedArticles();
  document.querySelector('main').innerHTML = `
    <section class="ar-head st-reveal">
      <h1><span class="wide">Hueber</span><em>vibe</em></h1>
      <p>${escapeHTML(pageText('world.tagline', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'))}</p>
    </section>
    ${featured ? `
    <a class="ar-featured" href="${articleHref(featured)}">
      <div class="pj-cell"><div class="pj-img">${mediaHTML(featured.images[0])}</div></div>
      <div class="ar-featured__text st-reveal">
        ${articleMetaHTML(featured)}
        <h2 class="wide">${escapeHTML(featured.title)}</h2>
        <p>${escapeHTML(featured.excerpt)}</p>
        <span class="more">Read more</span>
      </div>
    </a>` : '<p class="ar-empty">No articles yet.</p>'}
    ${others.length ? `<section class="ar-grid" aria-label="All articles">${others.map(articleCardHTML).join('')}</section>` : ''}`;
};

const renderArticle = () => {
  const main = document.querySelector('main');
  const articles = sortedArticles();
  const slug = new URLSearchParams(location.search).get('a');
  const article = articles.find(item => item.slug === slug);
  if (!article) {
    document.title = 'Article not found — HUEBERvibe';
    main.innerHTML = `<section class="pj-missing"><h1 class="wide">Article not found</h1><a class="more" href="vibe.html">Back to HUEBERvibe</a></section>`;
    return;
  }
  const [cover, ...images] = article.images;
  const [intro, ...texts] = article.texts;
  const more = articles.filter(item => item !== article).slice(0, 3);
  document.title = `${article.title} — HUEBERvibe`;
  main.innerHTML = `
    <section class="pj-hero">${mediaHTML(cover)}</section>
    <section class="ar-title st-reveal">
      ${articleMetaHTML(article)}
      <h1 class="wide">${escapeHTML(article.title)}</h1>
      ${intro ? `<p>${escapeHTML(intro)}</p>` : ''}
    </section>
    ${buildBlocks(images, texts).map(blockHTML).join('\n')}
    <section class="ar-more">
      <h2 class="wide st-reveal">More from HUEBERvibe</h2>
      ${more.length ? `<div class="ar-grid">${more.map(articleCardHTML).join('')}</div>` : ''}
      <a class="more" href="vibe.html">All articles</a>
    </section>`;
};

// Page Projets : une ligne par projet, avec des dispositions de photos qui alternent
const ROW_LAYOUTS = [['narrow', 'wide'], ['narrow', 'narrow', 'narrow'], ['wide', 'narrow']];
// Textes provisoires, à remplacer par les vrais
const PROJECTS_INTRO = LOREM_LONG;
const CATEGORY_TEXT = LOREM_SHORT;

// Place une photo horizontale dans l'emplacement large quand le projet en a une
const rowPhotos = (images, layout) => {
  const remaining = [...images];
  return layout.map(size => {
    const landscape = size === 'wide' ? remaining.findIndex(isLandscape) : -1;
    const [image] = remaining.splice(Math.max(landscape, 0), 1);
    return { size, image };
  }).filter(slot => slot.image);
};

const projectRowHTML = (project, index) => `
      <a class="pl-row" href="${projectHref(project)}">
        <div class="pl-row__text st-reveal">
          <h3 class="wide">${escapeHTML(project.title)}</h3>
          <span class="more">Explore the Project</span>
        </div>
        <div class="pl-row__photos">
          ${rowPhotos(project.images, ROW_LAYOUTS[index % ROW_LAYOUTS.length]).map(({ size, image }) => `<div class="pj-cell pl-photo pl-photo--${size}"><div class="pj-img">${mediaHTML(image)}</div></div>`).join('')}
        </div>
      </a>`;

const renderProjects = () => {
  const groups = CATEGORIES
    .map(category => ({ category, projects: PROJECTS.filter(project => project.category === category.id) }))
    .filter(group => group.projects.length);
  document.querySelector('main').innerHTML = `
    <section class="pl-head st-reveal">
      <h1 class="wide">Interior Projects</h1>
      <p>${escapeHTML(pageText('projects.intro', PROJECTS_INTRO))}</p>
      <nav aria-label="Project categories">
        ${groups.map(({ category }) => `<a class="more" href="#${category.id}">${escapeHTML(category.label)}</a>`).join('')}
      </nav>
    </section>
    ${groups.map(({ category, projects }) => `
    <section class="pl-group" id="${category.id}">
      <div class="pl-group__head st-reveal">
        <h2 class="wide">${escapeHTML(category.label)}</h2>
        <p>${escapeHTML(pageText(`projects.category_${category.id}`, CATEGORY_TEXT))}</p>
      </div>
      ${projects.map(projectRowHTML).join('')}
    </section>`).join('')}`;
  // Le contenu vient d'être créé : le navigateur n'a pas pu aller seul à la catégorie demandée dans l'adresse
  document.getElementById(location.hash.slice(1))?.scrollIntoView();
};

// Accueil : chaque grand panneau présente un projet, choisi dans l'admin ou, sinon, parmi les premiers publiés
const renderHomePanels = () => {
  const section = document.querySelector('.panels');
  const chosen = ['home.panel1_project', 'home.panel2_project'].map(key => PROJECTS.find(project => project.slug === pageText(key)));
  const others = PROJECTS.filter(project => !chosen.includes(project));
  const projects = chosen.map(project => project ?? others.shift()).filter(Boolean);
  section.innerHTML = projects.map(project => `
    <a class="panel" href="${projectHref(project)}">
      ${mediaHTML(project.images[0])}
      <div class="panel__text">
        <h2 class="wide">${escapeHTML(project.title)}</h2>
        <p class="panel__sub">${escapeHTML(categoryLabel(project.category))}</p>
        <span class="more">Discover More</span>
      </div>
    </a>`).join('');
};

if (document.body.dataset.page === 'home') renderHomePanels();
if (document.body.dataset.page === 'projects') renderProjects();
if (document.body.dataset.page === 'project') renderProject();
if (document.body.dataset.page === 'world') renderWorld();
if (document.body.dataset.page === 'article') renderArticle();
if (document.body.dataset.page !== 'home') {
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.pj-hero');
  const heroMedia = hero?.querySelector('.media');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let lastY = Math.max(scrollY, 0);

  // Menu transparent en haut de page, caché en descendant, clair quand il revient en remontant
  const updateHeader = () => {
    const y = Math.max(scrollY, 0);
    const atTop = y <= (hero ? hero.offsetHeight * HEADER_TOP_ZONE : 0);
    const inUse = header.matches(':has(.search.is-open, .nav-main.is-open, .has-panel:hover)');
    header.classList.toggle('is-solid', !hero || !atTop);
    if (atTop || inUse) header.classList.remove('is-hidden');
    else if (Math.abs(y - lastY) >= 4) header.classList.toggle('is-hidden', y > lastY);
    if (Math.abs(y - lastY) >= 4) lastY = y;
    // La première image glisse moins vite que la page
    if (heroMedia && !reducedMotion.matches) heroMedia.style.translate = `0 ${Math.min(y, hero.offsetHeight) * HERO_PARALLAX}px`;
  };
  addEventListener('scroll', updateHeader, { passive: true });
  addEventListener('resize', updateHeader);
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  updateHeader();
}

const menuBtn = document.querySelector('.menu-btn');
const navMain = document.getElementById('nav-main');
const setMenuOpen = open => {
  navMain.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
menuBtn.addEventListener('click', () => setMenuOpen(!navMain.classList.contains('is-open')));

// Double chaque mot du menu pour l'effet de rouleau
document.querySelectorAll('.nav-main > li > a, .nav-world-item > a, .nav-icon, .st-links a, .ct-submit').forEach(link => {
  const roll = document.createElement('span');
  const inner = document.createElement('span');
  roll.className = 'roll';
  inner.className = 'roll__inner';
  // Le chevron de Projects reste fixe ; l'icône d'un .nav-icon roule avec le reste
  [...link.childNodes].filter(node => link.matches('.nav-icon') || node.nodeName !== 'svg').forEach(node => inner.append(node));
  const clone = inner.cloneNode(true);
  clone.classList.add('roll__clone');
  clone.setAttribute('aria-hidden', 'true');
  roll.append(inner, clone);
  link.prepend(roll);
  link.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') playRoll(roll);
  });
});
const playRoll = (roll, done) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done?.();
  const inner = roll.firstElementChild;
  if (!roll.classList.contains('is-rolling')) {
    roll.classList.add('is-rolling');
    inner.addEventListener('animationend', () => roll.classList.remove('is-rolling'), { once: true });
  }
  // Minuteur plutôt que fin d'animation : un clic ne doit jamais se perdre si l'animation est gelée
  if (done) setTimeout(done, 600);
};

// Sur mobile, Projects déroule ses catégories ; les autres liens ferment le menu
document.querySelector('.site-nav').addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  const isMobile = matchMedia('(max-width: 900px)').matches;
  const roll = link.querySelector(':scope > .roll');
  if (isMobile && link.matches('.projects-link')) {
    event.preventDefault();
    link.parentElement.classList.toggle('is-expanded');
    playRoll(roll);
  } else if (roll) {
    // Le lien ne part qu'à la fin de l'animation, sinon elle ne se verrait pas
    event.preventDefault();
    playRoll(roll, () => {
      if (isMobile) setMenuOpen(false);
      location.href = link.href;
    });
  } else if (isMobile) {
    setMenuOpen(false);
  }
});

// Révèle chaque bloc quand il entre à l'écran
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .15 });
document.querySelectorAll('.tile, .panel, .newsletter, .footer-col, .site-footer .wordmark, .footer-legal, .pj-cell, .pj-info, .pj-text, .st-reveal')
  .forEach(element => revealObserver.observe(element));

const search = document.getElementById('search');
const searchToggle = document.querySelector('.search-toggle');
const searchInput = search.querySelector('input');
const searchItems = [...search.querySelectorAll('.search__item')];
const searchEmpty = search.querySelector('.search__empty');
const setSearchOpen = open => {
  search.classList.toggle('is-open', open);
  searchToggle.setAttribute('aria-expanded', open);
  if (open) {
    setMenuOpen(false);
    searchInput.focus();
  }
};
const closeSearch = () => {
  setSearchOpen(false);
  searchToggle.focus();
};
searchToggle.addEventListener('click', () => {
  playRoll(searchToggle.querySelector('.roll'));
  setSearchOpen(!search.classList.contains('is-open'));
});
search.querySelector('.search__close').addEventListener('click', closeSearch);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && search.classList.contains('is-open')) closeSearch();
});
document.addEventListener('click', event => {
  if (!event.target.closest('.search, .search-toggle')) setSearchOpen(false);
});
// Sans recherche, seules les premières suggestions s'affichent
const filterSearch = () => {
  const query = searchInput.value.trim().toLowerCase();
  searchItems.forEach((item, index) => {
    item.hidden = query ? !item.textContent.toLowerCase().includes(query) : index >= SEARCH_SUGGESTIONS;
  });
  searchEmpty.hidden = searchItems.some(item => !item.hidden);
};
searchInput.addEventListener('input', filterSearch);
filterSearch();

if (document.body.dataset.page === 'studio') {
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = value => Math.min(Math.max(value, 0), 1);

  // L'image centrale grandit avec le défilement jusqu'à remplir l'écran, et écarte le nom
  const intro = document.querySelector('.st-intro');
  const stage = intro.querySelector('.st-stage');
  const startSize = () => {
    stage.style.removeProperty('--st-w');
    stage.style.removeProperty('--st-h');
    const { width, height } = stage.querySelector('.st-media').getBoundingClientRect();
    return { width, height };
  };
  let start = startSize();
  const updateIntro = () => {
    const progress = clamp01(-intro.getBoundingClientRect().top / (intro.offsetHeight - innerHeight) / STUDIO_INTRO_END);
    stage.style.setProperty('--st-w', `${start.width + (stage.offsetWidth - start.width) * progress}px`);
    stage.style.setProperty('--st-h', `${start.height + (stage.offsetHeight - start.height) * progress}px`);
  };

  // La ligne active de « Our practice » suit le défilement
  const practice = document.querySelector('.st-practice');
  const practiceItems = [...practice.querySelectorAll('li')];
  const updatePractice = () => {
    const progress = clamp01((innerHeight - practice.getBoundingClientRect().top) / innerHeight);
    const active = Math.min(Math.floor(progress * practiceItems.length), practiceItems.length - 1);
    practiceItems.forEach((item, index) => item.classList.toggle('is-active', index === active));
  };

  const onStudioScroll = () => {
    if (!prefersReducedMotion) updateIntro();
    updatePractice();
  };
  addEventListener('scroll', onStudioScroll, { passive: true });
  addEventListener('resize', () => {
    start = startSize();
    onStudioScroll();
  });
  onStudioScroll();

  // Carrousel : avance tout seul, sauf au survol ou si on le manipule
  const carousel = document.querySelector('.st-carousel');
  const track = carousel.querySelector('.st-carousel__track');
  const slides = [...track.children];
  const dotsBox = carousel.querySelector('.st-carousel__dots');
  const dots = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to image ${index + 1} of ${slides.length}`);
    dot.addEventListener('click', () => goToSlide(index));
    dotsBox.append(dot);
    return dot;
  });
  const maxScroll = () => track.scrollWidth - track.clientWidth;
  const currentSlide = () => {
    let closest = 0;
    slides.forEach((slide, index) => {
      if (Math.abs(slide.offsetLeft - track.scrollLeft) < Math.abs(slides[closest].offsetLeft - track.scrollLeft)) closest = index;
    });
    return closest;
  };
  const updateDots = () => {
    const current = currentSlide();
    dots.forEach((dot, index) => {
      dot.setAttribute('aria-current', index === current);
      // Pas de point pour une position que le carrousel ne peut pas atteindre
      dot.hidden = index > 0 && slides[index - 1].offsetLeft >= maxScroll();
    });
  };
  addEventListener('resize', updateDots);
  const goToSlide = index => track.scrollTo({ left: slides[index].offsetLeft, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  track.addEventListener('scroll', updateDots, { passive: true });
  updateDots();
  let carouselPaused = prefersReducedMotion;
  carousel.addEventListener('pointerenter', () => { carouselPaused = true; });
  carousel.addEventListener('pointerleave', () => { carouselPaused = prefersReducedMotion; });
  carousel.addEventListener('focusin', () => { carouselPaused = true; });
  carousel.addEventListener('focusout', () => { carouselPaused = prefersReducedMotion; });
  setInterval(() => {
    if (carouselPaused || document.hidden) return;
    // Revient au début une fois la dernière image atteinte
    goToSlide(track.scrollLeft >= maxScroll() - 1 ? 0 : currentSlide() + 1);
  }, CAROUSEL_DELAY);

  // Dernière section : chaque lien affiche son image au survol
  const linkImages = [...document.querySelectorAll('.st-links .media')];
  document.querySelectorAll('.st-links a').forEach((link, index) => {
    const showImage = () => linkImages.forEach((image, imageIndex) => image.classList.toggle('is-active', imageIndex === index));
    link.addEventListener('pointerenter', showImage);
    link.addEventListener('focus', showImage);
  });
}

// Les formulaires passent par la fonction Supabase « contact », qui envoie la demande par mail au studio
const connectForm = (form, status, kind, messages) => form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  const fields = Object.fromEntries(new FormData(form));
  button.disabled = true;
  status.hidden = true;
  try {
    const response = await fetch(`${window.SUPABASE_URL}/functions/v1/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: window.SUPABASE_KEY },
      body: JSON.stringify({ ...fields, kind, newsletter: 'newsletter' in fields })
    });
    if (!response.ok) throw new Error(`Réponse ${response.status}`);
    form.reset();
    status.textContent = messages.sent;
  } catch (error) {
    console.warn('Envoi du formulaire impossible :', error.message);
    status.textContent = messages.failed;
  }
  status.hidden = false;
  button.disabled = false;
});

connectForm(document.querySelector('.newsletter'), document.querySelector('.newsletter__status'), 'newsletter', {
  sent: 'Thank you for subscribing.',
  failed: 'Your subscription could not be registered. Please try again in a moment.'
});

if (document.body.dataset.page === 'contact') {
  const contactForm = document.querySelector('.ct-form');
  connectForm(contactForm, contactForm.querySelector('.ct-status'), 'contact', {
    sent: 'Merci, votre message a bien été envoyé. Nous vous répondrons rapidement.',
    failed: "Votre message n'a pas pu être envoyé. Merci de réessayer dans un instant."
  });
}
