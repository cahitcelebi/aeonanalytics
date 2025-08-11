-- Developers Table


CREATE TABLE developers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "companyName" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Games Table
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    "developerId" INT REFERENCES developers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "apiKey" VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(50),
    "gameVersion" VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Players tablosu (Oyun kullanıcıları/oyuncular)
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    "gameId" INT REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    "playerUid" VARCHAR(255) NOT NULL,
    "firstSeenAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "totalSessions" INT DEFAULT 0,
    "totalPlaytimeSeconds" INT DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("gameId", "playerUid") -- Composite unique key
);

-- Devices tablosu (Cihaz bilgileri)
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    "deviceId" VARCHAR(255) NOT NULL,
    "playerId" INT REFERENCES players(id) ON DELETE CASCADE,
    "gameId" INT REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    "osVersion" VARCHAR(50),
    "deviceModel" VARCHAR(100),
    "screenResolution" VARCHAR(50),
    language VARCHAR(10),
    country VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("gameId", "deviceId") -- Composite unique key
);

-- Sessions Table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    "sessionId" VARCHAR(255) UNIQUE NOT NULL,
    "playerId" INT NOT NULL,
    "deviceId" INT NOT NULL,
    "gameId" INT NOT NULL,
    "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endTime" TIMESTAMP WITH TIME ZONE,
    "durationSeconds" INT,
    "gameVersion" VARCHAR(255),
    "timezoneOffsetMinutes" INT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    FOREIGN KEY ("playerId") REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY ("deviceId") REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY ("gameId") REFERENCES games(id) ON DELETE CASCADE
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    "sessionId" INT REFERENCES sessions(id) ON DELETE CASCADE,
    "playerId" INT REFERENCES players(id) ON DELETE CASCADE,
    "gameId" INT REFERENCES games(id) ON DELETE CASCADE,
    "eventName" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    parameters JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Progression tablosu (İlerleme bilgileri)
CREATE TABLE progression (
    id SERIAL PRIMARY KEY,
    "playerId" INT REFERENCES players(id) ON DELETE CASCADE,
    "gameId" INT REFERENCES games(id) ON DELETE CASCADE,
    "levelNumber" INT NOT NULL,
    "levelName" VARCHAR(100),
    "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endTime" TIMESTAMP WITH TIME ZONE,
    "completionStatus" VARCHAR(50),
    score INT,
    stars INT,
    attempts INT DEFAULT 1,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monetization tablosu (Satın alma işlemleri)
CREATE TABLE monetization (
    id SERIAL PRIMARY KEY,
    "transactionId" VARCHAR(255) UNIQUE NOT NULL,
    "playerId" INT REFERENCES players(id) ON DELETE CASCADE,
    "gameId" INT REFERENCES games(id) ON DELETE CASCADE,
    "productId" VARCHAR(100) NOT NULL,
    "productType" VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    platform VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Metrics tablosu
CREATE TABLE daily_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    "gameId" INT REFERENCES games(id) ON DELETE CASCADE,
    "metricName" VARCHAR(100) NOT NULL,
    value FLOAT NOT NULL,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, "gameId", "metricName")
);

-- Player Segments Table
CREATE TABLE IF NOT EXISTS player_segments (
    id SERIAL PRIMARY KEY,
    "gameId" INT REFERENCES games(id),
    "segmentName" VARCHAR(100),
    "segmentCriteria" JSONB,
    "playerCount" INT,
    "createdAt" TIMESTAMP WITH TIME ZONE
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    "gameId" INT REFERENCES games(id),
    "deviceModel" VARCHAR(100),
    "osVersion" VARCHAR(50),
    "avgFps" FLOAT,
    "avgLoadTime" FLOAT,
    "crashCount" INT,
    date DATE,
    "createdAt" TIMESTAMP WITH TIME ZONE
);

-- Indexes (camelCase)
CREATE INDEX IF NOT EXISTS idx_developers_email ON developers(email);
CREATE INDEX IF NOT EXISTS idx_games_developer ON games("developerId");
CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions("playerId");
CREATE INDEX IF NOT EXISTS idx_sessions_game ON sessions("gameId");
CREATE INDEX IF NOT EXISTS idx_sessions_time ON sessions("startTime", "endTime");
CREATE INDEX IF NOT EXISTS idx_events_session ON events("sessionId");
CREATE INDEX IF NOT EXISTS idx_events_game ON events("gameId");
CREATE INDEX IF NOT EXISTS idx_events_player_time ON events("playerId", timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type_time ON events("eventType", timestamp);
CREATE INDEX IF NOT EXISTS idx_player_segments_game ON player_segments("gameId");
CREATE INDEX IF NOT EXISTS idx_performance_metrics_game ON performance_metrics("gameId"); 
CREATE INDEX IF NOT EXISTS idx_players_game ON players("gameId");
CREATE INDEX IF NOT EXISTS idx_devices_game ON devices("gameId");
CREATE INDEX IF NOT EXISTS idx_devices_player ON devices("playerId");
CREATE INDEX IF NOT EXISTS idx_progression_game ON progression("gameId");
CREATE INDEX IF NOT EXISTS idx_progression_player ON progression("playerId");
CREATE INDEX IF NOT EXISTS idx_monetization_game ON monetization("gameId");
CREATE INDEX IF NOT EXISTS idx_monetization_player ON monetization("playerId");
CREATE INDEX IF NOT EXISTS idx_daily_metrics_game ON daily_metrics("gameId"); 
