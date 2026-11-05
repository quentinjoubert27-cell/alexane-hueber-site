-- Permet d'ajouter des catégories depuis l'admin : à exécuter une fois dans Supabase (SQL Editor).
-- La liste des catégories est enregistrée dans site_texts (site.categories) ; la base vérifie seulement la forme de l'identifiant.

alter table public.projects drop constraint if exists projects_category_check;
alter table public.projects add constraint projects_category_check check (category ~ '^[a-z0-9_]+$');
