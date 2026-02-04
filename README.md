# Vietlott Random Generator

## Giới thiệu
Ứng dụng tạo số ngẫu nhiên cho các game Vietlott (Mega 6/45, Power 6/55, Max 3D, Keno, Loto...) và tự động cập nhật kết quả từ các trang xổ số.

## Cấu trúc dự án
- `backend/`: Node.js server (Express + SQLite + Crawlee)
- `frontend/`: React application (Vite)

## Hướng dẫn cài đặt & chạy

### 1. Khởi chạy Backend (Server)
Backend chịu trách nhiệm xử lý logic, lưu trữ dữ liệu và crawl kết quả.

1.  Mở terminal và di chuyển vào thư mục `backend`:
    ```bash
    cd backend
    ```
2.  Cài đặt thư viện (chỉ cần chạy lần đầu):
    ```bash
    npm install
    ```
3.  Cài đặt trình duyệt cho crawler (chỉ cần chạy lần đầu):
    ```bash
    npx playwright install
    ```
4.  Chạy server:
    ```bash
    node server.js
    ```
    *Server sẽ chạy tại: `http://localhost:3000`*

### 2. Khởi chạy Frontend (Giao diện)
1.  Mở một terminal **mới** (giữ terminal backend đang chạy) và di chuyển vào thư mục `frontend`:
    ```bash
    cd frontend
    ```
2.  Cài đặt thư viện (chỉ cần chạy lần đầu):
    ```bash
    npm install
    ```
3.  Chạy giao diện web:
    ```bash
    npm run dev
    ```
    *Giao diện sẽ chạy tại: `http://localhost:5173` (hoặc port khác nếu bị trùng)*

## Hướng dẫn sử dụng Crawler
1.  Trên giao diện web, cuộn xuống phần **"Kết quả Xổ số Gần nhất"**.
2.  Nhấn nút **"Cập nhật dữ liệu"**.
3.  Hệ thống sẽ chạy crawler ngầm.
    - Nếu thành công: Sẽ có thông báo số lượng bản ghi mới được thêm.
    - Nếu thất bại: Sẽ có thông báo lỗi (thường do trang nguồn thay đổi cấu trúc hoặc chặn bot).

## Database
Dữ liệu được lưu trong file `backend/vietlott.db` (SQLite).
