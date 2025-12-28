const db = require('../../config/db');

// Örnek Senaryo Şablonları (Dokümandan)
const SCENARIO_TEMPLATES = {
  1: [
    { name: 'Başiskele', count: 10, weight: 120 }, { name: 'Çayırova', count: 8, weight: 80 },
    { name: 'Darıca', count: 15, weight: 200 }, { name: 'Derince', count: 10, weight: 150 },
    { name: 'Dilovası', count: 12, weight: 180 }, { name: 'Gebze', count: 5, weight: 70 },
    { name: 'Gölcük', count: 7, weight: 90 }, { name: 'Kandıra', count: 6, weight: 60 },
    { name: 'Karamürsel', count: 9, weight: 110 }, { name: 'Kartepe', count: 11, weight: 130 },
    { name: 'Körfez', count: 6, weight: 75 }, { name: 'İzmit', count: 14, weight: 160 }
  ],
  2: [
    { name: 'Başiskele', count: 40, weight: 200 }, { name: 'Çayırova', count: 35, weight: 175 },
    { name: 'Darıca', count: 10, weight: 150 }, { name: 'Derince', count: 5, weight: 100 },
    { name: 'Gebze', count: 8, weight: 120 }, { name: 'İzmit', count: 20, weight: 160 }
  ],
  3: [
    { name: 'Çayırova', count: 3, weight: 700 }, { name: 'Dilovası', count: 4, weight: 800 },
    { name: 'Gebze', count: 5, weight: 900 }, { name: 'İzmit', count: 5, weight: 300 }
  ],
  4: [
    { name: 'Başiskele', count: 30, weight: 300 }, { name: 'Gölcük', count: 15, weight: 220 },
    { name: 'Kandıra', count: 5, weight: 250 }, { name: 'Karamürsel', count: 20, weight: 180 },
    { name: 'Kartepe', count: 10, weight: 200 }, { name: 'Körfez', count: 8, weight: 400 }
  ]
};

exports.addCargo = async (req, res) => {
  const { items, date } = req.body;
  if (!items || items.length === 0 || !date) return res.status(400).json({ error: 'Veri eksik.' });
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query('INSERT INTO cargo_requests (station_id, weight, request_date) VALUES ($1, $2, $3)', [item.station_id, item.weight, date]);
    }
    await client.query('COMMIT');
    res.status(201).json({ message: 'Kargolar eklendi.' });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); } finally { client.release(); }
};

exports.getCargoByDate = async (req, res) => {
  const { date } = req.query;
  try {
    const result = await db.query(
      `SELECT c.*, s.name as station_name, s.latitude, s.longitude 
       FROM cargo_requests c JOIN stations s ON c.station_id = s.id 
       WHERE c.request_date = $1`, [date]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.loadScenarioTemplate = async (req, res) => {
    const { date, scenarioId } = req.body;
    const template = SCENARIO_TEMPLATES[scenarioId];
    if (!template) return res.status(404).json({ error: 'Şablon bulunamadı.' });
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const stationsRes = await db.query('SELECT id, name FROM stations');
        const stations = stationsRes.rows;
        for (const item of template) {
            const station = stations.find(s => s.name.includes(item.name));
            if (station) {
                const weightPerItem = item.weight / item.count;
                for (let i = 0; i < item.count; i++) {
                    await client.query('INSERT INTO cargo_requests (station_id, weight, request_date) VALUES ($1, $2, $3)', [station.id, weightPerItem, date]);
                }
            }
        }
        await client.query('COMMIT');
        res.json({ message: `Senaryo ${scenarioId} yüklendi.` });
    } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); } finally { client.release(); }
};

exports.seedRandomCargo = async (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Tarih gerekli.' });
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const stationsRes = await client.query("SELECT id FROM stations WHERE name != 'Kocaeli Üniversitesi Umuttepe Kampüsü'");
        const stations = stationsRes.rows;
        const count = Math.floor(Math.random() * 15) + 5;
        for (let i = 0; i < count; i++) {
            const randomStation = stations[Math.floor(Math.random() * stations.length)];
            const randomWeight = (Math.random() * 150) + 5;
            await client.query('INSERT INTO cargo_requests (station_id, weight, request_date) VALUES ($1, $2, $3)', [randomStation.id, randomWeight, date]);
        }
        await client.query('COMMIT');
        res.json({ message: `${count} adet sentetik kargo oluşturuldu.` });
    } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); } finally { client.release(); }
};

// Kargo Takip (Public) - GELİŞTİRİLMİŞ
exports.trackCargo = async (req, res) => {
    const { id } = req.params;
    try {
        const cargoRes = await db.query(
            `SELECT c.*, s.name as station_name 
             FROM cargo_requests c 
             JOIN stations s ON c.station_id = s.id 
             WHERE c.id = $1`, [id]
        );
        
        if (cargoRes.rows.length === 0) return res.status(404).json({ error: 'Kargo bulunamadı.' });
        const cargo = cargoRes.rows[0];

        if (!cargo.scenario_id) {
            return res.json({ cargo, message: 'Kargonuz henüz bir plana dahil edilmedi veya plan taslak aşamasında.' });
        }

        // Doğrudan kargonun bağlı olduğu senaryoya ait rotaları çek
        const routesRes = await db.query('SELECT * FROM routes WHERE scenario_id = $1', [cargo.scenario_id]);
        
        const myRoute = routesRes.rows.find(r => {
            const data = r.path_data;
            return data.stops.some(stop => stop.items && stop.items.some(item => item.id == id));
        });

        if (!myRoute) return res.status(404).json({ error: 'Bu kargo için onaylanmış rota bilgisi bulunamadı.' });

        res.json({ cargo, route: myRoute.path_data });

    } catch (err) { console.error(err); res.status(500).json({ error: 'Takip hatası.' }); }
};