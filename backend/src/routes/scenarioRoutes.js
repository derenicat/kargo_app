const express = require('express');
const router = express.Router();
const scenarioController = require('../controllers/scenarioController');

router.post('/', scenarioController.createScenario);
router.get('/', scenarioController.getAllScenarios);
router.get('/:id', scenarioController.getScenarioById);

module.exports = router;
