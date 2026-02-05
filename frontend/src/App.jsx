import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GameCard from './components/GameCard';
import Ball from './components/Ball';
import LotteryMachine from './components/LotteryMachine';
import { fetchGames, generateNumbers, saveNumbers, fetchSavedNumbers, checkHistory, fetchHistory, triggerCrawl, deleteNumbers } from './api';
import { useUserEntropy } from './hooks/useUserEntropy';

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [error, setError] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [strategy, setStrategy] = useState('random'); // 'random' | 'smart' | 'prediction' | 'enhanced'
  const [showSimulation, setShowSimulation] = useState(false);
  const [historyMatch, setHistoryMatch] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Collect user entropy in the background
  useUserEntropy(true);

  useEffect(() => {
    async function loadGames() {
      try {
        const data = await fetchGames();
        setGames(data);
        if (data.length > 0) {
          setSelectedGame(data[0].id);
          // Load saved items for the first game initially
          loadSavedItems(data[0].id);
        }
      } catch (err) {
        console.error("Error loading games:", err);
        setError("Không thể tải danh sách game.");
      }
    }
    loadGames();
    loadHistoryData(); // Load history data on initial mount
  }, []);

  // When selectedGame changes: Clear result & Load relevant saved items & History
  useEffect(() => {
    if (selectedGame) {
      setResult(null); // Clear previous result
      setHistoryMatch(null); // Clear history match
      loadSavedItems(selectedGame);
      loadHistoryData(selectedGame); // Load history for this game
    }
  }, [selectedGame]);

  async function loadSavedItems(gameId) {
    const items = await fetchSavedNumbers(gameId);
    setSavedItems(items);
  }

  async function loadHistoryData(gameId) {
    const gid = gameId || selectedGame;
    if (!gid) return;
    try {
      const data = await fetchHistory(gid);
      setHistoryData(data);
    } catch (err) {
      console.error("Error fetching history data:", err);
      // Optionally set an error state for history data specifically
    }
  }

  const handleCrawl = async () => {
    setCrawling(true);
    setError(null);
    try {
      const res = await triggerCrawl();
      const stats = res.stats;
      let msg = "Đã cập nhật dữ liệu thành công!";
      if (stats) {
        msg += `\n- Mới thêm: ${stats.newItems}`;
        if (stats.errors && stats.errors.length > 0) {
          msg += `\n- Lỗi: ${stats.errors.length} (Xem console)`;
        }
      }
      alert(msg);
      loadHistoryData(); // Refresh table
    } catch (err) {
      alert("Lỗi khi cập nhật dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setCrawling(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedGame) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setHistoryMatch(null);

    // Artificial delay for UX (300-500ms)
    const delayPromise = new Promise(resolve => setTimeout(resolve, 500));

    try {
      const [data] = await Promise.all([generateNumbers(selectedGame, false, strategy), delayPromise]);
      setResult(data);

      // Check history ONLY for standard games (Mega/Power) that have single number array
      if (data.type !== 'compound') {
        const historyCheck = await checkHistory(selectedGame, data.numbers);
        if (historyCheck && historyCheck.totalDraws > 0) {
          setHistoryMatch(historyCheck);
        }
      } else if (data.type === 'compound' && data.numbers[0]) {
        // For compound (Power/Loto), check the main set (numbers[0])
        const historyCheck = await checkHistory(selectedGame, data.numbers[0]);
        if (historyCheck && historyCheck.totalDraws > 0) {
          setHistoryMatch(historyCheck);
        }
      }

    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await saveNumbers({
        game: selectedGame, // Use ID for consistency with filter
        numbers: result.numbers,
        type: result.type,
        is_smart: isSmartMode
      });
      alert("Đã lưu bộ số vào SQLite DB!");
      loadSavedItems(selectedGame); // Reload list for current game
    } catch (err) {
      alert("Lỗi khi lưu bộ số");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa bộ số này?")) return;
    try {
      await deleteNumbers(id);
      loadSavedItems(selectedGame); // Reload list after delete
    } catch (err) {
      alert("Lỗi khi xóa bộ số");
    }
  };

  const handleCopy = () => {
    if (!result) return;
    // Format text based on type
    let text = `${result.game}: `;
    if (result.type === 'compound') {
      text += `[${result.numbers[0].join(', ')}] + [${result.numbers[1].join(', ')}]`;
    } else {
      text += result.numbers.join(', ');
    }
    navigator.clipboard.writeText(text);
    alert("Đã sao chép vào clipboard!");
  };

  // Helper to determine ball type based on game id
  const getBallType = (gameId) => {
    // Configuration says max3d is 'digit'
    if (gameId === 'max3d') return 'digit';
    return 'matrix';
  };

  return (
    <div id="app">
      <Header />

      <main>
        {/* Left Sidebar: History */}
        <div className="history-sidebar" style={{ background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📋 Lịch sử KQXS</h3>
            <button
              onClick={handleCrawl}
              disabled={crawling}
              title="Cập nhật dữ liệu từ MinhChinh"
              style={{
                background: 'none',
                border: 'none',
                cursor: crawling ? 'not-allowed' : 'pointer',
                fontSize: '1.2rem'
              }}
            >
              {crawling ? '⏳' : '🔄'}
            </button>
          </div>

          <div className="history-list" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ngày</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Bộ số</th>
                </tr>
              </thead>
              <tbody>
                {historyData.filter(item => item.game === selectedGame).length > 0 ? (
                  historyData
                    .filter(item => item.game === selectedGame)
                    .map((item, idx) => {
                      // Determine numbers to highlight: compare against the CURRENT generated result
                      const highlightNumbers = result
                        ? (result.type === 'compound' ? result.numbers.flat() : result.numbers)
                        : [];

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '0.5rem 0.2rem', color: '#666', whiteSpace: 'nowrap' }}>
                            {selectedGame === 'keno' && item.draw_date.includes(' ') ? (
                              <>
                                <div style={{ fontSize: '0.85rem' }}>{item.draw_date.split(' ')[0]}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{item.draw_date.split(' ')[1]}</div>
                              </>
                            ) : (
                              item.draw_date.split(' ')[0]
                            )}
                          </td>
                          <td style={{ padding: '0.5rem 0.2rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                              {Array.isArray(item.numbers) && item.numbers.map((n, i) => {
                                let isSpecial = false;
                                let isGolden = false;

                                // Power 6/55: 7th number (index 6) is Special (red)
                                if (selectedGame === 'power655' && i === 6) {
                                  isSpecial = true;
                                }
                                // Loto 5/35: 6th number (index 5) is Golden Ball (gold)
                                if (selectedGame === 'loto535' && i === 5) {
                                  isGolden = true;
                                }

                                const isMatch = highlightNumbers.includes(n);

                                // Determine background color
                                let bgColor = '#eee';
                                if (isSpecial) bgColor = '#ef4444';
                                else if (isGolden) bgColor = isMatch ? '#fbbf24' : '#fde68a'; // Brighter gold if match
                                else if (isMatch) bgColor = '#ffeba7';

                                // Determine text color
                                let txtColor = '#333';
                                if (isSpecial) txtColor = '#fff';
                                else if (isGolden) txtColor = '#92400e';
                                else if (isMatch) txtColor = '#d97706';

                                return (
                                  <span key={i} style={{
                                    display: 'inline-block',
                                    width: '20px',
                                    height: '20px',
                                    textAlign: 'center',
                                    lineHeight: '20px',
                                    borderRadius: '50%',
                                    background: bgColor,
                                    color: txtColor,
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    marginRight: ((selectedGame === 'power655' && i === 5) || (selectedGame === 'loto535' && i === 4)) ? '4px' : '0',
                                    border: isGolden ? '2px solid #d97706' : 'none'
                                  }}>
                                    {n}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '1rem', color: '#999' }}>
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Content: Game Selector + Generator */}
        <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className="game-selector">
            {games.map(game => (
              <GameCard
                key={game.id}
                id={game.id}
                name={game.name}
                isActive={selectedGame === game.id}
                onClick={setSelectedGame}
              />
            ))}
          </section>

          <section className="generator">
            {selectedGame && (
              <div className="controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div className="strategy-selector" style={{ width: '100%', maxWidth: '320px' }}>
                  <label htmlFor="strategy" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Chế độ tạo số:</label>
                  <select
                    id="strategy"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '1rem',
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="random">🎲 Ngẫu nhiên (Mô phỏng lồng cầu)</option>
                    <option value="smart">🧠 Thông minh (Loại trừ số xấu)</option>
                    <option value="prediction">🔮 Dự đoán (Phân tích dữ liệu)</option>
                    <option value="enhanced">⚡ Nâng cao (Random.org + Multi-source)</option>
                  </select>
                </div>

                {/* Simulation Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="simToggle"
                    checked={showSimulation}
                    onChange={(e) => setShowSimulation(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="simToggle" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                    🎰 Hiển thị mô phỏng máy quay số
                  </label>
                </div>

                <button
                  className="primary-btn"
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{ width: '100%', maxWidth: '320px' }}
                >
                  {loading ? 'Đang xử lý...' : 'Tạo bộ số ngẫu nhiên'}
                </button>
              </div>
            )}

            {error && <div style={{ color: 'red' }}>{error}</div>}

            {historyMatch && (
              <div style={{ background: '#f0f9ff', color: '#0369a1', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #bae6fd' }}>
                <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>📊 Phân tích Lịch sử (Backtest)</h4>
                <div>
                  <strong>
                    {['max3d', 'max3dpro'].includes(selectedGame) ? "Tỉ lệ xuất hiện:" :
                      selectedGame === 'loto535' ? "Tỉ lệ trúng (2+ số):" :
                        `Tỉ lệ trúng (${historyMatch.minMatchesForWin || 3}+ số):`}
                  </strong>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: Number(historyMatch.winRate || 0) > 0 ? '#16a34a' : 'inherit', marginLeft: '0.5rem' }}>
                    {historyMatch.winRate || 0}%
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}> ({historyMatch.wins || 0}/{historyMatch.totalDraws || 0} kỳ)</span>
                </div>

                {historyMatch.matchCounts && Object.keys(historyMatch.matchCounts).length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <strong>Chi tiết trùng khớp:</strong>
                    <ul style={{ margin: '0.3rem 0', paddingLeft: '1.2rem' }}>
                      {Object.entries(historyMatch.matchCounts)
                        .sort((a, b) => b[0] - a[0]) // Sort by match count desc
                        .map(([matches, count]) => (
                          <li key={matches}>
                            {['max3d', 'max3dpro'].includes(selectedGame) ?
                              `Xuất hiện ${matches} số:` :
                              `Trùng ${matches} số:`} {count} lần
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Handle both old (flat) and new (nested bestMatch) formats for backward compatibility */}
                {(historyMatch.bestMatch || (historyMatch.drawDate ? historyMatch : null)) && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', borderTop: '1px dashed #bae6fd', paddingTop: '0.5rem' }}>
                    <strong>Kỳ trùng nhiều nhất:</strong> Ngày {(historyMatch.bestMatch || historyMatch).drawDate} <span style={{ color: '#555', fontStyle: 'italic' }}>[{(historyMatch.bestMatch || historyMatch).numbers.join(', ')}]</span>
                    (Matches: {(historyMatch.bestMatch || historyMatch).matches})
                  </div>
                )}
              </div>
            )}

            {result && (
              <div className="results">
                {/* Physics Simulation */}
                {showSimulation && selectedGame && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <LotteryMachine
                      numbers={result.type === 'compound' ? result.numbers.flat() : result.numbers}
                      min={1}
                      max={selectedGame === 'mega645' ? 45 : selectedGame === 'power655' ? 55 : selectedGame === 'loto535' ? 35 : 45}
                      pickCount={result.type === 'compound' ? result.numbers.flat().length : result.numbers.length}
                    />
                  </div>
                )}
                <div className="balls-container">
                  {result.type === 'compound' ? (
                    // Loto 5/35: needs to separate 5 balls and 1 ball
                    // result.numbers will be [[1,2,3,4,5], [9]]
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                        {result.numbers[0].map((num, i) => (
                          <Ball
                            key={`part1-${i}`}
                            number={num}
                            type="matrix"
                            highlight={(historyMatch?.bestMatch?.numbers || historyMatch?.numbers || []).includes(num)}
                          />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', borderTop: '1px dashed #ccc', paddingTop: '1rem', width: '100%' }}>
                        <span style={{ alignSelf: 'center', fontWeight: 'bold', color: '#888' }}>Số cầu vàng: </span>
                        {result.numbers[1].map((num, i) => (
                          <Ball
                            key={`part2-${i}`}
                            number={num}
                            type="matrix"
                            highlight={(historyMatch?.bestMatch?.numbers || historyMatch?.numbers || []).includes(num)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    result.numbers.map((num, index) => (
                      <Ball
                        key={`${selectedGame}-${index}`}
                        number={num}
                        type={getBallType(selectedGame)}
                        highlight={(historyMatch?.bestMatch?.numbers || historyMatch?.numbers || []).includes(num)}
                      />
                    ))
                  )}
                </div>
                <div className="result-note">
                  Bộ số được sinh ngẫu nhiên, không dựa trên kết quả trước
                </div>
                <div className="actions">
                  <button className="action-btn" onClick={handleCopy}>Sao chép</button>
                  <button className="action-btn" onClick={handleSave}>Lưu tạm</button>
                </div>
              </div>
            )}
          </section>

          {/* Saved Items Section */}
          {savedItems.length > 0 && (
            <section className="saved-items" style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#555' }}>Bộ số đã lưu (Gần nhất)</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {savedItems.map(item => {
                  const gameInfo = games.find(g => g.id === item.game);
                  const displayName = gameInfo ? gameInfo.name : item.game;

                  return (
                    <li key={item.id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary-red)', minWidth: '80px' }}>{displayName}</span>
                      <span style={{ flex: 1 }}>
                        {item.type === 'compound' ? (
                          `${item.numbers[0].join(', ')} | ${item.numbers[1]}`
                        ) : (
                          item.numbers.join(', ')
                        )}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontSize: '1rem',
                          borderRadius: '4px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#fee2e2'}
                        onMouseOut={(e) => e.target.style.background = 'transparent'}
                        title="Xóa bộ số này"
                      >
                        🗑️
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
