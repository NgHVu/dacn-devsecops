export type ProductOption = {
  id: string;
  name: string;
  price: number;
};

export type ProductSize = ProductOption;
export type ProductTopping = ProductOption;

export const SIZES: ProductSize[] = [
  { id: "S", name: "Nhỏ (S)", price: 0 },
  { id: "M", name: "Vừa (M)", price: 5000 },
  { id: "L", name: "Lớn (L)", price: 10000 },
];

export const TOPPINGS: ProductTopping[] = [
  { id: "pearl", name: "Trân châu đen", price: 5000 },
  { id: "jelly", name: "Thạch trái cây", price: 5000 },
  { id: "pudding", name: "Bánh Pudding", price: 7000 },
  { id: "cheese", name: "Kem phô mai", price: 10000 },
];