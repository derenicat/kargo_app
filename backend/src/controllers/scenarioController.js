const db = require('../../config/db');

// Yeni Senaryo ve Talepleri Oluştur
exports.createScenario = async (req, res) => {
  const { name, demands } = req.body;
  // demands: [{ station_id, cargo_count, total_weight }, ...]

  if (!name || !demands || demands.length === 0) {
    return res.status(400).json({ error: 'Senaryo adı ve en az bir talep gereklidir.' });
  }

  const client = await db.pool.connect(); // Transaction için client al

  try {
    await client.query('BEGIN'); // Transaction Başlat

    // 1. Senaryoyu kaydet
    const scenarioResult = await client.query(
      'INSERT INTO scenarios (name) VALUES ($1) RETURNING id, name, created_at',
      [name]
    );
    const scenarioId = scenarioResult.rows[0].id;

    // 2. Talepleri kaydet (Döngü ile)
    for (const demand of demands) {
      await client.query(
        'INSERT INTO demands (scenario_id, station_id, cargo_count, total_weight) VALUES ($1, $2, $3, $4)',
        [scenarioId, demand.station_id, demand.cargo_count, demand.total_weight]
      );
    }

    await client.query('COMMIT'); // İşlemi Onayla
    res.status(201).json({ message: 'Senaryo başarıyla oluşturuldu.', scenario: scenarioResult.rows[0] });

  } catch (err) {
    await client.query('ROLLBACK'); // Hata durumunda geri al
    console.error('Senaryo oluşturma hatası:', err);
    res.status(500).json({ error: 'Senaryo kaydedilirken hata oluştu.' });
  } finally {
    client.release(); // Bağlantıyı havuza geri ver
  }
};

// Tüm Senaryoları Getir
exports.getAllScenarios = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM scenarios ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Senaryolar alınırken hata oluştu.' });
  }
};

// Tek Bir Senaryonun Detaylarını Getir (Taleplerle birlikte)
exports.getScenarioById = async (req, res) => {
  const { id } = req.params;
  try {
    const scenarioQuery = await db.query('SELECT * FROM scenarios WHERE id = $1', [id]);
    
    if (scenarioQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Senaryo bulunamadı.' });
    }

    const demandsQuery = await db.query(
      `SELECT d.*, s.name as station_name, s.latitude, s.longitude 
       FROM demands d 
       JOIN stations s ON d.station_id = s.id 
       WHERE d.scenario_id = $1`,
      [id]
    );

    res.json({
      ...scenarioQuery.rows[0],
      demands: demandsQuery.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Senaryo detayı alınırken hata oluştu.' });
  }
};
