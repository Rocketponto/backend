const express = require('express');
const pointRecordController = require('../controllers/pointRecord.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

router.post('/', pointRecordController.savePointRecord);
router.get('/my-records', pointRecordController.listUserPointRecords);
router.get('/status', pointRecordController.getUserStatus);

router.get('/all', authorize('DIRETOR'), pointRecordController.getAllPointRecords);

module.exports = router;