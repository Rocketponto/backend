const { use } = require('../routes/pointRecord.route');
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

  async closedPoint(req, res) {
    try {
      const { pointRecordId } = req.params

      await pointRecordService.closePoint(pointRecordId)

      res.status(201).json({
        success: true,
        message: 'Ponto fechado com sucesso!'
       })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao fechar ponto.'
      })
    }
  }

  async getLastPoint(req, res) {
    try {
      const { userId } = req.params

      const lastPoint = await pointRecordService.getLastPoint(userId)

      res.status(200).json(lastPoint)
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  async listUserPointRecords(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'ID do usuário inválido'
        });
      }

      if (page < 1 || limit < 1) {
        return res.status(400).json({
          success: false,
          error: 'Página e limite devem ser maiores que 0'
        });
      }

      if (limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Limite máximo de 100 registros por página'
        });
      }

      const result = await pointRecordService.listRecordPointsByUser(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
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