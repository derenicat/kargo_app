const db = require('../../config/db');

// Tüm istasyonları getir
exports.getAllStations = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stations ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İstasyonlar alınırken hata oluştu.' });
  }
};

// Yeni istasyon ekle
exports.createStation = async (req, res) => {
  const { name, latitude, longitude } = req.body;

  if (!name || !latitude || !longitude) {
    return res.status(400).json({ error: 'Lütfen tüm alanları doldurun (Ad, Enlem, Boylam).' });
  }

  try {
    const result = await db.query(
      'INSERT INTO stations (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING *',
      [name, latitude, longitude]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Bu isimde bir istasyon zaten mevcut.' });
    }
    res.status(500).json({ error: 'İstasyon eklenirken hata oluştu.' });
  }
};
