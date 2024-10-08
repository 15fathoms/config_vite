# Projet Vite Build avec Obfuscation et Watcher

Ce projet utilise **Vite** pour construire des fichiers JavaScript et SCSS, avec des alias de chemins pour les ressources. Il inclut également une fonction de **watch** pour surveiller les changements dans les fichiers et reconstruire automatiquement les fichiers nécessaires. Un serveur WebSocket est également utilisé pour envoyer des signaux de rafraîchissement aux clients après la compilation.

## Fonctionnalités

- **Compilation avec Vite** : Compile les fichiers JavaScript et SCSS en utilisant Vite.
- **Obfuscation** : Optionnel, obfuscation des fichiers JavaScript après la compilation pour les protéger.
- **Watch Mode** : Surveille les changements dans les fichiers et reconstruit automatiquement les fichiers nécessaires.
- **WebSocket Server** : Notifie les clients connectés (par WebSocket) lorsque la compilation est terminée afin de rafraîchir les pages.
- **Logging des avertissements** : Capture et affiche les avertissements pour les bundles vides.

## Prérequis

- **Node.js** (version >= 14)
- **Vite**
- **Chokidar**
- **Glob**
- **WebSocket (ws)**
- **Chalk** pour le logging coloré
- **JavaScript Obfuscator** pour l'obfuscation du code (facultatif)

## Installation

1. Clonez le dépôt :
   ```bash
   git clone <url-du-depot>
   ```
Installez les dépendances :
```bash
npm install
```
Utilisation
1. Build Initial
Pour effectuer une compilation initiale de tous les fichiers JavaScript et SCSS, exécutez simplement la commande suivante :

```bash
node build.js
```
Cela compilera tous les fichiers dans les dossiers theme/scripts et theme/styles et les placera dans le dossier dist.

2. Mode Watch
Pour lancer le serveur de watch et surveiller les changements dans les fichiers .js, .scss et .liquid, utilisez la commande suivante :

```bash
node build.js --watch
```
Le mode watch surveillera les changements dans les fichiers et déclenchera une recompilation automatique.

3. WebSocket Notifications
Un serveur WebSocket tourne sur le port 8080. À chaque fois qu'une recompilation est effectuée, un signal refresh est envoyé à tous les clients connectés pour leur indiquer de rafraîchir leur page.

4. Obfuscation (facultatif)
Le code contient une section commentée qui permet d'obfusquer les fichiers JavaScript après compilation. Si vous souhaitez l'activer, décommentez la section obfuscate dans la fonction buildAllFiles pour activer l'obfuscation des fichiers JavaScript après la compilation.

```js

// Décommentez cette section pour obfusquer les fichiers JS après build
// const jsFiles = glob.sync(`${path.resolve(__dirname, "dist/scripts")}/**/*.js`);
// console.log(chalk.hex('077E8C')(`Obfuscating ${jsFiles.length} files`));
// await Promise.all(jsFiles.map(async (file) => {
//     if (file.includes('bundle')) {
//         let data = fs.readFileSync(file, 'utf8');
//         let obfuscationResult = JavaScriptObfuscator.obfuscate(data, { ... });
//         fs.writeFileSync(file, obfuscationResult.getObfuscatedCode(), 'utf8');
//     }
// }));
```
5. Logging des Avertissements
Lorsque des bundles vides sont générés, le projet capture et affiche des avertissements en indiquant le fichier source concerné. Le logger affiche les chemins d'entrée et d'origine pour chaque fichier concerné.

6. Alias de Chemins
Le projet utilise plusieurs alias pour référencer les dossiers plus facilement :

@Styles : ./theme/styles
@Sections : ./theme/styles/sections
@Snippets : ./theme/styles/snippets
@Helpers : ./theme/styles/helpers
@Base : ./theme/styles/base
@Scripts : ./src/scripts
@FontsSolid : ./theme/styles/assets/solid/scss
@FontsOutline : ./theme/styles/assets/outline/scss
7. Exécution de commandes personnalisées
Le script est conçu pour être flexible et facilement personnalisable. Si vous avez besoin d'ajouter des options supplémentaires ou d'inclure d'autres extensions de fichiers dans le processus de build ou de watch, vous pouvez ajuster le code dans build.js.

Contribuer
Les contributions sont les bienvenues. Si vous trouvez des bogues ou avez des suggestions pour améliorer ce projet, n'hésitez pas à ouvrir une issue ou à proposer une pull request.

Auteurs
Développé par [votre nom].

Licence
Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus d'informations.