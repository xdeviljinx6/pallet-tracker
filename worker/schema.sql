CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT,
  item_code TEXT,
  pallets TEXT,
  gross_wt REAL,
  pallet_wt REAL,
  plastic_rate REAL,
  empty_plastic REAL,
  net_wt REAL,
  total_bundles REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
