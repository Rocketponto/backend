const PointRecord = require('../models/PointRecord');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
//const Justification = require('./Justification');

PointRecord.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(PointRecord, {
  foreignKey: 'userId',
  as: 'pointRecords'
});

/*
PointRecord.hasOne(Justification, {
  foreignKey: 'pointRecordId',
  as: 'justification'
});

Justification.belongsTo(PointRecord, {
  foreignKey: 'pointRecordId',
  as: 'pointRecord'
});
*/

User.hasOne(Wallet, {
  foreignKey: 'userId',
  as: 'wallet',
  onDelete: 'CASCADE'
});
Wallet.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Wallet -> Transactions (1:N)
Wallet.hasMany(Transaction, {
  foreignKey: 'walletId',
  as: 'transactions',
  onDelete: 'CASCADE'
});
Transaction.belongsTo(Wallet, {
  foreignKey: 'walletId',
  as: 'wallet'
});

// User -> Transactions (para processedBy)
User.hasMany(Transaction, {
  foreignKey: 'processedBy',
  as: 'processedTransactions'
});
Transaction.belongsTo(User, {
  foreignKey: 'processedBy',
  as: 'processor'
});

module.exports = {
  PointRecord,
  User,
  Wallet,
  Transaction
  //Justification
};