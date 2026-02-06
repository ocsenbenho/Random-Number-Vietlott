# Quick Reference - Vietlot RNG

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/games` | List games |
| GET | `/generate?game=xxx&strategy=xxx` | Generate numbers |
| GET | `/history?game=xxx` | Draw history |
| POST | `/check-history` | Backtest |
| POST | `/save` | Save numbers |
| GET | `/saved` | Get saved |
| DELETE | `/saved/:id` | Delete saved |
| POST | `/crawl` | Update data |

## Strategies

| Strategy | Description |
|----------|-------------|
| `random` | Pure random (Fisher-Yates) |
| `smart` | Exclude bad numbers |
| `prediction` | History-based weights |
| `enhanced` | Random.org + entropy |
| `balanced` | Odd/Even, High/Low, Sum filter |

## Game Configs

| Game | Range | Count | Type |
|------|-------|-------|------|
| mega645 | 1-45 | 6 | matrix |
| power655 | 1-55 | 6+1 | matrix |
| loto535 | 1-35, 1-12 | 5+1 | compound |
| max3d | 0-9 | 3 | digit |
| keno | 1-80 | 10 | matrix |

## Balanced Strategy Constraints

| Constraint | Mega 6/45 | Power 6/55 |
|------------|-----------|------------|
| Odd/Even | 2-4 each | 2-4 each |
| High/Low | 2-4 each | 2-4 each |
| Sum Range | 100-190 | 120-220 |
| Consecutive | Max 3 | Max 3 |

## Files

```
backend/
├── server.js          # Main server
├── utils/
│   ├── rng.js         # Random generators
│   ├── analyzer.js    # History analysis
│   ├── strategies.js  # Balanced strategy
│   ├── entropy.js     # Entropy pool
│   ├── crawler.js     # Data updater
│   └── db.js          # Database ops
├── config/            # Game configs (JSON)
└── vietlott.db        # SQLite database

frontend/
├── src/
│   ├── App.jsx        # Main component
│   └── components/    # UI components
```

## Quick Commands

```bash
# Start backend
cd backend && node server.js

# Start frontend
cd frontend && npm run dev

# Run migration
node backend/scripts/migrate_to_neo4j.js
```
