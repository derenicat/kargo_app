const express = require('express');
const router = express.Router();
const cargoController = require('../controllers/cargoController');

router.post('/', cargoController.addCargo);
router.get('/', cargoController.getCargoByDate);
router.post('/load-template', cargoController.loadScenarioTemplate);
router.post('/seed-random', cargoController.seedRandomCargo);

module.exports = router;