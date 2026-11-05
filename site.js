const { PROJECTS, CATEGORIES } = window;
const MEGA_PROJECTS = 6;
const SEARCH_SUGGESTIONS = 3;
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
            ${projects.length > MEGA_PROJECTS ? '<a class="more" href="#">View more</a>' : ''}
          </div>`;
}).join('');

// La recherche couvre les projets (proposés en premier) et les articles de HUEBERworld
const searchEntries = [
  ...PROJECTS.map(project => ({ href: projectHref(project), image: project.images[0], title: project.title, label: categoryLabel(project.category) })),
  ...sortedArticles().map(article => ({ href: articleHref(article), image: article.images[0], title: article.title, label: `HUEBERworld · ${article.tag}` }))
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
        <a class="projects-link" href="${homeHref}#projets">Projects<svg class="nav-chevron" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></a>
        <div class="mega" style="--mega-cols: ${megaColumns}">${megaHTML}</div>
      </li>
      <li><a href="studio.html">Studio</a></li>
      <li class="nav-world-mobile"><a class="nav-world" href="world.html"><span class="wide">Hueber</span><em>world</em></a></li>
    </ul>
    <a class="site-logo wide" href="${homeHref || '#'}" aria-label="Alexane Hueber — home"><span>Alexane</span> <span>Hueber</span></a>
    <ul class="nav-side">
      <li class="nav-world-item"><a class="nav-world" href="world.html"><span class="wide">Hueber</span><em>world</em></a></li>
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
    <form class="newsletter" action="#" onsubmit="event.preventDefault()">
      <h2>Sign up for our news<br>and invitations</h2>
      <div class="newsletter__field">
        <input type="email" placeholder="Email address*" aria-label="Email address" required>
        <button type="submit" aria-label="Subscribe"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 12h18M14 5l7 7-7 7"/></svg></button>
      </div>
      <label class="check"><input type="checkbox" required> I accept the terms and conditions*</label>
    </form>
    <div class="footer-col">
      <h3 class="wide">Studio</h3>
      <ul>
        <li><a href="studio.html">About</a></li>
        <li><a href="#">Projects</a></li>
        <li><a href="#">Press</a></li>
        <li><a href="world.html">HUEBERworld</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h3 class="wide">Support</h3>
      <ul>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="#">FAQ</a></li>
        <li><a href="legal-notice.html">Legal Notice</a></li>
        <li><a href="privacy-policy.html">Privacy Policy</a></li>
        <li><a href="cookie-policy.html">Cookie Policy</a></li>
        <li><a href="terms-of-use.html">Terms of Use</a></li>
      </ul>
    </div>
  </div>
  <span class="wordmark wide" aria-hidden="true"><span class="wordmark__inner">Alexane Hueber</span></span>
  <div class="footer-legal">
    <span>Alexane Hueber © 2026 — All rights reserved</span>
    <ul>
      <li><a href="legal-notice.html">Legal Notice</a></li>
      <li><a href="privacy-policy.html">Privacy</a></li>
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
  const [intro, ...texts] = project.texts;
  document.title = `${project.title} — Alexane Hueber`;
  const facts = [['Location', project.location], ['Type', categoryLabel(project.category)], ['Year', project.year], ['Area', project.area]].filter(([, value]) => value);
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
// HUEBERworld : liste des articles et page de lecture
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
      <h1><span class="wide">Hueber</span><em>world</em></h1>
      <p>Stories, inspirations and news from the studio.</p>
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
    document.title = 'Article not found — HUEBERworld';
    main.innerHTML = `<section class="pj-missing"><h1 class="wide">Article not found</h1><a class="more" href="world.html">Back to HUEBERworld</a></section>`;
    return;
  }
  const [cover, ...images] = article.images;
  const [intro, ...texts] = article.texts;
  const more = articles.filter(item => item !== article).slice(0, 3);
  document.title = `${article.title} — HUEBERworld`;
  main.innerHTML = `
    <section class="pj-hero">${mediaHTML(cover)}</section>
    <section class="ar-title st-reveal">
      ${articleMetaHTML(article)}
      <h1 class="wide">${escapeHTML(article.title)}</h1>
      ${intro ? `<p>${escapeHTML(intro)}</p>` : ''}
    </section>
    ${buildBlocks(images, texts).map(blockHTML).join('\n')}
    <section class="ar-more">
      <h2 class="wide st-reveal">More from HUEBERworld</h2>
      ${more.length ? `<div class="ar-grid">${more.map(articleCardHTML).join('')}</div>` : ''}
      <a class="more" href="world.html">All articles</a>
    </section>`;
};

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

// Le formulaire n'est relié à aucun service d'envoi pour l'instant : on le dit au lieu de simuler un envoi
if (document.body.dataset.page === 'contact') {
  const contactForm = document.querySelector('.ct-form');
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    contactForm.querySelector('.ct-status').hidden = false;
  });
}
