# PHASES.md - Roadmap d'exécution Fidélys Chez Sénan

> Tu coches au fur et à mesure. Tu ne sautes pas une phase. Tu ne commences pas la phase N+1 tant que la phase N n'est pas validée par l'utilisateur. Le PRD reste la source de vérité, ce fichier en est la trajectoire.

---

## Vue d'ensemble

| # | Phase | Durée estimée | Dépend de |
|---|-------|---------------|-----------|
| 1 | Setup projet et infra | 1 jour | rien |
| 2 | Schéma de base de données | 1 jour | 1 |
| 3 | Auth vendeur et shell admin | 1 jour | 2 |
| 4 | Inscription client et lien unique | 1 jour | 3 |
| 5 | Carte client (lecture + QR) | 2 jours | 4 |
| 6 | Edge Functions credit-purchase et validate-voucher | 2 jours | 5 |
| 7 | Dashboard vendeur : enregistrer un achat (scan QR + recherche) | 2 jours | 6 |
| 8 | Dashboard vendeur : valider un bon | 1 jour | 7 |
| 9 | Notifications push (VAPID, abonnement, envoi) | 2 jours | 8 |
| 10 | Cron send-reminders et expirations | 1 jour | 9 |
| 11 | Campagnes push | 1 jour | 9 |
| 12 | Paramètres boutique | 0.5 jour | 11 |
| 13 | Tests bout-en-bout, polish UX, formation | 2 jours | 12 |
| 14 | Mise en production | 0.5 jour | 13 |

**Total** : environ 18 jours ouvrables.

---

## Phase 1 : Setup projet et infra

**Objectif** : avoir un repo GitHub déployé sur Vercel qui affiche un "Hello Fidélys" dans un navigateur.

### Pré-requis à demander à l'utilisateur

- [x] Confirmer le nom du repo GitHub (proposer `fidelys-chez-senan`)
- [x] Confirmer que le projet Supabase existe et que le MCP est connecté
- [x] Récupérer l'URL et l'anon key Supabase
- [x] Récupérer le domaine Vercel (par défaut `fidelys-chez-senan.vercel.app`)

### Tâches

- [x] Initialiser le projet Vite + React : `npm create vite@latest`
- [x] Installer Tailwind v3 selon la doc officielle Vite + Tailwind
- [x] Installer React Router v6
- [x] Installer @supabase/supabase-js
- [x] Configurer `tailwind.config.js` avec une couleur primary par défaut #C17A2B
- [x] Créer `src/lib/supabase.js` qui exporte un client Supabase configuré via VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
- [x] Créer `.env.example` avec les variables documentées
- [x] Ajouter `.env.local` au `.gitignore`
- [x] Créer une route `/` qui affiche "Fidélys Chez Sénan"
- [x] Créer le repo GitHub via MCP, push initial sur main
- [x] Connecter le repo à Vercel, configurer les variables d'environnement
- [x] Vérifier que le deploy passe et que le site est accessible

### Critère de validation

Le navigateur affiche "Fidélys Chez Sénan" sur l'URL Vercel.

### Commit final

`Phase 1 : setup projet, déploiement Vercel`

---

## Phase 2 : Schéma de base de données

**Objectif** : toutes les tables existent dans Supabase avec RLS activé et une politique de base.

### Pré-requis à demander

- [x] Confirmer qu'on crée la boutique "Chez Sénan" en seed initial

### Tâches

- [x] Créer le dossier `supabase/migrations/`
- [x] Migration `0001_create_shops.sql` : table shops + seed Chez Sénan
- [x] Migration `0002_create_reward_config.sql` : table reward_config + seed pour Chez Sénan (500000, 50000, 150)
- [x] Migration `0003_create_customers.sql` : table customers avec access_token UUID, contrainte UNIQUE(shop_id, phone)
- [x] Migration `0004_create_vouchers.sql` : table vouchers avec colonne générée amount_remaining
- [x] Migration `0005_create_transactions.sql` : table transactions
- [x] Migration `0006_create_notification_log.sql`
- [x] Migration `0007_create_campaigns.sql`
- [x] Migration `0008_enable_rls.sql` : RLS activé sur toutes les tables
- [x] Migration `0009_rls_policies.sql` : politiques de base
  - customers : SELECT public si access_token correspond
  - tout le reste : auth.uid() requis avec shop_id matchant
- [x] Appliquer les migrations via MCP Supabase
- [x] Vérifier dans le dashboard Supabase que les tables sont créées et RLS est ON partout

### Critère de validation

Toutes les tables sont visibles dans Supabase, RLS est activé, le seed Chez Sénan existe dans `shops` et `reward_config`.

### Commit final

`Phase 2 : schéma DB et migrations initiales`

---

## Phase 3 : Auth vendeur et shell admin

