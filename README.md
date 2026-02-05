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

---

## 🔄 Workflow Ứng dụng

### Kiến trúc tổng quan
```
┌─────────────────┐     HTTP API     ┌─────────────────┐
│                 │ ◄──────────────► │                 │
│   Frontend      │                  │   Backend       │
│   (React/Vite)  │                  │   (Express)     │
│   Port: 5173    │                  │   Port: 3000    │
│                 │                  │                 │
└─────────────────┘                  └────────┬────────┘
                                              │
                                              ▼
                          ┌─────────────────────────────────┐
                          │         SQLite Database         │
                          │         (vietlott.db)           │
                          │                                 │
                          │  • saved_combinations           │
                          │  • draw_history                 │
                          └─────────────────────────────────┘
```

### Luồng hoạt động chính

#### 1. 🎲 Tạo số ngẫu nhiên
```
User chọn Game → Chọn Chế độ tạo số → Bấm "Tạo bộ số"
                        │
                        ▼
         ┌──────────────┴──────────────┐
         │                             │
    ┌────▼────┐  ┌────▼────┐  ┌───▼────┐
    │ Ngẫu    │  │ Thông   │  │ Dự     │
    │ nhiên   │  │ minh    │  │ đoán   │
    └────┬────┘  └────┬────┘  └───┬────┘
         │            │           │
         ▼            ▼           ▼
    Fisher-Yates   Loại trừ    Phân tích
    Shuffle        số xấu      lịch sử
         │            │           │
         └────────────┴─────┬─────┘
                            ▼
                    Hiển thị kết quả
                            │
                            ▼
                    Backtest với lịch sử
                    (Tính tỉ lệ trùng khớp)
```

#### 2. 📊 Cập nhật dữ liệu (Crawler)
```
User bấm "Cập nhật dữ liệu"
         │
         ▼
    ┌─────────────────────────────┐
    │  PlaywrightCrawler chạy    │
    │  truy cập minhchinh.com    │
    └──────────────┬──────────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │  Parse HTML, trích xuất:   │
    │  - Ngày quay               │
    │  - Bộ số trúng thưởng      │
    │  - Số đặc biệt (nếu có)    │
    └──────────────┬──────────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │  Lưu vào draw_history      │
    │  (INSERT OR IGNORE)        │
    └─────────────────────────────┘
```

#### 3. ⏰ Tự động cập nhật (Scheduler)
```
Server khởi động
       │
       ▼
  node-cron đăng ký 2 job:
       │
       ├── 19:15 hàng ngày: Crawl Mega, Power, Max3D, Loto
       │
       └── 22:05 hàng ngày: Crawl Keno (quay tối)
```

#### 4. 💾 Lưu & Xóa bộ số
```
Tạo số xong → Bấm "Lưu bộ số"
                    │
                    ▼
           POST /save → SQLite
                    
Danh sách đã lưu → Bấm 🗑️ → Xác nhận
                             │
                             ▼
                    DELETE /saved/:id
```

### Bảng mô tả các Game

| Game | Số chính | Số đặc biệt | Màu hiển thị |
|------|----------|-------------|--------------|
| Mega 6/45 | 6 số (1-45) | Không | - |
| Power 6/55 | 6 số (1-55) | 1 số (Special) | 🔴 Đỏ |
| Loto 5/35 | 5 số (1-35) | 1 số (Cầu vàng) | 🟡 Vàng |
| Max 3D | 3 số (0-9) | Không | - |
| Keno | 20 số (1-80) | Không | - |

### API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/games` | Danh sách các game |
| GET | `/generate?game=xxx&strategy=xxx` | Tạo số ngẫu nhiên |
| GET | `/history?game=xxx` | Lịch sử kết quả |
| GET | `/saved?limit=10&game=xxx` | Danh sách đã lưu |
| POST | `/save` | Lưu bộ số |
| DELETE | `/saved/:id` | Xóa bộ số đã lưu |
| POST | `/crawl` | Chạy crawler thủ công |
| POST | `/check-history` | Backtest số với lịch sử |

### Cấu trúc thư mục
```
Random Number Vietlot/
├── backend/
│   ├── server.js           # Entry point
│   ├── vietlott.db         # SQLite database
│   ├── config/             # Game configurations (JSON)
│   │   ├── mega645.json
│   │   ├── power655.json
│   │   ├── loto535.json
│   │   ├── max3d.json
│   │   └── keno.json
│   └── utils/
│       ├── db.js           # Database operations
│       ├── rng.js          # Random number generators
│       ├── analyzer.js     # Prediction mode analysis
│       ├── crawler.js      # Web scraping
│       ├── scheduler.js    # Auto-update jobs
│       └── history_loader.js
│
└── frontend/
    ├── src/
    │   ├── App.jsx         # Main component
    │   ├── api.js          # API client
    │   ├── index.css       # Styles
    │   └── components/
    │       ├── Ball.jsx
    │       ├── Header.jsx
    │       └── GameCard.jsx
    └── package.json
```
