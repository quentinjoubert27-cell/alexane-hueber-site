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
const views = ['view-login', 'view-denied', 'view-list', 'view-editor'];

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

// Liste des projets
const categoryLabel = id => window.CATEGORIES.find(category => category.id === id)?.label ?? id;

const showList = async () => {
  isDirty = false;
  const query = client.from(config().table).select('*');
  const { data, error } = await (kind === 'project' ? query.order('position').order('created_at') : query.order('date', { ascending: false }));
  document.querySelectorAll('.ad-tab').forEach(tab => tab.setAttribute('aria-current', tab.dataset.tab === kind));
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
  kind = tab.dataset.tab;
  showMessage('');
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

addEventListener('beforeunload', event => {
  if (isDirty) event.preventDefault();
});

refreshSession();
