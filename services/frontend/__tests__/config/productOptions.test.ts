import { SIZES, TOPPINGS } from "../../config/productOptions";

/**
 * Kiểm thử các hằng số tùy chọn sản phẩm để đảm bảo dữ liệu cấu hình không bị thay đổi sai lệch.
 */
describe("Product Options Constants", () => {

  describe("SIZES configuration", () => {
    test("nên có 3 loại kích thước chuẩn (S, M, L)", () => {
      expect(SIZES).toHaveLength(3);
      const ids = SIZES.map(s => s.id);
      expect(ids).toContain("S");
      expect(ids).toContain("M");
      expect(ids).toContain("L");
    });

    test("size S nên có giá cộng thêm bằng 0", () => {
      const sizeS = SIZES.find(s => s.id === "S");
      expect(sizeS?.price).toBe(0);
    });

    test("giá của size L phải lớn hơn size M", () => {
      const sizeM = SIZES.find(s => s.id === "M");
      const sizeL = SIZES.find(s => s.id === "L");
      expect(sizeL!.price).toBeGreaterThan(sizeM!.price);
    });
  });

  describe("TOPPINGS configuration", () => {
    test("nên chứa các loại topping phổ biến", () => {
      expect(TOPPINGS.length).toBeGreaterThanOrEqual(4);
      const names = TOPPINGS.map(t => t.name);
      expect(names).toContain("Trân châu đen");
      expect(names).toContain("Kem phô mai");
    });

    test("mọi topping đều phải có giá dương", () => {
      TOPPINGS.forEach(topping => {
        expect(topping.price).toBeGreaterThan(0);
      });
    });

    test("topping cheese (phô mai) nên có giá cao nhất", () => {
      const prices = TOPPINGS.map(t => t.price);
      const maxPrice = Math.max(...prices);
      const cheese = TOPPINGS.find(t => t.id === "cheese");
      expect(cheese?.price).toBe(maxPrice);
    });
  });
});