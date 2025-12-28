const { calculateDistance } = require('../utils/haversine');

class GeneticAlgorithmService {
    constructor(stations, cargoItems, vehicles, options = {}) {
        this.stations = stations;
        this.cargoItems = cargoItems;
        this.vehicles = JSON.parse(JSON.stringify(vehicles));
        this.mode = options.mode || 'unlimited';
        
        this.endPoint = stations.find(s => s.name.includes('Umuttepe')) || stations[stations.length - 1];
        this.depot = stations.find(s => s.name === 'İzmit' || s.name === 'İzmit Merkez') || stations[0];

        this.activeItems = cargoItems.filter(item => item.station_id !== this.endPoint.id);
        
        this.distMatrix = {};
        this.precomputeDistances();

        this.popSize = 50;
        this.generations = 100;
        this.mutationRate = 0.2;
    }

    precomputeDistances() {
        this.stations.forEach(s1 => {
            this.distMatrix[s1.id] = {};
            this.stations.forEach(s2 => {
                const d = calculateDistance(s1.latitude, s1.longitude, s2.latitude, s2.longitude);
                this.distMatrix[s1.id][s2.id] = d || 0;
            });
        });
    }

    solve() {
        let itemsToProcess = [...this.activeItems];
        if (this.mode !== 'unlimited') {
            const totalCap = this.vehicles.reduce((s, v) => s + v.capacity, 0);
            itemsToProcess.sort((a, b) => this.mode === 'max_weight' ? b.weight - a.weight : a.weight - b.weight);
            let currentSum = 0;
            const selected = [];
            for (const item of itemsToProcess) {
                if (currentSum + item.weight <= totalCap) {
                    selected.push(item);
                    currentSum += item.weight;
                }
            }
            this.rejectedItems = itemsToProcess.filter(i => !selected.includes(i));
            itemsToProcess = selected;
        }
        this.finalItems = itemsToProcess;

        let population = Array.from({ length: this.popSize }, () => this.shuffle([...this.finalItems]));
        
        for (let g = 0; g < this.generations; g++) {
            const scoredPop = population.map(chrom => ({
                chrom,
                fitness: this.calculateFitness(chrom)
            })).sort((a, b) => a.fitness - b.fitness);

            const nextGen = scoredPop.slice(0, 10).map(p => p.chrom);
            while (nextGen.length < this.popSize) {
                const parent = nextGen[Math.floor(Math.random() * nextGen.length)];
                nextGen.push(this.mutate([...parent]));
            }
            population = nextGen;
        }

        const bestChrom = population[0];
        const result = this.decode(bestChrom);
        return { ...result, rejectedItems: this.rejectedItems || [] };
    }

    calculateFitness(chromosome) {
        return this.decode(chromosome).fitness;
    }

    decode(chromosome) {
        const routes = [];
        let fleet = JSON.parse(JSON.stringify(this.vehicles));
        let vehicleIdx = 0;
        let currentItems = [];
        let currentLoad = 0;

        for (let i = 0; i < chromosome.length; i++) {
            const item = chromosome[i];
            let vehicle = fleet[vehicleIdx];

            if (currentLoad + item.weight <= vehicle.capacity) {
                currentItems.push(item);
                currentLoad += item.weight;
            } else {
                if (currentItems.length > 0) routes.push(this.buildRoute(vehicle, currentItems, currentLoad));
                vehicleIdx++;
                if (vehicleIdx >= fleet.length) {
                    if (this.mode === 'unlimited') {
                        const newV = { id: 999+fleet.length, name: `Kiralık Araç`, capacity: 500, is_rental: true };
                        fleet.push(newV);
                        vehicle = newV;
                    } else break;
                }
                currentItems = [item];
                currentLoad = item.weight;
            }
        }
        if (currentItems.length > 0 && vehicleIdx < fleet.length) {
            routes.push(this.buildRoute(fleet[vehicleIdx], currentItems, currentLoad));
        }

        const totalDist = routes.reduce((sum, r) => sum + r.individual_cost, 0);
        const totalRental = routes.filter(r => r.vehicle.is_rental).length * 200;
        return { routes, fitness: totalDist + totalRental };
    }

    buildRoute(vehicle, items, load) {
        // İstasyonları grupla
        const stationMap = {};
        items.forEach(it => {
            if (!stationMap[it.station_id]) {
                const st = this.stations.find(s => s.id === it.station_id);
                stationMap[it.station_id] = { 
                    id: st.id, name: st.name, lat: st.latitude, lng: st.longitude, 
                    items: [], weight: 0 
                };
            }
            stationMap[it.station_id].items.push(it);
            stationMap[it.station_id].weight += it.weight;
        });

        let unvisited = Object.values(stationMap);
        let stops = [];
        let current = unvisited.shift(); // İlk paketin istasyonundan başla
        stops.push({...current, isOrigin: true}); // Bu rotanın başlangıcı

        while (unvisited.length > 0) {
            unvisited.sort((a, b) => this.distMatrix[current.id][a.id] - this.distMatrix[current.id][b.id]);
            current = unvisited.shift();
            stops.push(current);
        }

        // Varis Noktasi Ekle
        stops.push({ 
            id: this.endPoint.id, name: this.endPoint.name, 
            lat: this.endPoint.latitude, lng: this.endPoint.longitude, 
            isDestination: true, items: [], weight: 0 
        });

        // Maliyet
        let cost = 0;
        for (let i = 0; i < stops.length - 1; i++) {
            cost += this.distMatrix[stops[i].id][stops[i+1].id];
        }

        return {
            vehicle,
            load,
            individual_cost: cost,
            stops: stops.map(s => ({
                ...s,
                cargo_count: s.items.length,
                total_weight: s.weight
            })),
            path: stops.map(s => [s.lat, s.lng])
        };
    }

    shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }
    mutate(chrom) {
        if (chrom.length < 2) return chrom;
        const i = Math.floor(Math.random() * chrom.length);
        const j = Math.floor(Math.random() * chrom.length);
        [chrom[i], chrom[j]] = [chrom[j], chrom[i]];
        return chrom;
    }
}

module.exports = GeneticAlgorithmService;
