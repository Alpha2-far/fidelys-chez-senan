# Fidelys Chez Senan

Programme de fidelite digital pour la boutique **Chez Senan** (Cotonou).

## Stack technique

- **Frontend** : React 18 + Vite + Tailwind CSS v3
- **Backend** : Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **PWA** : vite-plugin-pwa + Workbox
- **Hosting** : Vercel

## Installation locale

```bash
npm install
cp .env.example .env.local
# Remplir les variables dans .env.local
npm run dev
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Cle anonyme Supabase (publique) |

## Documentation

- [PRD.md](./PRD.md) - Specification produit
- [PHASES.md](./PHASES.md) - Roadmap d'execution
- [CLAUDE.md](./CLAUDE.md) - Regles de developpement
