# Tài Liệu Nghiệp Vụ - Vietlot Random Number Generator

> **Version:** 1.4.0  
> **Cập nhật:** 2026-02-06

---

## 1. Giới Thiệu

### 1.1 Mục Đích
Ứng dụng tạo số ngẫu nhiên cho các loại hình xổ số Vietlot, hỗ trợ người chơi:
- Tạo bộ số ngẫu nhiên theo nhiều chiến lược
- Kiểm tra lịch sử trùng khớp (backtest)
- Lưu trữ và quản lý các bộ số

### 1.2 Đối Tượng Sử Dụng
- Người chơi xổ số Vietlot
- Nhà phân tích thống kê
- Người yêu thích toán xác suất

---

## 2. Các Loại Hình Xổ Số Hỗ Trợ

### 2.1 Mega 6/45

| Thông tin | Chi tiết |
|-----------|----------|
| **Phạm vi số** | 1 - 45 |
| **Số lượng chọn** | 6 số |
| **Lịch quay** | Thứ 4, Thứ 6, Chủ nhật |
| **Xác suất trúng Jackpot** | 1/8,145,060 |

**Cơ cấu giải thưởng:**
| Giải | Điều kiện | Tỉ lệ giải thưởng |
|------|-----------|-------------------|
| Jackpot | 6 số | 55% quỹ giải đặc biệt |
| Giải 1 | 5 số | 10% quỹ giải |
| Giải 2 | 4 số | 15% quỹ giải |
| Giải 3 | 3 số | 20% quỹ giải |

---

### 2.2 Power 6/55

| Thông tin | Chi tiết |
|-----------|----------|
| **Phạm vi số** | 1 - 55 (6 số chính + 1 số đặc biệt) |
| **Số lượng chọn** | 6 số chính + 1 số Power |
| **Lịch quay** | Thứ 3, Thứ 5, Thứ 7 |
| **Xác suất trúng Jackpot** | 1/28,989,675 |

**Đặc điểm:**
- Có **2 Jackpot**: Jackpot 1 (6 số + Power) và Jackpot 2 (6 số, không Power)
- Số Power là số thứ 7, được quay riêng

---

### 2.3 Loto 5/35 (Bao 5)

| Thông tin | Chi tiết |
|-----------|----------|
| **Phạm vi số bộ chính** | 1 - 35 |
| **Phạm vi số cầu vàng** | 1 - 12 |
| **Số lượng chọn** | 5 số + 1 cầu vàng |
| **Lịch quay** | Thứ 2, Thứ 4, Thứ 6 |

**Đặc điểm:**
- Gồm 2 phần: **Bộ số chính** (5/35) và **Cầu vàng** (1/12)
- Phải trùng cả bộ số và cầu vàng mới trúng Jackpot

---

### 2.4 Max 3D

| Thông tin | Chi tiết |
|-----------|----------|
| **Phạm vi số** | 0 - 9 (mỗi vị trí) |
| **Số lượng chọn** | 3 chữ số |
| **Lịch quay** | Thứ 2 đến Thứ 6 |

**Đặc điểm:**
- Số có thể lặp lại (e.g., 111, 222)
- Kết quả là dãy 3 chữ số cố định vị trí

---

### 2.5 Keno

| Thông tin | Chi tiết |
|-----------|----------|
| **Phạm vi số** | 1 - 80 |
| **Số lượng chọn** | 1 - 10 số |
| **Lịch quay** | Mỗi 10 phút, từ 6:00 - 22:00 |

**Đặc điểm:**
- Vietlott quay 20 số mỗi kỳ
- Người chơi chọn từ 1-10 số, so khớp với 20 số quay

---

## 3. Chiến Lược Tạo Số

### 3.1 Ngẫu Nhiên (random)

**Mô tả:** Sử dụng thuật toán Fisher-Yates shuffle với nguồn ngẫu nhiên từ `crypto.randomBytes()`.

**Ưu điểm:**
- Đảm bảo tính ngẫu nhiên thực sự
- Mỗi số có xác suất bằng nhau
- Không có bias

**Phù hợp với:** Người chơi muốn số hoàn toàn ngẫu nhiên.

---

### 3.2 Thông Minh (smart)

**Mô tả:** Loại trừ các "số xấu" theo thống kê.

**Quy tắc loại trừ:**
- Số đã trúng Jackpot nhiều lần gần đây
- Số xuất hiện liên tiếp >3 kỳ
- Dãy số consecutive (1,2,3,4,5,6)

**Phù hợp với:** Người chơi tin vào thống kê ngắn hạn.

---

### 3.3 Dự Đoán (prediction)

**Mô tả:** Dựa trên phân tích lịch sử để tính trọng số.

**Công thức:**
```
Weight = 10 + (Frequency × 2) + (Gap × 0.5)
```

| Yếu tố | Ảnh hưởng |
|--------|-----------|
| **Frequency** | Số xuất hiện nhiều → trọng số cao (Hot) |
| **Gap** | Số lâu chưa xuất hiện → trọng số tăng (Due) |

**Phù hợp với:** Người chơi phân tích xu hướng.

---

### 3.4 Nâng Cao (enhanced)

**Mô tả:** Sử dụng nhiều nguồn entropy kết hợp.

**Nguồn entropy:**
1. **Random.org API** - Quantum Random Number Generator
2. **User Input** - Di chuyển chuột, timing gõ phím
3. **System Entropy** - crypto.randomBytes()

**Phù hợp với:** Người cần độ ngẫu nhiên cao nhất.

---

### 3.5 Cân Bằng (balanced) ⭐ NEW

