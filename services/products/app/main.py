from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field

# ================================================================= #
# Pydantic Models: Định nghĩa cấu trúc dữ liệu
# ================================================================= #
class Product(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=120, description="Tên món ăn")
    price: float = Field(gt=0, description="Giá sản phẩm (VND) phải lớn hơn 0")
    image: Optional[str] = Field(default=None, description="Tên file ảnh hoặc URL")
    
    class Config:
        # Cung cấp ví dụ cho tài liệu API tự động
        schema_extra = {
            "example": {
                "id": 1,
                "name": "Cơm Tấm Sườn Bì Chả",
                "price": 55000.0,
                "image": "com-tam.jpg"
            }
        }

# ================================================================= #
# FastAPI App & Middlewares
# ================================================================= #
app = FastAPI(
    title="Products Service API",
    description="API quản lý sản phẩm cho hệ thống đặt món ăn.",
    version="1.0.0",
    openapi_tags=[
        {"name": "products", "description": "Các endpoint liên quan đến sản phẩm"},
        {"name": "health", "description": "Endpoint kiểm tra sức khỏe cho Kubernetes"},
    ],
)

# Thêm CORS Middleware để cho phép frontend (chạy ở domain khác) gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong môi trường production, nên giới hạn lại domain cụ thể
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thêm GZip Middleware để nén các response lớn, tăng tốc độ trả về
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ================================================================= #
# Dữ liệu giả lập (In-memory Database)
# ================================================================= #
PRODUCTS_DB: List[Product] = [
    Product(id=1, name="Cơm Tấm Sườn Bì Chả", price=55_000.0, image="com-tam.jpg"),
    Product(id=2, name="Phở Bò Tái Nạm",      price=50_000.0, image="pho-bo.jpg"),
    Product(id=3, name="Bún Bò Huế",          price=45_000.0, image="bun-bo-hue.jpg"),
]


# ================================================================= #
# API Routes
# ================================================================= #
@app.get("/", tags=["products"], summary="Endpoint chào mừng")
def read_root():
    """Endpoint gốc để kiểm tra nhanh service có hoạt động hay không."""
    return {"message": "Welcome to the Products Service"}


@app.get("/api/products", response_model=List[Product], tags=["products"], summary="Lấy danh sách sản phẩm")
def get_all_products():
    """Lấy danh sách tất cả các sản phẩm có trong hệ thống."""
    return PRODUCTS_DB


@app.get("/api/products/{product_id}", response_model=Product, tags=["products"], summary="Lấy chi tiết sản phẩm")
def get_product_detail(product_id: int):
    """Lấy thông tin chi tiết của một sản phẩm dựa trên ID."""
    product = next((p for p in PRODUCTS_DB if p.id == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found")
    return product


# --- Health Check Endpoints ---
@app.get("/healthz", tags=["health"], summary="Liveness Probe")
def liveness_probe():
    """Endpoint cho Kubernetes liveness probe, kiểm tra xem container có 'sống' không."""
    return {"status": "ok"}


@app.get("/readyz", tags=["health"], summary="Readiness Probe")
def readiness_probe():
    """Endpoint cho Kubernetes readiness probe, kiểm tra xem ứng dụng đã sẵn sàng nhận request chưa."""
    return {"status": "ready"}