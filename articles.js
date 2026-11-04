// Articles de HUEBERworld : comme projects.js, ce fichier sera rempli par la future page admin.
// Un article = une fiche, des images et des textes. La mise en page se fait toute seule (voir LAYOUT dans site.js).
//
// {
//   slug: 'mon-article',              identifiant unique, utilisé dans l'adresse de la page
//   title: 'Mon article',
//   date: '2026-11-04',               année-mois-jour : les articles se classent du plus récent au plus ancien
//   tag: 'Inspiration',
//   excerpt: 'Court résumé…',         affiché dans la liste des articles
//   images: [{ src: 'images/photo.jpg', alt: 'Description' }],   la première sert de grande image
//   texts: ['Chapeau…', 'Paragraphe…']   le premier s'affiche en grand sous le titre
// }

// Articles provisoires, à remplacer par les vrais. En attendant, ils réutilisent les photos des projets.
const articlePhotos = window.PROJECTS.flatMap(project => project.images);

const placeholderArticle = (number, date, tag) => ({
  slug: `article-${number}`,
  title: `Article ${number}`,
  date,
  tag,
  excerpt: 'Placeholder summary of the article, in one or two sentences, to be replaced by the real text.',
  images: Array.from({ length: 8 }, (_, i) => articlePhotos[(Number(number) * 4 + i) % articlePhotos.length]),
  texts: [
    'Placeholder introduction of the article, to be replaced by the real text.',
    'Placeholder paragraph telling the first part of the story: where the idea comes from and why it matters.',
    'Placeholder paragraph with more details about the subject, the people involved and what was discovered along the way.',
    'Placeholder paragraph closing the article, to be replaced by the real text.'
  ]
});

window.ARTICLES = [
  placeholderArticle('01', '2026-10-28', 'Inspiration'),
  placeholderArticle('02', '2026-10-14', 'Behind the scenes'),
  placeholderArticle('03', '2026-09-30', 'Materials'),
  placeholderArticle('04', '2026-09-16', 'Inspiration'),
  placeholderArticle('05', '2026-09-02', 'Travel'),
  placeholderArticle('06', '2026-08-19', 'Behind the scenes'),
  placeholderArticle('07', '2026-08-05', 'Materials')
];