**Objectif** : un vendeur peut se connecter sur `/admin/login` et arriver sur `/admin` qui affiche son nom et un menu vide.

### Pré-requis à demander

- [ ] Email du compte vendeur initial (pour le seed Auth)
- [ ] Mot de passe initial (à transmettre de façon sécurisée, l'utilisateur le créera dans Supabase Auth)

### Tâches

- [ ] Créer le compte vendeur dans Supabase Auth via MCP ou dashboard
- [ ] Créer `src/lib/auth.js` avec helpers signIn, signOut, getSession
- [ ] Créer `src/routes/AdminLogin.jsx` : formulaire email/password, redirection vers `/admin` si succès
- [ ] Créer `src/components/admin/ProtectedRoute.jsx` : wrapper qui vérifie la session, redirige vers `/admin/login` sinon
- [ ] Créer `src/routes/AdminDashboard.jsx` : affiche "Tableau de bord Chez Sénan" + bouton Déconnexion + menu de navigation vide pour l'instant
- [ ] Configurer React Router : `/`, `/admin/login`, `/admin/*` (toutes les sous-routes admin protégées)
- [ ] Tester en local : login fonctionne, déconnexion fonctionne, accès direct à /admin sans session redirige

### Critère de validation

Login → arrivée sur dashboard avec layout. Déconnexion → retour à login. Accès direct interdit.

### Commit final

`Phase 3 : authentification vendeur et layout admin`

---

## Phase 4 : Inscription client et lien unique

**Objectif** : depuis le dashboard, le vendeur peut créer un nouveau client et obtenir le lien à lui transmettre.

### Tâches

- [ ] Créer `src/routes/AdminCustomerNew.jsx` : formulaire nom + téléphone
- [ ] Au submit : INSERT dans customers, récupérer l'access_token généré, afficher le lien complet `https://[domaine]/carte/[access_token]`
- [ ] Bouton "Copier le lien" qui utilise `navigator.clipboard.writeText`
- [ ] Bouton "Envoyer par WhatsApp" qui ouvre `https://wa.me/?text=[lien encodé]`
- [ ] Gérer l'erreur de doublon de téléphone (contrainte UNIQUE) avec message clair
- [ ] Ajouter un lien vers cette page depuis le dashboard
- [ ] Lister les derniers clients inscrits sur le dashboard (limit 5, dernière inscription en haut)

### Critère de validation

Création d'un client → lien généré → cliquer sur le lien dans un nouvel onglet ouvre une page (peu importe son contenu pour l'instant, la phase 5 la construira).

### Commit final

`Phase 4 : inscription client et génération du lien unique`

---

## Phase 5 : Carte client (lecture seule + QR)

**Objectif** : la route `/carte/:accessToken` affiche la carte fidélité du client avec son QR code.

### Tâches

- [ ] Installer `qrcode` (npm)
- [ ] Créer `src/routes/ClientCard.jsx`
- [ ] Au mount : SELECT customer WHERE access_token = paramURL (politique RLS publique)
- [ ] Si pas trouvé : afficher "Lien invalide"
- [ ] Charger aussi le shop (shop_name, primary_color) et reward_config
- [ ] Afficher : en-tête avec shop_name, nom du client, solde cumulé, barre de progression, texte d'encouragement, QR code (URL = lien complet de cette page)
- [ ] Charger les bons actifs et partiellement utilisés du client, les afficher
  - Code masqué par défaut (CSS `filter: blur(8px)`)
  - Bouton "Révéler" : retire le blur pendant 10 secondes (setTimeout)
  - Date d'expiration formatée
  - Si partiellement utilisé : "Solde restant X / Y FCFA"
- [ ] Section "Historique" : bouton qui ouvre une modale ou une page dédiée listant les transactions
- [ ] Configurer la PWA via vite-plugin-pwa (manifest minimal : nom, theme_color, icons placeholder)
- [ ] Tester sur mobile : la PWA s'installe, l'icône apparaît sur l'écran d'accueil

### Critère de validation

Cliquer sur un lien client ouvre la carte avec toutes les infos correctes. Sur mobile, l'option "Installer" apparaît dans le navigateur.

### Commit final

`Phase 5 : carte client avec QR code et bons`

---

## Phase 6 : Edge Functions credit-purchase et validate-voucher

**Objectif** : la logique métier d'attribution des bons et de validation existe côté serveur, testable depuis l'admin Supabase.

### Pré-requis à demander

- [ ] Confirmer que le CLI Supabase est installé localement (sinon les fonctions sont déployées via MCP)

### Tâches credit-purchase

