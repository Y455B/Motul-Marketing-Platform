# Africa Marketing Platform
### Motul Africa × Declic Agency

Plateforme digitale de gestion des actions marketing partenaires Motul Africa.

---

## Stack

- **Frontend** : React 18 + Vite
- **Auth + DB** : Supabase
- **Stockage fichiers** : Supabase Storage
- **Hébergement** : Vercel
- **Emails** : Resend (optionnel)

---

## Installation locale

```bash
# 1. Cloner le repo
git clone https://github.com/TON_COMPTE/africa-marketing-platform.git
cd africa-marketing-platform

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# → Éditer .env avec tes clés Supabase

# 4. Lancer en dev
npm run dev
# → http://localhost:3000
```

---

## Configuration Supabase

### 1. Créer un projet sur supabase.com

### 2. Créer les tables SQL (Settings > SQL Editor)

```sql
-- Utilisateurs (géré par Supabase Auth)
-- Ajouter le rôle dans user_metadata via dashboard ou API

-- Demandes marketing (DMP)
create table dmp_requests (
  id text primary key,
  title text not null,
  company text not null,
  demandeur text not null,
  category text not null,
  budget numeric not null,
  launch_date date not null,
  status text default 'pending',
  comment text,
  motif text,
  documents jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Demandes Motul Library
create table library_requests (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  email text not null,
  entreprise text not null,
  poste text not null,
  access_granted boolean default false,
  created_at timestamptz default now()
);

-- Abonnés newsletter
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nom text,
  prenom text,
  entreprise text,
  created_at timestamptz default now()
);

-- Actualités
create table news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  visible boolean default true,
  created_at timestamptz default now()
);

-- Sliders homepage
create table sliders (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  btn_label text,
  image_url text,
  visible boolean default true,
  sort_order integer default 0
);
```

### 3. Créer un bucket Storage

Dans Supabase > Storage > New bucket :
- Nom : `platform-files`
- Public : Non (accès via signed URLs)

### 4. Récupérer les clés API

Settings > API :
- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_ANON_KEY` = anon public key

---

## Déploiement Vercel

```bash
# Option 1 : Via CLI
npm install -g vercel
vercel --prod

# Option 2 : Via GitHub
# → Connecter le repo sur vercel.com
# → Ajouter les variables d'environnement dans Settings > Environment Variables
# → Chaque push sur main = déploiement automatique
```

**Variables à ajouter sur Vercel :**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Structure du projet

```
africa-marketing-platform/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Topbar + Sidebar + routing
│   ├── pages/
│   │   ├── Login.jsx           # Page connexion
│   │   ├── DMP.jsx             # Module Actions Marketing (Phase 2)
│   │   ├── Hub.jsx             # Hub fichiers (Phase 1) — à brancher
│   │   ├── Library.jsx         # Motul Library (Phase 3) — à brancher
│   │   ├── News.jsx            # Actualités (Phase 3) — à brancher
│   │   ├── Sliders.jsx         # Sliders (Phase 3) — à brancher
│   │   └── Newsletter.jsx      # Newsletter (Phase 3) — à brancher
│   ├── lib/
│   │   └── supabase.js         # Client + helpers auth + storage
│   └── styles/
│       └── global.css          # Variables Motul + composants
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

---

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `admin` | Back-office complet, validation DMP, gestion users |
| `user` | Formulaires, lecture actualités, favoris |

Attribuer le rôle dans Supabase > Authentication > Users > Edit user metadata :
```json
{ "role": "admin" }
```

---

## Roadmap

- [x] Phase 1 — Hub fichiers (démo)
- [x] Phase 2 — Module DMP (démo + code)
- [x] Phase 3 — Library, Actualités, Sliders, Newsletter (démo + code)
- [ ] Connecter Supabase (auth réelle)
- [ ] Brancher Storage pour upload fichiers
- [ ] Emails automatiques via Resend
- [ ] Domaine custom (africa-marketing.ma)

---

*Developed by Declic Agency for Motul Africa*
