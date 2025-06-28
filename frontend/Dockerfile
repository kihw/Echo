# Dockerfile pour Echo Frontend (Next.js)
FROM node:18-alpine

# Installer libc6-compat pour la compatibilité Alpine
RUN apk add --no-cache libc6-compat

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers package.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Définir les variables d'environnement par défaut
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Commande de démarrage
CMD ["npm", "run", "dev"]
