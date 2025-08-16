# Valifi Platform: Database Schema

This document contains the complete SQL schema for the Valifi platform, designed for a SQLite-compatible database like Turso. It should be used to manually initialize the production database as described in `SETUP.md`.

```sql

-- Users Table: Stores core user information.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    profilePhotoUrl TEXT,
    kycStatus TEXT CHECK(kycStatus IN ('Not Started', 'Pending', 'Approved', 'Rejected', 'Resubmit Required')) DEFAULT 'Not Started',
    kycRejectionReason TEXT,
    isAdmin BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- UserSettings Table: Manages user-specific settings and preferences.
CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    twoFactorEnabled BOOLEAN DEFAULT FALSE,
    twoFactorMethod TEXT CHECK(twoFactorMethod IN ('none', 'email', 'sms', 'authenticator')) DEFAULT 'none',
    twoFactorSecret TEXT, -- Encrypted
    loginAlerts BOOLEAN DEFAULT TRUE,
    preferences TEXT, -- JSON stored as TEXT for currency, language, theme, etc.
    privacy TEXT, -- JSON stored as TEXT for marketing consents
    vaultRecovery TEXT -- Encrypted JSON stored as TEXT for recovery details
);

-- ActiveSessions Table: Tracks active user login sessions for security.
CREATE TABLE IF NOT EXISTS active_sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device TEXT,
    location TEXT,
    ipAddress TEXT,
    lastActive TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_active_sessions_userId ON active_sessions(userId);


-- Investment & Asset Tables
-- =========================

-- Assets Table: A central, polymorphic table for all user-owned assets.
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    type TEXT CHECK(type IN ('Crypto', 'Stock', 'Cash', 'NFT', 'REIT')) NOT NULL,
    balance REAL NOT NULL,
    balanceInEscrow REAL DEFAULT 0.0,
    valueUSD REAL NOT NULL,
    initialInvestment REAL,
    totalEarnings REAL,
    status TEXT CHECK(status IN ('Active', 'Pending', 'Matured', 'Withdrawable', 'Pending Withdrawal', 'Withdrawn', 'Collateralized')),
    maturityDate TIMESTAMP,
    payoutDestination TEXT CHECK(payoutDestination IN ('wallet', 'balance')),
    details TEXT, -- JSON stored as TEXT for type-specific data
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assets_userId ON assets(userId);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- InvestmentLogs Table: Records the history of actions for a specific asset.
CREATE TABLE IF NOT EXISTS investment_logs (
    id TEXT PRIMARY KEY,
    assetId TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action TEXT CHECK(action IN ('Buy', 'Reward', 'Compound', 'Withdrawal', 'Maturity Transfer', 'Stake Withdrawal Request', 'Dividend Payout', 'Sell', 'Stake')) NOT NULL,
    amountUSD REAL NOT NULL,
    status TEXT CHECK(status IN ('Completed', 'Pending')) NOT NULL,
    referenceId TEXT
);
CREATE INDEX IF NOT EXISTS idx_investment_logs_assetId ON investment_logs(assetId);


-- Financial & Transaction Tables
-- ==============================

-- Transactions Table: A global log of all financial movements on the platform.
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    amountUSD REAL NOT NULL,
    status TEXT CHECK(status IN ('Completed', 'Pending', 'Failed')) NOT NULL,
    type TEXT CHECK(type IN ('Deposit', 'Withdrawal', 'Trade', 'Interest', 'Sent', 'Received', 'Reinvestment', 'ROI Payout', 'Maturity', 'P2P', 'Loan Repayment')) NOT NULL,
    txHash TEXT,
    relatedAssetId TEXT REFERENCES assets(id)
);
CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);


-- P2P Exchange Tables
-- ===================

-- PaymentMethods Table: User-defined payment methods for P2P.
CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    methodType TEXT NOT NULL,
    nickname TEXT NOT NULL,
    country TEXT NOT NULL,
    details TEXT NOT NULL -- Encrypted JSON stored as TEXT
);

-- P2POffers Table: User-created offers to buy or sell assets.
CREATE TABLE IF NOT EXISTS p2p_offers (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('BUY', 'SELL')) NOT NULL,
    assetTicker TEXT NOT NULL,
    fiatCurrency TEXT NOT NULL,
    price REAL NOT NULL,
    priceType TEXT DEFAULT 'FIXED',
    floatingMargin REAL,
    availableAmount REAL NOT NULL,
    minOrder REAL NOT NULL,
    maxOrder REAL NOT NULL,
    paymentTimeLimitMinutes INTEGER NOT NULL,
    terms TEXT,
    isActive BOOLEAN DEFAULT TRUE
);

-- P2POrders Table: Represents an active or completed trade between two users.
CREATE TABLE IF NOT EXISTS p2p_orders (
    id TEXT PRIMARY KEY,
    offerId TEXT NOT NULL REFERENCES p2p_offers(id),
    buyerId TEXT NOT NULL REFERENCES users(id),
    sellerId TEXT NOT NULL REFERENCES users(id),
    status TEXT CHECK(status IN ('Pending Payment', 'Payment Sent', 'Escrow Released', 'Completed', 'Cancelled', 'Disputed', 'Under Review', 'Auto-Cancelled')) NOT NULL,
    fiatAmount REAL NOT NULL,
    cryptoAmount REAL NOT NULL,
    paymentMethodDetails TEXT, -- JSON of the selected payment method
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP,
    completedAt TIMESTAMP
);

-- P2PChatMessages Table: Stores messages for a specific P2P order.
CREATE TABLE IF NOT EXISTS p2p_chat_messages (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
    authorId TEXT NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imageUrl TEXT
);

-- Disputes Table: Manages disputes raised for P2P orders.
CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL UNIQUE REFERENCES p2p_orders(id) ON DELETE CASCADE,
    raisedById TEXT NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    status TEXT CHECK(status IN ('Open', 'Under Review', 'Resolved')) NOT NULL,
    resolution TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Feature-Specific Tables
-- =======================

-- LoanApplications Table: Stores user loan applications.
CREATE TABLE IF NOT EXISTS loan_applications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    term INTEGER NOT NULL,
    interestRate REAL NOT NULL,
    collateralAssetId TEXT NOT NULL REFERENCES assets(id),
    status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Repaid', 'Defaulted', 'Active', 'Late')) NOT NULL,
    details TEXT, -- JSON stored as TEXT for repayment progress, dates, etc.
    reason TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ValifiCards Table: Stores details of user-issued cards.
CREATE TABLE IF NOT EXISTS valifi_cards (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK(status IN ('Not Applied', 'Pending Approval', 'Approved')) NOT NULL,
    type TEXT CHECK(type IN ('Virtual', 'Physical')) NOT NULL,
    currency TEXT NOT NULL,
    theme TEXT NOT NULL,
    cardNumberHash TEXT,
    expiry TEXT, -- Encrypted
    cvvHash TEXT,
    isFrozen BOOLEAN NOT NULL DEFAULT FALSE
);

-- BankAccounts Table: Stores linked bank accounts for fiat movements.
CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    countryCode TEXT NOT NULL,
    nickname TEXT NOT NULL,
    accountDisplay TEXT NOT NULL, -- e.g., "Chase (...1234)"
    details TEXT NOT NULL, -- Encrypted JSON stored as TEXT
    status TEXT CHECK(status IN ('Pending', 'Verified', 'Rejected')) NOT NULL,
    rejectionReason TEXT
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isRead BOOLEAN DEFAULT FALSE,
    link TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);

-- NewsItems Table (Global)
CREATE TABLE IF NOT EXISTS news_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REITs Table (Admin-managed)
CREATE TABLE IF NOT EXISTS reits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    totalShares REAL,
    pricePerShare REAL,
    imageUrl TEXT,
    monthlyDividend REAL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WatchedWallets Table (Admin)
CREATE TABLE IF NOT EXISTS watched_wallets (
    id TEXT PRIMARY KEY,
    hash TEXT NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CareerApplications Table (Public submissions)
CREATE TABLE IF NOT EXISTS career_applications (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    expertise TEXT,
    coverLetter TEXT,
    resumeFileName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
