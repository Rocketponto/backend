const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointRecord = sequelize.define('PointRecord', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  entryDateHour: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'entry_date_hour'
  },
  exitDateHour: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'exit_date_hour'
  },
  pointRecordStatus: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS'),
    allowNull: true,
    field: 'point_record_status'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'point_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PointRecord;