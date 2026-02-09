# Nghiên Cứu Quy Luật Số Xổ Số Vietlot

> **Ngày nghiên cứu:** 2026-02-06  
> **Dữ liệu phân tích:** Mega 6/45 (32 kỳ), Power 6/55 (31 kỳ), Loto 5/35 (115 kỳ)

---

## 1. Tóm Tắt Nghiên Cứu

Phân tích thống kê dữ liệu lịch sử xổ số Vietlot để xác định các pattern và biến số có thể sử dụng để cải thiện thuật toán tạo số.

### 1.1 Kết Luận Chính

> ⚠️ **QUAN TRỌNG:** Xổ số là trò chơi NGẪU NHIÊN. Các pattern phân tích dưới đây chỉ mang tính THỐNG KÊ MÔ TẢ, không đảm bảo dự đoán chính xác.

**Tuy nhiên**, có thể tối ưu hóa xác suất trúng **giải phụ** bằng cách:
1. Tránh các pattern hiếm gặp (tần suất <5%)
2. Chọn bộ số có phân bố "cân đối" theo lịch sử
3. Kết hợp số hot và số overdue

---

## 2. Phân Tích Mega 6/45

### 2.1 Phân Bố Chẵn/Lẻ

| Pattern | Tần suất | Tỉ lệ |
|---------|----------|-------|
| 3 lẻ - 3 chẵn | 12 kỳ | 37.50% |
| 4 lẻ - 2 chẵn | 6 kỳ | 18.75% |
| 2 lẻ - 4 chẵn | 8 kỳ | 25.00% |
| 5 lẻ - 1 chẵn | 2 kỳ | 6.25% |
| 1 lẻ - 5 chẵn | 3 kỳ | 9.38% |

**Kết luận:** ~81% các kỳ có 2-4 số lẻ → Ưu tiên bộ số cân đối

### 2.2 Phân Bố Cao/Thấp

| Pattern | Tần suất | Tỉ lệ |
|---------|----------|-------|
| 3 thấp - 3 cao | 9 kỳ | 28.13% |
| 2 thấp - 4 cao | 10 kỳ | 31.25% |
| 4 thấp - 2 cao | 6 kỳ | 18.75% |

**Kết luận:** ~78% có 2-4 số thấp (1-22) → Ưu tiên phân bố đều

### 2.3 Phân Tích Tổng

| Khoảng | Số kỳ | Tỉ lệ |
|--------|-------|-------|
| 80-99 | 2 | 6.25% |
| 100-119 | 7 | 21.88% |
| 120-139 | 12 | 37.50% |
| 140-159 | 5 | 15.63% |
| 160-179 | 3 | 9.38% |
| 180-199 | 3 | 9.38% |

**Kết luận:** 75% các kỳ có tổng 100-159 → Sum filter range: **100-160**

### 2.4 Số Liên Tiếp

- Kỳ có số liên tiếp: 60%
- Số liên tiếp dài nhất: 3 (hiếm gặp)

**Kết luận:** >3 số liên tiếp rất hiếm → Loại bỏ pattern này

### 2.5 Hot Numbers (Xuất hiện nhiều)

| Số | Tần suất | Tỉ lệ |
|----|----------|-------|
| 15 | 9 | 28.13% |
| 23 | 9 | 28.13% |
| 30 | 8 | 25.00% |
| 2 | 8 | 25.00% |
| 43 | 8 | 25.00% |

### 2.6 Cold Numbers (Xuất hiện ít)

| Số | Tần suất | Tỉ lệ |
|----|----------|-------|
| 44 | 1 | 3.13% |
| 32 | 1 | 3.13% |
| 38 | 2 | 6.25% |
| 17 | 2 | 6.25% |

### 2.7 Cặp Số Hay Đi Cùng

| Cặp | Số lần |
|-----|--------|
| [21-23] | 4 |
| [2-15] | 4 |
| [15-28] | 4 |
| [2-23] | 4 |

---

## 3. Phân Tích Power 6/55

### 3.1 Phân Bố Chẵn/Lẻ

| Pattern | Tần suất | Tỉ lệ |
|---------|----------|-------|
| 3 lẻ - 4 chẵn | 9 kỳ | 29.03% |
| 4 lẻ - 3 chẵn | 6 kỳ | 19.35% |
| 2 lẻ - 5 chẵn | 6 kỳ | 19.35% |

**Kết luận:** Rộng hơn Mega → Cho phép 2-5 số lẻ

### 3.2 Phân Tích Tổng

- Trung bình: **199.77**
- Min: 126, Max: 271
- Khoảng phổ biến: **160-220** (68%)

### 3.3 Hot Numbers

| Số | Tần suất |
|----|----------|
| 14, 16, 20, 32, 38, 48, 55 | 7 lần (22.58%) |

### 3.4 Cold Numbers

| Số | Tần suất |
|----|----------|
| 1, 19 | 0 lần (0%) |
| 6, 8, 44, 49 | 1 lần (3.23%) |

---

## 4. Phân Tích Loto 5/35

### 4.1 Phân Bố Chẵn/Lẻ

| Pattern | Tần suất | Tỉ lệ |
|---------|----------|-------|
| 3 lẻ - 3 chẵn | 44 kỳ | 38.26% |
| 4 lẻ - 2 chẵn | 38 kỳ | 33.04% |
| 2 lẻ - 4 chẵn | 16 kỳ | 13.91% |

**Kết luận:** 85% có 2-4 số lẻ

