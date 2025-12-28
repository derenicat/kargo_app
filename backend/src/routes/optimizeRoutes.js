const express = require('express');
const router = express.Router();
const optimizeController = require('../controllers/optimizeController');

router.post('/simulate', optimizeController.runOptimization);
router.post('/save', optimizeController.saveScenario);
router.get('/saved', optimizeController.getSavedScenario); // YENİ
router.get('/summary', optimizeController.getOptimizationSummary);
router.delete('/reset-all', optimizeController.resetAllData); // YENİ
router.delete('/:id', optimizeController.deleteScenario);

module.exports = router;
