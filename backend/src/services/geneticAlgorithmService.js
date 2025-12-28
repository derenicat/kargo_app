const { calculateDistance } = require('../utils/haversine');

class GeneticAlgorithmService {
  constructor(stations, cargoItems, vehicles, options = {}) {
    this.stations = stations;
    this.cargoItems = JSON.parse(JSON.stringify(cargoItems)).map((i) => ({
      ...i,
      weight: parseFloat(i.weight),
    }));
    this.vehicles = JSON.parse(JSON.stringify(vehicles));
    this.mode = options.mode || 'unlimited';

    this.endPoint =
      stations.find(
        (s) => s.name === 'Kocaeli Üniversitesi Umuttepe Kampüsü'
      ) || stations[stations.length - 1];
    this.depot =
      stations.find((s) => s.name === 'İzmit' || s.name === 'İzmit Merkez') ||
      stations[0];

    this.activeItems = this.cargoItems.filter(
      (item) => item.station_id !== this.endPoint.id
    );

    this.rentalTemplate = this.vehicles.find((v) => v.is_rental === true) || {
      id: 999,
      name: 'Kiralık Araç',
      capacity: 500,
      is_rental: true,
    };
    this.ownFleet = this.vehicles.filter((v) => v.is_rental === false);

    this.distMatrix = {};
    this.precomputeDistances();

    this.populationSize = 50;
    this.generations = 100;
    this.mutationRate = 0.2;
    this.logs = [];
    this.initialRejected = [];
  }

  addLog(message) {
    this.logs.push(`[${new Date().toLocaleTimeString('tr-TR')}] ${message}`);
  }

  precomputeDistances() {
    this.stations.forEach((s1) => {
      this.distMatrix[s1.id] = {};
      this.stations.forEach((s2) => {
        const d = calculateDistance(
          s1.latitude,
          s1.longitude,
          s2.latitude,
          s2.longitude
        );
        this.distMatrix[s1.id][s2.id] = isNaN(d) ? 0 : d; // Hata buradaydi, duzeltildi
      });
    });
  }

  solve() {
    this.addLog(`Optimizasyon basladi. Mod: ${this.mode.toUpperCase()}`);

    let itemsToProcess = [...this.activeItems];
    if (this.mode !== 'unlimited') {
      const totalCap = this.ownFleet.reduce((s, v) => s + v.capacity, 0);
      itemsToProcess.sort((a, b) =>
        this.mode === 'max_weight' ? b.weight - a.weight : a.weight - b.weight
      );

      let currentSum = 0;
      const selected = [];
      for (const item of itemsToProcess) {
        if (currentSum + item.weight <= totalCap) {
          selected.push(item);
          currentSum += item.weight;
        }
      }
      this.initialRejected = itemsToProcess.filter(
        (i) => !selected.includes(i)
      );
      itemsToProcess = selected;
    }
    this.finalActiveItems = itemsToProcess;

    let population = Array.from({ length: this.populationSize }, () =>
      this.shuffle([...this.finalActiveItems])
    );
    let scoredPop = population.map((chrom) => this.decode(chrom));

    for (let g = 0; g < this.generations; g++) {
      scoredPop = this.evolve(scoredPop);
      if (g % 10 === 0) {
        const best = scoredPop.reduce((p, c) =>
          p.fitness < c.fitness ? p : c
        );
        this.addLog(
          `Jenerasyon ${g}: En iyi maliyet = ${best.fitness.toFixed(2)}`
        );
      }
    }

    const finalBest = scoredPop.reduce((p, c) =>
      p.fitness < c.fitness ? p : c
    );
    const finalRejected = [...this.initialRejected, ...finalBest.unpackedItems];

    // KRITIK: Kullaniciya ceza puanlarindan arindirilmis GERCEK operasyonel maliyeti dön
    // Individual cost'lar zaten cezasiz mesafeleri iceriyor.
    const realFitness = finalBest.routes.reduce(
      (sum, r) => sum + r.individual_cost,
      0
    );

    this.addLog(
      `Bitti. Tasinan: ${
        this.activeItems.length - finalRejected.length
      }, Tasinamayan: ${finalRejected.length}`
    );

    return {
      ...finalBest,
      fitness: realFitness, // ARTIK GERCEK MALIYET
      logs: this.logs,
      rejectedItems: finalRejected,
    };
  }

  calculateFitness(chromosome) {
    return this.decode(chromosome).fitness;
  }

