const pointRecordService = require('../services/pointRecord.service');

class PointRecordController {

  async savePointRecord(req, res) {
    try {
      const userId = req.user.id; // Vem do middleware de auth
      const { description } = req.body;

      const pointRecord = await pointRecordService.savePointRecord(userId, description);

      res.status(201).json({
        success: true,
        message: 'Registro de ponto salvo com sucesso',
        data: pointRecord
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async listUserPointRecords(req, res) {
    try {
      const userId = req.user.id;
      const pointRecords = await pointRecordService.listRecordPointsByUser(userId);

      res.json({
        success: true,
        data: pointRecords
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllPointRecords(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await pointRecordService.getAllPointRecords(page, limit);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUserStatus(req, res) {
    try {
      const userId = req.user.id;
      const status = await pointRecordService.getUserCurrentStatus(userId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PointRecordController();