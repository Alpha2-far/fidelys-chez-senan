# PRD - Fidélys Chez Sénan

**Produit** : Application de fidélité PWA, outil interne de la boutique Chez Sénan
**Prestataire** : ON AGENCY
**Version** : 1.0
**Statut** : En cours de construction (Mai 2026)

> Ce document est la source de vérité produit. Toute décision de build doit pouvoir s'y rattacher. Si une feature n'est pas ici, elle n'est pas dans le scope v1.

---

## 1. Vision

Remplacer la carte de fidélité papier de la boutique Chez Sénan (vêtements et tissus africains, Cotonou) par un outil digital simple, géré en interne par le vendeur, qui automatise la fidélité et permet la communication directe avec les clients.

**Promesse client** : "Je présente mon QR, le vendeur scanne, mes achats sont crédités, je reçois mes bons automatiquement."
**Promesse vendeur** : "Je n'ai plus à gérer de cartes papier, ni à faire les calculs, ni à oublier qui mérite un bon."

---

## 2. Personas

### Le client (Aïcha, 34 ans, cliente régulière)

- Achète des tissus et vêtements 2 à 4 fois par an chez Sénan
- Possède un smartphone Android, utilise WhatsApp en permanence
- N'installera jamais une application depuis un store pour une seule boutique
- Veut savoir où elle en est dans sa fidélité, sans appeler la boutique

### Le vendeur (Sénan, propriétaire de la boutique)

- Tient sa boutique seul ou avec un assistant
- Utilise un smartphone et parfois un ordinateur portable
- Veut un outil rapide à utiliser pendant qu'un client paie
- N'a pas le temps de former chaque nouveau client à une app compliquée

---

## 3. Parcours utilisateur

### 3.1 Parcours client : première inscription

```
1. Le client passe en boutique et achète quelque chose
2. Le vendeur lui propose la carte de fidélité digitale
3. Vendeur ouvre son dashboard, saisit nom + numéro
4. Le système génère un lien unique : https://chezsenan.app/carte/[uuid]
5. Vendeur copie le lien, l'envoie au client par WhatsApp
6. Client clique sur le lien depuis son téléphone
7. La PWA s'ouvre dans le navigateur, le client voit sa carte
8. Le navigateur propose "Installer l'application" : un raccourci apparaît sur l'écran d'accueil
9. Le client autorise les notifications quand on lui demande
```

### 3.2 Parcours client : achat suivant

```
1. Client revient en boutique, ouvre sa PWA depuis l'écran d'accueil
2. Affiche son QR code au vendeur
3. Vendeur scanne, saisit le montant, valide
4. Client reçoit une notification push : "Achat de X FCFA crédité, solde Y FCFA"
5. Si seuil atteint, deuxième notification : "Bon de 50 000 FCFA généré, code ABC123, valable 150 jours"
6. Le bon apparaît sur la carte du client (code masqué par défaut, bouton Révéler)
```

### 3.3 Parcours client : utiliser un bon

```
1. Client en boutique veut utiliser son bon
2. Sur sa PWA, il appuie sur "Révéler le code", récite ou montre les 6 caractères
3. Vendeur saisit le code dans le dashboard, indique le montant à utiliser
4. Système valide, met à jour le solde du bon
5. Si bon partiellement utilisé, le client garde le solde restant pour plus tard
```

### 3.4 Parcours vendeur : enregistrer un achat

**Mode rapide (privilégié) : scan QR**

```
1. Vendeur ouvre le dashboard, page "Enregistrer un achat"
2. Appuie sur "Scanner", la caméra s'ouvre
3. Pointe le QR code affiché sur le téléphone du client
4. Profil client identifié immédiatement, solde affiché
5. Saisit le montant, valide
```

**Mode secours : recherche par téléphone**

```
1. Si pas de QR (téléphone client déchargé, etc.), vendeur tape le numéro
2. Recherche en temps réel dès 3 caractères
3. Sélectionne le bon client, valide le montant
```

### 3.5 Parcours vendeur : envoyer une campagne

