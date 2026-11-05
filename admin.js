const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
const BUCKET = 'project-images';
const STATIC_PROJECTS = window.PROJECTS;

// Règles de saisie : un brouillon peut rester incomplet, elles s'appliquent à la publication
const TITLE_MAX = 40;
const MIN_PHOTOS = 4;
const INTRO_MIN = 300;
const INTRO_MAX = 900;
const PARAGRAPH_MIN = 150;
const PARAGRAPH_MAX = 600;
const PARAGRAPHS_MAX = 6;
const PHOTOS_PER_PARAGRAPH = 4;
const EXCERPT_MIN = 40;
const EXCERPT_MAX = 240;
const ARTICLE_INTRO_MAX = 600;
const ARTICLE_PARAGRAPH_MAX = 2000;
const ARTICLE_PARAGRAPHS_MAX = 30;

// Ce qui diffère entre un projet et un article ; le reste de l'admin est commun
const KINDS = {
  project: { table: 'projects', listTitle: 'Projets', newLabel: 'Nouveau projet', editLabel: 'Modifier le projet', empty: "Aucun projet pour l'instant.", fallbackSlug: 'projet', storagePrefix: '', titleMax: TITLE_MAX, introLabel: 'Introduction', introMin: INTRO_MIN, introMax: INTRO_MAX, paragraphMin: PARAGRAPH_MIN, paragraphMax: PARAGRAPH_MAX, viewHref: slug => `project.html?p=${encodeURIComponent(slug)}` },
  article: { table: 'articles', listTitle: 'Articles', newLabel: 'Nouvel article', editLabel: "Modifier l'article", empty: "Aucun article pour l'instant. Tant qu'il n'y en a aucun de publié, HUEBERworld affiche les articles d'exemple.", fallbackSlug: 'article', storagePrefix: 'articles/', titleMax: 80, introLabel: 'Introduction *', introMin: 0, introMax: ARTICLE_INTRO_MAX, paragraphMin: 0, paragraphMax: ARTICLE_PARAGRAPH_MAX, viewHref: slug => `article.html?a=${encodeURIComponent(slug)}` }
};

// Réglages des photos envoyées, les mêmes que pour les projets déjà sur le site
const PHOTO_MAX_SIDE = 2600;
const PHOTO_QUALITY = .8;

const $ = id => document.getElementById(id);
const views = ['view-login', 'view-denied', 'view-list', 'view-texts', 'view-images', 'view-editor'];

let kind = 'project';
const config = () => KINDS[kind];
let projects = [];    // projets ou articles de l'onglet ouvert
let editing = null;   // { id, slug, published, position, isNew }
let photos = [];      // { src?, blob?, preview, alt, width, height }
let removedSources = [];
let isDirty = false;
let isBusy = false;

const showView = id => {
  views.forEach(view => { $(view).hidden = view !== id; });
  $('tabs').hidden = !['view-list', 'view-texts', 'view-images'].includes(id);
  window.scrollTo(0, 0);
};

const showMessage = (text, isError = false) => {
  const box = $('message');
  box.textContent = text;
  box.classList.toggle('is-error', isError);
  box.hidden = !text;
};

const setBusy = busy => {
  isBusy = busy;
  document.querySelectorAll('.ad-actions button, #new-project, #import-projects').forEach(button => { button.disabled = busy; });
};

// Connexion
const refreshSession = async () => {
  const { data: { session } } = await client.auth.getSession();
  $('logout').hidden = !session;
  if (!session) return showView('view-login');
  const { data: isAdmin, error } = await client.rpc('is_admin');
  if (error) return showMessage(`Impossible de vérifier ce compte : ${error.message}`, true);
  if (!isAdmin) return showView('view-denied');
  await showList();
};

$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  showMessage('');
  const { error } = await client.auth.signInWithPassword({ email: $('login-email').value.trim(), password: $('login-password').value });
  $('login-password').value = '';
  if (error) return showMessage('E-mail ou mot de passe incorrect.', true);
  await refreshSession();
});

$('logout').addEventListener('click', async () => {
  if (isDirty && !confirm('Les modifications non enregistrées seront perdues. Se déconnecter ?')) return;
  isDirty = false;
  await client.auth.signOut();
  showMessage('');
  await refreshSession();
});

const setActiveTab = active => document.querySelectorAll('.ad-tab').forEach(tab => tab.setAttribute('aria-current', tab.dataset.tab === active));

// Liste des projets
const categoryLabel = id => window.CATEGORIES.find(category => category.id === id)?.label ?? id;

