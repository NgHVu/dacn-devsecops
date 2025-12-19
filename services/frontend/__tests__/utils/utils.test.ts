import { cn, formatPrice, getImageUrl } from "@/lib/utils";

describe("Utility Functions", () => {
  
  // --- 1. Test hàm cn (Tailwind Merge) ---
  describe("cn", () => {
    test("nên kết hợp các class string bình thường", () => {
      expect(cn("bg-red-500", "p-4")).toBe("bg-red-500 p-4");
    });

    test("nên xử lý các điều kiện class (conditional)", () => {
      expect(cn("p-4", true && "bg-blue-500", false && "hidden")).toBe("p-4 bg-blue-500");
    });

    test("nên ưu tiên các class Tailwind sau cùng (twMerge)", () => {
      // p-4 (1rem) bị ghi đè bởi p-8 (2rem)
      const result = cn("p-4", "p-8");
      expect(result).toBe("p-8");
    });
  });

  // --- 2. Test hàm formatPrice (VND) ---
  describe("formatPrice", () => {
    test("nên định dạng số thành tiền tệ VND", () => {
      const result = formatPrice(100000);
      // Sử dụng regex vì khoảng trắng trong Intl có thể là non-breaking space
      expect(result).toMatch(/100\.000/);
      expect(result).toMatch(/₫/);
    });

    test("nên xử lý số 0 chính xác", () => {
      expect(formatPrice(0)).toMatch(/0/);
    });
  });

  // --- 3. Test hàm getImageUrl ---
  describe("getImageUrl", () => {
    const placeholder = "https://placehold.co/400x300/e0e0e0/7c7c7c?text=FoodApp";

    test("nên trả về ảnh placeholder nếu imagePath null hoặc undefined", () => {
      expect(getImageUrl(null)).toBe(placeholder);
      expect(getImageUrl(undefined)).toBe(placeholder);
      expect(getImageUrl("")).toBe(placeholder);
    });

    test("nên trả về chính nó nếu là URL tuyệt đối (http/https)", () => {
      const externalUrl = "https://images.unsplash.com/photo-123";
      expect(getImageUrl(externalUrl)).toBe(externalUrl);
    });

    test("nên trả về chính nó nếu bắt đầu bằng dấu gạch chéo (/)", () => {
      const internalPath = "/uploads/avatar.png";
      expect(getImageUrl(internalPath)).toBe(internalPath);
    });

    test("nên tự động thêm /images/ nếu là đường dẫn tên file thuần túy", () => {
      expect(getImageUrl("pizza.jpg")).toBe("/images/pizza.jpg");
    });
  });
});