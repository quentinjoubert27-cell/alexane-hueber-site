-- Schéma du site Alexane Hueber : à exécuter une fois dans Supabase (SQL Editor).
-- Lecture publique des projets publiés ; écriture réservée aux personnes listées dans public.admins.

-- Personnes autorisées à utiliser l'admin
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Projets : mêmes champs que projects.js
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 40),
  category text not null check (category in ('residential', 'hotels', 'restaurant', 'retail')),
  location text not null default '',
  year text not null default '',
  area text not null default '',
  images jsonb not null default '[]' check (jsonb_typeof(images) = 'array'),
  texts jsonb not null default '[]' check (jsonb_typeof(texts) = 'array'),
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

create policy "Les projets publiés sont visibles par tous"
on public.projects for select
to anon, authenticated
using (published or public.is_admin());

create policy "Les admins ajoutent des projets"
on public.projects for insert
to authenticated
with check (public.is_admin());

create policy "Les admins modifient des projets"
on public.projects for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Les admins suppriment des projets"
on public.projects for delete
to authenticated
using (public.is_admin());

-- Photos : lisibles par tous via leur adresse, 15 Mo maximum, formats d'image uniquement
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 15728640, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Les admins voient les fichiers"
on storage.objects for select
to authenticated
using (bucket_id = 'project-images' and public.is_admin());

create policy "Les admins ajoutent des photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-images' and public.is_admin());

create policy "Les admins remplacent des photos"
on storage.objects for update
to authenticated
using (bucket_id = 'project-images' and public.is_admin())
with check (bucket_id = 'project-images' and public.is_admin());

create policy "Les admins suppriment des photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'project-images' and public.is_admin());
