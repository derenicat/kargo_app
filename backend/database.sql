-- 1. İstasyonlar
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL
);

-- 2. Araçlar (Filo)
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity FLOAT NOT NULL,
    is_rental BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Senaryolar (Günlük Onaylanmış Planlar)
CREATE TABLE IF NOT EXISTS scenarios (
    id SERIAL PRIMARY KEY,
    optimization_date DATE NOT NULL UNIQUE,
    optimization_mode VARCHAR(20) NOT NULL,
    total_cost FLOAT NOT NULL,
    optimization_logs JSONB, -- YENİ: Algoritma adımlarını tutar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Kargo İstekleri
CREATE TABLE IF NOT EXISTS cargo_requests (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE SET NULL, -- Hangi onaylı plana dahil?
    weight FLOAT NOT NULL,
    request_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PLANNED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Rotalar (Senaryo ve Araç İlişkili)
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE, -- Senaryo silinince rotalar gider
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE, -- Araç bilgisi artık referansla tutuluyor
    path_data JSONB, -- Sadece coğrafi koordinatlar ve durak sıralaması
    individual_cost FLOAT,
    capacity_usage FLOAT
);

-- BAŞLANGIÇ VERİLERİ
INSERT INTO stations (name, latitude, longitude) VALUES
('Başiskele', 40.7167, 29.9333), ('Çayırova', 40.8175, 29.3750),
('Darıca', 40.7739, 29.4003), ('Derince', 40.7561, 29.8306),
('Dilovası', 40.7875, 29.5469), ('Gebze', 40.8028, 29.4307),
('Gölcük', 40.7172, 29.8181), ('Kandıra', 41.0706, 30.1517),
('Karamürsel', 40.6922, 29.6156), ('Kartepe', 40.7533, 30.0244),
('Körfez', 40.7769, 29.7369), ('İzmit', 40.7654, 29.9408),
('Kocaeli Üniversitesi Umuttepe Kampüsü', 40.8222, 29.9218)
ON CONFLICT (name) DO NOTHING;

-- Varsayılan Filo
INSERT INTO vehicles (name, capacity, is_rental) VALUES
('Araç 1 (500kg)', 500, FALSE),
('Araç 2 (750kg)', 750, FALSE),
('Araç 3 (1000kg)', 1000, FALSE),
('Standart Kiralık Araç (500kg)', 500, TRUE) -- Kiralık modeller de sistemde tanımlı olmalı
ON CONFLICT DO NOTHING;