const showList = async () => {
  isDirty = false;
  const query = client.from(config().table).select('*');
  const { data, error } = await (kind === 'project' ? query.order('position').order('created_at') : query.order('date', { ascending: false }));
  setActiveTab(kind);
  $('list-title').textContent = config().listTitle;
  $('new-project').textContent = config().newLabel;
  $('list-empty').textContent = config().empty;
  showView('view-list');
  if (error) {
    $('project-list').replaceChildren();
    $('import-box').hidden = true;
    $('list-empty').hidden = true;
    return showMessage(`Impossible de charger cette liste : ${error.message}`, true);
  }
  projects = data;
  const list = $('project-list');
  list.replaceChildren(...projects.map(projectRow));
  $('list-empty').hidden = projects.length > 0;
  $('import-box').hidden = kind !== 'project' || projects.length > 0 || !STATIC_PROJECTS?.length;
};

document.querySelectorAll('.ad-tab').forEach(tab => tab.addEventListener('click', async () => {
  if (isDirty && !confirm('Les modifications non enregistrées seront perdues. Changer d\'onglet ?')) return;
  isDirty = false;
  showMessage('');
  if (tab.dataset.tab === 'texts') return showTexts();
  if (tab.dataset.tab === 'images') return showImages();
  kind = tab.dataset.tab;
  await showList();
}));

const formatDate = date => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));

const projectRow = project => {
  const row = document.createElement('li');
  const image = document.createElement('img');
  image.alt = '';
  if (project.images[0]) image.src = project.images[0].src;
  const text = document.createElement('div');
  text.className = 'ad-list__text';
  const title = document.createElement('div');
  title.textContent = project.title;
  const meta = document.createElement('div');
  meta.className = 'ad-list__meta';
  const photoCount = `${project.images.length} photo${project.images.length > 1 ? 's' : ''}`;
  meta.textContent = kind === 'project'
    ? `${categoryLabel(project.category)} · ${photoCount}`
    : `${formatDate(project.date)}${project.tag ? ` · ${project.tag}` : ''} · ${photoCount}`;
  text.append(title, meta);
  const status = document.createElement('span');
  status.className = `ad-status${project.published ? ' is-published' : ''}`;
  status.textContent = project.published ? 'Publié' : 'Brouillon';
  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'ad-link';
  edit.textContent = 'Modifier';
  edit.addEventListener('click', () => openEditor(project));
  row.append(image, text, status, edit);
  return row;
};

$('new-project').addEventListener('click', () => openEditor(null));

$('back').addEventListener('click', async () => {
  if (isDirty && !confirm('Les modifications non enregistrées seront perdues. Revenir à la liste ?')) return;
  showMessage('');
  await showList();
});

// Reprend dans la base les projets écrits dans projects.js ; leurs photos restent dans le dossier du site
$('import-projects').addEventListener('click', async () => {
  setBusy(true);
  const rows = STATIC_PROJECTS.map((project, index) => ({ ...project, position: index + 1, published: true }));
  const { error } = await client.from('projects').insert(rows);
  setBusy(false);
  if (error) return showMessage(`L'import a échoué : ${error.message}`, true);
  showMessage(`${rows.length} projets importés.`);
  await showList();
});

// Formulaire
window.CATEGORIES.forEach(category => {
  $('field-category').add(new Option(category.label, category.id));
});

const openEditor = project => {
  showMessage('');
  $('form-errors').hidden = true;
  editing = project
    ? { id: project.id, slug: project.slug, published: project.published, position: project.position, isNew: false }
    : { id: crypto.randomUUID(), slug: null, published: false, position: Math.max(0, ...projects.map(item => item.position ?? 0)) + 1, isNew: true };
  $('editor-title').textContent = project ? config().editLabel : config().newLabel;
  document.querySelectorAll('[data-kind]').forEach(element => { element.hidden = element.dataset.kind !== kind; });
  $('intro-label').textContent = config().introLabel;
  $('field-date').value = project?.date ?? new Date().toISOString().slice(0, 10);
  $('field-tag').value = project?.tag ?? '';
  $('field-excerpt').value = project?.excerpt ?? '';
  $('field-title').value = project?.title ?? '';
  $('field-category').value = project?.category ?? window.CATEGORIES[0].id;
  $('field-location').value = project?.location ?? '';
  $('field-year').value = project?.year ?? '';
  $('field-area').value = project?.area ?? '';
  const [intro = '', ...paragraphs] = project?.texts ?? [];
  $('field-intro').value = intro;
  $('paragraph-list').replaceChildren();
  paragraphs.forEach(addParagraph);
  photos = (project?.images ?? []).map(image => ({ ...image, preview: image.src }));
  removedSources = [];
  renderPhotos();
  updateCounters();
  $('publish').textContent = project?.published ? 'Enregistrer' : 'Publier';
  $('save-draft').textContent = project?.published ? 'Repasser en brouillon' : 'Enregistrer en brouillon';
  $('delete-project').hidden = !project;
  $('view-project').hidden = !project?.published;
  if (project?.published) $('view-project').href = config().viewHref(project.slug);
  isDirty = false;
  showView('view-editor');
};

