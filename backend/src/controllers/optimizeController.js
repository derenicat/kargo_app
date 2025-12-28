const db = require('../../config/db');
const GeneticAlgorithmService = require('../services/geneticAlgorithmService');
const { calculateDistance } = require('../utils/haversine');

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
        const vehiclesRes = await db.query('SELECT * FROM vehicles WHERE is_active = TRUE');
        
        const ga = new GeneticAlgorithmService(stationsRes.rows, cargoItems, vehiclesRes.rows, {
            mode: optimizationMode || 'unlimited'
        });

        const solution = ga.solve();

        res.json({
            date,
            mode: optimizationMode || 'unlimited',
            total_cost: solution.fitness,
            routes: solution.routes,
            rejectedItems: solution.rejectedItems,
            logs: solution.logs // YENİ: Logları ekrana dön
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Simülasyon hatası.' });
    }
};

exports.saveScenario = async (req, res) => {
    const { date, mode, total_cost, routes, logs } = req.body;
    
    // DEBUG: Gelen veriyi kontrol et
    console.log(`[SAVE] Date: ${date}, Mode: ${mode}, Routes Count: ${routes?.length}`);
    if (routes && routes.length > 0) {
        console.log('[SAVE] Sample Route Data:', JSON.stringify(routes[0], null, 2));
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM scenarios WHERE optimization_date = $1', [date]);
        await client.query('UPDATE cargo_requests SET status = \'PENDING\', scenario_id = NULL WHERE request_date = $1', [date]);

        const scenarioRes = await client.query(
            'INSERT INTO scenarios (optimization_date, optimization_mode, total_cost, optimization_logs) VALUES ($1, $2, $3, $4) RETURNING id',
            [date, mode, total_cost, JSON.stringify(logs)] 
        );
        const scenarioId = scenarioRes.rows[0].id;

        for (const route of routes) {
            // DEBUG: Kapasite değerlerini kontrol et
            console.log(`[SAVE] Vehicle: ${route.vehicle.name}, Load: ${route.load}, Capacity: ${route.vehicle.capacity}`);
            
            let capUsage = parseFloat(route.capacity_usage);
            if (isNaN(capUsage) || capUsage === 0) {
                const load = parseFloat(route.load) || 0;
                const capacity = parseFloat(route.vehicle.capacity) || 500;
                capUsage = (load / capacity) * 100;
                console.log(`[SAVE] Recalculated Usage: ${capUsage.toFixed(2)}%`);
            }

            await client.query(
                `INSERT INTO routes (scenario_id, vehicle_id, path_data, individual_cost, capacity_usage) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    scenarioId,
                    route.vehicle.id,
                    JSON.stringify(route),
                    route.individual_cost || 0,
                    capUsage
                ]
            );

            // ... (Kargo güncelleme döngüsü aynı kalacak)

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
        res.json({
            ...scenario, 
            mode: scenario.optimization_mode, 
            routes, 
            logs: scenario.optimization_logs // YENİ: Kayıtlı logları dön
        });
    } catch (err) { res.status(500).json({ error: 'Veri çekilemedi.' }); }
};

exports.getOptimizationSummary = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                s.id, 
                s.optimization_date as date, 
                s.optimization_mode as mode, 
                s.total_cost, 
                s.created_at,
                (SELECT COUNT(*) FROM routes WHERE scenario_id = s.id) as vehicle_count,
                COALESCE(
                    (SELECT AVG(capacity_usage) FROM routes WHERE scenario_id = s.id), 
                    0
                ) as avg_capacity
             FROM scenarios s 
             ORDER BY s.optimization_date ASC`
        );
        // Sayısal değerleri garantiye al
        const formattedRows = result.rows.map(row => ({
            ...row,
            avg_capacity: parseFloat(row.avg_capacity),
            total_cost: parseFloat(row.total_cost)
        }));
        res.json(formattedRows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Özet veriler alınamadı.' });
    }
};

exports.deleteScenario = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM scenarios WHERE id = $1', [id]);
        res.json({ message: 'Silindi.' });
    } catch (err) { res.status(500).json({ error: 'Hata.' }); }
};

// Tüm Operasyonel Verileri Sıfırla (TAM TEMİZLİK)
exports.resetAllData = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM routes');
        await client.query('DELETE FROM cargo_requests'); // ARTIK TAMAMEN SİLİYOR
        await client.query('DELETE FROM scenarios');
        await client.query('COMMIT');
        res.json({ message: 'Tüm operasyonel veriler sıfırlandı.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Sıfırlama hatası.' });
    } finally {
        client.release();
    }
};