"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { productService } from "@/services/productService";
import { orderService } from "@/services/orderService";
import { Product, Review } from "@/types/product";
import { Order } from "@/types/order";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn, formatPrice, getImageUrl } from "@/lib/utils";
import { SIZES, ProductOption } from "@/config/productOptions"; 
import { ProductDetailSkeleton } from "@/components/skeletons/ProductDetailSkeleton";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Minus,
  Plus,
  ChevronRight,
  Star,
  Clock,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  Box,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { FadeIn } from "@/components/animations/FadeIn";

interface LocalUser {
  id?: string | number;
  userId?: string | number;
  username?: string;
  email?: string;
  name?: string;
  sub?: string;
  roles?: (string | { name: string })[];
  role?: string;
  authorities?: { authority: string }[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart state
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ProductOption>(SIZES[0]);
  const [note, setNote] = useState("");

  // Review & Dialog state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [eligibleOrderId, setEligibleOrderId] = useState<number | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);

  // Logic tồn kho
  const stock = product?.stockQuantity || 0;
  const isOutOfStock = stock <= 0;
  const maxSelectable = stock > 0 ? stock : 1; 

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const u = user as unknown as LocalUser;
    let roles: string[] = [];
    if (Array.isArray(u.roles)) {
      roles = u.roles.map((r) => (typeof r === "string" ? r : r.name));
    } else if (u.role) {
      roles = [u.role];
    }
    if (Array.isArray(u.authorities)) {
      roles = [...roles, ...u.authorities.map((a) => a.authority)];
    }
    return roles.includes("ADMIN") || roles.includes("ROLE_ADMIN");
  }, [user]);

  const userReview = useMemo(() => {
    if (!user || reviews.length === 0) return null;
    const u = user as unknown as LocalUser;
    return reviews.find((r) => {
      if (!r.userId) return false;
      const reviewUserId = String(r.userId);
      const currentId = u.id ? String(u.id) : null;
      const currentUserId = u.userId ? String(u.userId) : null;
      
      const isMatchId = (currentId && reviewUserId === currentId);
      const isMatchUserId = (currentUserId && reviewUserId === currentUserId);
      const isMatchName = (u.name && r.userName === u.name);

      return isMatchId || isMatchUserId || isMatchName;
    });
  }, [reviews, user]);

  const sortedReviews = useMemo(() => {
    if (!userReview) return reviews;
    const otherReviews = reviews.filter((r) => r.id !== userReview.id);
    return [userReview, ...otherReviews];
  }, [reviews, userReview]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productData, reviewsData] = await Promise.all([
          productService.getProductById(Number(id)),
          productService.getProductReviews(Number(id), 0, 100),
        ]);
        setProduct(productData);
        setReviews(reviewsData.content);
        if (user) checkReviewEligibility(Number(id));
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const checkReviewEligibility = async (productId: number) => {
    try {
      const ordersData = await orderService.getMyOrders();
      const myOrders = ordersData.content || [];
      const validOrder = myOrders.find(
        (order: Order) =>
          (order.status === "DELIVERED" || order.status === "COMPLETED") &&
          order.items.some((item) => item.productId === productId)
      );
      if (validOrder) setEligibleOrderId(validOrder.id);
    } catch {
      console.log("User chưa mua sản phẩm này");
    }
  };

  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment || "");
    setIsReviewOpen(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      await productService.deleteReview(reviewToDelete);
      toast.success("Đã xóa đánh giá");
      const [newReviews, updatedProduct] = await Promise.all([
        productService.getProductReviews(Number(id), 0, 100),
        productService.getProductById(Number(id)),
      ]);
      setReviews(newReviews.content);
      setProduct(updatedProduct);
      checkReviewEligibility(Number(id));
    } catch {
      toast.error("Lỗi khi xóa đánh giá");
    } finally {
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!editingReview && !eligibleOrderId) {
      toast.error("Bạn chưa mua sản phẩm này hoặc đơn hàng chưa giao thành công!");
      return;
    }
    try {
      setSubmitting(true);
      const u = user as unknown as LocalUser;
      const userNameSubmit = u.name || u.username || "Khách hàng";
      if (editingReview) {
        await productService.updateReview(editingReview.id, {
          productId: Number(id),
          orderId: editingReview.orderId || eligibleOrderId || 0,
          rating: rating,
          comment: comment,
          userName: userNameSubmit,
        });
        toast.success("Cập nhật đánh giá thành công!");
      } else {
        await productService.createReview({
          productId: Number(id),
          orderId: eligibleOrderId!,
          rating: rating,
          comment: comment,
          userName: userNameSubmit,
        });
        toast.success("Đánh giá thành công!");
      }
      setIsReviewOpen(false);
      const [newReviews, updatedProduct] = await Promise.all([
        productService.getProductReviews(Number(id), 0, 100),
        productService.getProductById(Number(id)),
      ]);
      setReviews(newReviews.content);
      setProduct(updatedProduct);
    } catch (error) {
      toast.error("Lỗi khi gửi đánh giá.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsReviewOpen(open);
    if (!open) {
      setTimeout(() => {
        setEditingReview(null);
        setRating(5);
        setComment("");
      }, 300);
    }
  };

  const renderStars = (val: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={cn("h-4 w-4", star <= Math.round(val) ? "fill-orange-400 text-orange-400" : "fill-gray-200 text-gray-200")} />
      ))}
    </div>
  );

  const calculateTotalPrice = () => {
    if (!product) return 0;
    return (product.price + selectedSize.price) * quantity;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Kiểm tra tồn kho phía Client
    if (product.stockQuantity < quantity) {
        toast.error(`Rất tiếc, chỉ còn ${product.stockQuantity} sản phẩm trong kho.`);
        return;
    }

    addToCart(product, quantity, {
      size: selectedSize,
      toppings: [], 
      note: note,
    });
  };

  // Tăng giảm số lượng thông minh
  const increaseQuantity = () => {
      if (quantity < maxSelectable) setQuantity(q => q + 1);
      else toast.warning(`Bạn chỉ có thể mua tối đa ${stock} sản phẩm.`);
  }

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return <div className="text-center py-20">Không tìm thấy sản phẩm</div>;

  return (
    <div className="min-h-screen bg-background pb-32 animate-in fade-in duration-500">
      <div className="container px-4 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-orange-600">Trang chủ</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* IMAGE SECTION */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 relative aspect-square w-full rounded-[2rem] overflow-hidden shadow-xl border bg-white dark:bg-zinc-900">
              <Image 
                src={getImageUrl(product.image)} 
                alt={product.name} 
                fill 
                className={cn("object-cover transition-all", isOutOfStock && "grayscale opacity-80")} 
                priority 
              />
              {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                      <div className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-lg transform -rotate-12 border-4 border-white shadow-2xl">
                          HẾT HÀNG
                      </div>
                  </div>
              )}
            </div>
          </div>

          {/* INFO SECTION */}
          <div className="lg:col-span-7">
            <FadeIn delay={0.1} className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h1 className="text-3xl md:text-4xl font-extrabold">{product.name}</h1>
                  <div className="text-2xl font-bold text-orange-600">{formatPrice(product.price)}</div>
                </div>
                
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 px-3 py-1.5 rounded-full font-semibold">
                    {renderStars(product.averageRating || 0)}
                    <span>{(product.averageRating || 0).toFixed(1)} ({product.reviewCount || 0} đánh giá)</span>
                  </div>
                  
                  {/* Trạng thái kho */}
                  <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border", 
                      isOutOfStock ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-700 border-green-200")}>
                      {isOutOfStock ? <AlertCircle className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                      <span className="font-medium">
                          {isOutOfStock ? "Tạm hết hàng" : `Còn ${stock} sản phẩm`}
                      </span>
                  </div>
                </div>

                <p className="text-muted-foreground">{product.description}</p>
              </div>

              <Separator />

              {/* Options Selection */}
              <div className={cn("space-y-6", isOutOfStock && "opacity-60 pointer-events-none")}>
                <div>
                  <Label className="text-base font-bold mb-3 block">Chọn kích cỡ</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {SIZES.map((size) => (
                      <div
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center transition-all",
                          selectedSize.id === size.id ? "border-orange-600 bg-orange-50 dark:bg-orange-900/20" : "hover:border-orange-200"
                        )}
                      >
                        <span className={cn("font-bold", selectedSize.id === size.id && "text-orange-600")}>{size.name}</span>
                        <span className="text-xs text-muted-foreground">+{formatPrice(size.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Textarea placeholder="Ví dụ: Ít ngọt, nhiều đá..." value={note} onChange={(e) => setNote(e.target.value)} disabled={isOutOfStock} />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="mt-16 lg:mt-24 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Đánh giá từ khách hàng</h2>
            {!editingReview && eligibleOrderId && !userReview && (
              <Button variant="outline" onClick={() => setIsReviewOpen(true)} className="border-orange-200 text-orange-600 hover:bg-orange-50">
                <Star className="mr-2 h-4 w-4" /> Viết đánh giá
              </Button>
            )}
            {userReview && (
              <div className="text-sm text-green-600 flex items-center gap-2 border border-green-200 bg-green-50 px-3 py-1.5 rounded-full animate-in fade-in">
                <Check className="h-4 w-4" /> Bạn đã đánh giá sản phẩm này
              </div>
            )}
          </div>

          <div className="space-y-4">
            {sortedReviews.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed text-muted-foreground">
                Chưa có đánh giá nào. Hãy là người đầu tiên!
              </div>
            ) : (
              sortedReviews.map((review) => {
                const isOwner = userReview?.id === review.id; 
                const canModify = isOwner || isAdmin;
                return (
                  <div key={review.id} className={cn("bg-card p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow relative group", isOwner && "border-orange-200 bg-orange-50/50 dark:bg-orange-900/10")}>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className={cn("font-bold", isOwner ? "bg-orange-200 text-orange-800" : "bg-orange-100 text-orange-700")}>{review.userName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm flex items-center gap-2">{review.userName} {isOwner && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded border border-blue-200">Của bạn</span>}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">{renderStars(review.rating)} <span>• {(review.createdAt ? new Date(review.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "")}</span></div>
                        </div>
                      </div>
                      {canModify && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isOwner && <DropdownMenuItem onClick={() => handleEditClick(review)} className="cursor-pointer"><Pencil className="mr-2 h-4 w-4" /> Sửa đánh giá</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => { setReviewToDelete(review.id); setDeleteDialogOpen(true); }} className="text-red-600 focus:text-red-600 cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Xóa đánh giá</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap pl-12">{review.comment}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* CART FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t p-4 safe-area-bottom">
        <div className="container max-w-6xl mx-auto flex gap-4">
          <div className={cn("flex items-center bg-secondary rounded-full border", isOutOfStock && "opacity-50 pointer-events-none")}>
            <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="rounded-l-full" disabled={isOutOfStock}><Minus className="h-4 w-4" /></Button>
            <span className="w-10 text-center font-bold">{quantity}</span>
            <Button variant="ghost" size="icon" onClick={increaseQuantity} className="rounded-r-full" disabled={isOutOfStock}><Plus className="h-4 w-4" /></Button>
          </div>
          <Button onClick={handleAddToCart} disabled={isOutOfStock} className={cn("flex-1 rounded-full font-bold h-12 text-lg shadow-lg transition-all", isOutOfStock ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400 text-white" : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20")}>
            {isOutOfStock ? "HẾT HÀNG" : `Thêm vào giỏ - ${formatPrice(calculateTotalPrice())}`}
          </Button>
        </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={isReviewOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-center text-xl">{editingReview ? "Chỉnh sửa đánh giá" : "Đánh giá sản phẩm"}</DialogTitle><DialogDescription className="text-center">Bạn cảm thấy món <b>{product.name}</b> thế nào?</DialogDescription></DialogHeader>
          <div className="flex flex-col items-center py-6 gap-6">
            <div className="flex gap-2">{[1, 2, 3, 4, 5].map((star) => (<Star key={star} onClick={() => setRating(star)} className={cn("h-10 w-10 cursor-pointer transition-all hover:scale-110 active:scale-95", star <= rating ? "fill-orange-500 text-orange-500" : "fill-transparent text-gray-300")} />))}</div>
            <Textarea placeholder="Chia sẻ cảm nhận của bạn về món ăn này..." value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-[100px] text-base resize-none bg-muted/30" />
          </div>
          <DialogFooter><Button onClick={handleSubmitReview} disabled={submitting} className="w-full bg-orange-600 text-white font-bold h-11">{submitting ? "Đang gửi..." : editingReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xóa đánh giá?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteReview} className="bg-red-600 hover:bg-red-700 text-white">Xóa ngay</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}