```
1. Page "Campagnes" dans le dashboard
2. Saisit titre + corps du message + lien optionnel
3. Aperçu de la notification telle qu'elle s'affichera
4. Bouton "Envoyer à tous les clients"
5. Le système envoie à tous les clients ayant push_subscription non null
6. Historique des campagnes archivé pour consultation
```

---

## 4. Fonctionnalités v1 (scope figé)

### Côté client (interface PWA `/carte/:access_token`)

- Affichage du nom de la boutique en en-tête (configurable depuis les paramètres)
- Solde cumulé en FCFA
- Barre de progression vers le prochain bon
- Texte d'encouragement dynamique
- QR code unique du client, toujours visible
- Liste des bons actifs avec code masqué + révélation 10 secondes
- Bons partiellement utilisés : affichage solde restant
- Date d'expiration de chaque bon
- Historique des transactions (achats + utilisations de bons)
- Mode hors ligne via service worker
- Notifications push (achat crédité, bon généré, rappel expiration, campagne)
- Installation PWA depuis le navigateur

### Côté vendeur (dashboard `/admin`, auth requise)

- Vue d'ensemble : stats clients inscrits, bons actifs, bons expirés ce mois, total récompenses distribuées
- Inscription d'un nouveau client : nom + téléphone, génération automatique du lien, bouton copier
- Enregistrer un achat : scan QR ou recherche téléphone, saisie montant, validation
- Valider un bon : saisie code 6 caractères, montant à utiliser
- Campagnes : créer, envoyer, historique
- Paramètres boutique : nom de la boutique, couleur principale, seuil de bon, valeur du bon, durée de validité

### Backend (Supabase Edge Functions)

- `credit-purchase` : crédite un achat, génère un bon si seuil atteint, envoie les push
- `validate-voucher` : valide l'utilisation d'un bon, gère les utilisations partielles
- `send-reminders` : cron quotidien à 20h, envoie rappels J+30, J+60, J+90, J+120
- `send-campaign` : envoie une campagne push à tous les clients abonnés

---

## 5. Hors périmètre v1

À ne pas construire, à ne pas suggérer pendant le build :

- Site vitrine public (catalogue, pages produit, etc.) : c'est un outil interne uniquement
- Logo de boutique : seul le nom textuel est utilisé
- Paiement en ligne
- Multi-boutiques sur un même compte vendeur
- Application native iOS/Android
- Récupération de mot de passe self-service (gérée par ON AGENCY)
- Création de compte client : le client n'a jamais de mot de passe, son lien unique fait office d'authentification
- Automatisation des avis Google
- Programme de parrainage

---

## 6. Modèle de données

### Tables Supabase

**shops**

| Champ | Type | Notes |
|-------|------|-------|
| id | uuid PK | gen_random_uuid() |
| name | text | identifiant interne |
| slug | text unique | utilisé dans les URLs si besoin |
| shop_name | text | nom affiché côté client (configurable) |
| primary_color | text | défaut '#C17A2B' |
| created_at | timestamptz | |

**reward_config**

| Champ | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| shop_id | uuid FK | |
| threshold_amount | integer | défaut 500 000 FCFA |
| voucher_amount | integer | défaut 50 000 FCFA |
| voucher_validity_days | integer | défaut 150 |
| updated_at | timestamptz | |

**customers**

| Champ | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| shop_id | uuid FK | |
| name | text | |
| phone | text | |
| total_spent | integer | cumul historique en FCFA |
| created_at | timestamptz | |
| push_subscription | jsonb | objet PushSubscription sérialisé |
| access_token | uuid | UNIQUE, sert d'auth client |

Contrainte : UNIQUE(shop_id, phone)

**transactions**

| Champ | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| customer_id | uuid FK | |
| shop_id | uuid FK | |
| amount | integer | en FCFA |
| type | text | 'purchase' ou 'voucher_use' |
| voucher_id | uuid FK nullable | renseigné si type = voucher_use |
| created_at | timestamptz | |

**vouchers**

| Champ | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| customer_id | uuid FK | |
| shop_id | uuid FK | |
| code | text UNIQUE | 6 caractères alphanumériques majuscules |
| amount_total | integer | |
| amount_used | integer | défaut 0 |
| amount_remaining | integer | colonne générée |
| status | text | 'active', 'partially_used', 'used', 'expired' |
| generated_at | timestamptz | |
| expires_at | timestamptz | |
| milestone | integer | numéro du palier |

