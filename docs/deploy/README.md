# Déploiement — Math

Le dépôt `elypso49/math` produit une seule image Docker, `elypso/math`, qui
contient la SPA compilée et le nginx qui la sert. Elle tourne derrière le nginx
de l'hôte, sur **math.giet.fr**.

| Élément | Valeur |
|---|---|
| Dépôt GitHub | `elypso49/math` |
| Image Docker Hub | `elypso/math` |
| Port hôte | `40303` (40302 sert déjà biblio.giet.fr) |
| Réseau Docker | `mlt-network`, externe, partagé avec MltStore |
| Serveur | `bakaserver` (192.168.1.16), joignable en SSH par l'alias `giet` |
| Certificat | joker `*.giet.fr` / `*.giet.xyz`, déjà en place |
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

Les commandes Docker et nginx demandent les droits root sur le serveur.

```bash
# 1. DNS : créer l'enregistrement math.giet.fr chez le registraire, comme les
#    autres sous-domaines (pas d'enregistrement joker sur giet.fr)

# 2. Le réseau partagé avec MltStore doit exister
docker network create mlt-network || true

# 3. Poser le compose et démarrer (ou créer la pile équivalente dans Portainer)
mkdir -p /opt/math
cp docker-compose.yml /opt/math/docker-compose.yml
cd /opt/math && docker compose pull && docker compose up -d

# 4. Ajouter le bloc de nginx-math.giet.fr.conf dans /etc/nginx/sites-available/giet
nginx -t && systemctl reload nginx
```

Aucun certificat à demander : le certificat joker `*.giet.fr` inclus par
`snippets/giet-https.conf` couvre `math.giet.fr`, et la redirection HTTP vers
HTTPS est commune à tous les sous-domaines.

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
