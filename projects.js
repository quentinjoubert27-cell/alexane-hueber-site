// Catégories du site, et projets de secours : le site lit ses projets dans Supabase (voir site-loader.js) et n'utilise cette liste
// que si la base est vide ou injoignable. Pour ajouter un projet, passer par admin.html.
// Un projet = une fiche, des images et des textes. La mise en page se fait toute seule (voir LAYOUT dans site.js).
//
// {
//   slug: 'villa-exemple',            identifiant unique, utilisé dans l'adresse de la page
//   title: 'Villa Exemple',
//   category: 'residential',          id d'une des catégories ci-dessous
//   location: 'Paris',                lieu, année et surface sont facultatifs : vides, un texte provisoire s'affiche
//   year: '2026',
//   area: '250 m²',
//   images: [                         la première sert de grande image en haut de page
//     { src: 'images/photo.jpg', alt: 'Description de la photo', width: 1733, height: 2600 }
//   ],                                la largeur et la hauteur permettent de choisir le bloc adapté au format
//   texts: ['Présentation…', 'Paragraphe…']   le premier s'affiche à côté de la fiche
// }

window.CATEGORIES = [
  { id: 'residential', label: 'Residential' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'restaurant', label: 'Restaurant & Bar' },
  { id: 'retail', label: 'Retail & Commercial' }
];

window.PROJECTS = [
  {
    "slug": "project-1",
    "title": "Project 1",
    "category": "restaurant",
    "location": "",
    "year": "",
    "area": "",
    "images": [
      {
        "src": "images/projects/project-1/01.jpg",
        "alt": "Restaurant dining room with an orange banquette, set tables and a dark green paneled wall",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-1/02.jpg",
        "alt": "Stained glass windows and globe pendant lights above a set table",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-1/03.jpg",
        "alt": "Glass chandeliers glowing against a warm ceiling",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-1/04.jpg",
        "alt": "Bar with green glazed tiles and shelves of bottles",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-1/05.jpg",
        "alt": "Patterned wallpaper panels and a ribbed glass pendant light",
        "width": 1732,
        "height": 2600
      }
    ],
    "texts": []
  },
  {
    "slug": "project-2",
    "title": "Project 2",
    "category": "residential",
    "location": "",
    "year": "",
    "area": "",
    "images": [
      {
        "src": "images/projects/project-2/01.jpg",
        "alt": "Living room with a white sofa and an orange cushion facing a black kitchen",
        "width": 1731,
        "height": 2600
      },
      {
        "src": "images/projects/project-2/02.jpg",
        "alt": "Spiral staircase against an exposed brick wall beside a green fireplace",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-2/03.jpg",
        "alt": "Small washroom with an organic mirror, green tiles and a ribbed wood vanity",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-2/04.jpg",
        "alt": "Black kitchen with a copper-toned backsplash seen from above the sofa",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-2/05.jpg",
        "alt": "Detail of the staircase railing and wooden steps against the brick wall",
        "width": 1733,
        "height": 2600
      }
    ],
    "texts": []
  },
  {
    "slug": "project-3",
    "title": "Project 3",
    "category": "restaurant",
    "location": "",
    "year": "",
    "area": "",
    "images": [
      {
        "src": "images/projects/project-3/01.jpg",
        "alt": "Restaurant dining room with red walls, burgundy chairs and red chandeliers",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-3/02.jpg",
        "alt": "Bar with a blue tiled column, a marble counter and wooden shelves",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-3/03.jpg",
        "alt": "Wall of backlit bottles behind a burgundy armchair",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-3/04.jpg",
        "alt": "Red terrace with rattan chairs and woven pendant lights overlooking the water",
        "width": 1733,
        "height": 2600
      }
    ],
    "texts": []
  },
  {
    "slug": "project-4",
    "title": "Project 4",
    "category": "residential",
    "location": "",
    "year": "",
    "area": "",
    "images": [
      {
        "src": "images/projects/project-4/01.jpg",
        "alt": "Living room with a green sofa and rattan armchair in window light",
        "width": 1080,
        "height": 1616
      },
      {
        "src": "images/projects/project-4/02.jpg",
        "alt": "Double-height living space with black steel trusses and a ceiling fan",
        "width": 1080,
        "height": 1616
      },
      {
        "src": "images/projects/project-4/03.jpg",
        "alt": "White kitchen with a long island under a vaulted ceiling",
        "width": 1080,
        "height": 1443
      },
      {
        "src": "images/projects/project-4/04.jpg",
        "alt": "Dining area with a round table, cane chairs and a large textured artwork",
        "width": 1080,
        "height": 1616
      },
      {
        "src": "images/projects/project-4/05.jpg",
        "alt": "View of the kitchen framed by a white linen curtain",
        "width": 998,
        "height": 1498
      },
      {
        "src": "images/projects/project-4/06.jpg",
        "alt": "Bedroom with a white bed against a partition wall with a niche of green vases",
        "width": 1080,
        "height": 1616
      },
      {
        "src": "images/projects/project-4/07.jpg",
        "alt": "Bed and open bathroom with a wooden vanity and round mirror",
        "width": 1024,
        "height": 1368
      },
      {
        "src": "images/projects/project-4/08.jpg",
        "alt": "Bedroom reflected in a wooden framed mirror",
        "width": 1080,
        "height": 1616
      }
    ],
    "texts": []
  },
  {
    "slug": "project-5",
    "title": "Project 5",
    "category": "restaurant",
    "location": "",
    "year": "",
    "area": "",
    "images": [
      {
        "src": "images/projects/project-5/01.jpg",
        "alt": "Large restaurant room with crystal chandeliers, wooden tables and a copper bar",
        "width": 2600,
        "height": 1733
      },
      {
        "src": "images/projects/project-5/02.jpg",
        "alt": "Pastry counter with red lanterns and a chandelier under a patterned ceiling",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-5/03.jpg",
        "alt": "Floral banquette with burgundy chairs below a molded wall and wall light",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-5/04.jpg",
        "alt": "Woven wall with framed pictures above a floral banquette and wooden tables",
        "width": 1733,
        "height": 2600
      },
      {
        "src": "images/projects/project-5/05.jpg",
        "alt": "Pink ceiling painted with flowing dark lines",
        "width": 1733,
        "height": 2600
      }
    ],
    "texts": []
  }
];
