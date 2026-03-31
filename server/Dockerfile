# Dùng node nhẹ hơn để Render gói Free build nhanh
FROM node:18-alpine

WORKDIR /app

# 1. Copy package.json TỪ THƯ MỤC server ngoài gốc vào container
COPY server/package*.json ./

# 2. Cài đặt thư viện
RUN npm install

# 3. Copy Prisma config và schema (đường dẫn phải đúng từ gốc)
COPY server/prisma.config.ts ./
COPY server/prisma/ ./prisma/

# 4. Generate Prisma Client (Dùng DATABASE_URL giả để build không lỗi)
RUN DATABASE_URL="postgresql://placeholder:5432" npx prisma generate

# 5. Copy TOÀN BỘ code của backend vào container
COPY server/ .

EXPOSE 5000

# 6. LÊN MÂY THÌ PHẢI CHẠY START, KHÔNG CHẠY DEV
# (Đảm bảo trong package.json của server có script "start": "node index.js")
CMD ["node", "index.js"]