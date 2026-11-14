# Interface — math

La référence visuelle est `maquette/project/` (10 écrans, 390 px de large). Les
couleurs y sont reprises telles quelles comme tokens dans `src/index.css`.

## Principes

Mobile d'abord : colonne de 430 px maximum, cibles tactiles de 44 px au moins,
touches du pavé numérique de 68 px. Police Atkinson Hyperlegible, choisie pour sa
lisibilité par les jeunes lecteurs.

Aucune information n'est portée par la couleur seule : juste ou faux est toujours
doublé d'une icône et d'un texte. Les pavés numériques répondent aussi au clavier
physique (chiffres, Retour arrière, Entrée).

Le code d'un enfant ou du parent n'est jamais affiché pendant la saisie : seules des
pastilles indiquent le nombre de chiffres tapés. Le code est vérifié dès le quatrième
chiffre, sans bouton de validation ; un code faux fait vibrer le pavé et affiche
« Code incorrect » en rouge.

Les onglets des statistiques parent sont des pictogrammes (vue d'ensemble, +, −, ×, ÷),
sans texte ; leur nom n'apparaît qu'au survol et pour les lecteurs d'écran.

Aucune fenêtre du navigateur (`alert`, `confirm`) n'est utilisée : toute question passe par
la popin de l'application (`components/ui/Dialog.tsx`).

Depuis la vue d'ensemble des statistiques, le parent ouvre l'historique de l'enfant : chaque
série et évaluation se déplie sur ses réponses, avec la réponse donnée, le bon résultat, le
temps et le verdict de chaque question.
