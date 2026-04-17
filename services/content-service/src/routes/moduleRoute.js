const express = require('express');
const router = express.Router();
const ModuleController = require('../controller/moduleController');

router.post('/', ModuleController.createModule);
router.patch('/:id', ModuleController.updateModule);
router.delete('/:id', ModuleController.deleteModule);
router.patch('/:id/publish', ModuleController.publishModule);
router.get('/', ModuleController.getAllModule);
router.get('/:id', ModuleController.getModuleById);

module.exports = router;
