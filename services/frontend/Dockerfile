# ================================================================= #
# Giai đoạn 1: Cài đặt phụ thuộc (Dependencies)
# ================================================================= #
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ================================================================= #
# Giai đoạn 2: Build ứng dụng
# ================================================================= #
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vô hiệu hóa telemetry để tăng tốc build và bảo mật
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ================================================================= #
# Giai đoạn 3: Runner - Image cuối cùng siêu nhẹ
# ================================================================= #
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# [SECURITY FIX] Cập nhật Alpine để vá lỗi Trivy (giống Backend)
RUN apk update && apk upgrade --no-cache

# Tạo user không có quyền root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Chỉ copy những file cần thiết từ giai đoạn build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Chạy bằng server.js được sinh ra từ mode standalone (không cần npm start)
CMD ["node", "server.js"]