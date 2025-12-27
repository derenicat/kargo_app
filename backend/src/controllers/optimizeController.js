const db = require('../../config/db');
const GeneticAlgorithmService = require('../services/geneticAlgorithmService');

exports.runOptimization = async (req, res) => {
    const { date, optimizationMode } = req.body; // date: 'YYYY-MM-DD', optimizationMode: 'unlimited' | 'max_weight' | 'max_count'

    if (!date) {
        return res.status(400).json({ error: 'Tarih bilgisi gereklidir.' });
    }

    try {
        // 1. Verileri Çek (Bireysel Kargo İstekleri)
        const cargoQuery = await db.query(
            `SELECT c.*, s.name as station_name, s.latitude, s.longitude 
             FROM cargo_requests c 
             JOIN stations s ON c.station_id = s.id 
             WHERE c.request_date = $1 AND c.status != 'REJECTED'`,
            [date]
        );
        const cargoItems = cargoQuery.rows;

        if (cargoItems.length === 0) {
            return res.status(404).json({ error: 'Bu tarihe ait kargo talebi bulunamadı.' });
        }

        const stationsResult = await db.query('SELECT * FROM stations');
        const stations = stationsResult.rows;

        // 2. Araçları Tanımla (Varsayılan 3 Araç)
        // Gerçek senaryoda bu da DB'den gelebilir
        const vehicles = [
            { id: 1, name: 'Araç 1', capacity: 500, isRental: false },
            { id: 2, name: 'Araç 2', capacity: 750, isRental: false },
            { id: 3, name: 'Araç 3', capacity: 1000, isRental: false }
        ];

        // 3. Algoritmayı Çalıştır (Yeni Paket Bazlı Mod)
        const ga = new GeneticAlgorithmService(stations, cargoItems, vehicles, {
            populationSize: 100,
            generations: 200,
            mode: optimizationMode || 'unlimited' // Varsayılan: Sınırsız
        });

        const bestSolution = ga.solve();

        // 4. Sonuçları Veritabanına Kaydet (Transaction)
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            
            // Önceki rotaları temizle (aynı tarih için)
            await client.query('DELETE FROM routes WHERE optimization_date = $1', [date]);

            const savedRoutes = [];
            for (const route of bestSolution.routes) {
                
                // Rotadaki durakları ve yüklenen paketleri detaylandır
                const detailedPath = route.stops.map(stop => {
                    return {
                        id: stop.station.id,
                        name: stop.station.name,
                        lat: stop.station.latitude,
                        lng: stop.station.longitude,
                        cargo_count: stop.items.length, 
                        total_weight: stop.load,
                        items: stop.items 
                    };
                });

                // KRİTİK: Varış noktasını (Umuttepe) stops dizisinin sonuna ekle
                const endStation = stations.find(s => s.name === 'Kocaeli Üniversitesi Umuttepe Kampüsü') || stations[stations.length - 1];
                detailedPath.push({
                    id: endStation.id,
                    name: endStation.name,
                    lat: endStation.latitude,
                    lng: endStation.longitude,
                    cargo_count: 0,
                    total_weight: 0,
                    items: [],
                    isDestination: true
                });

                // KRİTİK: Başlangıç noktasını (Depo) stops dizisinin başına ekle
                const startStation = stations.find(s => s.name === 'İzmit' || s.name === 'İzmit Merkez') || stations[0];
                detailedPath.unshift({
                    id: startStation.id,
                    name: startStation.name,
                    lat: startStation.latitude,
                    lng: startStation.longitude,
                    cargo_count: 0,
                    total_weight: 0,
                    items: [],
                    isOrigin: true
                });

                const routeEntry = {
                    vehicle: route.vehicle,
                    path: route.path, 
                    stops: detailedPath,
                    load: route.load,
                    capacity: route.vehicle.capacity
                };
                savedRoutes.push(routeEntry);

                await client.query(
                    `INSERT INTO routes 
                    (optimization_date, vehicle_info, path_data, total_cost, capacity_usage) 
                    VALUES ($1, $2, $3, $4, $5)`,
                    [
                        date,
                        JSON.stringify(route.vehicle),
                        JSON.stringify(routeEntry),
                        bestSolution.fitness,
                        (route.load / route.vehicle.capacity) * 100
                    ]
                );
                
                // Kargo durumlarını güncelle (PLANNED)
                for (const stop of detailedPath) {
                    for (const item of stop.items) {
                        await client.query('UPDATE cargo_requests SET status = $1 WHERE id = $2', ['PLANNED', item.id]);
                    }
                }
            }
            
            // Taşınamayan (Rejected) Kargoları İşle (Eğer varsa)
            if (bestSolution.rejectedItems && bestSolution.rejectedItems.length > 0) {
                 for (const item of bestSolution.rejectedItems) {
                     // Bunları REJECTED yapmıyoruz, bir sonraki sefere kalsın diye PENDING bırakabiliriz
                     // veya kullanıcıya bildirmek için özel bir statü verebiliriz.
                     // Şimdilik dokunmuyoruz (PENDING kalıyor).
                 }
            }

            await client.query('COMMIT');
            
            res.json({
                message: 'Optimizasyon tamamlandı.',
                solution: {
                    ...bestSolution,
                    routes: savedRoutes
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