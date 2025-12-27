const { calculateDistance } = require('../utils/haversine');

class GeneticAlgorithmService {
    constructor(stations, cargoItems, vehicles, options = {}) {
        this.stations = stations;
        this.cargoItems = cargoItems;
        this.vehicles = JSON.parse(JSON.stringify(vehicles)); // Orijinal araç listesini koru
        
        this.mode = options.mode || 'unlimited';
        
        this.endPoint = stations.find(s => s.name === 'Kocaeli Üniversitesi Umuttepe Kampüsü') || stations[stations.length - 1];
        this.depot = stations.find(s => s.name === 'İzmit' || s.name === 'İzmit Merkez') || stations[0];

        // Umuttepe'den kargo alınmaz
        this.activeItems = cargoItems.filter(item => item.station_id !== this.endPoint.id);
        
        this.populationSize = options.populationSize || 50;
        this.generations = options.generations || 100;
        this.mutationRate = options.mutationRate || 0.1;
        this.rejectedItems = [];
    }

    solve() {
        let itemsToProcess = [...this.activeItems];
        
        // Sabit araç modunda kapasite üstü kargoları en başta eliyoruz (Greedy Pre-filter)
        if (this.mode !== 'unlimited') {
            const totalCapacity = this.vehicles.reduce((sum, v) => sum + v.capacity, 0);
            
            if (this.mode === 'max_weight') {
                itemsToProcess.sort((a, b) => b.weight - a.weight);
            } else if (this.mode === 'max_count') {
                itemsToProcess.sort((a, b) => a.weight - b.weight);
            }
            
            let currentSum = 0;
            const selected = [];
            const rejected = [];
            
            for (const item of itemsToProcess) {
                if (currentSum + item.weight <= totalCapacity) {
                    selected.push(item);
                    currentSum += item.weight;
                } else {
                    rejected.push(item);
                }
            }
            itemsToProcess = selected;
            this.rejectedItems = rejected;
        }

        this.finalActiveItems = itemsToProcess;

        let population = this.initializePopulation();

        for (let g = 0; g < this.generations; g++) {
            population = this.evolve(population);
        }

        const best = this.getBestIndividual(population);
        return {
            ...best,
            rejectedItems: this.rejectedItems
        };
    }

    initializePopulation() {
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            let chromosome = this.shuffle([...this.finalActiveItems]);
            population.push(this.decode(chromosome));
        }
        return population;
    }

    /**
     * Kromozomu Rotalara Dönüştür
     */
    decode(chromosome) {
        let routes = [];
        let currentVehicleIndex = 0;
        
        // Her birey için araç listesinin kopyasını al
        let availableVehicles = JSON.parse(JSON.stringify(this.vehicles));
        
        let currentRouteStops = [];
        let currentVehicleLoad = 0;

        for (let i = 0; i < chromosome.length; i++) {
            const item = chromosome[i];
            let currentVehicle = availableVehicles[currentVehicleIndex];

            // Mevcut araca sığıyor mu?
            if (currentVehicleLoad + item.weight <= currentVehicle.capacity) {
                const station = this.stations.find(s => s.id === item.station_id);
                const lastStop = currentRouteStops[currentRouteStops.length - 1];
                
                if (lastStop && lastStop.station.id === station.id) {
                    lastStop.items.push(item);
                    lastStop.load += item.weight;
                } else {
                    currentRouteStops.push({
                        station: station,
                        items: [item],
                        load: item.weight
                    });
                }
                currentVehicleLoad += item.weight;
            } else {
                // Sığmıyor, mevcut rotayı bitir ve yeni araca geç
                if (currentRouteStops.length > 0) {
                    this.finalizeRoute(routes, currentVehicle, currentRouteStops, currentVehicleLoad);
                }

                currentVehicleIndex++;
                currentRouteStops = [];
                currentVehicleLoad = 0;

                // Yeni araç var mı kontrol et
                if (currentVehicleIndex >= availableVehicles.length) {
                    if (this.mode === 'unlimited') {
                        const newRental = {
                            id: `rental-${availableVehicles.length}`,
                            name: `Kiralık Araç ${availableVehicles.length - 2}`,
                            capacity: 500,
                            isRental: true
                        };
                        availableVehicles.push(newRental);
                    } else {
                        // SABİT MOD: Araç bitti, kalan kargolar bu çözümde taşınamaz
                        break; 
                    }
                }
                
                // Döngüyü bu paket için tekrar çalıştır (yeni araçla)
                i--; 
            }
        }

        // Son kalan rotayı ekle
        if (currentRouteStops.length > 0 && currentVehicleIndex < availableVehicles.length) {
            this.finalizeRoute(routes, availableVehicles[currentVehicleIndex], currentRouteStops, currentVehicleLoad);
        }

        return {
            routes,
            fitness: this.calculateFitness(routes)
        };
    }

    finalizeRoute(routes, vehicle, stops, load) {
        const pathCoords = [
            [this.depot.latitude, this.depot.longitude],
            ...stops.map(s => [s.station.latitude, s.station.longitude]),
            [this.endPoint.latitude, this.endPoint.longitude]
        ];

        routes.push({
            vehicle: JSON.parse(JSON.stringify(vehicle)), // Kopya alarak kopyalanma hatasını önle
            stops: stops,
            path: pathCoords,
            load: load
        });
    }

    calculateFitness(routes) {
        let totalDistance = 0;
        let rentalCost = 0;
        let unreachablePenalty = 0;

        // Taşınamayan kargo varsa ceza puanı ekle (Algoritmayı doğru çözüme zorlar)
        const itemsInRoutes = routes.reduce((sum, r) => sum + r.stops.reduce((s, st) => s + st.items.length, 0), 0);
        if (itemsInRoutes < this.finalActiveItems.length) {
            unreachablePenalty = (this.finalActiveItems.length - itemsInRoutes) * 5000;
        }

        routes.forEach(route => {
            if (route.vehicle.isRental) rentalCost += 200;
            for (let i = 0; i < route.path.length - 1; i++) {
                const [lat1, lon1] = route.path[i];
                const [lat2, lon2] = route.path[i+1];
                totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
            }
        });

        return totalDistance + rentalCost + unreachablePenalty;
    }

    evolve(population) {
        const newPopulation = [];
        const sorted = population.sort((a, b) => a.fitness - b.fitness);
        const elites = sorted.slice(0, Math.floor(this.populationSize * 0.2));
        newPopulation.push(...elites);

        while (newPopulation.length < this.populationSize) {
            let parent = elites[Math.floor(Math.random() * elites.length)];
            let newChrom = this.mutate(this.extractChromosome(parent));
            newPopulation.push(this.decode(newChrom));
        }
        return newPopulation;
    }

    extractChromosome(individual) {
        return individual.routes.flatMap(r => r.stops.flatMap(s => s.items));
    }

    mutate(chromosome) {
        if (Math.random() < this.mutationRate) {
            const idx1 = Math.floor(Math.random() * chromosome.length);
            const idx2 = Math.floor(Math.random() * chromosome.length);
            [chromosome[idx1], chromosome[idx2]] = [chromosome[idx2], chromosome[idx1]];
        }
        return chromosome;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getBestIndividual(population) {
        return population.reduce((prev, curr) => (prev.fitness < curr.fitness ? prev : curr));
    }
}

module.exports = GeneticAlgorithmService;