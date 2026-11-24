-- FA ESSÊNCIA — schema Supabase (PostgreSQL + RLS + Storage privado)
-- Espelha as entidades do adaptador local (js/store.js). Aplicar com `supabase db push` ou no SQL Editor.
-- LGPD: dados de saúde e fotos são sensíveis. Nenhum bucket público; acesso só por RLS.

create extension if not exists "pgcrypto";

-- ---------- perfis e papéis ----------
create type app_role as enum ('patient','staff','doctor');
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'patient',
  full_name text not null,
  created_at timestamptz not null default now()
);
create or replace function is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('staff','doctor'));
$$;

create table clinic_settings (
  id int primary key default 1 check (id = 1),
  whatsapp text not null,
  max_days_no_contact int not null default 4,
  checkpoints jsonb not null default '[{"day":0,"label":"Procedimento"},{"day":1,"label":"Primeiro registro"},{"day":3,"label":"Novo registro"},{"day":7,"label":"Registro de evolução"},{"day":15,"label":"Acompanhamento"},{"day":30,"label":"Registro final da etapa"}]'
);

-- ---------- pacientes ----------
create type follow_status as enum ('novo','em_acompanhamento','retorno_pendente','concluido');
create table patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text, phone text, avatar_path text,
  status follow_status not null default 'novo',
  doctor text not null,
  next_step text, next_step_date date,
  prefs jsonb not null default '{"registro":true,"orientacao":true,"retorno":true,"consulta":true,"checkin":true,"carinho":true}',
  created_at timestamptz not null default now()
);
create table consents (  -- registro auditável de consentimentos (LGPD art. 8º e 11)
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  kind text not null check (kind in ('health_data','photos_staff','reminders')),
  granted boolean not null, granted_at timestamptz not null default now()
);
create table procedures (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  name text not null, performed_on date not null, doctor text not null
);
create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  title text not null, scheduled_on date not null, scheduled_time time, kind text default 'retorno'
);

-- ---------- acompanhamento ----------
create table photos (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  storage_path text not null,              -- bucket privado "evolution-photos"
  taken_on date not null default current_date, day_n int, note text,
  created_at timestamptz not null default now()
);
create table checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  kind text not null check (kind in ('bem','duvidas','conversar','registrar')),
  note text, handled boolean not null default false, created_at timestamptz not null default now()
);
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  tag text not null, body text not null,
  shared_with_staff boolean not null default false, handled boolean not null default false,
  created_at timestamptz not null default now()
);
create table feedbacks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  rating int not null check (rating between 1 and 5), comment text,
  handled boolean not null default false, created_at timestamptz not null default now()
);
create table contacts (  -- histórico de contatos (paciente↔clínica)
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  direction text not null check (direction in ('patient','clinic')),
  channel text not null, kind text, note text, handled boolean not null default false,
  created_by text, created_at timestamptz not null default now()
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  type text not null, title text not null, body text,
  deliver_at timestamptz not null default now(), read boolean not null default false,
  source text not null default 'staff'
);
create table messages ( -- "recado da Clínica FA"
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  body text not null, signed_by text not null, created_at timestamptz not null default now()
);
create table staff_notes ( -- internas: NUNCA visíveis à paciente
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  body text not null, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table guidance (  -- conteúdo clínico: só aparece aprovado
  id uuid primary key default gen_random_uuid(),
  procedure_name text not null, category text not null, title text not null, body text not null,
  approved boolean not null default false, approved_by uuid references auth.users(id), approved_at timestamptz
);

-- ---------- RLS ----------
create or replace function my_patient_id() returns uuid language sql stable security definer set search_path = public as $$
  select id from patients where user_id = auth.uid();
$$;
do $$ declare t text; begin
  foreach t in array array['profiles','clinic_settings','patients','consents','procedures','appointments','photos','checkins','journal_entries','feedbacks','contacts','notifications','messages','staff_notes','guidance'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

create policy profiles_self on profiles for select using (id = auth.uid() or is_staff());
create policy settings_read on clinic_settings for select using (auth.uid() is not null);
create policy settings_staff on clinic_settings for all using (is_staff()) with check (is_staff());
create policy patients_self on patients for select using (user_id = auth.uid());
create policy patients_self_upd on patients for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy patients_staff on patients for all using (is_staff()) with check (is_staff());

-- Tabelas com patient_id: paciente vê e cria o seu; equipe gerencia tudo.
do $$ declare t text; begin
  foreach t in array array['consents','procedures','appointments','checkins','feedbacks','contacts','notifications','messages'] loop
    execute format('create policy %I on %I for select using (patient_id = my_patient_id())', t||'_self_sel', t);
    execute format('create policy %I on %I for all using (is_staff()) with check (is_staff())', t||'_staff', t);
  end loop;
end $$;
create policy checkins_self_ins on checkins for insert with check (patient_id = my_patient_id());
create policy feedbacks_self_ins on feedbacks for insert with check (patient_id = my_patient_id());
create policy contacts_self_ins on contacts for insert with check (patient_id = my_patient_id() and direction = 'patient');
create policy consents_self_ins on consents for insert with check (patient_id = my_patient_id());
create policy notifications_self_upd on notifications for update using (patient_id = my_patient_id()) with check (patient_id = my_patient_id());

-- Fotos e diário: a paciente controla; equipe só vê com consentimento 'photos_staff' (fotos) ou se compartilhado (diário).
create policy photos_self on photos for all using (patient_id = my_patient_id()) with check (patient_id = my_patient_id());
create policy photos_staff_read on photos for select using (
  is_staff() and exists (select 1 from consents c where c.patient_id = photos.patient_id and c.kind = 'photos_staff'
    and c.granted and c.granted_at = (select max(granted_at) from consents where patient_id = photos.patient_id and kind = 'photos_staff')));
create policy journal_self on journal_entries for all using (patient_id = my_patient_id()) with check (patient_id = my_patient_id());
create policy journal_staff_read on journal_entries for select using (is_staff() and shared_with_staff);
create policy journal_staff_upd on journal_entries for update using (is_staff() and shared_with_staff);

create policy notes_staff on staff_notes for all using (is_staff()) with check (is_staff());  -- sem policy p/ paciente
create policy guidance_patient on guidance for select using (approved and auth.uid() is not null);
create policy guidance_staff on guidance for all using (is_staff()) with check (is_staff());

-- ---------- Storage privado ----------
insert into storage.buckets (id, name, public) values ('evolution-photos','evolution-photos', false), ('avatars','avatars', false) on conflict do nothing;
-- Convenção de caminho: <patient_id>/<arquivo>
create policy "photos_owner_rw" on storage.objects for all to authenticated
  using (bucket_id in ('evolution-photos','avatars') and (storage.foldername(name))[1] = my_patient_id()::text)
  with check (bucket_id in ('evolution-photos','avatars') and (storage.foldername(name))[1] = my_patient_id()::text);
create policy "photos_staff_read" on storage.objects for select to authenticated
  using (bucket_id = 'evolution-photos' and is_staff() and exists (
    select 1 from consents c where c.patient_id::text = (storage.foldername(name))[1] and c.kind = 'photos_staff' and c.granted
      and c.granted_at = (select max(granted_at) from consents where patient_id = c.patient_id and kind = 'photos_staff')));
-- Entrega de imagens: sempre via URLs assinadas de curta duração (createSignedUrl), nunca URLs públicas.