**Mô tả:** Áp dụng các ràng buộc thống kê để tạo bộ số "hợp lý".

**Ràng buộc:**

| Ràng buộc | Mega 6/45 | Power 6/55 | Loto 5/35 |
|-----------|-----------|------------|-----------|
| **Odd/Even** | 2-4 lẻ, 2-4 chẵn | 2-4 lẻ, 2-4 chẵn | 2-3 lẻ, 2-3 chẵn |
| **High/Low** | 2-4 cao (23-45), 2-4 thấp (1-22) | 2-4 cao (28-55), 2-4 thấp (1-27) | 2-3 cao (18-35), 2-3 thấp (1-17) |
| **Tổng** | 100 - 190 | 120 - 220 | 70 - 130 |
| **Consecutive** | Không >3 số liên tiếp | Không >3 số liên tiếp | Không >3 số liên tiếp |
| **Same Decade** | Không cùng decade | Không cùng decade | Không cùng decade |

**Cơ sở thống kê:**
- 73% các kỳ quay có 2-4 số lẻ
- 68% các kỳ quay có tổng trong range phổ biến
- <2% các kỳ quay có >3 số liên tiếp

**Phù hợp với:** Người muốn tối ưu xác suất trúng giải phụ.

---

## 4. Tính Năng Backtest

### 4.1 Mô Tả
So sánh bộ số sinh ra với lịch sử kết quả thực tế.

### 4.2 Chỉ Số Đánh Giá

| Chỉ số | Ý nghĩa |
|--------|---------|
| **Win Rate** | Tỉ lệ % các kỳ có trùng ≥ N số |
| **Match Counts** | Chi tiết số lần trùng 1, 2, 3... số |
| **Best Match** | Kỳ trùng nhiều nhất |

### 4.3 Ngưỡng Thắng

| Game | Ngưỡng thắng |
|------|--------------|
| Mega 6/45 | 3+ số |
| Power 6/55 | 3+ số |
| Loto 5/35 | 2+ số |
| Max 3D | Số xuất hiện trong kết quả |

---

## 5. Luồng Sử Dụng

### 5.1 Tạo Số Mới

```
1. Chọn loại game (Mega 6/45, Power 6/55, ...)
2. Chọn chiến lược (random, smart, prediction, enhanced, balanced)
3. Nhấn "Tạo bộ số"
4. [Tùy chọn] Xem mô phỏng quay số
5. Xem kết quả
6. Xem phân tích Backtest
7. [Tùy chọn] Lưu hoặc sao chép
```

### 5.2 Quản Lý Số Đã Lưu

```
1. Xem danh sách số đã lưu
2. Xóa số không cần thiết
3. Sao chép để sử dụng
```

### 5.3 Cập Nhật Dữ Liệu

```
1. Nhấn "Cập nhật dữ liệu"
2. Hệ thống tự động crawl kết quả mới
3. Kết quả được lưu vào database
```

---

## 6. Lưu Ý Quan Trọng

### 6.1 Disclaimer

> ⚠️ **CẢNH BÁO:** Xổ số là trò chơi may rủi. Không có phương pháp nào đảm bảo trúng thưởng. Các chiến lược trong ứng dụng chỉ nhằm mục đích giải trí và tham khảo.

### 6.2 Xác Suất Cơ Bản

| Game | Xác suất trúng Jackpot |
|------|------------------------|
| Mega 6/45 | 1/8,145,060 (~0.0000123%) |
| Power 6/55 | 1/28,989,675 (~0.0000034%) |
| Loto 5/35 | 1/4,056,648 (~0.0000247%) |

### 6.3 Best Practices

1. **Không đầu tư quá nhiều** - Chỉ chơi với số tiền có thể mất
2. **Đa dạng hóa** - Thử nhiều chiến lược khác nhau
3. **Không tin mù quáng** - Mỗi kỳ quay là độc lập
4. **Backtest chỉ tham khảo** - Hiệu suất quá khứ không đảm bảo tương lai

---

## 7. Thuật Ngữ

| Thuật ngữ | Định nghĩa |
|-----------|------------|
| **Jackpot** | Giải thưởng lớn nhất, trúng khi khớp tất cả số |
| **Hot Number** | Số xuất hiện thường xuyên gần đây |
| **Cold Number** | Số lâu chưa xuất hiện |
| **Gap** | Số kỳ quay kể từ lần cuối số đó xuất hiện |
| **Backtest** | So sánh số sinh ra với lịch sử thực tế |
| **Entropy** | Nguồn dữ liệu ngẫu nhiên |
| **Fisher-Yates** | Thuật toán xáo trộn ngẫu nhiên chuẩn |
| **Compound Game** | Game có nhiều phần (VD: Loto 5/35) |

---

## 8. FAQ

### Q: Chiến lược nào tốt nhất?
**A:** Không có chiến lược nào "tốt nhất" vì xổ số là ngẫu nhiên. Tuy nhiên, `balanced` giúp tránh các bộ số có pattern hiếm gặp.

### Q: Backtest có nghĩa gì?
**A:** Backtest cho biết bộ số của bạn đã từng "trúng" bao nhiêu lần nếu bạn chơi trong quá khứ. Tuy nhiên, đây chỉ là số liệu tham khảo.

### Q: Số đã lưu có hết hạn không?
**A:** Không, số đã lưu được lưu trữ vĩnh viễn trong database local.

### Q: Có thể sử dụng offline không?
**A:** Có, nhưng tính năng `enhanced` (Random.org) và cập nhật dữ liệu cần internet.

---

*Tài liệu này được tạo cho mục đích hướng dẫn sử dụng. Vui lòng chơi có trách nhiệm.*
