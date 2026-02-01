const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * 用户角色关联表
 * 管理用户和角色的多对多关系
 */
const UserRole = sequelize.define('UserRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID',
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '角色ID',
  },
}, {
  tableName: 'user_roles',
  timestamps: true,
  paranoid: false,
  createdAt: 'createdAt',
  updatedAt: false, // 不需要 updatedAt
  indexes: [
    {
      unique: true,
      fields: ['userId', 'roleId'],
      name: 'uk_user_role'
    },
    {
      fields: ['userId'],
      name: 'idx_user_id'
    },
    {
      fields: ['roleId'],
      name: 'idx_role_id'
    }
  ]
})

module.exports = UserRole

