# CLAUDE.md - Fidélys Chez Sénan

> Ce fichier est lu à chaque conversation. Il contient les règles que tu dois respecter en permanence sur ce projet. Les détails produit sont dans `PRD.md`. La roadmap d'exécution est dans `PHASES.md`.

---

## 1. Lis ces fichiers AVANT toute action

Au démarrage de chaque session, dans cet ordre :

1. `PRD.md` : ce que le produit doit faire (source de vérité)
2. `PHASES.md` : où en est le projet et quelle est la prochaine action
3. Le code existant pertinent à la phase en cours

Si tu es sur le point de coder quelque chose qui n'est pas dans le PRD, **arrête-toi et demande**. Ne suppose jamais. Ne crée pas de feature non listée.

---

## 2. Stack technique imposée

Aucune dérive autorisée vers d'autres technos sans validation explicite.

| Couche | Tech | Version |
|--------|------|---------|
| Frontend | React 18 + Vite | dernière stable |
| Routing | React Router | v6 |
| Styling | Tailwind CSS | v3 (pas v4) |
| PWA | vite-plugin-pwa + Workbox | dernière stable |
| Backend | Supabase | PostgreSQL + Auth + Edge Functions + Storage |
| Edge Functions | Deno | runtime Supabase |
| Auth vendeur | Supabase Auth email/password | |
| QR generation | qrcode (npm) | côté client |
| QR scanning | @zxing/browser ou html5-qrcode | côté vendeur |
| Push | Web Push API + VAPID | natif navigateur |
| Hosting | Vercel | déploiement auto sur push main |
| CI/CD | GitHub Actions ou Vercel native | |

**Règle absolue** : pas d'ajout de dépendance npm sans justification écrite dans le commit. Pas de framework UI lourd (Material UI, Chakra, etc.) : Tailwind suffit.

---

## 3. MCP disponibles

Tu as accès à deux MCP servers configurés :

### Supabase MCP

Utilisé pour : créer des migrations, exécuter des SQL, gérer les Edge Functions, configurer Auth, gérer Storage, lire les logs.

**Demande à l'utilisateur** quand tu as besoin :

- D'une clé API ou d'un secret (anon key, service role, VAPID, etc.) : "J'ai besoin de la VAPID public key pour l'environnement client. Peux-tu la générer et me la donner ?"
- D'un accès à un projet Supabase : "Le MCP Supabase pointe-t-il bien sur le projet `fidelys-chez-senan` ?"

### GitHub MCP

Utilisé pour : créer le repo, push, ouvrir des PR, lire les issues, gérer les branches.

**Demande à l'utilisateur** quand tu as besoin :

- De confirmer le nom du repo
- De créer un repo privé vs public

**Règle** : pas de PR auto-mergée. Tu ouvres une PR quand une phase est terminée, l'utilisateur valide.

---

## 4. Conventions de code

### Structure de dossiers

```
fidelys-chez-senan/
├── public/
├── src/
│   ├── lib/              # supabase.js, push.js, helpers
│   ├── routes/
│   │   ├── ClientCard.jsx       # /carte/:accessToken
│   │   ├── AdminLogin.jsx       # /admin/login
│   │   ├── AdminDashboard.jsx   # /admin
│   │   ├── AdminPurchase.jsx    # /admin/purchase
│   │   ├── AdminVoucher.jsx     # /admin/voucher
│   │   ├── AdminCampaigns.jsx   # /admin/campaigns
│   │   └── AdminSettings.jsx    # /admin/settings
│   ├── components/
│   │   ├── client/       # composants spécifiques à la carte client
│   │   ├── admin/        # composants spécifiques au dashboard
│   │   └── shared/       # boutons, inputs, etc.
│   ├── hooks/            # useCustomer, useVouchers, useShop
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── migrations/       # fichiers SQL versionnés
│   └── functions/
│       ├── credit-purchase/
│       ├── validate-voucher/
│       ├── send-reminders/
│       └── send-campaign/
├── PRD.md
├── PHASES.md
├── CLAUDE.md
└── README.md
```

### Nommage

- Fichiers React : `PascalCase.jsx`
- Hooks : `useXxx.js`, camelCase
- Helpers : `camelCase.js`
- Tables Supabase : `snake_case`
- Variables JS : `camelCase`
- Constantes : `UPPER_SNAKE_CASE`

### Style React

