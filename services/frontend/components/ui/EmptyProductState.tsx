import { ShoppingBag } from "lucide-react";

export function EmptyProductState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-gray-50">
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <ShoppingBag className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">Chưa có sản phẩm nào</h3>
      <p className="text-gray-500 mt-2 text-center max-w-sm">
        Hệ thống đang được cập nhật. Vui lòng quay lại sau để xem những món ngon hấp dẫn nhé!
      </p>
    </div>
  );
}