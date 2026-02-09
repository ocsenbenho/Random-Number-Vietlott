import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            marginTop: '3rem',
            padding: '2rem 1rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.85rem'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h4 style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#475569',
                    textTransform: 'uppercase'
                }}>
                    ⚠️ Miễn Trừ Trách Nhiệm (Disclaimer)
                </h4>
                <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
                    Ứng dụng này được phát triển với mục đích duy nhất là <strong>giải trí và nghiên cứu thống kê</strong>.
                    Các bộ số được tạo ra dựa trên các thuật toán ngẫu nhiên máy tính hoặc phân tích dữ liệu quá khứ,
                    và <strong>hoàn toàn không đảm bảo</strong> khả năng trúng thưởng.
                </p>
                <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
                    Chúng tôi không khuyến khích hành vi đánh bạc, cá cược trái phép.
                    Người sử dụng tự chịu hoàn toàn trách nhiệm về các quyết định tài chính và hành vi cá nhân của mình.
                    Chúng tôi không chịu trách nhiệm trước pháp luật về bất kỳ thiệt hại, mất mát nào phát sinh từ việc sử dụng các thông tin trong ứng dụng này.
                </p>
                <p style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                    Vui lòng mua vé số tại các đại lý chính thức được nhà nước cấp phép (Vietlott) để Ích Nước - Lợi Nhà.
                </p>
                <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                    &copy; {new Date().getFullYear()} Lottery Research Tool. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
