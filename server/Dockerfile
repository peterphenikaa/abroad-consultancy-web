FROM node:18-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy prisma schema before generate
COPY prisma ./prisma/
RUN npx prisma generate

# Copy rest of the applications
COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