const addParagraph = (value = '') => {
  const box = document.createElement('div');
  box.className = 'ad-paragraph';
  const head = document.createElement('div');
  head.className = 'ad-paragraph__head';
  const label = document.createElement('span');
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'ad-link';
  remove.textContent = 'Retirer';
  remove.addEventListener('click', () => {
    box.remove();
    numberParagraphs();
    isDirty = true;
  });
  head.append(label, remove);
  const area = document.createElement('textarea');
  area.rows = 4;
  area.value = typeof value === 'string' ? value : '';
  area.setAttribute('aria-label', 'Paragraphe');
  const count = document.createElement('small');
  count.className = 'ad-count';
  area.addEventListener('input', () => updateCount(area, count, config().paragraphMin, config().paragraphMax));
  box.append(head, area, count);
  $('paragraph-list').append(box);
  updateCount(area, count, config().paragraphMin, config().paragraphMax);
  numberParagraphs();
};

const numberParagraphs = () => {
  [...$('paragraph-list').children].forEach((box, index) => {
    box.querySelector('span').textContent = `Paragraphe ${index + 1}`;
  });
};

$('add-paragraph').addEventListener('click', () => {
  addParagraph();
  isDirty = true;
});

const updateCount = (field, counter, min, max) => {
  const length = field.value.trim().length;
  counter.textContent = min && length
    ? `${length} caractères (de ${min} à ${max})`
    : `${length} / ${max} caractères`;
  counter.classList.toggle('is-over', length > max || (min && length > 0 && length < min));
};

const updateCounters = () => {
  updateCount($('field-title'), document.querySelector('[data-count-for="field-title"]'), 0, config().titleMax);
  updateCount($('field-intro'), document.querySelector('[data-count-for="field-intro"]'), config().introMin, config().introMax);
  updateCount($('field-excerpt'), document.querySelector('[data-count-for="field-excerpt"]'), EXCERPT_MIN, EXCERPT_MAX);
};

$('project-form').addEventListener('input', () => {
  isDirty = true;
  updateCounters();
});
$('project-form').addEventListener('submit', event => event.preventDefault());

// Photos : réduites et ré-encodées dans le navigateur, ce qui retire aussi leurs métadonnées
const preparePhoto = async file => {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', PHOTO_QUALITY));
  if (!blob) throw new Error('Encodage impossible');
  return { blob, preview: URL.createObjectURL(blob), alt: '', width: canvas.width, height: canvas.height };
};

const addFiles = async files => {
  const rejected = [];
  showMessage('Préparation des photos…');
  for (const file of files) {
    try {
      photos.push(await preparePhoto(file));
    } catch {
      rejected.push(file.name);
    }
  }
  showMessage(rejected.length ? `Photos non lues (convertis-les en JPEG) : ${rejected.join(', ')}` : '', rejected.length > 0);
  isDirty = true;
  renderPhotos();
};

$('field-photos').addEventListener('change', async event => {
  await addFiles([...event.target.files]);
  event.target.value = '';
});

const dropZone = $('drop-zone');
['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => {
  event.preventDefault();
  dropZone.classList.add('is-over');
}));
['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => {
  event.preventDefault();
  dropZone.classList.remove('is-over');
}));
dropZone.addEventListener('drop', event => addFiles([...event.dataTransfer.files]));

const movePhoto = (index, offset) => {
  const [photo] = photos.splice(index, 1);
  photos.splice(index + offset, 0, photo);
  isDirty = true;
  renderPhotos();
};

const toolButton = (label, title, disabled, onClick) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.title = title;
  button.setAttribute('aria-label', title);
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
};

const renderPhotos = () => {
  $('photo-list').replaceChildren(...photos.map((photo, index) => {
    const item = document.createElement('li');
    item.className = 'ad-photo';
    const frame = document.createElement('div');
    frame.className = 'ad-photo__image';
    const image = document.createElement('img');
    image.src = photo.preview;
    image.alt = '';
    frame.append(image);
    if (index === 0) {
      const cover = document.createElement('span');
      cover.className = 'ad-photo__cover';
      cover.textContent = 'Grande image';
      frame.append(cover);
    }
    const alt = document.createElement('input');
    alt.type = 'text';
    alt.value = photo.alt;
    alt.placeholder = 'Description de la photo *';
    alt.setAttribute('aria-label', `Description de la photo ${index + 1}`);
    alt.addEventListener('input', () => { photo.alt = alt.value; });
    const tools = document.createElement('div');
    tools.className = 'ad-photo__tools';
    tools.append(
      toolButton('←', 'Avancer la photo', index === 0, () => movePhoto(index, -1)),
      toolButton('→', 'Reculer la photo', index === photos.length - 1, () => movePhoto(index, 1)),
      toolButton('Retirer', 'Retirer la photo', false, () => {
        if (photo.src) removedSources.push(photo.src);
        photos.splice(index, 1);
        isDirty = true;
        renderPhotos();
      })
    );
    item.append(frame, alt, tools);
    if (index === 0 && photo.height > photo.width) {
      const note = document.createElement('small');
      note.className = 'ad-photo__note';
      note.textContent = 'Photo verticale : le haut et le bas seront coupés sur ordinateur.';
      item.append(note);
    }
    return item;
  }));
};

