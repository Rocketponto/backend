const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('DIRETOR', 'MEMBRO'),
    allowNull: false,
    defaultValue: 'MEMBRO'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

User.prototype.checkPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function() {
  const user = { ...this.get() };
  delete user.password;
  return user;
};

// Adicionar no model User

User.addHook('afterCreate', async (user, options) => {
  const walletService = require('../services/wallet.service');

  try {
    await walletService.createWallet(user.id);
    console.log(`✅ Carteira criada para usuário: ${user.name}`);
  } catch (error) {
    console.error(`❌ Erro ao criar carteira para ${user.name}:`, error);
  }
});

module.exports = User;