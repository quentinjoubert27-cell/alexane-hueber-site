-- Articles de HUEBERworld : à exécuter une fois dans Supabase (SQL Editor), après schema.sql.
-- Mêmes règles que les projets : lecture publique des articles publiés, écriture réservée aux admins.
-- Leurs photos vont dans le même espace que celles des projets, sous le dossier articles/.

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 80),
  date date not null default current_date,
  tag text not null default '',
  excerpt text not null default '',
  images jsonb not null default '[]' check (jsonb_typeof(images) = 'array'),
  texts jsonb not null default '[]' check (jsonb_typeof(texts) = 'array'),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.articles enable row level security;

create trigger articles_set_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

create policy "Les articles publiés sont visibles par tous"
on public.articles for select
to anon, authenticated
using (published or public.is_admin());

create policy "Les admins ajoutent des articles"
on public.articles for insert
to authenticated
with check (public.is_admin());

create policy "Les admins modifient des articles"
on public.articles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Les admins suppriment des articles"
on public.articles for delete
to authenticated
using (public.is_admin());
