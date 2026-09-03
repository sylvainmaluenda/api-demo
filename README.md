# Orders Batch Processing — Node.js Microservices

> Mini-projet **Node.js orienté backend / architecture distribuée**, conçu autour d'un problème concret : traiter un grand volume de commandes de manière contrôlée, résiliente et observable, tout en déclenchant un traitement asynchrone côté notifications.

## 🎯 Pourquoi ce projet ?

Ce projet met en pratique plusieurs problématiques que l'on rencontre rapidement sur un backend soumis à de la charge :

- traiter **un grand nombre de commandes** sans saturer le système ;
- contrôler la **concurrence des appels HTTP** vers un service distant ;
- découper le traitement en **batches** ;
- gérer les **timeouts** et l'annulation avec `AbortController` ;
- distinguer une erreur métier, une erreur réseau et une interruption volontaire ;
- implémenter une stratégie de **retry avec backoff** ;
- conserver les résultats déjà obtenus lorsqu'un traitement est interrompu ;
- séparer les responsabilités au sein de **deux microservices indépendants**.

L'objectif n'était donc pas simplement de construire une API CRUD, mais de travailler sur les problématiques de **fiabilité, performance et résilience d'un traitement distribué**.

---

## 🏗️ Architecture

Le projet est volontairement composé de deux microservices :

┌──────────────────┐ ┌──────────────────────┐
│ │ │ │
│ orders-service │ ──────────▶ │notifications-service │
│ │ │ │
│ - orders │ │ - fake email sender │
│ - batching │ │ - simulated latency │
│ - concurrency │ │ - failures │
│ - retry │ │ │
│ - timeout │ │ │
│ - abort │ │ │
└──────────────────┘ └──────────────────────┘

### `orders-service`

Responsable de l'orchestration du traitement :

- récupération des commandes à traiter ;
- découpage en batches ;
- limitation de la concurrence ;
- appel HTTP vers `notifications-service` ;
- gestion des erreurs ;
- retry ;
- backoff ;
- timeout configurable ;
- annulation via `AbortController` ;
- agrégation des résultats.

### `notifications-service`

Responsable de l'envoi des notifications :

- réception d'une commande ;
- simulation d'un envoi d'email ;
- latence configurable ;
- simulation d'échecs ;
- prise en compte de l'annulation d'une requête HTTP.

L'envoi d'email est volontairement **simulé** afin de se concentrer sur les problématiques de communication inter-services et de traitement concurrent.

---

## ⚙️ Flux de traitement

Lorsqu'un traitement des commandes est lancé :

```
Orders
  │
  ▼
Load pending orders
  │
  ▼
Split into batches
  │
  ▼
Process batch
  │
  ├── Order 1 ──▶ Notification ──▶ Success
  ├── Order 2 ──▶ Notification ──▶ Retry ──▶ Success
  ├── Order 3 ──▶ Notification ──▶ Failure
  └── ...
  │
  ▼
Aggregate results
  │
  ▼
Next batch
```

Le système ne lance pas toutes les requêtes simultanément. La **taille du batch** et le **niveau de concurrence** sont deux paramètres distincts permettant de contrôler la pression exercée sur le service distant.

---

## 🧠 Points techniques principaux

### 1. Batch processing

Le traitement d'un grand volume de commandes est découpé en lots.

Cela permet notamment de :

- limiter la quantité de travail simultanément en mémoire ;
- contrôler le nombre d'appels réseau ;
- obtenir des résultats intermédiaires ;
- éviter qu'une seule opération massive ne monopolise le système.

La taille des batches est configurable afin de pouvoir observer son impact sur les performances.

---

### 2. Concurrency control

Un batch important ne signifie pas que toutes les commandes doivent être traitées simultanément.

Le projet distingue :

batchSize → combien de commandes composent un lot
maxConcurrency → combien de requêtes peuvent être actives simultanément

Cette distinction est importante pour éviter de transformer une optimisation apparente en **saturation du service distant**.

---

### 3. Timeout configurable

Chaque appel vers `notifications-service` peut être soumis à un timeout.

En cas de dépassement :

```
fetch
  │
  ├── response
  │
  └── timeout
        │
        ▼
   AbortController
        │
        ▼
    AbortError
```

Le timeout est configurable afin de pouvoir adapter le comportement du système aux caractéristiques du service appelé.

---

### 4. AbortController

L'utilisation de `AbortController` permet d'annuler réellement un `fetch` en cours.

Le signal est propagé jusqu'à l'appel HTTP. Le projet exploite ce mécanisme pour gérer les interruptions et éviter de continuer inutilement des traitements qui ne doivent plus être poursuivis.

---

### 5. Retry & backoff

Les erreurs récupérables peuvent faire l'objet de plusieurs tentatives.

Exemple :

```
Attempt 1
   │
   └── failure
        │
        ▼
     backoff
        │
        ▼
Attempt 2
   │
   └── failure
        │
        ▼
     backoff
        │
        ▼
Attempt 3
   │
   ├── success
   └── definitive failure
```

Le nombre maximal de tentatives et la stratégie de backoff sont configurables.

---

### 6. Gestion des résultats partiels

Un point important du projet est la gestion d'une interruption pendant un traitement.

Si une partie des commandes a déjà été traitée avant l'annulation, ces résultats ne sont pas simplement perdus.

Le traitement distingue notamment :

- commandes traitées avec succès ;
- commandes ayant échoué ;
- commandes interrompues ;
- commandes qui n'ont pas encore été traitées.

