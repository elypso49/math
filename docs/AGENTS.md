# Conventions techniques — math

Décline `../../AGENTS.md` pour ce stack.

## Stack

React 19 + Vite + TypeScript strict + Tailwind 4 (configuration CSS-first dans
`src/index.css`), React Router 7, Vitest. Police Atkinson Hyperlegible auto-hébergée
via `@fontsource`. Les icônes sont les SVG de `assets/icons`, chargés par
`components/ui/Icon.tsx` ; aucune bibliothèque d'icônes.

## Découpage

```
src/
├── main.tsx              entrée, providers
├── routes/               un écran par route, gardes d'accès
├── components/           présentation (props-in), un dossier par domaine
├── features/             logique : contexts, hooks, fonctions pures
│   ├── exercise/         génération des calculs, séries, déroulé d'un exercice
│   ├── learning/         compétences, maîtrise, répétition espacée, planification, progression
│   ├── encouragement/    badges et messages
│   ├── stats/            chiffres de l'espace parent
│   ├── family/ session/ access/
├── lib/
│   ├── api/              contrat MathApi / AuthApi et choix du mode
│   ├── mltstore/         client MltStore et connexion Google (GIS)
│   └── local/            simulation localStorage du même contrat
└── types/
```

## Règles propres au projet

La génération des questions, la maîtrise, la planification des séries, la
progression des niveaux, les badges et les statistiques sont des **fonctions pures** : aléa injecté (`Random`), date passée en
paramètre. C'est ce qui les rend testables ; elles sont couvertes par les `*.test.ts`.

Toute donnée passe par `lib/api` : les écrans ne savent pas s'ils parlent à
MltStore ou à la simulation locale. Le mode se choisit avec `VITE_DATA_MODE`
(`local` par défaut, `mltstore` dans l'image Docker).
