# Périmètre fonctionnel — math

## Comptes et accès

La famille est rattachée au compte Google du parent, retenu par l'appareil. Un code
parent à 4 chiffres ouvre l'espace parent ; chaque enfant peut avoir un code secret
facultatif. Ces codes protègent les écrans d'un appareil partagé, ils ne sont pas un
mécanisme de sécurité : ils sont stockés en clair et visibles par le parent.

## Exercices

Une **évaluation** compte 25 questions : les opérations activées par le parent à chacun des
5 niveaux, dans un ordre mélangé. Une opération désactivée garde son niveau. Elle fixe les niveaux : l'enfant monte d'un niveau tant qu'au moins la
moitié des questions de ce niveau sont justes. Le bouton rouge « C'est trop dur » passe
une question : elle compte comme fausse et une nouvelle question de la même opération et
du même niveau s'ajoute à la fin, dans la limite de 25 questions ajoutées.

Les **calculs à trous** reprennent une série composée comme un entraînement, sur les
opérations activées, en cachant un des deux nombres au hasard : « 3 + ? = 9 », la réponse
attendue est 6. La révision des tables n'est proposée que si la multiplication est activée.

La **révision des tables** (`features/learning/tablesPlanner.ts`) pose 10, 15, 20 ou 25
multiplications des tables de 1 à 10. Chaque question tire d'abord une table, pondérée par
sa maîtrise mesurée sur toutes les évaluations, séries et révisions : une table maîtrisée
pèse 0,15, une table toujours ratée 2, une table encore peu vue 1. Elle tire ensuite un
multiplicateur de cette table, en favorisant les faits ratés récemment, à revoir ou lents.
La même table ne revient jamais deux fois de suite et un fait n'est posé qu'une fois par
série. Ses réponses nourrissent les mêmes statistiques et la même adaptation des niveaux
que les séries.

Une **série** compte 10, 15, 20 ou 25 questions au choix de l’enfant (10 par défaut), composées
par `features/learning/planner.ts`.

## Algorithme d'apprentissage

**Compétences suivies** (`features/learning/skills.ts`) : les tables de multiplication
et de division de 1 à 12 (un fait 7 × 8 compte pour la table de 7 et celle de 8, une
division compte pour son diviseur), les grands nombres, et cinq niveaux de complexité
pour l'addition et la soustraction (jusqu'à 10, passage de la dizaine, 2 chiffres sans
puis avec retenue, 3 chiffres). Chaque niveau d'une opération ouvre de nouvelles
compétences : tables 1, 2, 5, 10, puis 3 et 4, puis 6 à 9, puis 11 et 12, puis les grands
nombres.

**Maîtrise** (`mastery.ts`) : calculée sur les 12 dernières réponses, les plus récentes
pesant le plus. La réussite pèse 60 %, la vitesse affine le reste : 1 sous le temps
visé, 0 à trois fois ce temps. Le temps visé d'un fait est de 3 s, seuil courant de
l'automaticité (la réponse vient de mémoire, sans compter sur les doigts). Bandes :
fragile, en cours, solide, automatisé.

**Répétition espacée** (`schedule.ts`) : chaque fait passe par cinq boîtes de Leitner.
Une réponse juste et rapide le fait monter (revu après 1, 3, 7 puis 21 jours), une
réponse juste mais lente le laisse en place, une erreur le renvoie en boîte 1, revu à la
série suivante.

**Composition d'une série** :
1. 3 questions sur les faits les plus faibles (erreurs récentes, boîte 1) ;
2. jusqu'à 4 faits que le calendrier ramène aujourd'hui ;
3. 0 à 3 faits jamais vus, selon la réussite des 30 dernières réponses : on vise
   environ 85 % de réussite, assez pour encourager, assez peu pour apprendre ;
4. le reste par tirage pondéré, où une table fragile pèse jusqu'à trois fois plus.

Les questions sont ensuite entremêlées (jamais deux fois le même fait à la suite, rarement
la même opération). Une erreur revient trois questions plus tard pour une deuxième chance
(deux au plus par série).

**Progression** (`progression.ts`) : le niveau d'une opération monte quand chaque
compétence qu'il a ouverte atteint 0,8 de maîtrise sur au moins 6 réponses et que les
plus simples tiennent ; il baisse quand ses nouvelles compétences restent sous une réponse
juste sur deux, ou à plus de trois fois le temps visé. Seules les réponses données depuis
le dernier changement comptent.

**Mesures par question** : temps de réflexion (jusqu'au premier chiffre), temps de
réponse (jusqu'à la validation), temps de lecture de la correction, chiffres effacés.

### Sources

- Répétition incrémentale, associer faits connus et inconnus :
  [Codding et al., 2010](https://springerlink.bibliotecabuap.elogim.com/doi/10.1007/s10864-010-9102-9),
  [étude sur la fluence en multiplication](https://iro.uiowa.edu/esploro/outputs/journalArticle/Examining-Incremental-Rehearsal-Multiplication-Fluency-with/9983993325302771).
- Pratique espacée et entremêlée en mathématiques :
  [Rohrer et Hartwig](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-spaced-and-interleaved-mathematics-practice-rohrer-hartwig.pdf),
  [Rohrer et al., 2014](https://link.springer.com/article/10.3758/s13423-014-0588-3).
- Taux de réussite visé d'environ 85 % :
  [Wilson et al., 2019](https://experts.arizona.edu/en/publications/the-eighty-five-percent-rule-for-optimal-learning/),
  établi sur des tâches de classification, transposé ici comme repère.
- Seuil d'automaticité de 2 à 3 s par fait, heuristique de praticiens plus que norme :
  [Rocket Math](https://www.rocketmath.com/tag/basic-math/page/5/).

Les badges (`features/encouragement`) reprennent `assets/icons/encouragement/encouragements.csv`.

## Contrat MltStore — module Maths

Toutes les routes exigent une session (`RequireSharedAuth`, jeton obtenu par
`POST /api/auth/google`). Enveloppe `{ ok, data }`.

| Route | Rôle |
|---|---|
| `GET /api/maths/family` | Code parent et enfants |
| `PUT /api/maths/family/parent-pin` | Change le code parent |
| `POST /api/maths/children` | Ajoute un enfant |
| `PUT /api/maths/children/{id}` | Remplace les réglages et niveaux d'un enfant |
| `DELETE /api/maths/children/{id}` | Supprime un enfant et ses séries |
| `GET /api/maths/sessions` | Séries et évaluations terminées |
| `POST /api/maths/sessions` | Enregistre une série, avec les temps de chaque question ; renvoyer le même identifiant ne crée rien |

Le format échangé est le modèle de `src/types/math.types.ts`, sans conversion. Une série compte au plus 50 réponses ; une question passée porte `skipped: true`.
