-- Developers tablosu için örnek veri (bcrypt hash for '123456' generated in backend container)
INSERT INTO developers (id, username, email, "password", "companyName", "createdAt", "updatedAt")
VALUES (1, 'testdev', 'test@dev.com', '$2a$10$06qYwvo2WYYCzS0QxTfCruCtYD37z7QCAvA3VKUuphzSYUCvl8Be.', 'Test Company', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET username = EXCLUDED.username,
    email = EXCLUDED.email,
    "password" = EXCLUDED."password",
    "companyName" = EXCLUDED."companyName",
    "updatedAt" = NOW();

-- Games tablosu için iki oyun
INSERT INTO games (id, "developerId", name, description, "apiKey", platform, "gameVersion", "createdAt", "updatedAt")
VALUES (1, 1, 'First Game', 'A test game', 'sk-' || gen_random_uuid(), 'iOS', '1.0.0', NOW(), NOW()),
       (2, 1, 'Second Game', 'Another test game', 'sk-' || gen_random_uuid(), 'Android', '2.1.0', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Players tablosu için gerçekçi veri
INSERT INTO players (id, "gameId", "playerUid", "firstSeenAt", "lastSeenAt", "totalSessions", "totalPlaytimeSeconds", "createdAt")
VALUES 
(1, 1, 'g1_player1', '2025-05-01', '2025-05-31', 4, 7200, '2025-05-16 14:05:54.998'),
(2, 1, 'g1_player2', '2025-05-01', '2025-05-02', 2, 3600, '2025-05-16 14:05:54.998'),
(3, 1, 'g1_player3', '2025-05-01', '2025-05-01', 1, 1800, '2025-05-16 14:05:54.998'),
(4, 1, 'g1_player4', '2025-05-05', '2025-05-06', 2, 3600, '2025-05-16 14:05:54.998'),
(5, 1, 'g1_player5', '2025-05-10', '2025-05-17', 3, 5400, '2025-05-16 14:05:54.998'),
(6, 2, 'g2_player1', '2025-05-01', '2025-05-31', 4, 7200, '2025-05-16 14:05:54.998'),
(7, 2, 'g2_player2', '2025-05-01', '2025-05-02', 2, 3600, '2025-05-16 14:05:54.998'),
(8, 2, 'g2_player3', '2025-05-01', '2025-05-01', 1, 1800, '2025-05-16 14:05:54.998'),
(9, 2, 'g2_player4', '2025-05-05', '2025-05-06', 2, 3600, '2025-05-16 14:05:54.998'),
(10, 2, 'g2_player5', '2025-05-10', '2025-05-17', 3, 5400, '2025-05-16 14:05:54.998'),
(11, 2, 'g2_player6', '2025-05-05', '2025-05-06', 2, 3600, '2025-05-16 14:05:54.998'),
(12, 2, 'g2_player7', '2025-05-06', '2025-05-06', 1, 1800, '2025-05-16 14:05:54.998'),
(13, 2, 'g2_player8', '2025-05-06', '2025-05-06', 1, 1200, '2025-05-16 14:05:54.998'),
(200, 2, 'g2_dummy1', '2025-03-01', '2025-03-01', 1, 1800, '2025-03-01'),
(201, 2, 'g2_dummy2', '2025-03-15', '2025-03-15', 1, 1800, '2025-03-15'),
(202, 2, 'g2_dummy3', '2025-04-01', '2025-04-01', 1, 1800, '2025-04-01'),
(203, 2, 'g2_dummy4', '2025-04-15', '2025-04-15', 1, 1800, '2025-04-15'),
(204, 2, 'g2_dummy5', '2025-05-01', '2025-05-01', 1, 1800, '2025-05-01'),
(205, 2, 'g2_dummy6', '2025-05-13', '2025-05-13', 1, 1800, '2025-05-13'),
(206, 2, 'g2_dummy7', '2025-05-18', '2025-05-18', 1, 1800, '2025-05-18'),
(207, 2, 'g2_dummy8', '2025-05-19', '2025-05-19', 1, 1800, '2025-05-19'),
(208, 2, 'g2_dummy9', '2025-05-20', '2025-05-20', 1, 1800, '2025-05-20')
ON CONFLICT (id) DO NOTHING;

-- Devices tablosu (her iki oyun için)
INSERT INTO devices (id, "deviceId", "playerId", "gameId", platform, "osVersion", "deviceModel", "screenResolution", language, country, "createdAt")
VALUES
(1, 'dev1', 1, 1, 'Android', '10', 'Samsung S20', '1080x2400', 'en', 'US', '2025-05-16 14:05:54.998'),
(2, 'dev2', 2, 1, 'Android', '11', 'Pixel 5', '1080x2340', 'fr', 'FR', '2025-05-16 14:05:54.998'),
(3, 'dev3', 3, 1, 'Android', '9', 'OnePlus 7', '1080x2340', 'de', 'DE', '2025-05-16 14:05:54.998'),
(4, 'dev4', 4, 1, 'Android', '12', 'Xiaomi Mi 10', '1080x2340', 'es', 'ES', '2025-05-16 14:05:54.998'),
(5, 'dev5', 5, 1, 'Android', '13', 'Huawei P30', '1080x2340', 'tr', 'TR', '2025-05-16 14:05:54.998'),
(6, 'dev6', 6, 2, 'iOS', '15', 'iPhone 13', '1170x2532', 'en', 'US', '2025-05-16 14:05:54.998'),
(7, 'dev7', 7, 2, 'iOS', '16', 'iPhone 14', '1179x2556', 'fr', 'FR', '2025-05-16 14:05:54.998'),
(8, 'dev8', 8, 2, 'iOS', '14', 'iPhone 12', '1170x2532', 'de', 'DE', '2025-05-16 14:05:54.998'),
(9, 'dev9', 9, 2, 'iOS', '13', 'iPhone 11', '828x1792', 'es', 'ES', '2025-05-16 14:05:54.998'),
(10, 'dev10', 10, 2, 'iOS', '12', 'iPhone XR', '828x1792', 'tr', 'TR', '2025-05-16 14:05:54.998'),
(200, 'dev200', 200, 2, 'iOS', '15', 'iPhone 13', '1170x2532', 'en', 'US', '2025-03-01'),
(201, 'dev201', 201, 2, 'iOS', '15', 'iPhone 13', '1170x2532', 'en', 'US', '2025-03-15'),
(202, 'dev202', 202, 2, 'iOS', '15', 'iPhone 13', '1170x2532', 'en', 'US', '2025-04-01'),
(203, 'dev203', 203, 2, 'iOS', '15', 'iPhone 13', '1170x2532', 'en', 'US', '2025-04-15'),
(204, 'dev204', 204, 2, 'iOS', '15', 'iPhone 13', '1170x2532', 'en', 'US', '2025-05-01'),
(205, 'dev205', 205, 2, 'iOS', '15', 'iPhone 13', '1170x2532', 'en', 'US', '2025-05-13'),
(206, 'dev206', 206, 2, 'iOS', '15', 'iPhone 13', '1170x2532', 'en', 'US', '2025-05-18'),
(207, 'dev207', 207, 2, 'iOS', '15', 'iPhone 13', '1170x2532', 'en', 'US', '2025-05-19'),
(208, 'dev208', 208, 2, 'iOS', '15', 'iPhone 13', '1170x2532', 'en', 'US', '2025-05-20')
ON CONFLICT (id) DO NOTHING;

-- Sessions tablosu için gerçekçi veri (retention için tutarlı)
INSERT INTO sessions (id, "sessionId", "playerId", "deviceId", "gameId", "startTime", "endTime", "durationSeconds", "gameVersion", "timezoneOffsetMinutes", "createdAt", "updatedAt")
VALUES 
-- Player 1 (45 günlük kullanıcı, düzenli oynuyor)
(1, 'g1_sess1', 1, 1, 1, '2025-05-01 10:00', '2025-05-01 11:00', 3600, '1.0.0', 180, '2025-05-01 12:00:00', '2025-05-01 12:00:00'),
(2, 'g1_sess2', 1, 1, 1, '2025-05-02 10:00', '2025-05-02 11:00', 3600, '1.0.0', 180, '2025-05-02 12:00:00', '2025-05-02 12:00:00'),
(3, 'g1_sess3', 1, 1, 1, '2025-05-08 10:00', '2025-05-08 11:00', 3600, '1.0.0', 180, '2025-05-08 12:00:00', '2025-05-08 12:00:00'),
(4, 'g1_sess4', 1, 1, 1, '2025-05-31 10:00', '2025-05-31 11:00', 3600, '1.0.0', 180, '2025-05-31 12:00:00', '2025-05-31 12:00:00'),

-- Player 2 (40 günlük kullanıcı, düzenli oynuyor)
(5, 'g1_sess5', 2, 2, 1, '2025-05-01 12:00', '2025-05-01 13:00', 3600, '1.0.0', 180, '2025-05-01 14:00:00', '2025-05-01 14:00:00'),
(6, 'g1_sess6', 2, 2, 1, '2025-05-02 12:00', '2025-05-02 13:00', 3600, '1.0.0', 180, '2025-05-02 14:00:00', '2025-05-02 14:00:00'),
(7, 'g1_sess7', 3, 3, 1, '2025-05-01 14:00', '2025-05-01 14:30', 1800, '1.0.0', 180, '2025-05-01 15:00:00', '2025-05-01 15:00:00'),

-- Player 3 (35 günlük kullanıcı, ara sıra oynuyor)
(8, 'g1_sess8', 4, 4, 1, '2025-05-05 10:00', '2025-05-05 11:00', 3600, '1.0.0', 180, '2025-05-05 12:00:00', '2025-05-05 12:00:00'),
(9, 'g1_sess9', 4, 4, 1, '2025-05-06 10:00', '2025-05-06 11:00', 3600, '1.0.0', 180, '2025-05-06 12:00:00', '2025-05-06 12:00:00'),

-- Player 4 (30 günlük kullanıcı, yeni başlayan)
(10, 'g1_sess10', 5, 5, 1, '2025-05-10 10:00', '2025-05-10 11:00', 3600, '1.0.0', 180, '2025-05-10 12:00:00', '2025-05-10 12:00:00'),
(11, 'g1_sess11', 5, 5, 1, '2025-05-11 10:00', '2025-05-11 11:00', 3600, '1.0.0', 180, '2025-05-11 12:00:00', '2025-05-11 12:00:00'),
(12, 'g1_sess12', 5, 5, 1, '2025-05-17 10:00', '2025-05-17 11:00', 3600, '1.0.0', 180, '2025-05-17 12:00:00', '2025-05-17 12:00:00'),

-- Player 5 (25 günlük kullanıcı, ara sıra oynuyor)
(13, 'g2_sess1', 6, 6, 2, '2025-05-01 10:00', '2025-05-01 11:00', 3600, '1.0.0', 180, '2025-05-01 12:00:00', '2025-05-01 12:00:00'),
(14, 'g2_sess2', 6, 6, 2, '2025-05-02 10:00', '2025-05-02 11:00', 3600, '1.0.0', 180, '2025-05-02 12:00:00', '2025-05-02 12:00:00'),
(15, 'g2_sess3', 6, 6, 2, '2025-05-08 10:00', '2025-05-08 11:00', 3600, '1.0.0', 180, '2025-05-08 12:00:00', '2025-05-08 12:00:00'),
(16, 'g2_sess4', 6, 6, 2, '2025-05-31 10:00', '2025-05-31 11:00', 3600, '1.0.0', 180, '2025-05-31 12:00:00', '2025-05-31 12:00:00'),
(17, 'g2_sess5', 7, 7, 2, '2025-05-01 12:00', '2025-05-01 13:00', 3600, '1.0.0', 180, '2025-05-01 14:00:00', '2025-05-01 14:00:00'),
(18, 'g2_sess6', 7, 7, 2, '2025-05-02 12:00', '2025-05-02 13:00', 3600, '1.0.0', 180, '2025-05-02 14:00:00', '2025-05-02 14:00:00'),
(19, 'g2_sess7', 8, 8, 2, '2025-05-01 14:00', '2025-05-01 14:30', 1800, '1.0.0', 180, '2025-05-01 15:00:00', '2025-05-01 15:00:00'),
(20, 'g2_sess8', 9, 9, 2, '2025-05-05 10:00', '2025-05-05 11:00', 3600, '1.0.0', 180, '2025-05-05 12:00:00', '2025-05-05 12:00:00'),
(21, 'g2_sess9', 9, 9, 2, '2025-05-06 10:00', '2025-05-06 11:00', 3600, '1.0.0', 180, '2025-05-06 12:00:00', '2025-05-06 12:00:00'),
(22, 'g2_sess10', 10, 10, 2, '2025-05-10 10:00', '2025-05-10 11:00', 3600, '1.0.0', 180, '2025-05-10 12:00:00', '2025-05-10 12:00:00'),
(23, 'g2_sess11', 10, 10, 2, '2025-05-11 10:00', '2025-05-11 11:00', 3600, '1.0.0', 180, '2025-05-11 12:00:00', '2025-05-11 12:00:00'),
(24, 'g2_sess12', 10, 10, 2, '2025-05-17 10:00', '2025-05-17 11:00', 3600, '1.0.0', 180, '2025-05-17 12:00:00', '2025-05-17 12:00:00'),
(200, 'g2_sess200', 200, 6, 2, '2025-03-01 10:00', '2025-03-01 10:30', 1800, '2.1.0', 180, '2025-03-01', '2025-03-01'),
(201, 'g2_sess201', 201, 6, 2, '2025-03-15 10:00', '2025-03-15 10:30', 1800, '2.1.0', 180, '2025-03-15', '2025-03-15'),
(202, 'g2_sess202', 202, 6, 2, '2025-04-01 10:00', '2025-04-01 10:30', 1800, '2.1.0', 180, '2025-04-01', '2025-04-01'),
(203, 'g2_sess203', 203, 6, 2, '2025-04-15 10:00', '2025-04-15 10:30', 1800, '2.1.0', 180, '2025-04-15', '2025-04-15'),
(204, 'g2_sess204', 204, 6, 2, '2025-05-01 10:00', '2025-05-01 10:30', 1800, '2.1.0', 180, '2025-05-01', '2025-05-01'),
(205, 'g2_sess205', 205, 6, 2, '2025-05-13 10:00', '2025-05-13 10:30', 1800, '2.1.0', 180, '2025-05-13', '2025-05-13'),
(206, 'g2_sess206', 206, 6, 2, '2025-05-18 10:00', '2025-05-18 10:30', 1800, '2.1.0', 180, '2025-05-18', '2025-05-18'),
(207, 'g2_sess207', 207, 6, 2, '2025-05-19 10:00', '2025-05-19 10:30', 1800, '2.1.0', 180, '2025-05-19', '2025-05-19'),
(208, 'g2_sess208', 208, 6, 2, '2025-05-20 10:00', '2025-05-20 10:30', 1800, '2.1.0', 180, '2025-05-20', '2025-05-20')
ON CONFLICT (id) DO NOTHING;

-- Events tablosu için gerçekçi veri
INSERT INTO events (id, "sessionId", "playerId", "gameId", "eventName", "eventType", timestamp, parameters, "createdAt", "updatedAt")
VALUES 
-- Player 1'in eventleri
(1, 1, 1, 1, 'game_start', 'progression', '2025-05-01 10:00', '{"level": 1}', NOW(), NOW()),
(2, 2, 1, 1, 'level_complete', 'progression', '2025-05-02 10:00', '{"level": 2}', NOW(), NOW()),
(3, 3, 1, 1, 'game_start', 'progression', '2025-05-08 10:00', '{"level": 3}', NOW(), NOW()),
(4, 4, 1, 1, 'game_start', 'progression', '2025-05-31 10:00', '{"level": 4}', NOW(), NOW()),

-- Player 2'nin eventleri
(5, 5, 2, 1, 'game_start', 'progression', '2025-05-01 12:00', '{"level": 1}', NOW(), NOW()),
(6, 6, 2, 1, 'level_complete', 'progression', '2025-05-02 12:00', '{"level": 2}', NOW(), NOW()),

-- Player 3'ün eventleri
(7, 7, 3, 1, 'game_start', 'progression', '2025-05-01 14:00', '{"level": 1}', NOW(), NOW()),

-- Player 4'ün eventleri
(8, 8, 4, 1, 'game_start', 'progression', '2025-05-05 10:00', '{"level": 1}', NOW(), NOW()),
(9, 9, 4, 1, 'level_complete', 'progression', '2025-05-06 10:00', '{"level": 2}', NOW(), NOW()),

-- Player 5'in eventleri
(10, 10, 5, 1, 'game_start', 'progression', '2025-05-10 10:00', '{"level": 1}', NOW(), NOW()),
(11, 11, 5, 1, 'level_complete', 'progression', '2025-05-11 10:00', '{"level": 2}', NOW(), NOW()),

-- Player 6'nın eventleri
(12, 12, 6, 2, 'game_start', 'progression', '2025-05-01 10:00', '{"level": 1}', NOW(), NOW()),
(13, 13, 6, 2, 'level_complete', 'progression', '2025-05-02 10:00', '{"level": 2}', NOW(), NOW()),
(14, 14, 6, 2, 'game_start', 'progression', '2025-05-08 10:00', '{"level": 3}', NOW(), NOW()),
(15, 15, 6, 2, 'game_start', 'progression', '2025-05-31 10:00', '{"level": 4}', NOW(), NOW()),
(16, 16, 7, 2, 'game_start', 'progression', '2025-05-01 12:00', '{"level": 1}', NOW(), NOW()),
(17, 17, 7, 2, 'level_complete', 'progression', '2025-05-02 12:00', '{"level": 2}', NOW(), NOW()),
(18, 18, 8, 2, 'game_start', 'progression', '2025-05-01 14:00', '{"level": 1}', NOW(), NOW()),
(19, 19, 9, 2, 'game_start', 'progression', '2025-05-05 10:00', '{"level": 1}', NOW(), NOW()),
(20, 20, 9, 2, 'level_complete', 'progression', '2025-05-06 10:00', '{"level": 2}', NOW(), NOW()),
(21, 21, 10, 2, 'game_start', 'progression', '2025-05-10 10:00', '{"level": 1}', NOW(), NOW()),
(22, 22, 10, 2, 'level_complete', 'progression', '2025-05-11 10:00', '{"level": 2}', NOW(), NOW()),
(23, 23, 10, 2, 'game_start', 'progression', '2025-05-17 10:00', '{"level": 3}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- === PERFORMANCE TEST EVENTS: crash ve error ===
-- gameId=2 için sessionId'leri 9001 ve 9002 olan, playerId'leri 101 ve 102 olan crash ve error eventleri ekle
INSERT INTO events (id, "sessionId", "playerId", "gameId", "eventName", "eventType", timestamp, parameters, "createdAt", "updatedAt") VALUES
  (2011, 9001, 101, 2, 'app_crash', 'crash', '2025-05-27 10:00', '{}', NOW(), NOW()),
  (2012, 9002, 102, 2, 'app_crash', 'crash', '2025-05-27 11:00', '{}', NOW(), NOW()),
  (2013, 9001, 101, 2, 'app_crash', 'crash', '2025-05-27 12:00', '{}', NOW(), NOW()),
  (2014, 9002, 102, 2, 'app_crash', 'crash', '2025-05-27 13:00', '{}', NOW(), NOW()),
  (2015, 9001, 101, 2, 'app_crash', 'crash', '2025-05-27 14:00', '{}', NOW(), NOW()),
  (2016, 9002, 102, 2, 'app_error', 'error', '2025-05-27 15:00', '{}', NOW(), NOW()),
  (2017, 9001, 101, 2, 'app_error', 'error', '2025-05-27 16:00', '{}', NOW(), NOW()),
  (2018, 9002, 102, 2, 'app_error', 'error', '2025-05-27 17:00', '{}', NOW(), NOW()),
  (2019, 9001, 101, 2, 'app_error', 'error', '2025-05-27 18:00', '{}', NOW(), NOW()),
  (2020, 9002, 102, 2, 'app_error', 'error', '2025-05-27 19:00', '{}', NOW(), NOW());

-- Progression tablosu (her iki oyun için)
INSERT INTO progression (id, "playerId", "gameId", "levelNumber", "levelName", "startTime", "endTime", "completionStatus", score, stars, attempts, "createdAt")
VALUES
(1, 1, 1, 1, 'Level 1', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '10 minutes', 'completed', 100, 3, 1, NOW()),
(2, 2, 1, 1, 'Level 1', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '12 minutes', 'completed', 90, 2, 1, NOW()),
(3, 3, 1, 1, 'Level 1', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '15 minutes', 'failed', 60, 1, 2, NOW()),
(4, 6, 2, 1, 'Level 1', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days' + INTERVAL '8 minutes', 'completed', 80, 2, 1, NOW()),
(5, 7, 2, 1, 'Level 1', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '10 minutes', 'completed', 70, 1, 1, NOW()),
(6, 8, 2, 1, 'Level 1', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '12 minutes', 'failed', 40, 1, 2, NOW())
ON CONFLICT (id) DO NOTHING;

-- Progression tablosu (Level 1-100, son 7 gün, gameId=2, farklı oyuncular)
-- Her gün, her oyuncu için, her levelde bir completed ve bir failed attempt
DO $$
DECLARE
  d integer;
  l integer;
  p integer[] := ARRAY[6,7,8,11,12,13];
  pid integer;
  base_id integer := 2000;
BEGIN
  FOR d IN 0..6 LOOP
    FOR l IN 1..100 LOOP
      FOREACH pid IN ARRAY p LOOP
        -- completed
        INSERT INTO progression (id, "playerId", "gameId", "levelNumber", "levelName", "startTime", "endTime", "completionStatus", score, stars, attempts, "createdAt")
        VALUES (
          base_id + d*100*6*2 + (l-1)*6*2 + (array_position(p, pid)-1)*2 + 1,
          pid, 2, l, CONCAT('Level ', l),
          NOW() - (d || ' days')::interval,
          NOW() - (d || ' days')::interval + (10 + l % 5) * interval '1 minute',
          'completed',
          50 + l % 50,
          1 + (l % 3),
          1,
          NOW() - (d || ' days')::interval
        );
        -- failed
        INSERT INTO progression (id, "playerId", "gameId", "levelNumber", "levelName", "startTime", "endTime", "completionStatus", score, stars, attempts, "createdAt")
        VALUES (
          base_id + d*100*6*2 + (l-1)*6*2 + (array_position(p, pid)-1)*2 + 2,
          pid, 2, l, CONCAT('Level ', l),
          NOW() - (d || ' days')::interval,
          NOW() - (d || ' days')::interval + (12 + l % 7) * interval '1 minute',
          'failed',
          30 + l % 40,
          1 + (l % 2),
          2,
          NOW() - (d || ' days')::interval
        );
      END LOOP;
    END LOOP;
  END LOOP;
END$$;

-- Monetization tablosu (her iki oyun için)
INSERT INTO monetization (id, "transactionId", "playerId", "gameId", "productId", "productType", amount, currency, platform, timestamp, "createdAt")
VALUES 
(1, 'tx1', 1, 1, 'premium_pack', 'non-consumable', 9.99, 'USD', 'play_store', NOW() - INTERVAL '5 days', NOW()),
(2, 'tx2', 2, 1, 'coins_100', 'consumable', 4.99, 'USD', 'play_store', NOW() - INTERVAL '3 days', NOW()),
(3, 'tx3', 3, 1, 'premium_pack', 'non-consumable', 9.99, 'USD', 'play_store', NOW() - INTERVAL '1 day', NOW()),
(4, 'tx21', 6, 2, 'vip_pack', 'non-consumable', 19.99, 'USD', 'app_store', NOW() - INTERVAL '4 days', NOW()),
(5, 'tx22', 7, 2, 'gems_50', 'consumable', 2.99, 'USD', 'app_store', NOW() - INTERVAL '2 days', NOW()),
(6, 'tx23', 8, 2, 'vip_pack', 'non-consumable', 19.99, 'USD', 'app_store', NOW() - INTERVAL '1 day', NOW()),
(14, 'tx100', 11, 2, 'premium_pack', 'non-consumable', 19.99, 'USD', 'app_store', '2025-05-05', NOW()),
(15, 'tx101', 12, 2, 'coins_100', 'consumable', 4.99, 'USD', 'app_store', '2025-05-06', NOW()),
(16, 'tx102', 13, 2, 'gems_50', 'consumable', 2.99, 'USD', 'app_store', '2025-05-06', NOW())
ON CONFLICT (id) DO NOTHING;

-- Daily Metrics tablosu (her iki oyun için, 2025-05-01 - 2025-05-07 arası)
INSERT INTO daily_metrics (date, "gameId", "metricName", value, metadata, "createdAt")
VALUES
-- Test Game (id:1)
('2025-05-01', 1, 'dau', 10, '{}', NOW()),
('2025-05-02', 1, 'dau', 12, '{}', NOW()),
('2025-05-03', 1, 'dau', 14, '{}', NOW()),
('2025-05-04', 1, 'dau', 16, '{}', NOW()),
('2025-05-05', 1, 'dau', 18, '{}', NOW()),
('2025-05-06', 1, 'dau', 20, '{}', NOW()),
('2025-05-07', 1, 'dau', 22, '{}', NOW()),
-- Second Game (id:2)
('2025-05-01', 2, 'dau', 8, '{}', NOW()),
('2025-05-02', 2, 'dau', 9, '{}', NOW()),
('2025-05-03', 2, 'dau', 10, '{}', NOW()),
('2025-05-04', 2, 'dau', 11, '{}', NOW()),
('2025-05-05', 2, 'dau', 12, '{}', NOW()),
('2025-05-06', 2, 'dau', 13, '{}', NOW()),
('2025-05-07', 2, 'dau', 14, '{}', NOW())
ON CONFLICT DO NOTHING;

-- Player Segments tablosu (her iki oyun için)
INSERT INTO player_segments ("gameId", "segmentName", "segmentCriteria", "playerCount", "createdAt")
VALUES
(1, 'High Value Players', '{"min_sessions": 50, "min_revenue": 100}', 50, NOW()),
(1, 'Casual Players', '{"max_sessions": 20, "max_revenue": 10}', 200, NOW()),
(1, 'Whales', '{"min_revenue": 500}', 10, NOW()),
(2, 'High Value Players', '{"min_sessions": 40, "min_revenue": 80}', 30, NOW()),
(2, 'Casual Players', '{"max_sessions": 15, "max_revenue": 5}', 120, NOW()),
(2, 'Whales', '{"min_revenue": 300}', 5, NOW())
ON CONFLICT DO NOTHING;

-- Performance Metrics tablosu (her iki oyun için, 2025-05-01 - 2025-05-07 arası)
INSERT INTO performance_metrics ("gameId", "deviceModel", "osVersion", "avgFps", "avgLoadTime", "crashCount", date, "createdAt")
VALUES
-- Test Game (id:1)
(1, 'Samsung Galaxy S20', 'Android 10', 60.0, 2.5, 5, '2025-05-01', NOW()),
(1, 'Samsung Galaxy S20', 'Android 10', 61.0, 2.4, 4, '2025-05-02', NOW()),
(1, 'Samsung Galaxy S20', 'Android 10', 62.0, 2.3, 3, '2025-05-03', NOW()),
(1, 'Samsung Galaxy S20', 'Android 10', 63.0, 2.2, 2, '2025-05-04', NOW()),
(1, 'Samsung Galaxy S20', 'Android 10', 64.0, 2.1, 1, '2025-05-05', NOW()),
(1, 'Samsung Galaxy S20', 'Android 10', 65.0, 2.0, 0, '2025-05-06', NOW()),
(1, 'Samsung Galaxy S20', 'Android 10', 66.0, 1.9, 0, '2025-05-07', NOW()),
-- Second Game (id:2)
(2, 'iPhone 13', 'iOS 15', 61.0, 2.3, 2, '2025-05-01', NOW()),
(2, 'iPhone 13', 'iOS 15', 62.0, 2.2, 1, '2025-05-02', NOW()),
(2, 'iPhone 13', 'iOS 15', 63.0, 2.1, 0, '2025-05-03', NOW()),
(2, 'iPhone 13', 'iOS 15', 64.0, 2.0, 0, '2025-05-04', NOW()),
(2, 'iPhone 13', 'iOS 15', 65.0, 1.9, 0, '2025-05-05', NOW()),
(2, 'iPhone 13', 'iOS 15', 66.0, 1.8, 0, '2025-05-06', NOW()),
(2, 'iPhone 13', 'iOS 15', 67.0, 1.7, 0, '2025-05-07', NOW())
ON CONFLICT DO NOTHING;

-- === AI TEST DATA: 101, 102, 103 için örnek kayıtlar (son 24 saat, NOT NULL alanlar dolduruldu) ===

-- Devices
INSERT INTO devices (id, "deviceId", "playerId", "gameId", platform, "osVersion", "deviceModel", "screenResolution", language, country, "createdAt") VALUES
  (1001, 'ai_test_dev101', 101, 2, 'iOS', '16', 'iPhone 13', '1170x2532', 'tr', 'TR', NOW()),
  (1002, 'ai_test_dev102', 102, 2, 'Android', '13', 'Galaxy S21', '1080x2400', 'en', 'US', NOW()),
  (1003, 'ai_test_dev103', 103, 2, 'Android', '12', 'Pixel 6', '1080x2400', 'de', 'DE', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sessions
INSERT INTO sessions (id, "sessionId", "playerId", "deviceId", "gameId", "startTime", "endTime", "durationSeconds", "gameVersion", "timezoneOffsetMinutes", "createdAt", "updatedAt") VALUES
  (1001, 'ai_test_sess101', 101, 1001, 2, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hours', 3600, '1.0.0', 180, NOW(), NOW()),
  (1002, 'ai_test_sess102', 102, 1002, 2, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', 3600, '1.0.0', 180, NOW(), NOW()),
  (1003, 'ai_test_sess103', 103, 1003, 2, NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours', 3600, '1.0.0', 180, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Monetization
INSERT INTO monetization (id, "transactionId", "playerId", "gameId", amount, timestamp, "createdAt") VALUES
  (1001, 'ai_test_tx101', 101, 2, 4.99, NOW() - INTERVAL '2 hours', NOW()),
  (1002, 'ai_test_tx102', 102, 2, 1.99, NOW() - INTERVAL '5 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- === AI TEST DATA: Son 1 gün için yeni oyuncular
INSERT INTO players (id, "gameId", "playerUid", "firstSeenAt", "lastSeenAt", "totalSessions", "totalPlaytimeSeconds", "createdAt") VALUES
  (101, 2, 'ai_player101', NOW() - INTERVAL '1 day', NOW(), 1, 3600, NOW()),
  (102, 2, 'ai_player102', NOW() - INTERVAL '1 day', NOW(), 1, 3600, NOW())
ON CONFLICT (id) DO NOTHING;

-- Devices
INSERT INTO devices (id, "deviceId", "playerId", "gameId", platform, "osVersion", "deviceModel", "screenResolution", language, country, "createdAt") VALUES
  (9001, 'ai_dev101', 101, 2, 'iOS', '16', 'iPhone 13', '1170x2532', 'tr', 'TR', NOW()),
  (9002, 'ai_dev102', 102, 2, 'Android', '13', 'Galaxy S21', '1080x2400', 'en', 'US', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sessions
INSERT INTO sessions (id, "sessionId", "playerId", "deviceId", "gameId", "startTime", "endTime", "durationSeconds", "gameVersion", "timezoneOffsetMinutes", "createdAt", "updatedAt") VALUES
  (9001, 'ai_sess101', 101, 9001, 2, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hours', 3600, '1.0.0', 180, NOW(), NOW()),
  (9002, 'ai_sess102', 102, 9002, 2, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', 3600, '1.0.0', 180, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Monetization
INSERT INTO monetization (id, "transactionId", "playerId", "gameId", "productId", "productType", amount, currency, platform, timestamp, "createdAt") VALUES
  (9001, 'ai_tx101', 101, 2, 'test_product', 'consumable', 4.99, 'USD', 'app_store', NOW() - INTERVAL '2 hours', NOW()),
  (9002, 'ai_tx102', 102, 2, 'test_product', 'consumable', 1.99, 'USD', 'play_store', NOW() - INTERVAL '5 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- AI TEST DATA: Son 1 gün için yeni cihazlar
INSERT INTO devices (id, "deviceId", "playerId", "gameId", platform, "osVersion", "deviceModel", "screenResolution", language, country, "createdAt") VALUES
  (9001, 'ai_dev101', 101, 2, 'iOS', '16', 'iPhone 13', '1170x2532', 'tr', 'TR', NOW()),
  (9002, 'ai_dev102', 102, 2, 'Android', '13', 'Galaxy S21', '1080x2400', 'en', 'US', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sessions for performance events (gameId=2, playerId=101/102, deviceId=9001/9002, matching event timestamps)
INSERT INTO sessions (id, "sessionId", "playerId", "deviceId", "gameId", "startTime", "endTime", "durationSeconds", "gameVersion", "timezoneOffsetMinutes", "createdAt", "updatedAt") VALUES
  (9101, 'perf_sess_1', 101, 9001, 2, '2025-05-27 10:00', '2025-05-27 10:30', 1800, '1.0.0', 180, NOW(), NOW()),
  (9102, 'perf_sess_2', 102, 9002, 2, '2025-05-27 11:00', '2025-05-27 11:30', 1800, '1.0.0', 180, NOW(), NOW()),
  (9103, 'perf_sess_3', 101, 9001, 2, '2025-05-27 12:00', '2025-05-27 12:30', 1800, '1.0.0', 180, NOW(), NOW()),
  (9104, 'perf_sess_4', 102, 9002, 2, '2025-05-27 13:00', '2025-05-27 13:30', 1800, '1.0.0', 180, NOW(), NOW()),
  (9105, 'perf_sess_5', 101, 9001, 2, '2025-05-27 14:00', '2025-05-27 14:30', 1800, '1.0.0', 180, NOW(), NOW()),
  (9106, 'perf_sess_6', 102, 9002, 2, '2025-05-27 15:00', '2025-05-27 15:30', 1800, '1.0.0', 180, NOW(), NOW()),
  (9107, 'perf_sess_7', 101, 9001, 2, '2025-05-27 16:00', '2025-05-27 16:30', 1800, '1.0.0', 180, NOW(), NOW()),
  (9108, 'perf_sess_8', 102, 9002, 2, '2025-05-27 17:00', '2025-05-27 17:30', 1800, '1.0.0', 180, NOW(), NOW()),
  (9109, 'perf_sess_9', 101, 9001, 2, '2025-05-27 18:00', '2025-05-27 18:30', 1800, '1.0.0', 180, NOW(), NOW()),
  (9110, 'perf_sess_10', 102, 9002, 2, '2025-05-27 19:00', '2025-05-27 19:30', 1800, '1.0.0', 180, NOW(), NOW())
ON CONFLICT (id) DO NOTHING; 