FROM node:18-alpine

WORKDIR /app

# 1. Copy package.json (Đứng từ thư mục root của Repo)
COPY server/package*.json ./

RUN npm install

# 2. Copy thư mục prisma (Phải ghi rõ đường dẫn từ root repo)
COPY server/prisma/ ./prisma/
COPY server/prisma.config.ts ./

# 3. Generate Prisma
RUN DATABASE_URL="postgresql://placeholder:5432" npx prisma generate

# 4. Copy toàn bộ code server còn lại
COPY server/ .

EXPOSE 5000

# 5. Chạy lệnh start chuẩn
CMD ["node", "index.js"]