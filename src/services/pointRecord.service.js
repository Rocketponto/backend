const PointRecord = require('../models/PointRecord');
const User = require('../models/User');
const { Op } = require('sequelize');

class PointRecordService {

  async savePointRecord(userId, description = null) {
    try {
      const userExists = await User.findByPk(userId);
      if (!userExists) {
        throw new Error('User not found');
      }

      const lastPointRecord = await PointRecord.findOne({
        where: { userId: userId },
        order: [['entryDateHour', 'DESC']]
      });

      const entryDateTime = new Date();

      if (!lastPointRecord || lastPointRecord.exitDateHour !== null) {
        const pointRecord = await PointRecord.create({
          userId: userId,
          entryDateHour: entryDateTime,
          exitDateHour: null,
          pointRecordStatus: 'IN_PROGRESS',
          description: null
        });

        return await this.getPointRecordWithUser(pointRecord.id);
      } else {
        if (!description || description.trim() === '') {
          throw new Error('Descrição é obrigatória para registrar saída');
        }

        const exitDateTime = new Date();
        await lastPointRecord.update({
          exitDateHour: exitDateTime,
          pointRecordStatus: 'APPROVED',
          description: description.trim()
        });

        return await this.getPointRecordWithUser(lastPointRecord.id);
      }
    } catch (error) {
      throw new Error(`Erro ao salvar registro de ponto: ${error.message}`);
    }
  }

  async listRecordPointsByUser(userId, page = 1, limit = 10) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const offset = (page - 1) * limit;

      const { rows: pointRecords, count } = await PointRecord.findAndCountAll({
        where: { userId: userId },
        order: [['entryDateHour', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const pointRecordsWithUser = pointRecords.map(record => ({
        ...record.toJSON(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }));

      return {
        data: this.formatPointRecordsList(pointRecordsWithUser),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        },
        summary: {
          totalRecords: count,
          recordsInProgress: pointRecordsWithUser.filter(r => r.pointRecordStatus === 'IN_PROGRESS').length,
          recordsApproved: pointRecordsWithUser.filter(r => r.pointRecordStatus === 'APPROVED').length
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar registros de ponto: ${error.message}`);
    }
  }

  async getLastPoint(userId) {
    try {
      const lastPoint = await PointRecord.findOne({
        where: { userId: userId },
        order: [['created_at',  'DESC']]
      })

      if(!lastPoint) {
        return {
          success: false,
          message: 'Nenhum registro encontrado',
          lastPointRecord: null
        }
      }

      return {
        lastPointRecord: lastPoint,
        success: true
      }
    } catch (error) {
      throw new Error('Erro interno ao buscar ultimo registro.', error.message)
    }
  }

  async getAllPointRecords(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { rows, count } = await PointRecord.findAndCountAll({
        order: [['entryDateHour', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const pointRecordsWithUser = await Promise.all(
        rows.map(async (record) => {
          const userData = await User.findByPk(record.userId, {
            attributes: ['id', 'name', 'email']
          });
          return {
            ...record.toJSON(),
            user: userData
          };
        })
      );

      return {
        data: this.formatPointRecordsList(pointRecordsWithUser),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar todos os registros: ${error.message}`);
    }
  }

  async getPointRecordById(id) {
    try {
      const pointRecord = await PointRecord.findByPk(id);
      if (!pointRecord) {
        throw new Error('Registro de ponto não encontrado');
      }

      const userData = await User.findByPk(pointRecord.userId, {
        attributes: ['id', 'name', 'email']
      });

      return {
        ...pointRecord.toJSON(),
        user: userData
      };
    } catch (error) {
      throw new Error(`Erro ao buscar registro: ${error.message}`);
    }
  }

  async closePoint(id) {
    try {
      const pointRecord = await PointRecord.findByPk(id)

      if (!pointRecord) {
        throw new Error('Registro de ponto não encontrado.')
      }

      if (pointRecord.exitDateHour) {
        throw new Error('Esse ponto já esta fechado')
      }

      const exitTime = new Date()

      const closedPoint = await PointRecord.update({
        pointRecordStatus: 'APPROVED',
        description: 'Ponto fechado por diretor.',
        exitDateHour: exitTime
      },  { where: { id }
    })

      return {
        status_point_record: closedPoint.point_record_status,
      }
    } catch (error) {
      throw new Error('Erro interno ao fechar ponto.')
    }
  }

  async getUserCurrentStatus(userId) {
    try {
      const lastPointRecord = await PointRecord.findOne({
        where: { userId: userId },
        order: [['entryDateHour', 'DESC']]
      });

      if (!lastPointRecord) {
        return { status: 'NO_RECORDS', message: 'Nenhum registro encontrado' };
      }

      const userData = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email']
      });

      const isWorking = lastPointRecord.exitDateHour === null;

      return {
        status: isWorking ? 'WORKING' : 'NOT_WORKING',
        message: isWorking ? 'Usuário está trabalhando' : 'Usuário não está trabalhando',
        lastRecord: this.formatPointRecord({
          ...lastPointRecord.toJSON(),
          user: userData
        })
      };
    } catch (error) {
      throw new Error(`Erro ao verificar status do usuário: ${error.message}`);
    }
  }

  async getPointRecordWithUser(id) {
    const pointRecord = await PointRecord.findByPk(id);
    if (!pointRecord) return null;

    const userData = await User.findByPk(pointRecord.userId, {
      attributes: ['id', 'name', 'email']
    });

    return {
      ...pointRecord.toJSON(),
      user: userData
    };
  }

  formatPointRecordsList(pointRecords) {
    return pointRecords.map(record => this.formatPointRecord(record));
  }

  formatPointRecord(record) {
    const workingHours = this.calculateWorkingHours(record.entryDateHour, record.exitDateHour);

    return {
      id: record.id,
      userId: record.userId,
      user: record.user ? {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email
      } : null,
      entryDateHour: record.entryDateHour,
      exitDateHour: record.exitDateHour,
      pointRecordStatus: record.pointRecordStatus,
      description: record.description,
      workingHours: workingHours,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  calculateWorkingHours(entryDate, exitDate) {
    if (!exitDate) return null;

    const entry = new Date(entryDate);
    const exit = new Date(exitDate);
    const diffMs = exit - entry;
    const diffHours = diffMs / (1000 * 60 * 60);

    return {
      hours: Math.floor(diffHours),
      minutes: Math.floor((diffHours % 1) * 60),
      totalHours: parseFloat(diffHours.toFixed(2))
    };
  }
}

module.exports = new PointRecordService();