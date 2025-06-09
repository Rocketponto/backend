const express = require('express');
const pointRecordController = require('../controllers/pointRecord.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', pointRecordController.savePointRecord);
router.get('/my-records/:userId', pointRecordController.listUserPointRecords);
router.get('/status', pointRecordController.getUserStatus);
router.get('/get-last-point/:userId', pointRecordController.getLastPoint)

router.get('/all', authorize('DIRETOR'), pointRecordController.getAllPointRecords);
router.put('/closed-point/:pointRecordId', authorize('DIRETOR'), pointRecordController.closedPoint)

module.exports = router;