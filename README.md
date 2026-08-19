# payment-service

Service NestJS de paiement (mode sandbox Stripe) : dépôts, retraits (transfert plateforme → compte
connecté, et payout compte connecté → banque), webhooks, historique complet des transactions, et
enregistrement auprès d'un serveur Eureka.

## 0. Prérequis

- Node.js 18+ et npm
- Un compte [Stripe](https://dashboard.stripe.com) (mode Test/Sandbox — aucun document requis pour tester)
- Une base PostgreSQL [Neon](https://neon.tech) (offre gratuite suffisante pour démarrer)
- Optionnel : la [Stripe CLI](https://docs.stripe.com/stripe-cli) pour tester les webhooks en local

## 1. Créer le projet (si tu repars de zéro)

Ce dossier contient déjà tous les fichiers nécessaires. Si tu veux comprendre d'où on part, la commande
canonique pour générer un projet NestJS vide est :

```bash
npm i -g @nestjs/cli
nest new payment-service --package-manager npm
```

Ensuite, tu remplaces le contenu généré par les fichiers de ce dossier (`src/`, `package.json`, etc.).
Si tu utilises directement ce dossier fourni, passe à l'étape 2.

## 2. Installer les dépendances

```bash
cd payment-service
npm install
```

## 3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Puis renseigne dans `.env` :

- `DATABASE_URL` : l'URL de connexion Neon (Dashboard Neon → Connection string → coche "Pooled connection"
  si tu veux, garde `sslmode=require`)
- `STRIPE_SECRET_KEY` : ta clé **secrète de test** (`sk_test_...`), récupérable dans Dashboard Stripe →
  Developers → API keys, en mode "Test/Sandbox"
- `STRIPE_WEBHOOK_SECRET` : voir étape 5
- Les variables `EUREKA_*` / `SERVICE_*` : à adapter selon ton infrastructure Docker (mêmes conventions que
  ton service `messagerie-service` — le `SERVICE_HOST` doit correspondre au nom du service dans
  `docker-compose.yml`/le réseau Docker)

## 4. Lancer le service

```bash
npm run start:dev
```

Le service écoute sur `http://localhost:3000`. Vérifie qu'il tourne :

```bash
curl http://localhost:3000/health
```

**Documentation Swagger** : une fois le service démarré, ouvre `http://localhost:3000/docs` — chaque
route y est documentée avec des exemples de requête et de réponse pré-remplis (montants, ids Stripe,
statuts), testables directement depuis l'interface via "Try it out".

Au démarrage, il tente de s'enregistrer auprès d'Eureka après un court délai (`EUREKA_START_DELAY_MS`,
5s par défaut) pour laisser le temps au réseau Docker de se stabiliser — reprend le pattern de ton exemple
`messagerie-service` avec retry en backoff exponentiel en cas d'échec.

## 5. Tester les webhooks Stripe en local

Avec la Stripe CLI :

```bash
stripe login
stripe listen --forward-to localhost:3000/webhooks/stripe
```

La commande affiche un secret `whsec_...` — colle-le dans `STRIPE_WEBHOOK_SECRET` de ton `.env`, puis
redémarre le service.

## 6. Exemples d'appels (dépôt → confirmation → historique)

**Créer un dépôt (encaissement) :**

```bash
curl -X POST http://localhost:3000/payments/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "eur", "customerEmail": "test@example.com", "description": "Test dépôt"}'
```

**Confirmer avec une carte de test (sans frontend) :**

```bash
curl -X POST http://localhost:3000/payments/deposit/confirm \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId": "pi_xxx", "paymentMethod": "pm_card_visa"}'
```

Autres moyens de paiement de test utiles : `pm_card_visa_chargeDeclined` (échec simulé).

**Retrait — transfert plateforme vers un compte connecté :**

```bash
curl -X POST http://localhost:3000/payouts/transfer \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "currency": "eur", "connectedAccountId": "acct_xxx", "description": "Reversement"}'
```

**Historique des transactions :**

```bash
curl "http://localhost:3000/transactions?type=DEPOSIT&status=SUCCEEDED&page=1&limit=20"
```

## 7. Structure du projet

```
src/
├── main.ts                # bootstrap, rawBody activé pour les webhooks
├── app.module.ts           # assemblage de tous les modules
├── config/                 # lecture centralisée des variables d'environnement
├── eureka/                 # enregistrement auprès du service discovery
├── stripe/                 # client Stripe injectable (clé sandbox)
├── transactions/           # entité + service d'historique, utilisé par payments/payouts/webhooks
├── payments/                # dépôts (Payment Intents)
├── payouts/                 # retraits (Transfers + Payouts)
├── webhooks/                 # réception et vérification des événements Stripe
└── health/                   # endpoints /health et /info consommés par Eureka
```

## 8. À prévoir avant la production

- Remplacer `synchronize: true` (TypeORM) par de vraies migrations
- Passer les clés Stripe en mode live (`sk_live_...`) uniquement après vérification d'identité/entreprise
  auprès de Stripe — obligatoire pour déplacer de vrai argent, quel que soit le prestataire choisi
- Restreindre CORS à l'origine réelle du frontend plutôt que `enableCors()` ouvert
- Ajouter une authentification (JWT/API key) sur les routes `payments`/`payouts` avant exposition publique
