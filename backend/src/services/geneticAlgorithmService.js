const { calculateDistance } = require('../utils/haversine');

class GeneticAlgorithmService {
    constructor(stations, demands, vehicles, options = {}) {
        this.stations = stations; // { id, name, lat, lng }
        this.demands = demands;   // { station_id, weight }
        this.vehicles = vehicles; // [{ id, capacity, isRental }]
        this.depot = stations.find(s => s.name === 'İzmit' || s.name === 'İzmit Merkez') || stations[0]; // Merkez: İzmit
        
        // Genetik Parametreler
        this.populationSize = options.populationSize || 50;
        this.generations = options.generations || 100;
        this.mutationRate = options.mutationRate || 0.1;
    }

    /**
     * Ana çözüm fonksiyonu
     */
    solve() {
        let population = this.initializePopulation();

        for (let g = 0; g < this.generations; g++) {
            population = this.evolve(population);
        }

        return this.getBestIndividual(population);
    }

    /**
     * Başlangıç popülasyonunu oluştur (Rastgele geçerli rotalar)
     */
    initializePopulation() {
        const population = [];
        const stationIds = this.demands.map(d => d.station_id);

        for (let i = 0; i < this.populationSize; i++) {
            let chromosome = this.shuffle([...stationIds]);
            population.push(this.decode(chromosome));
        }
        return population;
    }

    /**
     * Kromozomu (İstasyon sıralaması) araç rotalarına böler (Greedy Split)
     */
    decode(chromosome) {
        let routes = [];
        let currentVehicleIndex = 0;
        let currentRoute = [];
        let currentLoad = 0;

        // Basit bir yaklaşımla: İstasyonları sırayla araçlara doldur
        chromosome.forEach(stationId => {
            const demand = this.demands.find(d => d.station_id === stationId);
            const vehicle = this.vehicles[currentVehicleIndex];

            if (currentLoad + demand.total_weight <= vehicle.capacity) {
                currentRoute.push(stationId);
                currentLoad += demand.total_weight;
            } else {
                // Mevcut rotayı bitir, yeni araca geç
                routes.push({
                    vehicle: vehicle,
                    path: [this.depot.id, ...currentRoute, this.depot.id],
                    load: currentLoad
                });

                currentVehicleIndex++;
                if (currentVehicleIndex >= this.vehicles.length) {
                    // Eğer araç bittiyse (ve kiralama varsa buraya mantık eklenebilir)
                    // Şimdilik ekstra bir kiralık araç simüle et
                    this.vehicles.push({ capacity: 500, isRental: true, name: 'Kiralık Araç' });
                }
                
                currentRoute = [stationId];
                currentLoad = demand.total_weight;
            }
        });

        // Son rotayı ekle
        if (currentRoute.length > 0) {
            routes.push({
                vehicle: this.vehicles[currentVehicleIndex],
                path: [this.depot.id, ...currentRoute, this.depot.id],
                load: currentLoad
            });
        }

        return {
            routes,
            fitness: this.calculateFitness(routes)
        };
    }

    calculateFitness(individual) {
        let totalDistance = 0;
        let rentalCost = 0;

        individual.forEach(route => {
            if (route.vehicle.isRental) rentalCost += 200;

            for (let i = 0; i < route.path.length - 1; i++) {
                const s1 = this.stations.find(s => s.id === route.path[i]);
                const s2 = this.stations.find(s => s.id === route.path[i+1]);
                totalDistance += calculateDistance(s1.latitude, s1.longitude, s2.latitude, s2.longitude);
            }
        });

        return totalDistance + rentalCost;
    }

    evolve(population) {
        // Seçilim, Çaprazlama ve Mutasyon işlemleri burada yapılacak
        // Şimdilik basitleştirilmiş bir elitizm ve rastgele mutasyon
        const newPopulation = [];
        const sorted = population.sort((a, b) => a.fitness - b.fitness);
        
        // Elitizm: En iyi %10'u koru
        const elites = sorted.slice(0, Math.floor(this.populationSize * 0.1));
        newPopulation.push(...elites);

        while (newPopulation.length < this.populationSize) {
            // Basit mutasyon: Rastgele bir bireyi al ve iki istasyonun yerini değiştir
            let parent = sorted[Math.floor(Math.random() * (this.populationSize / 2))]; // Üst yarıdan seç
            let newChrom = this.mutate(this.extractChromosome(parent));
            newPopulation.push(this.decode(newChrom));
        }

        return newPopulation;
    }

    extractChromosome(individual) {
        return individual.routes.flatMap(r => r.path.filter(id => id !== this.depot.id));
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