**notification_log**

| Champ | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| customer_id | uuid FK | |
| type | text | 'purchase_credited', 'voucher_generated', 'voucher_reminder', 'campaign' |
| voucher_id | uuid FK nullable | |
| campaign_id | uuid FK nullable | |
| sent_at | timestamptz | |
| reminder_day | integer nullable | 30, 60, 90 ou 120 |

**campaigns**

| Champ | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| shop_id | uuid FK | |
| title | text | |
| body | text | |
| destination_url | text nullable | |
| sent_at | timestamptz nullable | |
| created_at | timestamptz | |

---

## 7. Règles métier strictes

### R1 : Génération des bons

À chaque achat, le système calcule `milestones_reached = FLOOR(total_spent / threshold_amount)`. Il compare au nombre de bons déjà générés pour ce client. Si supérieur, il génère exactement la différence en bons. Cela garantit qu'un client ne reçoit jamais deux bons d'un coup même si un achat dépasse plusieurs paliers.

### R2 : Code bon

Le code est généré côté serveur (Edge Function), 6 caractères alphanumériques majuscules. Il doit être unique dans toute la table vouchers. En cas de collision (très rare), regénérer.

### R3 : Utilisation partielle

Un bon peut être utilisé en plusieurs fois. Le statut passe à `partially_used` jusqu'à épuisement, puis `used`. Un bon expiré ne peut plus être utilisé même partiellement.

### R4 : Expiration

Un bon expire après `voucher_validity_days` jours. Le cron quotidien `send-reminders` met à jour le statut en `expired` et bloque toute utilisation future.

### R5 : Rappels d'expiration

Les rappels sont envoyés à J+30, J+60, J+90, J+120 après génération du bon, à condition que le bon soit toujours actif ou partiellement utilisé. Un seul rappel par seuil par bon (vérification dans notification_log).

### R6 : Sécurité d'accès client

Le client n'a aucun compte. Son seul moyen d'accéder à sa carte est le lien `https://[domaine]/carte/[access_token]`. Le token est un UUID v4 non séquentiel. Aucune autre route ne doit exposer les données d'un client.

### R7 : RLS Supabase

Toutes les tables doivent avoir Row Level Security activé. La table `customers` doit être accessible en lecture publique uniquement via l'access_token (politique RLS dédiée). Le dashboard vendeur passe par auth.uid() pour vérifier shop_id.

### R8 : Pas de logo

Aucune image de logo n'est gérée par le système. L'identité visuelle de la boutique côté client se résume au nom textuel `shop_name` et à la couleur `primary_color`.

---

## 8. Critères d'acceptation v1

Le produit est livrable quand :

- [ ] Un vendeur peut s'authentifier sur `/admin`
- [ ] Un vendeur peut inscrire un nouveau client en moins de 30 secondes
- [ ] Le lien client généré ouvre la carte correctement sur mobile
- [ ] Le QR client est visible et scannable depuis le téléphone du vendeur
- [ ] Le scan QR depuis le dashboard ouvre le profil client en moins de 3 secondes
- [ ] Un achat crédité déclenche une notification push chez le client en moins de 5 secondes
- [ ] Quand le seuil est atteint, un bon est automatiquement généré et notifié
- [ ] Un bon partiellement utilisé garde son solde correct
- [ ] Le rappel J+30 est bien envoyé pour un bon généré 30 jours plus tôt
- [ ] La PWA s'installe sur Android et iOS
- [ ] La carte client fonctionne hors ligne (affichage du dernier état connu)
- [ ] Le vendeur peut modifier le nom de la boutique depuis les paramètres et la modification apparaît côté client
- [ ] Toutes les tables ont RLS activé
- [ ] Aucun secret n'est commité dans le code

---

## 9. KPI à suivre post-lancement

- Taux d'inscription : nombre de clients inscrits par mois
- Taux d'activation : % de clients qui ont cliqué sur leur lien après inscription
- Taux d'utilisation des bons : % de bons utilisés avant expiration
- Engagement push : taux de clic sur les notifications campagne
- Temps moyen de validation d'un achat côté vendeur
