'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('point_records', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      entry_date_hour: {
        type: Sequelize.DATE,
        allowNull: false
      },
      exit_date_hour: {
        type: Sequelize.DATE,
        allowNull: true
      },
      point_record_status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS'),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('point_records', ['user_id']);
    await queryInterface.addIndex('point_records', ['entry_date_hour']);
    await queryInterface.addIndex('point_records', ['point_record_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('point_records');
  }
};