const { calculateDistance } = require('../utils/haversine');

class GeneticAlgorithmService {
    constructor(stations, demands, vehicles, options = {}) {
        this.stations = stations;
        this.demands = demands;
        this.vehicles = vehicles;
        
        // Bitiş Noktası: Kocaeli Üniversitesi Umuttepe Kampüsü
        // Veritabanından gelen stations listesinde ismi 'Umuttepe' veya 'Kampüs' içeren kaydı bul.
        // Eğer bulamazsa, listenin son elemanını varsay.
        this.endPoint = stations.find(s => 
            s.name.toLowerCase().includes('umuttepe') || 
            s.name.toLowerCase().includes('kampüs') ||
            s.name.toLowerCase().includes('universitesi')
        ) || stations[stations.length - 1];
        
        // Çıkış Noktası: İzmit Merkez (Varsayılan depo) veya serbest bırakılabilir
        this.depot = stations.find(s => s.name === 'İzmit' || s.name === 'İzmit Merkez') || stations[0];
        
        this.populationSize = options.populationSize || 50;
        this.generations = options.generations || 100;
        this.mutationRate = options.mutationRate || 0.1;
    }

    solve() {
        let population = this.initializePopulation();

        for (let g = 0; g < this.generations; g++) {
            population = this.evolve(population);
        }

        return this.getBestIndividual(population);
    }

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
     * Kromozomu rotalara dönüştürür.
     * Kural: Her araç rotasını tamamladığında Umuttepe'ye gider.
     */
    decode(chromosome) {
        let routes = [];
        let currentVehicleIndex = 0;
        let currentRoute = [];
        let currentLoad = 0;

        chromosome.forEach(stationId => {
            const demand = this.demands.find(d => d.station_id === stationId);
            // Eğer araç dizisi bittiyse yeni kiralık araç ekle
            if (currentVehicleIndex >= this.vehicles.length) {
                 this.vehicles.push({ 
                     id: this.vehicles.length + 1,
                     name: `Kiralık Araç ${this.vehicles.length + 1}`,
                     capacity: 500, 
                     isRental: true 
                 });
            }
            
            const vehicle = this.vehicles[currentVehicleIndex];

            if (currentLoad + demand.total_weight <= vehicle.capacity) {
                currentRoute.push(stationId);
                currentLoad += demand.total_weight;
            } else {
                // Mevcut rotayı bitir -> SON DURAK UMUTTEPE
                // Başlangıç noktası: Önceki rotanın bittiği yer mi yoksa depo mu?
                // Basitlik için: Depodan çıkıp, işi bitince Umuttepe'ye dönüyor.
                
                // NOT: Gerçekçi olması için rotanın başına Depo(İzmit) eklenebilir.
                // path: [Depo, ...Duraklar, Umuttepe]
                const finalPath = [this.depot.id, ...currentRoute, this.endPoint.id];
                
                routes.push({
                    vehicle: vehicle,
                    path: finalPath,
                    load: currentLoad
                });

                currentVehicleIndex++;
                if (currentVehicleIndex >= this.vehicles.length) {
                     this.vehicles.push({ 
                         id: this.vehicles.length + 1,
                         name: `Kiralık Araç ${this.vehicles.length + 1}`, 
                         capacity: 500, 
                         isRental: true 
                     });
                }
                
                currentRoute = [stationId];
                currentLoad = demand.total_weight;
            }
        });

        // Son rotayı ekle
        if (currentRoute.length > 0) {
            const vehicle = this.vehicles[currentVehicleIndex];
            const finalPath = [this.depot.id, ...currentRoute, this.endPoint.id];
            
            routes.push({
                vehicle: vehicle,
                path: finalPath,
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
                // Eğer istasyon bulunamazsa (örn: Umuttepe henüz DB'de yoksa) hata vermemesi için kontrol
                if (s1 && s2) {
                    totalDistance += calculateDistance(s1.latitude, s1.longitude, s2.latitude, s2.longitude);
                }
            }
        });

        return totalDistance + rentalCost;
    }

    evolve(population) {
        const newPopulation = [];
        const sorted = population.sort((a, b) => a.fitness - b.fitness);
        
        // Elitizm
        const elites = sorted.slice(0, Math.floor(this.populationSize * 0.1));
        newPopulation.push(...elites);

        while (newPopulation.length < this.populationSize) {
            let parent = sorted[Math.floor(Math.random() * (this.populationSize / 2))];
            let newChrom = this.mutate(this.extractChromosome(parent));
            newPopulation.push(this.decode(newChrom));
        }

        return newPopulation;
    }

    extractChromosome(individual) {
        // Rotadan Depo(baş) ve Umuttepe(son) duraklarını çıkarıp saf kromozomu al
        return individual.routes.flatMap(r => r.path.filter(id => id !== this.depot.id && id !== this.endPoint.id));
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