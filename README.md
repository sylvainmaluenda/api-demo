# Orders Batch Processing — Node.js Microservices

> Mini-projet **Node.js orienté backend / architecture distribuée**, conçu autour d'un problème concret : traiter la relance des clients d'un grand volume de commandes ayant un status "en attente de paiement" de manière contrôlée, résiliente et observable, tout en déclenchant un traitement asynchrone côté notifications.

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

### `orders-service`

API Rest classique responsable des commandes :

- requêtes CRUD complètes avec params & queries
- structure de commande claire
- gestion des routes 404
- gestion des erreurs via middleware global
- commandes aléatoires via mock configurable
- repository mémoire via Map.

### `notifications-service`

Responsable de l'orchestration du traitement :

- simulation d'envoi d'emails de relance ;
- récupération des commandes concernées (pending status) ;
- découpage en batches ;
- limitation de la concurrence ;
- appel HTTP vers `orders-service` ;
- gestion des erreurs 413: Payload too long ;
- retry ;
- backoff ;
- timeout et latence configurables ;
- annulation via `AbortController` ;
- agrégation des résultats ;

- simulation d'échecs.

L'envoi d'email est volontairement **simulé** afin de se concentrer sur les problématiques de communication inter-services et de traitement concurrent.

---

## ⚙️ Flux de traitement

Lorsqu'un traitement des commandes est lancé :

Notifications
│
▼
Get orders from orders-service while existing (limit = `batchOrderSize`)
│
▼
Split orders into SMPT batches (max concurrency = `batchSmtpSize`)
│
▼
Process batch
│
├── Order 1 ──▶ Send mail ──▶ Success
├── Order 2 ──▶ Send mail ──▶ Failure
└── ...
│
▼
Retry batch while failures till (attempts limit = `maxAttempts`)
│
▼
Aggregate results
│
▼
Next SMTP batch
│
▼
Next Order batch

---

## 🧠 Points techniques principaux

### 1. Batch processing

Le traitement d'un grand volume de commandes est découpé en lots (batches) afin de contrôler la taille du payload envoyé par le service orders.

Paramètre : `batchOrderSize`
Responsabilité : **HTTP / transport**

La taille des batches est configurable afin de pouvoir observer son impact sur les performances.

---

### 2. Concurrency control

Afin de na pas saturer le service SMTP distant (simulé), le projet distingue :
batchOrderSize → combien de commandes composent un lot
batchSmtpSize → combien de requêtes peuvent être actives simultanément (contrôle de concurrence)

Paramètre : `batchSmtpSize`
Responsabilité : **Traitement / SMTP**

---

### 3. Timeout configurable

Chaque appel vers le serveur SMTP distant peut être soumis à un timeout.

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

L'utilisation de `AbortController` permet à l'utilisateur d'annuler un `fetch` en cours.

Le signal est propagé jusqu'à l'appel du service SMTP. Le projet exploite ce mécanisme pour gérer les interruptions et éviter de continuer inutilement des traitements qui ne doivent plus être poursuivis.

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

Si une partie des commandes a déjà été traitée avant l'annulation, ces résultats ne sont pas perdus.

Le traitement distingue notamment :

- commandes traitées avec succès ;
- commandes ayant échoué ;
- commandes restantes après abort.

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
  (batchOrderSize, batchSmtpSize, maxAttempts, timeout, backoff);
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
├── orders-service/ et notifications-service/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── middlewares/
│   └── tests/
│       └── http/
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

Lancer `orders-service` sur le port 3000:

```bash
cd orders-service
npm run start:dev
```

Lancer `notifications-service` dans un autre terminal sur le port 3001:

```bash
cd notifications-service
npm run start:dev
```

Exécuter la route `http://localhost:3001/notifications/send-reminders`
depuis `notifications-service/tests/http/notification.request.http` avec l'extension
REST Client de Huachao Mao ou directement depuis un nouveau terminal powershell :

```bash
Invoke-WebRequest -Uri "http://localhost:3001/notifications/send-reminders" -Method GET
```

Les ports et paramètres peuvent être adaptés via la configuration du projet
(dossier config/ de chaque microservice)

---

## 🔬 Scénarios intéressants à tester

### Petit batch / faible concurrence

Permet d'observer le fonctionnement nominal du traitement.

### Batch important

Permet d'observer la différence entre `batchOrderSize` et `batchSmtpSize`
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
notifications
  │
  │ HTTP
  ▼
orders
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

- worker pool pour optimiser la gestion de la concurrence ;
- persistance des jobs et de leur état ;
- reprise des jobs après crash ;
- rate limiting des appels SMTP ;
- tests de charge automatisés ;
- tests unitaires et d'intégration avec Jest et SuperTest ;
- mise en place de métriques et de tracing ;
- durcissement de la politique CORS ;
- gestion des tokens et de l'authentification ;
- contrôle fin des DTO avec Zod ;
- gestion sécurisée des variables d'environnement.

Ces éléments ne sont volontairement pas tous implémentés : le projet se concentre sur le **batch processing, la concurrence, les retries, les timeouts et l'annulation distribuée**.

---

## 👨‍💻 À propos

Ce projet fait partie de mes travaux personnels autour du développement **backend Node.js**, avec un intérêt particulier pour les problématiques de **conception, performance, résilience et architecture distribuée**.

Il est présenté comme un **mini-projet technique** permettant de rendre visibles les choix d'architecture et les problématiques rencontrées plutôt que comme une simple démonstration d'API CRUD.
