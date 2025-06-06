const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  walletId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Wallets',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('CREDIT', 'DEBIT'),
    allowNull: false,
    comment: 'CREDIT = ganhou moedas, DEBIT = gastou moedas'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  title: {
   type: DataTypes.STRING(255),
   allowNull: false,
   comment: 'Título da transação'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Descrição da transação'
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Referência externa (ID de ponto, etc.)'
  },
  processedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Usuário que processou a transação (para ajustes manuais)'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'COMPLETED'
  },
  balanceBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Saldo antes da transação'
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Saldo após a transação'
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    {
      fields: ['walletId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['category']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Transaction;