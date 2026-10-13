# Mes tâches — application web

Application web mobile et ordinateur, avec stockage persistant SQLite sur votre propre serveur, interface française et API pour ChatGPT.

## Démarrage local (ordinateur)
1. Installer Node.js 20 ou supérieur.
2. Copier `.env.example` vers `.env` et remplacer **APP_PASSWORD** et **API_TOKEN** par deux secrets longs et différents.
3. Dans ce dossier : `npm install` puis `npm start`.
4. Ouvrir `http://localhost:3000`. À la première utilisation, entrer le **API_TOKEN** dans la fenêtre de connexion.

## Android et ordinateur avec synchronisation
Déployer le dossier sur un hébergement Node.js avec HTTPS et un **volume disque persistant** monté sur `DATA_DIR` (par exemple `/data`). Configurer APP_PASSWORD, API_TOKEN et DATA_DIR comme variables d'environnement. Ne pas utiliser un hébergement dont le disque est effacé lors des redéploiements. Ouvrir ensuite l'URL HTTPS sur chaque appareil ; dans Chrome Android, menu ⋮ > Ajouter à l'écran d'accueil.

## Connexion à ChatGPT
L'application expose une API REST protégée par `API_TOKEN`. Pour un GPT personnalisé disposant des Actions :
1. Déployer d'abord sur une URL HTTPS publique.
2. Dans la configuration de votre GPT, ajouter une Action et importer `https://votre-domaine/openapi.yaml`.
3. Choisir une authentification de type **API key**, en-tête `Authorization`, valeur `Bearer VOTRE_API_TOKEN` (suivant les options de l'éditeur, renseigner le préfixe Bearer).
4. Donner l'instruction : « Pour toute demande de création, consultation, modification ou suppression de tâche, utilise l'action Mes tâches. Demande confirmation avant toute suppression. »
5. Tester avec « Ajoute appeler le constructeur jeudi, catégorie Maison ».

**Important :** cette connexion ne s'active pas automatiquement dans une conversation ChatGPT ordinaire. Il faut configurer une Action ou une intégration équivalente ; selon les capacités du compte, cette fonction peut ne pas être disponible. Ne jamais partager le jeton. Le serveur doit être exposé en HTTPS, pas en HTTP public.

## Sauvegarde
Le bouton « Exporter JSON » télécharge toutes les tâches. Sauvegarder aussi régulièrement le fichier `DATA_DIR/tasks.db` (idéalement via la fonction de sauvegarde SQLite du fournisseur). La suppression d'une tâche est définitive.

## Sécurité
Usage personnel mono-utilisateur. Ne pas utiliser le jeton API dans une application partagée ou publique. Privilégier un hébergeur avec HTTPS, sauvegardes et volume persistant. L'interface garde le jeton en session du navigateur ; elle ne l'enregistre pas sur disque.
