const db = require('../../config/db');
const GeneticAlgorithmService = require('../services/geneticAlgorithmService');

// 1. Simülasyon
exports.runOptimization = async (req, res) => {
    const { date, optimizationMode } = req.body;
    if (!date) return res.status(400).json({ error: 'Tarih gereklidir.' });

    try {
        const cargoQuery = await db.query(
            `SELECT c.*, s.name as station_name FROM cargo_requests c 
             JOIN stations s ON c.station_id = s.id 
             WHERE c.request_date = $1`, [date]
        );
        const cargoItems = cargoQuery.rows;
        if (cargoItems.length === 0) return res.status(404).json({ error: 'Talep bulunamadı.' });

        const stationsRes = await db.query('SELECT * FROM stations');
        const vehiclesRes = await db.query('SELECT * FROM vehicles WHERE is_active = TRUE AND is_rental = FALSE');
        
        const ga = new GeneticAlgorithmService(stationsRes.rows, cargoItems, vehiclesRes.rows, {
            mode: optimizationMode || 'unlimited'
        });

        const solution = ga.solve();

        res.json({
            date,
            mode: optimizationMode || 'unlimited',
            total_cost: solution.fitness,
            routes: solution.routes,
            rejectedItems: solution.rejectedItems
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Simülasyon hatası.' });
    }
};

// 2. Senaryo Kaydet
exports.saveScenario = async (req, res) => {
    const { date, mode, total_cost, routes } = req.body;
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM scenarios WHERE optimization_date = $1', [date]);
        await client.query('UPDATE cargo_requests SET status = \'PENDING\', scenario_id = NULL WHERE request_date = $1', [date]);

        const scenarioRes = await client.query(
            'INSERT INTO scenarios (optimization_date, optimization_mode, total_cost) VALUES ($1, $2, $3) RETURNING id',
            [date, mode, total_cost]
        );
        const scenarioId = scenarioRes.rows[0].id;

        for (const route of routes) {
            await client.query(
                `INSERT INTO routes (scenario_id, vehicle_id, path_data, individual_cost, capacity_usage) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    scenarioId,
                    route.vehicle.id,
                    JSON.stringify(route),
                    route.individual_cost,
                    (route.load / route.vehicle.capacity) * 100
                ]
            );

            // Kargoları güncelle
            for (const stop of route.stops) {
                if (stop.items && stop.items.length > 0) {
                    for (const item of stop.items) {
                        const itemId = typeof item === 'object' ? item.id : item;
                        await client.query('UPDATE cargo_requests SET status = \'PLANNED\', scenario_id = $1 WHERE id = $2', [scenarioId, itemId]);
                    }
                }
            }
        }
        await client.query('COMMIT');
        res.json({ message: 'Senaryo kaydedildi.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Kayıt hatası.' });
    } finally { client.release(); }
};

exports.getSavedScenario = async (req, res) => {
    const { date } = req.query;
    try {
        const scenarioRes = await db.query('SELECT * FROM scenarios WHERE optimization_date = $1', [date]);
        if (scenarioRes.rows.length === 0) return res.json(null);
        const scenario = scenarioRes.rows[0];
        const routesRes = await db.query(
            `SELECT r.*, v.name as vehicle_name, v.capacity as vehicle_capacity, v.is_rental 
             FROM routes r JOIN vehicles v ON r.vehicle_id = v.id 
             WHERE r.scenario_id = $1`, [scenario.id]
        );
        const routes = routesRes.rows.map(r => ({ ...r.path_data }));
        res.json({ ...scenario, mode: scenario.optimization_mode, routes });
    } catch (err) { res.status(500).json({ error: 'Veri çekilemedi.' }); }
};

exports.getOptimizationSummary = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT s.id, s.optimization_date as date, s.optimization_mode as mode, s.total_cost, s.created_at,
             (SELECT COUNT(*) FROM routes WHERE scenario_id = s.id) as vehicle_count 
             FROM scenarios s ORDER BY s.optimization_date DESC`
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Hata.' }); }
};

exports.deleteScenario = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM scenarios WHERE id = $1', [id]);
        res.json({ message: 'Silindi.' });
    } catch (err) { res.status(500).json({ error: 'Hata.' }); }
};