- [ ] Créer `supabase/functions/credit-purchase/index.ts`
- [ ] Inputs : customer_id, shop_id, amount
- [ ] Implémenter la logique R1 (génération de bons sur seuil) du PRD
- [ ] Générer le code bon (6 caractères, regen sur collision)
- [ ] Insérer la transaction
- [ ] Retourner la liste des bons générés et le nouveau solde
- [ ] Déployer via MCP Supabase
- [ ] Tester avec un appel HTTP direct (curl ou Supabase dashboard)

### Tâches validate-voucher

- [ ] Créer `supabase/functions/validate-voucher/index.ts`
- [ ] Inputs : code, amount_to_use, shop_id
- [ ] Vérifier existence, expiration, solde suffisant
- [ ] Mettre à jour amount_used et status
- [ ] Insérer la transaction de type voucher_use
- [ ] Retourner success + amount_remaining ou error code
- [ ] Déployer et tester

### Critère de validation

- Crédit d'un achat de 600 000 FCFA pour un client à 0 FCFA total → 1 bon généré, total_spent = 600 000.
- Crédit de 1 200 000 FCFA pour un client à 0 → 2 bons générés.
- Validation d'un code valide avec montant inférieur au solde → success, status = partially_used.
- Validation d'un code expiré → error.

### Commit final

`Phase 6 : Edge Functions credit-purchase et validate-voucher`

---

## Phase 7 : Dashboard vendeur, enregistrer un achat

**Objectif** : depuis le dashboard, le vendeur enregistre un achat soit en scannant le QR client, soit en cherchant par téléphone.

### Tâches

- [ ] Installer `@zxing/browser` (ou html5-qrcode, choix du dev avec validation utilisateur)
- [ ] Créer `src/routes/AdminPurchase.jsx`
- [ ] Sélecteur de mode : "Scanner QR" / "Rechercher par téléphone"
- [ ] Mode QR : ouvrir la caméra, lire le QR, extraire l'access_token de l'URL scannée, charger le customer correspondant
- [ ] Mode téléphone : input avec recherche en temps réel dès 3 caractères, debounce 300ms
- [ ] Une fois le client identifié : afficher nom + solde + progression
- [ ] Input montant (FCFA, entier, > 0)
- [ ] Bouton Valider → appelle l'Edge Function credit-purchase
- [ ] Afficher confirmation : "Achat de X FCFA crédité, nouveau solde Y FCFA"
- [ ] Si bon généré : afficher en plus "Un bon de Z FCFA a été généré, code ABCDEF"

### Critère de validation

Le vendeur peut enregistrer un achat en moins de 30 secondes via QR ou téléphone, le résultat s'affiche correctement.

### Commit final

`Phase 7 : enregistrement d'un achat avec scan QR`

---

## Phase 8 : Dashboard vendeur, valider un bon

**Objectif** : le vendeur peut entrer un code bon, voir le détail, et valider une utilisation partielle ou totale.

### Tâches

- [ ] Créer `src/routes/AdminVoucher.jsx`
- [ ] Input code 6 caractères majuscules
- [ ] À la saisie complète : SELECT voucher → afficher client, solde disponible, expiration
- [ ] Input montant à utiliser (max = amount_remaining)
- [ ] Bouton Valider → Edge Function validate-voucher
- [ ] Afficher confirmation avec solde restant
- [ ] Gérer toutes les erreurs : code invalide, bon expiré, montant trop élevé

### Critère de validation

Validation totale d'un bon : status = used. Validation partielle : status = partially_used, solde correct côté client.

### Commit final

`Phase 8 : validation d'un bon`

---

## Phase 9 : Notifications push

**Objectif** : le client reçoit les notifications "Achat crédité" et "Bon généré" sur son téléphone.

### Pré-requis à demander

- [ ] Générer une paire de clés VAPID (commande `npx web-push generate-vapid-keys`)
- [ ] L'utilisateur stocke la VAPID public dans VITE_VAPID_PUBLIC_KEY (env Vercel)
- [ ] L'utilisateur stocke la VAPID private dans les secrets Supabase Edge Functions

### Tâches côté client

- [ ] Créer `src/lib/push.js` : helpers pour subscribe, get permission, save subscription en DB
- [ ] Sur la carte client, déclencher la demande de permission au premier chargement
- [ ] Si accordée : créer un PushSubscription, l'enregistrer dans `customers.push_subscription`
- [ ] Créer `public/sw.js` (service worker custom ou via vite-plugin-pwa) qui gère l'événement `push` et affiche la notification

### Tâches côté serveur

- [ ] Modifier `credit-purchase` pour envoyer les push après crédit (achat + bon généré le cas échéant)
- [ ] Utiliser la lib web-push compatible Deno (ou implémenter manuellement la signature VAPID)
- [ ] Logger chaque envoi dans notification_log

### Critère de validation

Crédit d'un achat → notification reçue sur le téléphone du client. Génération d'un bon → notification distincte reçue.

### Commit final

`Phase 9 : notifications push fonctionnelles`

---

