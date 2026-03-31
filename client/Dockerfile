FROM node:22-alpine

WORKDIR /app

# Cache node_modules
COPY package*.json ./
RUN npm install

# In dev mode, we just run npm run dev
# which is configured to listen on port 80 (Vite)
COPY . .

EXPOSE 80

CMD ["npm", "run", "dev"]
