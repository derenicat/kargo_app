const db = require('../../config/db');
const GeneticAlgorithmService = require('../services/geneticAlgorithmService');

exports.runOptimization = async (req, res) => {
    const { scenarioId } = req.body;

    if (!scenarioId) {
        return res.status(400).json({ error: 'Senaryo ID gereklidir.' });
    }

    try {
        // 1. Verileri Çek (Talepler ve İstasyonlar)
        const demandsResult = await db.query('SELECT * FROM demands WHERE scenario_id = $1', [scenarioId]);
        const demands = demandsResult.rows;

        if (demands.length === 0) {
            return res.status(404).json({ error: 'Bu senaryoya ait talep bulunamadı.' });
        }

        const stationsResult = await db.query('SELECT * FROM stations');
        const stations = stationsResult.rows;

        // 2. Araçları Tanımla (Varsayılan 3 Araç)
        // Not: Gerçek senaryoda bu kullanıcıdan da alınabilir.
        const vehicles = [
            { id: 1, name: 'Araç 1', capacity: 500, isRental: false },
            { id: 2, name: 'Araç 2', capacity: 750, isRental: false },
            { id: 3, name: 'Araç 3', capacity: 1000, isRental: false }
        ];

        // 3. Algoritmayı Çalıştır
        const ga = new GeneticAlgorithmService(stations, demands, vehicles, {
            populationSize: 100,
            generations: 200
        });

        const bestSolution = ga.solve();

        // 4. Sonuçları Veritabanına Kaydet (Transaction)
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            
            // Önceki rotaları temizle (aynı senaryo için tekrar çalıştırılırsa)
            await client.query('DELETE FROM routes WHERE scenario_id = $1', [scenarioId]);

            const savedRoutes = [];
            for (const route of bestSolution.routes) {
                const detailedPath = route.path.map(stopId => {
                    const st = stations.find(s => s.id === stopId);
                    const demand = demands.find(d => d.station_id === stopId);
                    
                    return {
                        id: st.id,
                        name: st.name,
                        lat: st.latitude,
                        lng: st.longitude,
                        cargo_count: demand ? demand.cargo_count : 0,
                        total_weight: demand ? demand.total_weight : 0
                    };
                });

                const routeEntry = {
                    vehicle: route.vehicle,
                    path: detailedPath.map(p => [p.lat, p.lng]), // Harita için sadece koordinat dizisi (Polyline için)
                    stops: detailedPath, // Tüm detaylar
                    load: route.load,
                    capacity: route.vehicle.capacity
                };
                savedRoutes.push(routeEntry);

                await client.query(
                    `INSERT INTO routes 
                    (scenario_id, vehicle_info, path_data, total_cost, capacity_usage) 
                    VALUES ($1, $2, $3, $4, $5)`,
                    [
                        scenarioId,
                        JSON.stringify(route.vehicle),
                        JSON.stringify(routeEntry),
                        0,
                        (route.load / route.vehicle.capacity) * 100
                    ]
                );
            }

            await client.query('COMMIT');
            
            res.json({
                message: 'Optimizasyon tamamlandı.',
                solution: {
                    ...bestSolution,
                    routes: savedRoutes // ID'ler yerine koordinatlı rotaları dön
                }
            });

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Optimizasyon hatası:', err);
        res.status(500).json({ error: 'Algoritma çalışırken hata oluştu.' });
    }
};
