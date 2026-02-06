# Tài Liệu Kỹ Thuật - Vietlot Random Number Generator

> **Version:** 1.4.0  
> **Cập nhật:** 2026-02-06  
> **Repository:** [Random-Number-Vietlott](https://github.com/ocsenbenho/Random-Number-Vietlott)

---

## 1. Tổng Quan Hệ Thống

### 1.1 Kiến Trúc

```
┌─────────────────┐     HTTP API     ┌─────────────────┐     SQLite
│   Frontend      │ ◄──────────────► │   Backend       │ ◄──────────►  vietlott.db
│   React + Vite  │                  │   Express.js    │
│   Port: 5173    │                  │   Port: 3000    │
└─────────────────┘                  └─────────────────┘
```

### 1.2 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, CSS3 |
| Backend | Node.js 20+, Express.js 4.x |
| Database | SQLite3 |
| Crawler | Playwright (headless) |
| Scheduler | node-cron |

---

## 2. Cấu Hình Games (Backend)

### 2.1 Đường dẫn: `backend/config/`

| File | Game | Type |
|------|------|------|
| `mega645.json` | Mega 6/45 | matrix |
| `power655.json` | Power 6/55 | matrix |
| `loto535.json` | Loto 5/35 | compound |
| `max3d.json` | Max 3D | digit |
| `keno.json` | Keno | matrix |

### 2.2 Schema Cấu Hình

#### Type: `matrix` (Standard)
```json
{
  "name": "Mega 6/45",      // Tên hiển thị
  "type": "matrix",         // Loại game
  "min": 1,                 // Số nhỏ nhất
  "max": 45,                // Số lớn nhất
  "size": 6,                // Số lượng số cần chọn
  "allowDuplicate": false   // Cho phép trùng số
}
```

#### Type: `compound` (Multi-part)
```json
{
  "name": "Loto 5/35",
  "type": "compound",
  "parts": [
    {
      "name": "A",
      "type": "matrix",
      "min": 1,
      "max": 35,
      "size": 5,
      "allowDuplicate": false
    },
    {
      "name": "B",           // Số cầu vàng
      "type": "matrix",
      "min": 1,
      "max": 12,
      "size": 1,
      "allowDuplicate": false
    }
  ]
}
```

#### Type: `digit` (Số lẻ)
```json
{
  "name": "Max 3D",
  "type": "digit",
  "min": 0,
  "max": 9,
  "size": 3,
  "allowDuplicate": true    // Cho phép lặp (e.g., 111)
}
```

### 2.3 Chi Tiết Từng Game

| Game | Range | Size | Type | Special |
|------|-------|------|------|---------|
| Mega 6/45 | 1-45 | 6 | matrix | - |
| Power 6/55 | 1-55 | 6+1 | matrix | Số đặc biệt (7th) |
| Loto 5/35 | 1-35, 1-12 | 5+1 | compound | Cầu vàng |
| Max 3D | 0-9 | 3 | digit | Cho phép trùng |
| Keno | 1-80 | 10 | matrix | - |

---

## 3. API Endpoints

### 3.1 Base URL
```
http://localhost:3000
```

### 3.2 Endpoints

#### GET `/games`
Lấy danh sách games.

**Response:**
```json
[
  { "id": "mega645", "name": "Mega 6/45" },
  { "id": "power655", "name": "Power 6/55" },
  ...
]
```

---

#### GET `/generate`
Tạo bộ số ngẫu nhiên.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `game` | string | ✅ | - | ID của game (mega645, power655, ...) |
| `strategy` | string | ❌ | random | Chiến lược tạo số |
| `smart` | boolean | ❌ | false | Deprecated, dùng strategy=smart |

**Strategy Options:**

| Strategy | Description | Algorithm |
|----------|-------------|-----------|
| `random` | Ngẫu nhiên thuần túy | Fisher-Yates shuffle |
| `smart` | Loại trừ số xấu | Optimized matrix |
| `prediction` | Dựa lịch sử | Weighted by frequency + gap |
| `enhanced` | Multi-source entropy | Random.org + User entropy |
| `balanced` | Cân bằng thống kê | Odd/Even + High/Low + Sum filter |

**Response (matrix):**
```json
{
  "game": "Mega 6/45",
  "numbers": [5, 12, 23, 34, 38, 42],
  "type": "matrix",
  "mode": "balanced"
}
```

**Response (compound):**
```json
{
  "game": "Loto 5/35",
  "numbers": [[5, 12, 18, 27, 33], [7]],
  "type": "compound",
  "mode": "balanced"
}
```

---

#### GET `/history`
Lấy lịch sử kết quả.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `game` | string | ✅ | ID của game |
| `limit` | number | ❌ | Số lượng kết quả (default: 50) |

**Response:**
```json
[
  {
    "draw_date": "2026-01-15",
    "numbers": "[1, 5, 12, 23, 34, 45]"
  },
  ...
]
```

---

#### POST `/check-history`
Backtest số với lịch sử.

**Body:**
```json
{
  "game": "mega645",
  "numbers": [5, 12, 23, 34, 38, 42]
}
```

**Response:**
```json
{
  "totalDraws": 100,
  "wins": 15,
  "winRate": "15.00",
  "minMatchesForWin": 3,
  "matchCounts": { "3": 12, "4": 2, "5": 1 },
  "bestMatch": {
    "drawDate": "2026-01-15",
    "numbers": [5, 12, 23, 34, 38, 42],
    "matches": 5
  }
}
```

---

#### POST `/save`
Lưu bộ số.

**Body:**
```json
{
  "game": "mega645",
  "numbers": [5, 12, 23, 34, 38, 42],
  "type": "matrix"
}
```

---

#### GET `/saved`
Lấy danh sách đã lưu.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 10 | Số lượng items |
| `game` | string | - | Filter theo game |

---

#### DELETE `/saved/:id`
Xóa bộ số đã lưu.

---

#### POST `/crawl`
Chạy crawler cập nhật dữ liệu.

**Body:**
```json
{
  "game": "mega645"
}
```

---

#### POST `/entropy`
Thêm entropy pool.

**Body:**
```json
{
  "mouseX": 125,
  "mouseY": 340,
  "timestamp": 1707200000000,
  "keyTiming": [45, 67, 89]
}
```

---

## 4. Strategies Module

### 4.1 File: `backend/utils/strategies.js`

#### Cấu Hình Balanced

```javascript
const CONFIGS = {
    mega645: {
        min: 1, max: 45, count: 6,
        midPoint: 23,                    // 1-22: low, 23-45: high
        sumRange: { min: 100, max: 190 }, // Tổng hợp lệ
        idealOddEven: [3, 3],            // 3 lẻ + 3 chẵn
        idealHighLow: [3, 3],            // 3 cao + 3 thấp
    },
    power655: {
        min: 1, max: 55, count: 6,
        midPoint: 28,
        sumRange: { min: 120, max: 220 },
        idealOddEven: [3, 3],
        idealHighLow: [3, 3],
    },
    loto535: {
        min: 1, max: 35, count: 5,
        midPoint: 18,
        sumRange: { min: 70, max: 130 },
        idealOddEven: [2, 3],
        idealHighLow: [2, 3],
    }
};
```

#### Validation Functions

| Function | Description |
|----------|-------------|
| `isOddEvenBalanced(numbers)` | Kiểm tra cân bằng chẵn/lẻ (2-4 mỗi loại) |
| `isHighLowBalanced(numbers, midPoint)` | Kiểm tra cân bằng cao/thấp |
| `isValidSum(numbers, sumRange)` | Kiểm tra tổng trong range |
| `hasExcessiveConsecutive(numbers)` | Phát hiện >3 số liên tiếp |
| `isSameDecade(numbers)` | Phát hiện cùng decade (1-10, 11-20...) |
| `hasGoodSpread(numbers)` | Kiểm tra phân bố đều |
| `isValidCombination(numbers, config)` | Tổng hợp tất cả validations |

#### Generation Functions

| Function | Description |
|----------|-------------|
| `generateBalanced(min, max, count, stats, game)` | Tạo số với constraints |
| `generateWeightedPick(min, max, count, stats)` | Chọn số theo trọng số |
| `generateFallbackBalanced(min, max, count, config)` | Fallback đảm bảo valid |
| `analyzePairs(history, minCoOccurrence)` | Phân tích cặp số đi cùng |

---

## 5. Analyzer Module

### 5.1 File: `backend/utils/analyzer.js`

#### Weight Formula
```javascript
weight = 10 + (frequency * 2) + (gap * 0.5)
```

| Parameter | Description |
|-----------|-------------|
| `frequency` | Số lần xuất hiện trong lịch sử |
| `gap` | Số kỳ kể từ lần cuối xuất hiện |

#### Functions

| Function | Description |
|----------|-------------|
| `getHistory(game, limit)` | Lấy N kỳ gần nhất từ DB |
| `analyze(history, min, max)` | Phân tích thống kê |
| `generateWeighted(min, max, count, stats, sorted)` | Chọn số theo trọng số |

---

## 6. RNG Module

### 6.1 File: `backend/utils/rng.js`

#### Functions

| Function | Description |
|----------|-------------|
| `secureRandomInt(min, max)` | Số ngẫu nhiên bảo mật (crypto) |
| `generateMechanicalDraw(min, max, count, sorted)` | Fisher-Yates shuffle |
| `generateMatrix(min, max, size)` | Tạo matrix numbers |
| `generateDigits(min, max, size)` | Tạo digit numbers (cho phép trùng) |
| `generateOptimizedMatrix(min, max, size)` | Loại trừ số xấu |

---

## 7. Entropy Module

### 7.1 File: `backend/utils/entropy.js`

#### Entropy Pool

```javascript
entropyPool = {
    pool: [],           // Raw entropy data
    maxSize: 100,       // Giới hạn pool
    
    add(data),          // Thêm entropy
    extract()           // Lấy entropy để seed RNG
}
```

#### External Sources
- **Random.org API**: QRNG (Quantum Random Number Generator)
- **User Input**: Mouse movements, key timings

---

## 8. Database Schema

### 8.1 File: `backend/vietlott.db`

#### Table: `saved_combinations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key, auto-increment |
| `game` | TEXT | Game ID |
| `numbers` | TEXT | JSON array của numbers |
| `type` | TEXT | matrix/compound/digit |
| `created_at` | TEXT | Timestamp |

#### Table: `draw_history`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `game` | TEXT | Game ID |
| `draw_date` | TEXT | Ngày quay |
| `numbers` | TEXT | JSON array kết quả |

---

## 9. Frontend Components

### 9.1 Main Components

| Component | Location | Description |
|-----------|----------|-------------|
| `App.jsx` | `frontend/src/` | Main application |
| `Header.jsx` | `frontend/src/components/` | Header với logo |
| `Ball.jsx` | `frontend/src/components/` | Hiển thị số |
| `GameCard.jsx` | `frontend/src/components/` | Card chọn game |
| `LotteryMachine.jsx` | `frontend/src/components/` | Animation mô phỏng |

### 9.2 State Variables (App.jsx)

| State | Type | Description |
|-------|------|-------------|
| `games` | array | Danh sách games |
| `selectedGame` | string | Game đang chọn |
| `strategy` | string | Chiến lược hiện tại |
| `result` | object | Kết quả tạo số |
| `historyMatch` | object | Kết quả backtest |
| `savedItems` | array | Số đã lưu |
| `showSimulation` | boolean | Hiện simulation |
| `isSimulating` | boolean | Đang chạy animation |

---

## 10. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Backend port |
| `VITE_API_URL` | http://localhost:3000 | API endpoint (frontend) |

---

## 11. Cron Jobs

### 11.1 File: `backend/utils/scheduler.js`

| Schedule | Task | Description |
|----------|------|-------------|
| `0 19 * * 2,4,6` | Crawl Mega 6/45 | Thứ 3, 5, 7 lúc 19:00 |
| `0 19 * * 2,4,6` | Crawl Power 6/55 | Thứ 3, 5, 7 lúc 19:00 |
| `0 18 * * *` | Crawl Keno | Hàng ngày 18:00 |

---

## 12. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_GAME` | 400 | Game không tồn tại |
| `MISSING_PARAM` | 400 | Thiếu tham số bắt buộc |
| `DB_ERROR` | 500 | Lỗi database |
| `CRAWL_ERROR` | 500 | Lỗi crawler |

---

## 13. Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.4.0 | 2026-02-06 | Balanced strategy, UI flow improvements |
| v1.3.0 | 2026-02-04 | Enhanced entropy, Power 6/55 fix |
| v1.2.0 | 2026-02-03 | Lottery machine animation |
| v1.0.0 | 2026-01-28 | Initial release |

---

*Tài liệu này được tự động tạo và cập nhật.*
