import React, { useState, useEffect } from 'react';
import './StatisticsDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const StatisticsDashboard = ({ game }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (game) {
            fetchStatistics();
        }
    }, [game]);

    const fetchStatistics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/statistics?game=${game}`);
            const data = await response.json();

            if (data.success) {
                setStats(data);
            } else {
                setError(data.error || 'Failed to load statistics');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="stats-loading">⏳ Đang tải thống kê...</div>;
    if (error) return <div className="stats-error">⚠️ Lỗi: {error}</div>;
    if (!stats || stats.insufficientData) return <div className="stats-empty">Chưa đủ dữ liệu phân tích</div>;

    return (
        <div className="stats-dashboard">
            <h3>📊 Thống Kê Chi Tiết: {game.toUpperCase()}</h3>
            <p className="stats-meta">Dữ liệu từ {stats.totalDraws} kỳ quay gần nhất</p>

            <div className="stats-grid">
                {/* 1. Hot Numbers */}
                <div className="stats-card hot-cold">
                    <h4>🔥 Số Nóng (Về nhiều)</h4>
                    <div className="number-grid">
                        {stats.frequency.hot.map((item, i) => (
                            <div key={item.number} className="stat-item hot">
                                <span className="stat-num">{item.number}</span>
                                <span className="stat-val">{item.count} lần</span>
                                <div className="stat-bar" style={{ width: `${Math.min(item.percentage * 5, 100)}%` }}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Cold Numbers */}
                <div className="stats-card hot-cold">
                    <h4>❄️ Số Lạnh (Về ít)</h4>
                    <div className="number-grid">
                        {stats.frequency.cold.map((item, i) => (
                            <div key={item.number} className="stat-item cold">
                                <span className="stat-num">{item.number}</span>
                                <span className="stat-val">{item.count} lần</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Overdue Numbers */}
                <div className="stats-card overdue">
                    <h4>⏱️ Lâu chưa về (Top 10)</h4>
                    <ul className="stat-list">
                        {stats.gaps.map((item) => (
                            <li key={item.number}>
                                <strong>Số {item.number}</strong>
                                <span>{item.gap} kỳ</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 4. Sum Analysis */}
                <div className="stats-card sum-analysis">
                    <h4>➕ Tổng (Sum)</h4>
                    <div className="sum-summary">
                        <div>Avg: <strong>{stats.sum.average}</strong></div>
                        <div>Min: {stats.sum.min}</div>
                        <div>Max: {stats.sum.max}</div>
                    </div>
                    <div className="chart-container">
                        {stats.sum.ranges.map(r => (
                            <div key={r.range} className="chart-row">
                                <span className="chart-label">{r.range}</span>
                                <div className="chart-bar-bg">
                                    <div
                                        className="chart-bar-fill"
                                        style={{ width: `${(r.count / stats.totalDraws) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="chart-val">{r.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. Odd/Even */}
                <div className="stats-card odd-even">
                    <h4>🔢 Chẵn / Lẻ</h4>
                    <div className="chart-container">
                        {stats.oddEven.map(oe => (
                            <div key={oe.pattern} className="chart-row">
                                <span className="chart-label">{oe.pattern}</span>
                                <div className="chart-bar-bg">
                                    <div
                                        className="chart-bar-fill odd"
                                        style={{ width: `${oe.percentage}%` }}
                                    ></div>
                                </div>
                                <span className="chart-val">{oe.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. Pairs */}
                <div className="stats-card pairs">
                    <h4>👫 Cặp hay đi cùng</h4>
                    <div className="tags-container">
                        {stats.pairs.slice(0, 8).map(p => (
                            <span key={p.pair} className="pair-tag">
                                {p.pair} <small>({p.count})</small>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsDashboard;
