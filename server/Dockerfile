FROM node:22
WORKDIR /app

# Caching dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma config and schema and generate
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN DATABASE_URL="postgresql://placeholder:5432" npx prisma generate

# No need to copy EVERYTHING here if we use volumes in Compose, 
# but it's good practice for standalone builds
COPY . .

EXPOSE 5000 

# Default to development mode
CMD ["npm", "run", "dev"]
