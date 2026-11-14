# math — Entraînement aux calculs

Application de calcul mental pour enfants : séries de 10 calculs adaptées au niveau
de chaque enfant, évaluation de 25 questions, badges, et un espace parent protégé
par code qui suit les progrès.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5180
npm test         # tests Vitest de la logique pure
npm run build
```

Par défaut l'application tourne en **mode local** : la connexion Google est simulée
et les données vivent dans le `localStorage` du navigateur. Pour la brancher sur
MltStore, copier `.env.example` en `.env.local` et poser `VITE_DATA_MODE=mltstore`.

## Documentation

- [docs/AGENTS.md](docs/AGENTS.md) — conventions techniques du stack
- [docs/PROJECT_SPECIFIC.md](docs/PROJECT_SPECIFIC.md) — règles métier et contrat MltStore
- [docs/PROJECT_UX.md](docs/PROJECT_UX.md) — interface
- `maquette/` et `assets/` — maquette d'origine, icônes et logo