// Validation
const paragraphValues = () => [...$('paragraph-list').querySelectorAll('textarea')].map(area => area.value.trim()).filter(Boolean);

const collectErrors = isPublishing => {
  const errors = [];
  const title = $('field-title').value.trim();
  if (!title) errors.push('Ajoute un titre.');
  if (title.length > config().titleMax) errors.push(`Le titre doit faire ${config().titleMax} caractères au maximum.`);
  if (!isPublishing) return errors;
  if (kind === 'article') return [...errors, ...articleErrors()];

  if (photos.length < MIN_PHOTOS) errors.push(`Ajoute au moins ${MIN_PHOTOS} photos (${photos.length} pour l'instant).`);
  const withoutAlt = photos.filter(photo => !photo.alt.trim()).length;
  if (withoutAlt) errors.push(`Décris chaque photo : ${withoutAlt} description${withoutAlt > 1 ? 's manquent' : ' manque'}.`);

  const intro = $('field-intro').value.trim();
  const paragraphs = paragraphValues();
  if (intro && (intro.length < INTRO_MIN || intro.length > INTRO_MAX)) errors.push(`L'introduction doit faire de ${INTRO_MIN} à ${INTRO_MAX} caractères.`);
  if (paragraphs.length && !intro) errors.push('Ajoute une introduction avant les paragraphes.');
  paragraphs.forEach((text, index) => {
    if (text.length < PARAGRAPH_MIN || text.length > PARAGRAPH_MAX) errors.push(`Le paragraphe ${index + 1} doit faire de ${PARAGRAPH_MIN} à ${PARAGRAPH_MAX} caractères.`);
  });
  const allowed = Math.min(PARAGRAPHS_MAX, Math.floor(photos.length / PHOTOS_PER_PARAGRAPH));
  if (paragraphs.length > allowed) errors.push(`Avec ${photos.length} photos, ${allowed} paragraphe${allowed > 1 ? 's' : ''} au maximum, en plus de l'introduction.`);
  return errors;
};

const articleErrors = () => {
  const errors = [];
  if (!$('field-date').value) errors.push('Choisis une date.');
  if (!$('field-tag').value.trim()) errors.push('Indique une rubrique.');
  const excerpt = $('field-excerpt').value.trim().length;
  if (excerpt < EXCERPT_MIN || excerpt > EXCERPT_MAX) errors.push(`Le résumé doit faire de ${EXCERPT_MIN} à ${EXCERPT_MAX} caractères.`);
  if (!photos.length) errors.push('Ajoute au moins une photo.');
  const withoutAlt = photos.filter(photo => !photo.alt.trim()).length;
  if (withoutAlt) errors.push(`Décris chaque photo : ${withoutAlt} description${withoutAlt > 1 ? 's manquent' : ' manque'}.`);
  const intro = $('field-intro').value.trim().length;
  if (!intro) errors.push('Ajoute une introduction.');
  if (intro > ARTICLE_INTRO_MAX) errors.push(`L'introduction doit faire ${ARTICLE_INTRO_MAX} caractères au maximum.`);
  const paragraphs = paragraphValues();
  if (!paragraphs.length) errors.push('Ajoute au moins un paragraphe.');
  if (paragraphs.length > ARTICLE_PARAGRAPHS_MAX) errors.push(`${ARTICLE_PARAGRAPHS_MAX} paragraphes au maximum.`);
  paragraphs.forEach((text, index) => {
    if (text.length > ARTICLE_PARAGRAPH_MAX) errors.push(`Le paragraphe ${index + 1} doit faire ${ARTICLE_PARAGRAPH_MAX} caractères au maximum.`);
  });
  return errors;
};

const showErrors = errors => {
  const box = $('form-errors');
  box.replaceChildren(...errors.map(error => {
    const item = document.createElement('li');
    item.textContent = error;
    return item;
  }));
  box.hidden = errors.length === 0;
  if (errors.length) box.scrollIntoView({ block: 'center' });
};

// Enregistrement
const slugify = title => title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || config().fallbackSlug;

const availableSlug = async title => {
  const base = slugify(title);
  const { data, error } = await client.from(config().table).select('slug').like('slug', `${base}%`);
  if (error) throw error;
  const taken = new Set(data.map(row => row.slug));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
};

// Chemin d'un fichier dans Supabase ; null pour une photo gardée dans le dossier du site
const storagePath = src => {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = src.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(src.slice(index + marker.length));
};

