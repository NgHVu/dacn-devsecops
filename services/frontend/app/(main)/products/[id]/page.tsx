"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { productService } from "@/services/productService";
import { Product, Review } from "@/types/product"; // Import thêm Review
import { useCart } from "@/context/CartContext";
import { cn, formatPrice, getImageUrl } from "@/lib/utils";
import { SIZES, TOPPINGS, ProductOption } from "@/config/productOptions";
import { ProductDetailSkeleton } from "@/components/skeletons/ProductDetailSkeleton";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, ArrowLeft, Star, Clock, Check, ChevronRight, User } from "lucide-react";
import { toast } from "sonner";
import { FadeIn } from "@/components/animations/FadeIn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Import Avatar nếu chưa có thì dùng div tròn

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id; 
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]); // State lưu reviews
  const [loading, setLoading] = useState(true);
  
  // Cart states
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ProductOption>(SIZES[0]);
  const [selectedToppings, setSelectedToppings] = useState<ProductOption[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi song song cả product và reviews
        const [productData, reviewsData] = await Promise.all([
            productService.getProductById(Number(id)),
            productService.getProductReviews(Number(id), 0, 5) // Lấy 5 review mới nhất
        ]);
        
        setProduct(productData);
        setReviews(reviewsData.content);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const calculateTotalPrice = () => {
    if (!product) return 0;
    const base = product.price;
    const sizePrice = selectedSize.price;
    const toppingPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    return (base + sizePrice + toppingPrice) * quantity;
  };

  const handleToppingChange = (topping: ProductOption) => {
    const exists = selectedToppings.find(t => t.id === topping.id);
    if (exists) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart(product, quantity, {
      size: selectedSize,
      toppings: selectedToppings,
      note: note
    });
  };

  // Helper render sao
  const renderStars = (rating: number) => {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                    key={star} 
                    className={cn(
                        "h-4 w-4", 
                        star <= Math.round(rating) ? "fill-orange-400 text-orange-400" : "fill-gray-200 text-gray-200"
                    )} 
                />
            ))}
        </div>
    );
  };

  if (loading) return <ProductDetailSkeleton />;

  if (!product) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
       <div className="bg-muted/50 p-8 rounded-full">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
       </div>
       <div>
          <h2 className="text-2xl font-bold">Không tìm thấy món này</h2>
          <p className="text-muted-foreground mt-2">Món ăn có thể đã bị xóa hoặc tạm ngưng phục vụ.</p>
       </div>
       <Button onClick={() => router.push("/")} className="rounded-full px-8">Về trang chủ</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32 animate-in fade-in duration-500">
      <div className="container px-4 py-6 max-w-6xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-orange-600 transition-colors">Trang chủ</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/menu" className="hover:text-orange-600 transition-colors">Thực đơn</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* --- LEFT: IMAGE (Sticky) --- */}
          <div className="lg:col-span-5">
             <div className="lg:sticky lg:top-24 space-y-6">
                <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden shadow-xl border border-border/50 bg-white dark:bg-zinc-900 group">
                  <Image 
                    src={getImageUrl(product.image)} alt={product.name} fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                </div>
             </div>
          </div>

          {/* --- RIGHT: INFO --- */}
          <div className="lg:col-span-7"> 
             <FadeIn delay={0.1} className="space-y-8">
                 {/* Header Info */}
                 <div className="space-y-4">
                     <div className="flex justify-between items-start gap-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">{product.name}</h1>
                        <div className="text-2xl md:text-3xl font-bold text-orange-600 whitespace-nowrap">
                            {formatPrice(product.price)}
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full font-semibold">
                            {renderStars(product.averageRating || 0)}
                            <span>{(product.averageRating || 0).toFixed(1)} ({product.reviewCount || 0} đánh giá)</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" /> 15-20 phút
                        </div>
                     </div>

                     <p className="text-muted-foreground leading-relaxed text-base">
                         {product.description || "Món ngon đặc biệt được chế biến từ nguyên liệu tươi sạch, mang đến hương vị đậm đà khó quên."}
                     </p>
                 </div>

                 <Separator />

                 {/* Options Section */}
                 <div className="space-y-8">
                    {/* Size Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="font-bold text-base">Chọn kích cỡ (Size)</label>
                            <span className="text-xs font-medium bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded text-muted-foreground">Bắt buộc</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {SIZES.map((size) => {
                                const isSelected = selectedSize.id === size.id;
                                return (
                                    <div key={size.id} onClick={() => setSelectedSize(size)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none hover:scale-[1.02]",
                                            isSelected ? "border-orange-600 bg-orange-50 dark:bg-orange-900/20" : "border-border bg-card hover:border-orange-200"
                                        )}
                                    >
                                        <span className={cn("font-bold", isSelected ? "text-orange-700 dark:text-orange-400" : "text-foreground")}>{size.name}</span>
                                        <span className="text-xs text-muted-foreground mt-1">+{formatPrice(size.price)}</span>
                                        {isSelected && <div className="absolute top-2 right-2 text-orange-600"><Check className="h-4 w-4" /></div>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Toppings */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="font-bold text-base">Thêm Topping</label>
                            <span className="text-xs font-medium bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded text-muted-foreground">Tùy chọn</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {TOPPINGS.map((topping) => {
                                const isSelected = selectedToppings.some(t => t.id === topping.id);
                                return (
                                    <div key={topping.id} onClick={() => handleToppingChange(topping)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                                            isSelected ? "border-orange-600 bg-orange-50 ring-1 ring-orange-600 dark:bg-orange-900/20" : "border-border bg-card hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-5 w-5 rounded border flex items-center justify-center transition-colors", isSelected ? "bg-orange-600 border-orange-600" : "border-muted-foreground")}>
                                                {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                                            </div>
                                            <span className="font-medium text-sm">{topping.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-orange-600">+{formatPrice(topping.price)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-3">
                        <label className="font-bold text-base">Ghi chú cho quán</label>
                        <Textarea 
                            placeholder="Ví dụ: Không hành, nhiều đá, để riêng nước chấm..." 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="bg-card border-border min-h-[100px] rounded-xl focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                        />
                    </div>
                 </div>
             </FadeIn>
          </div>
        </div>

        {/* --- REVIEWS SECTION (NEW) --- */}
        <div className="mt-16 lg:mt-24 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                Đánh giá từ khách hàng
                <span className="text-lg font-normal text-muted-foreground">({product.reviewCount || 0})</span>
            </h2>
            
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed">
                        <p className="text-muted-foreground">Chưa có đánh giá nào. Hãy là người đầu tiên thưởng thức và đánh giá nhé!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                                            {review.userName ? review.userName.charAt(0).toUpperCase() : "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-sm">{review.userName || "Người dùng ẩn danh"}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {renderStars(review.rating)}
                                            <span>• {new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-foreground/90 leading-relaxed text-sm bg-muted/30 p-3 rounded-lg">
                                {review.comment || "Khách hàng không để lại bình luận."}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* --- STICKY FOOTER ACTION --- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border/60 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] p-4 safe-area-bottom">
        <div className="container max-w-6xl mx-auto flex items-center gap-6">
             {/* Quantity Control */}
             <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border shadow-inner">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white hover:shadow-sm transition-all" onClick={() => setQuantity(q => Math.max(1, q-1))}>
                    <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-bold text-lg tabular-nums">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white hover:shadow-sm transition-all" onClick={() => setQuantity(q => q + 1)}>
                    <Plus className="h-4 w-4" />
                </Button>
             </div>

             {/* Add Button */}
             <Button 
                onClick={handleAddToCart}
                className="flex-1 h-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-base font-bold shadow-lg shadow-orange-600/30 hover:scale-[1.02] transition-all active:scale-[0.98]"
             >
                <div className="flex items-center justify-between w-full px-4">
                    <span>Thêm vào giỏ</span> 
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold backdrop-blur-sm">
                        {formatPrice(calculateTotalPrice())}
                    </span>
                </div>
             </Button>
        </div>
      </div>
    </div>
  );
}