## Phase 10 : Cron send-reminders et expirations

**Objectif** : tous les jours à 20h, le système envoie les rappels J+30, J+60, J+90, J+120 et marque les bons expirés.

### Tâches

- [ ] Créer `supabase/functions/send-reminders/index.ts`
- [ ] Implémenter la logique R5 du PRD (rappels avec déduplication via notification_log)
- [ ] Marquer les bons dont expires_at < now() en status = 'expired'
- [ ] Configurer un cron Supabase pour appeler cette fonction tous les jours à 20h00 Africa/Porto-Novo
- [ ] Tester en simulant des dates (modifier manuellement generated_at d'un bon de test)

### Critère de validation

Un bon avec generated_at = now() - 30 jours déclenche un rappel quand le cron tourne. Un bon expiré devient inutilisable.

### Commit final

`Phase 10 : cron de rappels et expirations`

---

## Phase 11 : Campagnes push

**Objectif** : le vendeur peut envoyer un message push à tous les clients depuis le dashboard.

### Tâches

- [ ] Créer `supabase/functions/send-campaign/index.ts`
- [ ] Inputs : campaign_id, shop_id
- [ ] Charger tous les customers avec push_subscription non null pour ce shop
- [ ] Envoyer le push à chacun, logger dans notification_log
- [ ] Mettre à jour campaigns.sent_at
- [ ] Créer `src/routes/AdminCampaigns.jsx`
- [ ] Formulaire titre + corps + URL optionnelle
- [ ] Aperçu de la notification
- [ ] Bouton Envoyer (avec confirmation modale)
- [ ] Tableau historique des campagnes envoyées (date, titre, body)

### Critère de validation

Envoi d'une campagne test → tous les clients abonnés reçoivent la notification.

### Commit final

`Phase 11 : campagnes push`

---

## Phase 12 : Paramètres boutique

**Objectif** : le vendeur peut modifier le nom de la boutique, la couleur, et les paramètres de récompense depuis le dashboard.

### Tâches

- [ ] Créer `src/routes/AdminSettings.jsx`
- [ ] Charger shops + reward_config
- [ ] Champs éditables : shop_name, primary_color (color picker), threshold_amount, voucher_amount, voucher_validity_days
- [ ] Bouton Sauvegarder → UPDATE en DB
- [ ] Vérifier que le changement de shop_name apparaît côté client après refresh

### Critère de validation

Modification du nom de boutique → après refresh, la carte client affiche le nouveau nom.

### Commit final

`Phase 12 : paramètres boutique`

---

## Phase 13 : Tests bout-en-bout, polish UX, formation

**Objectif** : le produit est utilisable par un vendeur réel sans assistance.

### Tâches

- [ ] Parcours complet : inscription d'un client test, envoi du lien, achat de 600 000 FCFA, génération du bon, utilisation partielle, expiration simulée
- [ ] Polish visuel : cohérence des espacements, des polices, des couleurs avec primary_color
- [ ] Vérifier responsive sur 3 tailles : 375px, 768px, 1280px
- [ ] Vérifier que la PWA s'installe sur Android et iOS
- [ ] Vérifier que toutes les notifications arrivent
- [ ] Rédiger un mini guide vendeur (1 page, en français, dans `docs/guide-vendeur.md`)
- [ ] Rédiger un mini guide client (paragraphe à coller dans le message WhatsApp d'inscription)
- [ ] Corriger tous les warnings de la console

### Critère de validation

Démo complète sans bug visible. Le vendeur peut utiliser le produit sans poser de question.

### Commit final

`Phase 13 : polish UX et documentation`

---

## Phase 14 : Mise en production

**Objectif** : le produit est en ligne sur le domaine définitif et opérationnel pour Chez Sénan.

### Pré-requis à demander

- [ ] Domaine définitif (sous-domaine Vercel ou domaine personnalisé)
- [ ] Validation finale visuelle de l'utilisateur

### Tâches

- [ ] Configurer le domaine sur Vercel
- [ ] Vérifier toutes les variables d'environnement de prod
- [ ] Vérifier que le cron Supabase est bien actif sur le projet de prod
- [ ] Faire un dernier test end-to-end sur l'URL de prod
- [ ] Tag git v1.0.0
- [ ] Annoncer la livraison à l'utilisateur

### Critère de validation

Le produit tourne sur le domaine définitif, le vendeur peut commencer à inscrire ses clients réels.

### Commit final

`Release v1.0.0`

---

## En cas de blocage majeur

Si une phase prend plus du double du temps estimé ou si tu butes sur un problème non documenté ici :

1. Arrête le travail en cours
2. Résume à l'utilisateur : la phase, la sous-tâche, le blocage exact, ce que tu as essayé
3. Attends une décision avant de reprendre

Ne consomme pas de tokens à essayer cinq approches d'affilée.