Cette approche permet d'éviter de considérer l'ensemble du batch comme un échec lorsqu'une interruption survient en cours de traitement.

---

## 🧪 Simulation de charge

Le service `notifications-service` simule volontairement :

- une latence réseau ;
- des échecs aléatoires ;
- des traitements concurrents ;
- l'interruption d'un traitement en cours.

Cela permet de tester le comportement de `orders-service` dans différents scénarios sans dépendre d'un véritable fournisseur d'emails.

Le projet peut ainsi être utilisé pour expérimenter l'effet de paramètres tels que :

```js
{
  (batchSize, maxConcurrency, maxAttempts, timeout, backoff);
}
```

et observer leur impact sur le comportement global.

---

## 📊 Ce que ce projet cherche à démontrer

Au-delà de la syntaxe Node.js / Express, ce mini-projet met l'accent sur des problématiques backend concrètes :

| Problématique                  | Réponse apportée               |
| ------------------------------ | ------------------------------ |
| Gros volume de données         | Batch processing               |
| Trop de requêtes simultanées   | Concurrency control            |
| Service distant lent           | Timeout                        |
| Annulation d'un traitement     | `AbortController`              |
| Erreurs transitoires           | Retry                          |
| Retries trop agressifs         | Backoff                        |
| Traitement interrompu          | Gestion des résultats partiels |
| Couplage entre responsabilités | Microservices                  |
| Service externe indisponible   | Gestion explicite des erreurs  |

---

## 🗂️ Structure du projet

```text
.
├── orders-service/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── middlewares/
│   └── ...
│
├── notifications-service/
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   └── ...
│
└── README.md
```

> La structure exacte peut évoluer indépendamment dans chaque microservice afin de conserver un découpage cohérent des responsabilités.

---

## 🚀 Installation

### Prérequis

- Node.js
- npm

Cloner le repository :

```bash
git clone <repository-url>
cd <repository-directory>
```

Installer les dépendances de chaque service :

```bash
cd orders-service
npm install

cd ../notifications-service
npm install
```

---

## ▶️ Lancement

Lancer `notifications-service` :

```bash
cd notifications-service
npm run start:dev
```

Puis lancer `orders-service` dans un autre terminal :

```bash
cd orders-service
npm run start:dev
```

Les ports et paramètres peuvent être adaptés via la configuration du projet.

---

## 🔬 Scénarios intéressants à tester

### Petit batch / faible concurrence

Permet d'observer le fonctionnement nominal du traitement.

### Batch important

Permet d'observer la différence entre :

```text
batchSize
```

et :

```text
maxConcurrency
```

et d'identifier le point à partir duquel augmenter la taille du batch n'apporte plus de gain.

### Latence élevée

Augmenter la latence simulée de `notifications-service` permet de tester les timeouts.

### Taux d'échec élevé

Permet d'observer :

- les retries ;
- le backoff ;
- les échecs définitifs.

### Annulation pendant un batch

Déclencher une annulation alors que plusieurs commandes sont en cours permet de vérifier :

- la propagation du signal ;
- l'arrêt des requêtes ;
- la conservation des résultats déjà obtenus ;
- la distinction entre commandes traitées et commandes interrompues.

---

## 💡 Quelques choix de conception

### Pourquoi deux microservices ?

Le découpage permet de rendre explicite la communication inter-services :

```text
orders
  │
  │ HTTP
  ▼
notifications
```

`orders-service` ne connaît pas l'implémentation de l'envoi d'email. Il dépend uniquement du contrat exposé par `notifications-service`.

### Pourquoi simuler l'envoi d'email ?

L'objectif du projet est la gestion du **traitement distribué**, et non l'intégration d'un fournisseur SMTP ou transactionnel.

La simulation permet de reproduire :

- latence ;
- erreurs ;
- concurrence ;
- annulation ;

sans ajouter de dépendance externe.

---

## 🧩 Compétences mises en œuvre

**Node.js · Express · JavaScript · REST · HTTP · Fetch API · Async/Await · Promises · AbortController · Concurrency · Batch Processing · Retry · Backoff · Timeout · Error Handling · Microservices**

---

## 🎓 Ce que j'ai cherché à travailler

Ce projet a été réalisé comme un exercice orienté **backend senior**, avec une attention particulière portée non seulement au fonctionnement nominal, mais également aux comportements du système sous contrainte :

> **Que se passe-t-il lorsque le volume augmente, que le service distant ralentit, que des requêtes échouent ou qu'un traitement est interrompu en cours d'exécution ?**

C'est autour de cette question que le projet a été conçu.

---

## 📌 Évolutions possibles

Plusieurs pistes permettraient de rapprocher le projet d'une architecture de production :

- message broker (`RabbitMQ`, Kafka...) ;
- idempotency ;
- circuit breaker ;
- dead-letter queue ;
- observabilité avec logs structurés ;
- métriques et tracing ;
- persistence des jobs ;
- reprise après crash ;
- rate limiting ;
- tests de charge automatisés.

Ces éléments ne sont volontairement pas tous implémentés : le projet se concentre sur le **batch processing, la concurrence, les retries, les timeouts et l'annulation distribuée**.

---

## 👨‍💻 À propos

Ce projet fait partie de mes travaux personnels autour du développement **backend Node.js**, avec un intérêt particulier pour les problématiques de **conception, performance, résilience et architecture distribuée**.

Il est présenté comme un **mini-projet technique** permettant de rendre visibles les choix d'architecture et les problématiques rencontrées plutôt que comme une simple démonstration d'API CRUD.