- Composants fonctionnels uniquement, pas de classes
- Hooks pour l'état et les effets, pas de Redux ni Zustand pour la v1
- Pas de prop drilling profond : un Context par domaine si vraiment nécessaire
- Un fichier = un composant exporté par défaut, sauf petits composants utilitaires

### Style Tailwind

- Mobile-first systématique : classes par défaut pour mobile, `md:` et `lg:` ensuite
- Pas de CSS custom sauf cas d'absolue nécessité (animations complexes)
- Couleurs principales définies dans `tailwind.config.js` à partir de `primary_color` du shop

### Erreurs et bords

- Toute fonction async qui appelle Supabase doit gérer son erreur explicitement
- Affichage utilisateur des erreurs : composant Toast partagé, pas d'`alert()`
- Logs d'Edge Functions : `console.log` est suffisant, Supabase les capture

---

## 5. Anti-dérive : règles strictes pour économiser les tokens

### À FAIRE

- Avant de modifier un fichier, le lire intégralement une fois
- Avant de créer une migration, vérifier qu'il n'en existe pas déjà une équivalente
- Avant d'écrire une Edge Function, valider la logique avec l'utilisateur en pseudo-code (10 lignes max)
- Cocher la case correspondante dans `PHASES.md` à la fin de chaque sous-tâche
- Commiter à la fin de chaque sous-tâche avec un message clair

### À NE PAS FAIRE

- Réécrire un fichier qui n'a pas besoin d'être modifié "pour l'améliorer"
- Ajouter des features non demandées (animations gratuites, dark mode, i18n, etc.)
- Régénérer du boilerplate déjà existant
- Refactor pendant une phase de build ; le refactor a sa propre phase si besoin
- Demander confirmation pour des actions évidentes et non destructives
- Faire des recherches web sur des sujets que tu maîtrises déjà (React, Tailwind, Supabase basics)

### Règle du "cap" par sous-tâche

Si une sous-tâche dure plus de 30 minutes ou consomme visiblement beaucoup de tokens sans progresser, **arrête-toi et résume à l'utilisateur** : où tu en es, ce qui bloque, ce que tu proposes. C'est mieux que de creuser dans une mauvaise direction.

---

## 6. Sécurité non négociable

- Aucun secret en clair dans le code (clés API, VAPID private, service role, etc.)
- Tous les secrets côté client : préfixe `VITE_` dans `.env.local`, et seulement les clés publiques (anon key, VAPID public key)
- Tous les secrets serveur : variables d'environnement Supabase Edge Functions, jamais dans le repo
- `.env.local` dans `.gitignore` dès le commit initial
- RLS activé sur toutes les tables avant le premier déploiement
- Politique RLS pour `customers` : lecture publique autorisée uniquement quand `access_token` matche le paramètre de requête
- Politique RLS pour le reste : auth.uid() requis et shop_id matche le shop du vendeur connecté

---

## 7. Workflow Git imposé

- Branche principale : `main`
- Une branche par phase : `phase-1-setup`, `phase-2-db`, etc.
- Commits atomiques avec messages clairs en français : "Ajoute la table vouchers", "Corrige la validation du code bon"
- Pas de force push sur `main`
- Une PR par phase, mergée par l'utilisateur après validation visuelle

---

## 8. Communication avec l'utilisateur

- Réponses denses et concises, sans préambule
- Pas de tirets cadratins (em dash) ni de tirets demi-cadratins (en dash) dans le code, les commentaires, les commits ou les réponses
- Quand tu poses une question, pose UNE question à la fois sauf si plusieurs sont strictement liées
- Quand tu termines une sous-tâche, dis-le en une phrase et passe à la suivante
- Si tu hésites entre deux approches, présente-les en 2 lignes chacune et demande, plutôt que de partir sur l'une au hasard

---

## 9. Quand tu es bloqué

Dans cet ordre :

1. Relis le PRD et PHASES.md, la réponse y est souvent
2. Lis le code existant pertinent
3. Pose UNE question précise à l'utilisateur
4. Ne devine pas. Ne consomme pas des tokens à essayer trois approches.

---

## 10. Définition de "fini" pour une sous-tâche

Une sous-tâche est finie quand :

- [ ] Le code compile sans warning
- [ ] La feature fonctionne en local (test manuel rapide)
- [ ] La case est cochée dans PHASES.md
- [ ] Un commit a été poussé
- [ ] Tu as dit à l'utilisateur ce qui est fait et ce qui suit
