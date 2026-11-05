# Alexane Hueber

Site du studio de design Alexane Hueber, en HTML, CSS et JavaScript, sans dépendance à installer.

## Lancer le site

```bash
python3 -m http.server 4173
```

Puis ouvrir http://localhost:4173.

## Organisation

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil |
| `project.html` | Gabarit d'une page projet |
| `studio.html` | Page Studio |
| `contact.html` | Page Contact |
| `world.html`, `article.html` | HUEBERworld : liste des articles et page de lecture |
| `legal-notice.html`, `privacy-policy.html`, `cookie-policy.html`, `terms-of-use.html` | Pages légales |
| `admin.html`, `admin.js`, `admin.css` | Page admin : connexion, ajout et modification des projets |
| `site-loader.js` | Charge les projets publiés depuis Supabase, puis lance le site |
| `supabase-config.js` | Adresse et clé publique de Supabase |
| `supabase/schema.sql`, `supabase/articles.sql` | Tables, photos et règles de sécurité de la base |
| `projects.js` | Catégories et projets de secours, si la base est vide ou injoignable |
| `articles.js` | Articles d'exemple, si la base n'en contient aucun de publié |
| `site.js` | Menu, recherche, animations et mise en page automatique |
| `styles.css` | Styles de toutes les pages |
| `images/projects/` | Photos des projets, optimisées pour le web |

## À faire

- Noms et textes des projets
- Textes et images de l'accueil et de la page Studio
- Informations de l'entreprise dans les pages légales (champs surlignés)
- Envoi du formulaire de contact (il n'envoie rien pour l'instant)
- Choix de l'ordre des projets dans l'admin
