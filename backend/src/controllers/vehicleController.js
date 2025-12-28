const db = require('../../config/db');

// Tüm araçları getir
exports.getAllVehicles = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM vehicles ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Araçlar alınamadı.' });
  }
};

// Yeni araç ekle
exports.createVehicle = async (req, res) => {
  const { name, capacity, is_rental } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO vehicles (name, capacity, is_rental) VALUES ($1, $2, $3) RETURNING *',
      [name, capacity, is_rental || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Araç eklenemedi.' });
  }
};

// Araç durumunu güncelle (Aktif/Pasif)
exports.toggleVehicleStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    await db.query('UPDATE vehicles SET is_active = $1 WHERE id = $2', [is_active, id]);
    res.json({ message: 'Durum güncellendi.' });
  } catch (err) {
    res.status(500).json({ error: 'Güncelleme hatası.' });
  }
};

// Araç Sil
exports.deleteVehicle = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM vehicles WHERE id = $1', [id]);
    res.json({ message: 'Araç silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Silme hatası.' });
  }
};
