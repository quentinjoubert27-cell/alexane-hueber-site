-- Textes des pages (accueil, Studio, Contact, Projets, HUEBERworld) : à exécuter une fois dans Supabase (SQL Editor).
-- Lecture publique ; écriture réservée aux admins. Un texte absent garde le texte provisoire du site.

create table public.site_texts (
  key text primary key check (key ~ '^[a-z_]+\.[a-z0-9_]+$'),
  value text not null check (char_length(value) between 1 and 5000),
  updated_at timestamptz not null default now()
);
alter table public.site_texts enable row level security;

create trigger site_texts_set_updated_at
before update on public.site_texts
for each row execute function public.set_updated_at();

grant select on public.site_texts to anon, authenticated;
grant insert, update, delete on public.site_texts to authenticated;

create policy "Les textes sont visibles par tous"
on public.site_texts for select
to anon, authenticated
using (true);

create policy "Les admins ajoutent des textes"
on public.site_texts for insert
to authenticated
with check (public.is_admin());

create policy "Les admins modifient des textes"
on public.site_texts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Les admins suppriment des textes"
on public.site_texts for delete
to authenticated
using (public.is_admin());
