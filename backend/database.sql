-- Veritabanı Şeması ve Başlangıç Verileri

-- 1. İstasyonlar (İlçeler) Tablosu
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL
);

-- 2. Senaryolar Tablosu
CREATE TABLE IF NOT EXISTS scenarios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Talepler Tablosu (Hangi istasyonda ne kadar yük var?)
CREATE TABLE IF NOT EXISTS demands (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
    station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
    cargo_count INTEGER NOT NULL DEFAULT 0,
    total_weight FLOAT NOT NULL DEFAULT 0.0
);

-- 4. Rotalar Tablosu (Algoritma Sonuçları)
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
    vehicle_info VARCHAR(100), -- Örn: "Araç 1 (500kg)"
    path_data JSONB, -- İzlenen yolun sıralı istasyon ID'leri ve koordinatları
    total_cost FLOAT, -- Mesafe Maliyeti + Kiralama (varsa)
    capacity_usage FLOAT -- Doluluk oranı (%)
);

-- BAŞLANGIÇ VERİLERİ (SEED DATA)
-- Kocaeli İlçeleri ve Koordinatları
INSERT INTO stations (name, latitude, longitude) VALUES
('Başiskele', 40.7167, 29.9333),
('Çayırova', 40.8175, 29.3750),
('Darıca', 40.7739, 29.4003),
('Derince', 40.7561, 29.8306),
('Dilovası', 40.7875, 29.5469),
('Gebze', 40.8028, 29.4307),
('Gölcük', 40.7172, 29.8181),
('Kandıra', 41.0706, 30.1517),
('Karamürsel', 40.6922, 29.6156),
('Kartepe', 40.7533, 30.0244),
('Körfez', 40.7769, 29.7369),
('İzmit', 40.7654, 29.9408)
ON CONFLICT (name) DO NOTHING;
