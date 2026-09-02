Petit projet permettant de démontrer les fonctionnalités suivantes :

séparation des responsabilités ;
communication inter-services ;
traitement de gros volumes ;
batch ;
limitation de concurrence ;
timeout ;
retry ;
exponential backoff ;
gestion des erreurs.

batchSize optimise principalement :

mémoire ;
taille des traitements intermédiaires ;
gestion des retries ;
taille des résultats.

maxConcurrency optimise principalement :

débit ;
saturation du service distant ;
connexions réseau ;
CPU/RAM ;
nombre d'erreurs.
