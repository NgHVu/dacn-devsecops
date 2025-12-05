# 1. Dùng Node.js nhẹ nhất
FROM node:20-alpine

# 2. Tạo thư mục làm việc
WORKDIR /app

# 3. Copy file định nghĩa thư viện trước (để tận dụng cache)
COPY package*.json ./

# 4. Cài đặt thư viện
RUN npm install

# 5. Copy toàn bộ code vào
COPY . .

# 6. Build dự án (Tạo ra thư mục .next) -> Đây là bước thay thế npm run dev
RUN npm run build

# 7. Mở port 3000
EXPOSE 3000

# 8. Chạy ứng dụng ở chế độ Production
CMD ["npm", "start"]