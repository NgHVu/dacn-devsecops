"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { productService } from "@/services/productService";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Minus, Plus, ShoppingCart, ArrowLeft } from "lucide-react";
import { SIZES, TOPPINGS, ProductOption } from "@/config/productOptions";
import { FadeIn } from "@/components/animations/FadeIn";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id; 
  
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ProductOption>(SIZES[0]);
  const [selectedToppings, setSelectedToppings] = useState<ProductOption[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const data = await productService.getProductById(Number(id));
        setProduct(data);
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const calculateTotalPrice = () => {
    if (!product) return 0;
    const base = product.price;
    const sizePrice = selectedSize.price;
    const toppingPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    return (base + sizePrice + toppingPrice) * quantity;
  };

  const handleToppingChange = (topping: ProductOption, checked: boolean) => {
    if (checked) {
      setSelectedToppings([...selectedToppings, topping]);
    } else {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
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

  if (loading) return <div className="flex justify-center py-20 h-screen items-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!product) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
        <h2 className="text-xl font-semibold">Không tìm thấy sản phẩm</h2>
        <Button asChild variant="outline"><Link href="/">Quay lại trang chủ</Link></Button>
    </div>
  );

  return (
    <div className="container py-8 max-w-6xl">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại thực đơn
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        <FadeIn className="relative h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden shadow-lg border bg-white">
          {product.image ? (
            <Image src={getImageUrl(product.image)} alt={product.name} fill className="object-cover" priority />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">No Image</div>
          )}
        </FadeIn>

        <div className="space-y-8 pb-20 md:pb-0"> 
          <FadeIn delay={0.1}>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-2xl font-bold text-primary mt-2">{formatPrice(product.price)}</p>
            <p className="text-gray-600 mt-4 leading-relaxed text-lg">
                {product.description || "Món ăn ngon tuyệt vời, được chế biến từ nguyên liệu tươi sạch, đảm bảo vệ sinh an toàn thực phẩm."}
            </p>
          </FadeIn>

          <div className="h-px bg-gray-200 my-6" />

          <FadeIn delay={0.2} className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">Chọn kích cỡ <span className="text-red-500">*</span></h3>
            <RadioGroup 
                value={selectedSize.id} 
                onValueChange={(val) => setSelectedSize(SIZES.find(s => s.id === val) || SIZES[0])}
                className="flex flex-wrap gap-3"
            >
              {SIZES.map((size) => (
                <div key={size.id} className="relative">
                  <RadioGroupItem value={size.id} id={`size-${size.id}`} className="peer sr-only" />
                  <Label 
                    htmlFor={`size-${size.id}`} 
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all w-24"
                  >
                    <span className="text-lg font-bold">{size.id}</span>
                    <span className="text-xs text-muted-foreground">+{formatPrice(size.price)}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FadeIn>

          <FadeIn delay={0.3} className="space-y-4">
            <h3 className="font-semibold text-lg">Thêm Topping (Tùy chọn)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOPPINGS.map((topping) => (
                <div key={topping.id} className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <Checkbox 
                    id={`topping-${topping.id}`} 
                    onCheckedChange={(checked) => handleToppingChange(topping, checked === true)}
                  />
                  <Label htmlFor={`topping-${topping.id}`} className="flex-1 cursor-pointer flex justify-between font-normal">
                    <span>{topping.name}</span>
                    <span className="text-primary font-medium">+{formatPrice(topping.price)}</span>
                  </Label>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.4} className="space-y-4">
            <h3 className="font-semibold text-lg">Ghi chú cho quán</h3>
            <Textarea 
                placeholder="Ví dụ: Ít đường, không đá, xin thêm ớt..." 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none"
            />
          </FadeIn>

          <FadeIn delay={0.5} className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-2xl md:static md:p-0 md:border-none md:shadow-none z-50">
            <div className="container md:px-0 flex items-center gap-4 max-w-6xl mx-auto">
              <div className="flex items-center border rounded-md h-12">
                <Button variant="ghost" size="icon" className="h-full w-12" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-full w-12" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button size="lg" className="flex-1 h-12 text-lg font-bold shadow-lg" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Thêm • {formatPrice(calculateTotalPrice())}
              </Button>
            </div>
          </FadeIn>

        </div>
      </div>
    </div>
  );
}