### 4.2 Phân Bố Thập Kỷ

| Dải | Tỉ lệ |
|-----|-------|
| 1-10 | 36.67% |
| 11-20 | 25.94% |
| 21-30 | 24.64% |
| 31-35 | 12.75% |

**Kết luận:** Số nhỏ (1-10) xuất hiện nhiều hơn → Bias toward lower numbers

### 4.3 Cặp Số Hay Đi Cùng

| Cặp | Số lần |
|-----|--------|
| [7-10] | 10 |
| [2-10] | 10 |
| [7-9] | 9 |
| [10-13] | 9 |

---

## 5. Biến Số Thống Kê Quan Trọng

### 5.1 Bảng Tham Số

| Game | Sum Range | Odd/Even | High/Low | Max Consecutive |
|------|-----------|----------|----------|-----------------|
| Mega 6/45 | 100-160 | 2-4 mỗi loại | 2-4 mỗi loại | 3 |
| Power 6/55 | 160-220 | 2-5 mỗi loại | 2-5 mỗi loại | 3 |
| Loto 5/35 | 70-130 | 2-4 mỗi loại | 2-4 mỗi loại | 3 |

### 5.2 Công Thức Prediction Score

```
Score = FrequencyScore + GapScore + TrendBonus + RandomFactor

Where:
- FrequencyScore = (frequency / maxFrequency) × 40
- GapScore = (gap / maxGap) × 30
- TrendBonus = 20 (increasing) | 10 (stable) | 5 (decreasing)
- RandomFactor = random(0, 10)
```

---

## 6. Đề Xuất Cải Thiện Thuật Toán

### 6.1 Enhanced Balanced Strategy v2

```javascript
const ENHANCED_CONFIG = {
    mega645: {
        // Tightened based on analysis
        sumRange: { min: 100, max: 160 },  // Was 100-190
        oddEvenRange: { min: 2, max: 4 },
        highLowRange: { min: 2, max: 4 },
        maxConsecutive: 3,
        
        // NEW: Decade balance
        decadeBalance: {
            '1-10': { min: 1, max: 2 },
            '11-20': { min: 1, max: 2 },
            '21-30': { min: 1, max: 2 },
            '31-40': { min: 1, max: 2 },
            '41-45': { min: 0, max: 1 }
        },
        
        // NEW: Pair preference
        preferredPairs: [[21,23], [2,15], [15,28], [2,23]]
    },
    power655: {
        sumRange: { min: 160, max: 220 },
        oddEvenRange: { min: 2, max: 5 },
        highLowRange: { min: 2, max: 5 },
        maxConsecutive: 3
    },
    loto535: {
        sumRange: { min: 70, max: 130 },
        oddEvenRange: { min: 2, max: 4 },
        highLowRange: { min: 2, max: 4 },
        maxConsecutive: 3,
        
        // Prefer lower numbers
        decadeBias: { '1-10': 1.3, '11-20': 1.0, '21-30': 0.9, '31-35': 0.8 }
    }
};
```

### 6.2 Hybrid Scoring System

Kết hợp nhiều yếu tố:

1. **Base Score** (40%): Tần suất xuất hiện
2. **Overdue Score** (30%): Số kỳ chưa xuất hiện
3. **Trend Score** (15%): Xu hướng gần đây
4. **Pair Score** (10%): Bonus nếu có cặp hay đi cùng
5. **Random Factor** (5%): Đảm bảo tính ngẫu nhiên

### 6.3 Multi-Strategy Generator

```javascript
function generateHybrid(game, history) {
    // 1. Get candidates from each strategy
    const balanced = generateBalanced(game, history);
    const prediction = generatePrediction(game, history);
    const enhanced = generateEnhanced(game, history);
    
    // 2. Score each candidate
    const candidates = [...balanced, ...prediction, ...enhanced];
    
    // 3. Select best combination
    return selectOptimal(candidates, {
        balanceWeight: 0.4,
        predictionWeight: 0.3,
        diversityWeight: 0.2,
        randomWeight: 0.1
    });
}
```

---

## 7. Bộ Số Đề Xuất (Hôm Nay)

> ⚠️ Chỉ mang tính tham khảo, không đảm bảo trúng thưởng

### Mega 6/45
```
Đề xuất 1 (Prediction): [1, 2, 8, 21, 23, 31]
Đề xuất 2 (Balanced):   [3, 12, 24, 30, 37, 43]
```

### Power 6/55
```
Đề xuất 1 (Prediction): [14, 20, 21, 22, 29, 36]
Đề xuất 2 (Balanced):   [8, 17, 28, 35, 44, 52]
```

### Loto 5/35
```
Đề xuất 1 (Prediction): [2, 6, 8, 25, 31]
Đề xuất 2 (Balanced):   [4, 10, 18, 27, 33]
```

---

## 8. Kế Hoạch Triển Khai

### Phase 1: Cập nhật strategies.js
- [ ] Tightening sum ranges based on analysis
- [ ] Add decade balance validation
- [ ] Implement pair preference

### Phase 2: Add Hybrid Strategy
- [ ] Create `strategy=hybrid` endpoint
- [ ] Combine prediction + balanced
- [ ] Add scoring system

### Phase 3: Frontend Integration
- [ ] Show prediction scores
- [ ] Display hot/cold numbers
- [ ] Add "why this number" explanation

---

*Nghiên cứu này được thực hiện dựa trên phân tích thống kê mô tả. Kết quả quá khứ không đảm bảo cho tương lai.*
