package com.example.orders.service;

import com.example.orders.dto.ProductDto; 
import java.util.List;
import java.util.Set;

/**
 * Interface định nghĩa cách giao tiếp với Products Service. 
 * Mục đích là để lấy thông tin chi tiết về sản phẩm khi tạo đơn hàng.
 */
public interface ProductServiceClient {

    /**
     * Gọi API sang Products Service để lấy thông tin của nhiều sản phẩm dựa trên ID.
     *
     * @param productIds Danh sách (Set) các ID sản phẩm cần lấy thông tin.
     * @param bearerToken Token JWT để xác thực request (nếu Products Service yêu cầu).
     * @return Danh sách (List) các ProductDto chứa thông tin sản phẩm tìm được.
     * Trả về danh sách rỗng nếu không có ID nào được cung cấp hoặc không tìm thấy sản phẩm.
     * @throws IllegalArgumentException Nếu request không hợp lệ hoặc không tìm thấy sản phẩm (lỗi 4xx từ Product Service).
     * @throws RuntimeException Nếu có lỗi kết nối hoặc lỗi server từ Products Service (lỗi 5xx).
     */
    List<ProductDto> getProductsByIds(Set<Long> productIds, String bearerToken);

}
