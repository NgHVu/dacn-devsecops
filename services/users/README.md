# users service

Service đã hoàn thành các chức năng cơ bản bao gồm:
- Đăng ký người dùng, Đăng nhập, Tìm thông tin người dùng dựa trên access token
- Đăng ký người dùng không thể dùng cùng 1 mail, Không thể để trống các mục thông tin chỉ định như tên, email, mật khẩu
- Đăng nhập với mật khẩu sai sẽ báo lỗi
- Không có token hợp lệ sẽ không lấy được thông tin người dùng

Service dự kiến sẽ bổ sung các chức năng khác sau khi hoàn thành các service khác như:
- Quên mật khẩu, Đặt lại mật khẩu, Đổi mật khẩu
- Cập nhật thông tin người dùng như tên, sdt, các thông tin các nhân khác
- Quản lý địa chỉ giao hàng: Lấy danh sách địa chỉ, thêm địa chỉ mới, cập nhật địa chỉ, xóa địa chỉ
- Xác thực tài khoản qua mail, tức dùng mail đúng mới kích hoạt tài khoản được
