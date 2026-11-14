# Déploiement — Math

Le dépôt `elypso49/math` produit une seule image Docker, `elypso/math`, qui
contient la SPA compilée et le nginx qui la sert. Elle tourne derrière le nginx
de l'hôte, sur **math.giet.fr**.

| Élément | Valeur |
|---|---|
| Dépôt GitHub | `elypso49/math` |
| Image Docker Hub | `elypso/math` |
| Port hôte | `40302` |
| Réseau Docker | `mlt-network`, externe, partagé avec MltStore |
| URL publique | `https://math.giet.fr` |

## Ce dont Math dépend côté MltStore

- **Le module Maths en production.** Les routes `/api/maths/...` arrivent avec la
  branche `feature/math-module` de `elypso49/mlt-store`. Tant qu'elle n'est pas
  fusionnée dans `main` et redéployée, `math.giet.fr` répond mais ne peut ni lire
  ni enregistrer la famille.
- **La connexion Google de MltStore.** Math ne parle jamais à Google pour
  s'authentifier : Google Identity Services fournit un jeton que l'application
  échange sur `POST /api/auth/google` contre la session MltStore. L'identifiant
  client Google utilisé est celui partagé par les applications MltStore
  (`src/lib/config.ts`). Son écran de configuration Google Cloud doit lister
  `https://math.giet.fr` dans les *origines JavaScript autorisées*, sinon la
  fenêtre de connexion Google refuse de s'ouvrir.

## Secrets GitHub à créer

Sur `elypso49/math` → *Settings* → *Secrets and variables* → *Actions*.

| Secret | Obligatoire | Contenu |
|---|---|---|
| `DOCKER_USERNAME` | oui | Identifiant Docker Hub — `elypso`. |
| `DOCKER_PASSWORD` | oui | Jeton d'accès personnel Docker Hub, droits *Read, Write, Delete* sur le dépôt `math`. Pas le mot de passe du compte. |
| `PROD_MATH_WEBHOOK` | non | URL appelée en POST après un push sur `main` (redéploiement Portainer / Watchtower). Absente ou valant `placeholder`, l'étape est sautée. |
| `QUALIF_MATH_WEBHOOK` | non | Idem pour les branches `feature/**` et `develop`. |

En ligne de commande :

```bash
gh secret set DOCKER_USERNAME --repo elypso49/math --body "elypso"
gh secret set DOCKER_PASSWORD --repo elypso49/math --body "dckr_pat_..."
gh secret set PROD_MATH_WEBHOOK --repo elypso49/math --body "https://..."
```

Sans les deux premiers, le pipeline reste vert : l'image est construite pour
vérifier le `Dockerfile`, mais elle n'est ni publiée ni déployée, et le job
`build` le signale par un avertissement.

## Stratégie de tags

| Branche | Tag d'image | Webhook appelé |
|---|---|---|
| `main` | `latest` | `PROD_MATH_WEBHOOK` s'il est défini |
| `feature/**` | `feature` | `QUALIF_MATH_WEBHOOK` s'il est défini |
| `develop` | `feature` | `QUALIF_MATH_WEBHOOK` s'il est défini |
| autre | aucun déclenchement | — |

Le pipeline ne se déclenche que sur les chemins qui changent l'image : `src/`,
`assets/`, `public/`, `package*.json`, `tsconfig*.json`, `vite.config.ts`,
`index.html`, `Dockerfile`, `nginx.conf`, `.dockerignore` et le workflow
lui-même. Une modification de la documentation ne redéploie donc rien.

Les tags étant mobiles, un redéploiement rejoue `latest` : il n'y a pas de retour
arrière par tag, comme pour les autres dépôts perso.

## Barrière CI

Le job `test` lance `npm ci`, les tests Vitest (rapport publié dans l'onglet
*Checks*), puis `npm run build`, c'est-à-dire `tsc -b && vite build`. Le job
`build` n'est lancé que s'il passe.

## Premier déploiement

```bash
# 1. Le réseau partagé avec MltStore doit exister
docker network create mlt-network || true

# 2. Poser le compose
mkdir -p /opt/math
cp docker-compose.yml /opt/math/docker-compose.yml

# 3. Démarrer
cd /opt/math && docker compose pull && docker compose up -d

# 4. Le certificat AVANT le bloc 443 — voir ci-dessous
```

### Le certificat d'abord, le vhost ensuite

Écrire le bloc `listen 443` avant d'avoir le certificat rend `nginx -t`
invalide, et certbot refuse alors de travailler : il a besoin d'une
configuration qui passe le test. L'ordre est donc contraint.

```bash
# 1. Seul le bloc 80 de math.giet.fr est posé
nginx -t && systemctl reload nginx

# 2. Obtenir le certificat sans toucher aux vhosts
certbot certonly --nginx -d math.giet.fr

# 3. Poser le bloc 443, puis recharger
nginx -t && systemctl reload nginx
```

Le DNS de `math.giet.fr` doit pointer vers le serveur avant l'étape 2.

## Mise à jour

```bash
cd /opt/math && docker compose pull && docker compose up -d
```

C'est exactement ce que doit faire le webhook de redéploiement.

## Vérifier après déploiement

```bash
curl -sI https://math.giet.fr | head -1                       # 200
curl -s https://math.giet.fr/api/maths/family | head -c 80     # 401 attendu sans jeton
docker compose -f /opt/math/docker-compose.yml ps              # healthy
```

Un `401` sur `/api/maths/family` est le bon signe : le relais vers MltStore
fonctionne, le module Maths est présent et l'authentification est exigée. Un
`404` signifie que l'API MltStore déployée n'a pas encore le module Maths, un
`502` que `mltstore-api` n'est pas joignable sur `mlt-network`.
