# --- ÉTAPE 1 : Build de l'application ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances pour bénéficier du cache Docker
COPY package*.json ./

# Installation de TOUTES les dépendances (y compris devDependencies pour la compilation NestJS)
RUN npm ci

# Copie de l'ensemble du code source
COPY . .

# Compilation du projet NestJS (génère le dossier /dist)
RUN npm run build

# Nettoyage pour ne garder que les dépendances de production
RUN npm prune --production

# --- ÉTAPE 2 : Image d'exécution légère ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copie des dépendances de prod et du build depuis l'étape builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Exposer le port 3000
EXPOSE 3000

# Lancement de l'application NestJS compilée
CMD ["node", "dist/main"]