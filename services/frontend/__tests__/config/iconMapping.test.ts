/* eslint-disable @typescript-eslint/ban-ts-comment */
// Sử dụng đường dẫn tương đối để đảm bảo Jest tìm thấy module trong mọi cấu hình
import { getIconComponent, iconMap } from "../../config/iconMapping";
import { 
  Utensils, Coffee, Pizza, Soup, Sandwich, IceCream, 
  Beer, Flame, Beef, Carrot, CakeSlice, Fish, 
  Drumstick, Wine, Salad, Croissant, Wheat 
} from "lucide-react";

/**
 * Kiểm thử tính đúng đắn của việc ánh xạ biểu tượng (Icons Mapping).
 * Đảm bảo các biểu tượng được định nghĩa trong file chính khớp với iconMap.
 */
describe("Category Icons Logic", () => {
  
  test("iconMap: nên chứa đầy đủ và chính xác các biểu tượng đã định nghĩa", () => {
    // Kiểm tra các mapping cốt lõi
    expect(iconMap["Utensils"]).toBe(Utensils);
    expect(iconMap["Flame"]).toBe(Flame);
    expect(iconMap["Coffee"]).toBe(Coffee);
    expect(iconMap["Pizza"]).toBe(Pizza);
    expect(iconMap["Soup"]).toBe(Soup);
    expect(iconMap["Sandwich"]).toBe(Sandwich);
    expect(iconMap["IceCream"]).toBe(IceCream);
    expect(iconMap["Beer"]).toBe(Beer);
    expect(iconMap["Beef"]).toBe(Beef);
    expect(iconMap["Drumstick"]).toBe(Drumstick);
    expect(iconMap["Fish"]).toBe(Fish);
    expect(iconMap["Carrot"]).toBe(Carrot);
    expect(iconMap["Salad"]).toBe(Salad);
    expect(iconMap["CakeSlice"]).toBe(CakeSlice);
    expect(iconMap["Wine"]).toBe(Wine);
    expect(iconMap["Croissant"]).toBe(Croissant);
    expect(iconMap["Wheat"]).toBe(Wheat);

    // Kiểm tra tổng số lượng icon trong map (hiện tại là 17 icons)
    expect(Object.keys(iconMap).length).toBe(17);
  });

  describe("getIconComponent", () => {
    test("nên trả về đúng Component tương ứng cho mỗi tên icon hợp lệ", () => {
      expect(getIconComponent("Pizza")).toBe(Pizza);
      expect(getIconComponent("Coffee")).toBe(Coffee);
      expect(getIconComponent("Flame")).toBe(Flame);
      expect(getIconComponent("Beer")).toBe(Beer);
    });

    test("nên trả về Utensils (mặc định) khi tên icon không tồn tại", () => {
      // Thử nghiệm với một chuỗi bất kỳ không có trong danh sách
      // @ts-ignore - Kiểm tra hành vi runtime khi dữ liệu đầu vào không khớp
      expect(getIconComponent("FastFood")).toBe(Utensils);
      expect(getIconComponent("RandomString123")).toBe(Utensils);
    });

    test("nên trả về Utensils khi truyền vào giá trị undefined hoặc chuỗi rỗng", () => {
      expect(getIconComponent(undefined)).toBe(Utensils);
      expect(getIconComponent("")).toBe(Utensils);
    });
  });
});