const uploadNewPhotos = async () => {
  const uploaded = [];
  try {
    const pending = photos.filter(photo => photo.blob);
    for (const [index, photo] of pending.entries()) {
      showMessage(`Envoi des photos : ${index + 1} sur ${pending.length}…`);
      const path = `${config().storagePrefix}${editing.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await client.storage.from(BUCKET).upload(path, photo.blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (error) throw error;
      uploaded.push(path);
      photo.uploadedSrc = client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length) await client.storage.from(BUCKET).remove(uploaded);
    photos.forEach(photo => { delete photo.uploadedSrc; });
    throw error;
  }
};

const removeFiles = async sources => {
  const paths = sources.map(storagePath).filter(Boolean);
  if (paths.length) await client.storage.from(BUCKET).remove(paths);
};

const saveProject = async publish => {
  if (isBusy) return;
  const errors = collectErrors(publish);
  showErrors(errors);
  if (errors.length) return;
  setBusy(true);
  showMessage('');
  let uploaded = [];
  try {
    uploaded = await uploadNewPhotos();
    const intro = $('field-intro').value.trim();
    const fields = kind === 'project'
      ? { category: $('field-category').value, location: $('field-location').value.trim(), year: $('field-year').value.trim(), area: $('field-area').value.trim() }
      : { date: $('field-date').value || new Date().toISOString().slice(0, 10), tag: $('field-tag').value.trim(), excerpt: $('field-excerpt').value.trim() };
    const row = {
      title: $('field-title').value.trim(),
      ...fields,
      images: photos.map(photo => ({ src: photo.uploadedSrc ?? photo.src, alt: photo.alt.trim(), width: photo.width, height: photo.height })),
      texts: [...(intro ? [intro] : []), ...paragraphValues()],
      published: publish
    };
    showMessage('Enregistrement…');
    const { error } = editing.isNew
      ? await client.from(config().table).insert({ ...row, id: editing.id, slug: await availableSlug(row.title), ...(kind === 'project' ? { position: editing.position } : {}) })
      : await client.from(config().table).update(row).eq('id', editing.id);
    if (error) throw error;
    // Le projet est enregistré : on peut retirer les fichiers qu'il n'utilise plus
    await removeFiles(removedSources);
    isDirty = false;
    await showList();
    showMessage(publish ? `« ${row.title} » est publié.` : `« ${row.title} » est enregistré en brouillon.`);
  } catch (error) {
    if (uploaded.length) {
      await client.storage.from(BUCKET).remove(uploaded);
      photos.forEach(photo => { delete photo.uploadedSrc; });
    }
    showMessage(`L'enregistrement a échoué, rien n'a été modifié : ${error.message}`, true);
  } finally {
    setBusy(false);
  }
};

$('publish').addEventListener('click', () => saveProject(true));
$('save-draft').addEventListener('click', () => saveProject(false));

$('delete-project').addEventListener('click', async () => {
  const title = $('field-title').value.trim();
  if (!confirm(`Supprimer définitivement « ${title} » et ses photos ? Cette action est irréversible.`)) return;
  setBusy(true);
  const { error } = await client.from(config().table).delete().eq('id', editing.id);
  if (error) {
    setBusy(false);
    return showMessage(`La suppression a échoué : ${error.message}`, true);
  }
  await removeFiles([...photos.map(photo => photo.src).filter(Boolean), ...removedSources]);
  setBusy(false);
  isDirty = false;
  await showList();
  showMessage(`« ${title} » est supprimé.`);
});

// Onglet Textes : les textes des pages qui ne sont ni des projets ni des articles
const textGroups = () => [
  { title: 'Accueil', fields: [
    { key: 'home.hero_title', label: 'Titre principal' },
    { key: 'home.tile1_title', label: 'Vignette 1 : titre' },
    { key: 'home.tile1_text', label: 'Vignette 1 : texte' },
    { key: 'home.tile2_title', label: 'Vignette 2 : titre' },
    { key: 'home.tile2_text', label: 'Vignette 2 : texte' },
    { key: 'home.panel1_title', label: 'Grand panneau 1 : titre' },
    { key: 'home.panel1_text', label: 'Grand panneau 1 : sous-titre' },
    { key: 'home.panel2_title', label: 'Grand panneau 2 : titre' }
  ] },
  { title: 'Studio', fields: [
    { key: 'studio.about', label: 'Présentation', rows: 8, help: 'Laisse une ligne vide entre deux paragraphes.' },
    { key: 'studio.practice_title', label: 'Liste : titre' },
    { key: 'studio.practice_list', label: 'Liste : éléments', rows: 6, help: 'Un élément par ligne.' },
    { key: 'studio.how_title', label: 'Deuxième texte : titre' },
    { key: 'studio.how_text', label: 'Deuxième texte', rows: 6 }
  ] },
  { title: 'Contact', fields: [
    { key: 'contact.intro', label: 'Introduction', rows: 3 }
  ] },
  { title: 'Page Projets', fields: [
    { key: 'projects.intro', label: 'Introduction', rows: 5 },
    ...window.CATEGORIES.map(category => ({ key: `projects.category_${category.id}`, label: `Catégorie ${category.label}`, rows: 3 }))
  ] },
  { title: 'HUEBERworld', fields: [
    { key: 'world.tagline', label: 'Phrase sous le titre', rows: 2 }
  ] }
];

let savedTexts = {};

const renderTextsForm = () => {
  $('texts-form').replaceChildren(...textGroups().map(group => {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.title;
    fieldset.append(legend);
    group.fields.forEach(field => {
      const label = document.createElement('label');
      label.textContent = field.label;
      const input = document.createElement(field.rows ? 'textarea' : 'input');
      if (field.rows) input.rows = field.rows;
      else input.type = 'text';
      input.dataset.key = field.key;
      input.value = savedTexts[field.key] ?? '';
      label.append(input);
      if (field.help) {
        const help = document.createElement('small');
        help.className = 'ad-count';
        help.textContent = field.help;
        label.append(help);
      }
      fieldset.append(label);
    });
    return fieldset;
  }));
};

const showTexts = async () => {
  setActiveTab('texts');
  showView('view-texts');
  const { data, error } = await client.from('site_texts').select('key,value').not('key', 'like', 'image.%');
  if (error) {
    $('texts-form').replaceChildren();
    $('save-texts').hidden = true;
    return showMessage(`Impossible de charger les textes : ${error.message}`, true);
  }
  savedTexts = Object.fromEntries(data.map(({ key, value }) => [key, value]));
  $('save-texts').hidden = false;
  renderTextsForm();
  isDirty = false;
};

$('texts-form').addEventListener('input', () => { isDirty = true; });
$('texts-form').addEventListener('submit', event => event.preventDefault());

$('save-texts').addEventListener('click', async () => {
  if (isBusy) return;
  setBusy(true);
  showMessage('Enregistrement…');
  const inputs = [...$('texts-form').querySelectorAll('[data-key]')].map(input => ({ key: input.dataset.key, value: input.value.trim() }));
  const filled = inputs.filter(({ value }) => value);
  const cleared = inputs.filter(({ key, value }) => !value && savedTexts[key]).map(({ key }) => key);
  const saved = filled.length ? await client.from('site_texts').upsert(filled) : {};
  const removed = !saved.error && cleared.length ? await client.from('site_texts').delete().in('key', cleared) : {};
  setBusy(false);
  const error = saved.error || removed.error;
  if (error) return showMessage(`L'enregistrement a échoué : ${error.message}`, true);
  savedTexts = Object.fromEntries(filled.map(({ key, value }) => [key, value]));
  isDirty = false;
  window.scrollTo(0, 0);
  showMessage('Les textes sont enregistrés.');
});

// Onglet Images : les images des pages qui ne sont ni des projets ni des articles.
// Enregistrées dans site_texts : image.xxx pour l'adresse, image.xxx_alt pour la description
const IMAGE_GROUPS = [
  {
    "title": "Accueil",
    "slots": [
      {
        "key": "image.home_hero",
        "label": "Grande image du haut (horizontale de préférence)",
        "src": "images/projects/project-5/01.jpg",
        "alt": "Large restaurant room with crystal chandeliers, wooden tables and a copper bar"
      },
      {
        "key": "image.home_tile1",
        "label": "Vignette 1",
        "src": "images/projects/project-1/04.jpg",
        "alt": "Bar with green glazed tiles and shelves of bottles"
      },
      {
        "key": "image.home_tile2",
        "label": "Vignette 2",
        "src": "images/projects/project-4/01.jpg",
        "alt": "Living room with a green sofa and rattan armchair in window light"
      },
      {
        "key": "image.home_panel1",
        "label": "Grand panneau 1",
        "src": "images/projects/project-1/03.jpg",
        "alt": "Glass chandeliers glowing against a warm ceiling"
      },
      {
        "key": "image.home_panel2",
        "label": "Grand panneau 2",
        "src": "images/projects/project-4/04.jpg",
        "alt": "Dining area with a round table, cane chairs and a large textured artwork"
      }
    ]
  },
  {
    "title": "Studio",
    "slots": [
      {
        "key": "image.studio_intro",
        "label": "Image d'ouverture (horizontale de préférence)",
        "src": "images/projects/project-5/01.jpg",
        "alt": "Large restaurant room with crystal chandeliers, wooden tables and a copper bar"
      },
      {
        "key": "image.studio_about",
        "label": "Présentation",
        "src": "images/projects/project-4/02.jpg",
        "alt": "Double-height living space with black steel trusses and a ceiling fan"
      },
      {
        "key": "image.studio_duo1",
        "label": "Photos décalées : petite",
        "src": "images/projects/project-2/02.jpg",
        "alt": "Spiral staircase against an exposed brick wall beside a green fireplace"
      },
      {
        "key": "image.studio_duo2",
        "label": "Photos décalées : grande",
        "src": "images/projects/project-1/02.jpg",
        "alt": "Stained glass windows and globe pendant lights above a set table"
      },
      {
        "key": "image.studio_full",
        "label": "Pleine largeur (horizontale de préférence)",
        "src": "images/projects/project-3/01.jpg",
        "alt": "Restaurant dining room with red walls, burgundy chairs and red chandeliers"
      },
      {
        "key": "image.studio_slide1",
        "label": "Carrousel : image 1",
        "src": "images/projects/project-1/05.jpg",
        "alt": "Patterned wallpaper panels and a ribbed glass pendant light"
      },
      {
        "key": "image.studio_slide2",
        "label": "Carrousel : image 2",
        "src": "images/projects/project-2/04.jpg",
        "alt": "Black kitchen with a copper-toned backsplash seen from above the sofa"
      },
      {
        "key": "image.studio_slide3",
        "label": "Carrousel : image 3",
        "src": "images/projects/project-3/03.jpg",
        "alt": "Wall of backlit bottles behind a burgundy armchair"
      },
      {
        "key": "image.studio_slide4",
        "label": "Carrousel : image 4",
        "src": "images/projects/project-4/06.jpg",
        "alt": "Bedroom with a white bed against a partition wall with a niche of green vases"
      },
      {
        "key": "image.studio_slide5",
        "label": "Carrousel : image 5",
        "src": "images/projects/project-5/03.jpg",
        "alt": "Floral banquette with burgundy chairs below a molded wall and wall light"
      },
      {
        "key": "image.studio_slide6",
        "label": "Carrousel : image 6",
        "src": "images/projects/project-3/04.jpg",
        "alt": "Red terrace with rattan chairs and woven pendant lights overlooking the water"
      },
      {
        "key": "image.studio_link1",
        "label": "Fin de page : image du lien Projects",
        "src": "images/projects/project-1/01.jpg",
        "alt": "Restaurant dining room with an orange banquette, set tables and a dark green paneled wall"
      },
      {
        "key": "image.studio_link2",
        "label": "Fin de page : image du lien Campaigns",
        "src": "images/projects/project-3/02.jpg",
        "alt": "Bar with a blue tiled column, a marble counter and wooden shelves"
      },
      {
        "key": "image.studio_link3",
        "label": "Fin de page : image du lien HUEBERworld",
        "src": "images/projects/project-4/05.jpg",
        "alt": "View of the kitchen framed by a white linen curtain"
      },
      {
        "key": "image.studio_link4",
        "label": "Fin de page : image du lien Contact",
        "src": "images/projects/project-5/04.jpg",
        "alt": "Woven wall with framed pictures above a floral banquette and wooden tables"
      }
    ]
  },
  {
    "title": "Contact",
    "slots": [
      {
        "key": "image.contact_main",
        "label": "Grande image à gauche",
        "src": "images/projects/project-5/02.jpg",
        "alt": "Pastry counter with red lanterns and a chandelier under a patterned ceiling"
      }
    ]
  }
];

let imageState = {};  // par emplacement : { src, alt, savedSrc, savedAlt, blob, preview, reset }

const imageSlots = () => IMAGE_GROUPS.flatMap(group => group.slots);

const renderImages = () => {
  $('image-groups').replaceChildren(...IMAGE_GROUPS.map(group => {
    const box = document.createElement('section');
    box.className = 'ad-group';
    const title = document.createElement('h2');
    title.textContent = group.title;
    const grid = document.createElement('div');
    grid.className = 'ad-slots';
    grid.append(...group.slots.map(slotCard));
    box.append(title, grid);
    return box;
  }));
};

const slotCard = slot => {
  const state = imageState[slot.key];
  const card = document.createElement('div');
  card.className = 'ad-slot';
  const name = document.createElement('div');
  name.textContent = slot.label;
  const image = document.createElement('img');
  image.src = state.preview ?? state.src;
  image.alt = '';
  const alt = document.createElement('input');
  alt.type = 'text';
  alt.value = state.alt;
  alt.placeholder = "Description de l'image *";
  alt.setAttribute('aria-label', `Description : ${slot.label}`);
  alt.addEventListener('input', () => {
    state.alt = alt.value;
    isDirty = true;
  });
  const tools = document.createElement('div');
  tools.className = 'ad-slot__tools';
  const pick = document.createElement('label');
  pick.className = 'ad-slot__pick';
  pick.textContent = "Changer l'image";
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = 'image/jpeg,image/png,image/webp';
  file.addEventListener('change', async () => {
    if (!file.files[0]) return;
    showMessage('Préparation de la photo…');
    try {
      const prepared = await preparePhoto(file.files[0]);
      Object.assign(state, { blob: prepared.blob, preview: prepared.preview, reset: false, alt: '' });
      isDirty = true;
      showMessage('');
      renderImages();
    } catch {
      showMessage(`Photo non lue (convertis-la en JPEG) : ${file.files[0].name}`, true);
    }
  });
  pick.append(file);
  tools.append(pick);
  if (state.blob || (state.src !== slot.src && !state.reset)) {
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'ad-link';
    reset.textContent = "Remettre l'image d'origine";
    reset.addEventListener('click', () => {
      Object.assign(state, { blob: null, preview: null, src: slot.src, alt: slot.alt, reset: true });
      isDirty = true;
      renderImages();
    });
    tools.append(reset);
  }
  card.append(name, image, alt, tools);
  if (state.blob) {
    const pending = document.createElement('small');
    pending.className = 'ad-slot__state';
    pending.textContent = 'Nouvelle image, pas encore enregistrée';
    card.append(pending);
  }
  return card;
};

const showImages = async () => {
  setActiveTab('images');
  showView('view-images');
  $('image-errors').hidden = true;
  const { data, error } = await client.from('site_texts').select('key,value').like('key', 'image.%');
  if (error) {
    $('image-groups').replaceChildren();
    $('save-images').hidden = true;
    return showMessage(`Impossible de charger les images : ${error.message}`, true);
  }
  const saved = Object.fromEntries(data.map(({ key, value }) => [key, value]));
  imageState = Object.fromEntries(imageSlots().map(slot => {
    const src = saved[slot.key] ?? slot.src;
    const alt = saved[`${slot.key}_alt`] ?? slot.alt;
    return [slot.key, { src, alt, savedSrc: saved[slot.key] ?? null, savedAlt: saved[`${slot.key}_alt`] ?? null }];
  }));
  $('save-images').hidden = false;
  renderImages();
  isDirty = false;
};

$('save-images').addEventListener('click', async () => {
  if (isBusy) return;
  const slots = imageSlots();
  const missing = slots.filter(slot => !imageState[slot.key].alt.trim()).map(slot => slot.label);
  const errors = $('image-errors');
  errors.replaceChildren(...missing.map(label => {
    const item = document.createElement('li');
    item.textContent = `Ajoute une description : ${label}.`;
    return item;
  }));
  errors.hidden = missing.length === 0;
  if (missing.length) return errors.scrollIntoView({ block: 'center' });

  setBusy(true);
  const uploaded = [];
  try {
    const pending = slots.filter(slot => imageState[slot.key].blob);
    for (const [index, slot] of pending.entries()) {
      showMessage(`Envoi des images : ${index + 1} sur ${pending.length}…`);
      const path = `site/${slot.key.replace('image.', '')}/${crypto.randomUUID()}.jpg`;
      const { error } = await client.storage.from(BUCKET).upload(path, imageState[slot.key].blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (error) throw error;
      uploaded.push(path);
      imageState[slot.key].uploadedSrc = client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
    showMessage('Enregistrement…');
    const upserts = [];
    const deletes = [];
    const unusedFiles = [];
    slots.forEach(slot => {
      const state = imageState[slot.key];
      const altKey = `${slot.key}_alt`;
      if (state.uploadedSrc) {
        upserts.push({ key: slot.key, value: state.uploadedSrc });
        if (state.savedSrc) unusedFiles.push(state.savedSrc);
      } else if (state.reset && state.savedSrc) {
        deletes.push(slot.key);
        unusedFiles.push(state.savedSrc);
      }
      const alt = state.alt.trim();
      if (alt === slot.alt) {
        if (state.savedAlt) deletes.push(altKey);
      } else if (alt !== state.savedAlt) {
        upserts.push({ key: altKey, value: alt });
      }
    });
    if (upserts.length) {
      const { error } = await client.from('site_texts').upsert(upserts);
      if (error) throw error;
    }
    if (deletes.length) {
      const { error } = await client.from('site_texts').delete().in('key', deletes);
      if (error) throw error;
    }
    await removeFiles(unusedFiles);
    await showImages();
    window.scrollTo(0, 0);
    showMessage('Les images sont enregistrées.');
  } catch (error) {
    if (uploaded.length) await client.storage.from(BUCKET).remove(uploaded);
    slots.forEach(slot => { delete imageState[slot.key].uploadedSrc; });
    showMessage(`L'enregistrement a échoué, rien n'a été modifié : ${error.message}`, true);
  } finally {
    setBusy(false);
  }
});

addEventListener('beforeunload', event => {
  if (isDirty) event.preventDefault();
});

refreshSession();
