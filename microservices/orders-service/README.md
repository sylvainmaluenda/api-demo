Tu développes une API Node.js qui reçoit des commandes à traiter.

Chaque commande ressemble à ceci :

{

&#x20; id: 42,

&#x20; userId: 123,

&#x20; amount: 149.99

}

Tu dois implémenter une fonction :

processOrders(orders)

qui traite toutes les commandes.

Le traitement d'une commande est représenté par :

async function processOrder(order) {

&#x20; // simulation d'un appel API externe

&#x20; await delay(randomBetween(100, 500));



&#x20; // 10% de chances d'échec

&#x20; if (Math.random() < 0.1) {

&#x20;   throw new Error(`Failed to process order ${order.id}`);

&#x20; }



&#x20; return {

&#x20;   orderId: order.id,

&#x20;   success: true

&#x20; };

}

Contraintes

Ton système doit respecter toutes les contraintes suivantes.

1\. Ne pas saturer le service externe

Tu peux recevoir 100 000 commandes.

Tu ne dois jamais avoir plus de 10 appels processOrder() simultanément.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

2\. Continuer malgré les erreurs

Si une commande échoue :

order 42 → success

order 43 → error

order 44 → success

l'erreur de 43 ne doit pas empêcher le traitement des autres commandes.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

3\. Retourner un résultat complet

À la fin, tu dois obtenir quelque chose comme :

{

&#x20; successful: \[...],

&#x20; failed: \[...]

}

Par exemple :

{

&#x20; successful: \[

&#x20;   { orderId: 1, success: true },

&#x20;   { orderId: 2, success: true }

&#x20; ],



&#x20; failed: \[

&#x20;   {

&#x20;     orderId: 3,

&#x20;     error: "Failed to process order 3"

&#x20;   }

&#x20; ]

}

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

4\. Préserver l'ordre des résultats

Si l'entrée est :

\[

&#x20; { id: 10 },

&#x20; { id: 11 },

&#x20; { id: 12 },

&#x20; { id: 13 }

]

les résultats doivent rester associés à cet ordre.

Même si :

12 termine avant 10

13 termine avant 11

11 termine avant 10

le résultat final doit respecter l'ordre initial.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

5\. Éviter une consommation mémoire inutile

Attention :

Promise.all(orders.map(processOrder))

est potentiellement problématique avec :

100 000 commandes

Tu dois réfléchir à ce qui est conservé en mémoire et pendant combien de temps.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

6\. Ajouter une politique de retry

Une commande ayant échoué doit pouvoir être réessayée.

Règle :

tentative initiale

&#x20;   ↓

échec

&#x20;   ↓

retry 1

&#x20;   ↓

échec

&#x20;   ↓

retry 2

&#x20;   ↓

échec

&#x20;   ↓

définitivement failed

Maximum 3 tentatives au total.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

7\. Backoff

Entre deux tentatives, attendre :

retry 1 → 100 ms

retry 2 → 200 ms

Tu dois donc réfléchir à la manière de composer :

async function processOrderWithRetry(order)

avec :

processOrder(order)



Le traitement doit pouvoir être annulé.

On fournit :

const controller = new AbortController();



processOrders(orders, {

&#x20; signal: controller.signal

});

Puis à n'importe quel moment :

controller.abort();

À partir de cet instant :

•	aucune nouvelle commande ne doit être démarrée ; 

•	les commandes déjà en cours peuvent terminer ; 

•	le système doit retourner les résultats déjà obtenus ; 

•	les commandes jamais commencées doivent être identifiables. 





