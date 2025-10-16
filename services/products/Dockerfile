# ================================================================= #
# Giai đoạn 1: Builder - Build các "bánh xe" phụ thuộc
# ================================================================= #
# Nâng cấp lên Python 3.11 để đồng bộ với các stack hiện đại
FROM python:3.11-slim AS builder

# Thiết lập các biến môi trường tốt nhất cho Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /opt/wheels

# Sao chép requirements.txt vào trước để tận dụng layer cache
COPY requirements.txt .

# Đảm bảo pip/setuptools/wheel là phiên bản mới, sau đó build wheelhouse
RUN python -m pip install --upgrade pip setuptools wheel && \
    pip wheel --no-cache-dir --wheel-dir . -r requirements.txt


# ================================================================= #
# Giai đoạn 2: Final - Image cuối cùng để chạy ứng dụng
# ================================================================= #
FROM python:3.11-slim

# Thiết lập các biến môi trường
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_HOME=/app \
    APP_USER=app \
    APP_UID=10001 \
    APP_GID=10001

# Tạo group và user không có quyền root bằng ID số (ổn định hơn)
RUN groupadd -g ${APP_GID} -r ${APP_USER} && \
    useradd  -u ${APP_UID} -r -g ${APP_GID} -d ${APP_HOME} -s /sbin/nologin ${APP_USER}

WORKDIR ${APP_HOME}

# Cài đặt các thư viện từ wheelhouse một cách an toàn
COPY --from=builder /opt/wheels /opt/wheels
COPY requirements.txt .
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir --find-links=/opt/wheels -r requirements.txt

# Sao chép mã nguồn ứng dụng và gán quyền sở hữu ngay lập tức
# Kết quả: /app/app/main.py -> module path là app.main:app
COPY --chown=${APP_UID}:${APP_GID} ./app ${APP_HOME}/app

# Chuyển sang người dùng không có quyền root
USER ${APP_UID}:${APP_GID}

# Mở cổng 8080
EXPOSE 8080

# Thêm metadata theo tiêu chuẩn OCI (Open Container Initiative)
LABEL org.opencontainers.image.source="https://github.com/NgHVu/dacn-devsecops" \
      org.opencontainers.image.description="Products Service for the Food Ordering App" \
      org.opencontainers.image.licenses="MIT"

# Healthcheck: chỉ trả về 0 (thành công) khi endpoint /healthz trả về HTTP 200
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import http.client,sys; c=http.client.HTTPConnection('127.0.0.1',8080,timeout=2); c.request('GET','/healthz'); r=c.getresponse(); sys.exit(0 if r.status==200 else 1)"

# Lệnh khởi chạy server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]