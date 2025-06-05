const PointRecord = require('../models/PointRecord');
const User = require('../models/User');
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

module.exports = {
  PointRecord,
  User,
  //Justification
};