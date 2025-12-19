import React from "react";
import { render, screen, act } from "@testing-library/react";
// Chuyển đổi từ alias sang đường dẫn tương đối để tránh lỗi resolve
import { CartProvider, useCart } from "../../context/CartContext";
import { Product } from "../../types/product";
import { toast } from "sonner";

/**
 * Mock các module phụ thuộc để cô lập logic của CartContext.
 * Chúng ta giả lập router của Next.js và thư viện toast.
 */
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
  },
}));

/**
 * Mock component Image của Next.js.
 * Trong môi trường JSDOM (kiểm thử), component Image gốc của Next.js thường gây lỗi 
 * vì nó yêu cầu cấu hình server hoặc loader cụ thể.
 */
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => <img {...props} />,
}));

/**
 * Component Test phụ trợ giúp truy cập vào các giá trị của CartContext.
 * Vì useCart chỉ có thể hoạt động bên trong CartProvider.
 */
const TestCartComponent = () => {
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  
  const dummyProduct: Product = {
    id: 1,
    name: "Pizza Hải Sản",
    price: 150000,
    image: "pizza.jpg",
    description: "Pizza hải sản thơm ngon với phô mai",
    stockQuantity: 10,
    createdAt: "",
    updatedAt: ""
  };

  return (
    <div>
      <div data-testid="total-items">{totalItems}</div>
      <div data-testid="total-price">{totalPrice}</div>
      <div data-testid="items-count">{items.length}</div>
      <button onClick={() => addToCart(dummyProduct, 1)} data-testid="add-btn">Thêm vào giỏ</button>
      <button onClick={() => clearCart()} data-testid="clear-btn">Xóa giỏ hàng</button>
      {items.map(item => (
        <div key={item.uniqueKey}>
          <span data-testid={`item-qty-${item.id}`}>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.uniqueKey, item.quantity + 1)} data-testid="plus-btn">+</button>
          <button onClick={() => removeFromCart(item.uniqueKey)} data-testid="remove-btn">Xóa món</button>
        </div>
      ))}
    </div>
  );
};

describe("CartContext", () => {
  beforeEach(() => {
    // Làm sạch mock và localStorage trước mỗi bài test
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("nên khởi tạo giỏ hàng trống mặc định", () => {
    render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    expect(screen.getByTestId("total-items")).toHaveTextContent("0");
    expect(screen.getByTestId("items-count")).toHaveTextContent("0");
  });

  test("nên nạp dữ liệu giỏ hàng từ localStorage khi ứng dụng khởi chạy", () => {
    const savedCart = [{ 
      uniqueKey: "1-S-", 
      id: 1, 
      name: "Pizza Hải Sản", 
      price: 150000, 
      quantity: 2, 
      image: "", 
      size: "S", 
      toppings: [], 
      note: "" 
    }];
    localStorage.setItem("cart", JSON.stringify(savedCart));

    render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    expect(screen.getByTestId("total-items")).toHaveTextContent("2");
    expect(screen.getByTestId("total-price")).toHaveTextContent("300000");
  });

  test("addToCart: nên thêm sản phẩm mới và gọi thông báo thành công", () => {
    render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByTestId("add-btn").click();
    });

    expect(screen.getByTestId("total-items")).toHaveTextContent("1");
    expect(toast.success).toHaveBeenCalled();
  });

  test("addToCart: nên cộng dồn số lượng nếu sản phẩm đã tồn tại (cùng size/topping)", () => {
    render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByTestId("add-btn").click();
      screen.getByTestId("add-btn").click();
    });

    expect(screen.getByTestId("items-count")).toHaveTextContent("1"); // Vẫn chỉ có 1 loại món ăn
    expect(screen.getByTestId("total-items")).toHaveTextContent("2");
  });

  test("updateQuantity: nên cập nhật số lượng món ăn chính xác", () => {
    render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByTestId("add-btn").click();
    });

    act(() => {
      screen.getByTestId("plus-btn").click();
    });

    expect(screen.getByTestId("total-items")).toHaveTextContent("2");
  });

  test("removeFromCart: nên loại bỏ sản phẩm khỏi danh sách giỏ hàng", () => {
    render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByTestId("add-btn").click();
    });

    act(() => {
      screen.getByTestId("remove-btn").click();
    });

    expect(screen.getByTestId("items-count")).toHaveTextContent("0");
  });

  test("clearCart: nên làm sạch toàn bộ giỏ hàng và localStorage", () => {
    render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByTestId("add-btn").click();
      screen.getByTestId("clear-btn").click();
    });

    expect(screen.getByTestId("total-items")).toHaveTextContent("0");
    expect(localStorage.getItem("cart")).toBe("[]");
  });
});