  decode(chromosome) {
    const routes = [];
    let fleet = JSON.parse(JSON.stringify(this.ownFleet));
    let vIdx = 0;
    let currentItems = [];
    let currentLoad = 0;
    const unpackedItems = [];
    const processedIds = new Set();

    for (let i = 0; i < chromosome.length; i++) {
      const item = chromosome[i];
      if (processedIds.has(item.id)) continue;

      let vehicle = fleet[vIdx];
      if (!vehicle) {
        if (this.mode === 'unlimited') {
          vehicle = JSON.parse(JSON.stringify(this.rentalTemplate));
          fleet.push(vehicle);
        } else {
          unpackedItems.push(item);
          continue;
        }
      }

      if (currentLoad + item.weight <= vehicle.capacity) {
        currentItems.push(item);
        currentLoad += item.weight;
        processedIds.add(item.id);
      } else {
        if (currentItems.length > 0) {
          routes.push(this.buildRoute(vehicle, currentItems, currentLoad));
        }
        vIdx++;
        currentItems = [];
        currentLoad = 0;
        i--;
      }
    }

    if (currentItems.length > 0 && vIdx < fleet.length) {
      routes.push(this.buildRoute(fleet[vIdx], currentItems, currentLoad));
    }

    let fitness = routes.reduce((sum, r) => sum + r.individual_cost, 0);
    fitness += unpackedItems.length * 5000;

    return { routes, fitness, unpackedItems, chromosome: [...chromosome] };
  }

  buildRoute(vehicle, items, load) {
    const stationMap = {};
    items.forEach((it) => {
      if (!stationMap[it.station_id]) {
        const st = this.stations.find((s) => s.id === it.station_id);
        stationMap[it.station_id] = {
          id: st.id,
          name: st.name,
          lat: st.latitude,
          lng: st.longitude,
          items: [],
          weight: 0,
        };
      }
      stationMap[it.station_id].items.push(it);
      stationMap[it.station_id].weight += it.weight;
    });

    let unvisited = Object.values(stationMap);
    let stops = [];
    let current = this.depot;
    let startFound = false;

    // Eger depoda baslayan paketler varsa onlari ilk durağa alalım
    while (unvisited.length > 0) {
      unvisited.sort(
        (a, b) =>
          this.distMatrix[current.id][a.id] - this.distMatrix[current.id][b.id]
      );
      let next = unvisited.shift();
      if (!startFound) {
        stops.push({ ...next, isOrigin: true });
        startFound = true;
      } else stops.push(next);
      current = next;
    }

    stops.push({
      id: this.endPoint.id,
      name: this.endPoint.name,
      lat: this.endPoint.latitude,
      lng: this.endPoint.longitude,
      isDestination: true,
      items: [],
      weight: 0,
    });

    let cost = 0;
    // Eger aracın baslangıc noktası depodan farklıysa, depodan oraya gidis maliyetini ekleyelim
    cost += this.distMatrix[this.depot.id][stops[0].id];
    for (let i = 0; i < stops.length - 1; i++) {
      cost += this.distMatrix[stops[i].id][stops[i + 1].id];
    }

    return {
      vehicle: JSON.parse(JSON.stringify(vehicle)),
      load,
      individual_cost: cost + (vehicle.is_rental ? 200 : 0),
      stops: stops.map((s) => ({
        ...s,
        cargo_count: s.items.length,
        total_weight: s.weight,
      })),
      path: [
        [this.depot.latitude, this.depot.longitude],
        ...stops.map((s) => [s.lat, s.lng]),
      ],
    };
  }

  evolve(scoredPop) {
    const sorted = scoredPop.sort((a, b) => a.fitness - b.fitness);
    const eliteCount = Math.max(1, Math.floor(this.populationSize * 0.2));
    const elites = sorted
      .slice(0, eliteCount)
      .map((p) => ({ ...p, chromosome: [...p.chromosome] }));
    const newPop = [...elites];

    while (newPop.length < this.populationSize) {
      let parent = elites[Math.floor(Math.random() * elites.length)];
      let childChrom = this.mutate([...parent.chromosome]);
      newPop.push(this.decode(childChrom));
    }
    return newPop;
  }

  shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }
  mutate(chrom) {
    const newChrom = [...chrom];
    if (newChrom.length < 2) return newChrom;
    const i = Math.floor(Math.random() * newChrom.length);
    const j = Math.floor(Math.random() * newChrom.length);
    [newChrom[i], newChrom[j]] = [newChrom[j], newChrom[i]];
    return newChrom;
  }
}

module.exports = GeneticAlgorithmService;
