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

const placeholderArticle = (number, date) => ({
  slug: `article-${number}`,
  title: `Lorem ipsum ${number}`,
  date,
  tag: 'Lorem ipsum',
  excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  images: Array.from({ length: 8 }, (_, i) => articlePhotos[(Number(number) * 4 + i) % articlePhotos.length]),
  texts: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
  ]
});

window.ARTICLES = [
  placeholderArticle('01', '2026-10-28'),
  placeholderArticle('02', '2026-10-14'),
  placeholderArticle('03', '2026-09-30'),
  placeholderArticle('04', '2026-09-16'),
  placeholderArticle('05', '2026-09-02'),
  placeholderArticle('06', '2026-08-19'),
  placeholderArticle('07', '2026-08-05')
];
