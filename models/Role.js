const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * 角色模型（更新关联关系）
 */
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '角色名称',
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色编码（唯一标识）',
  },
  description: {
    type: DataTypes.STRING(200),
    defaultValue: null,
    comment: '角色描述',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1=启用，0=禁用',
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序（数字越小越靠前）',
  },
}, {
  tableName: 'roles',
  timestamps: true,
  paranoid: true, // 软删除
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  indexes: [
    {
      fields: ['code'],
      name: 'idx_code'
    },
    {
      fields: ['status'],
      name: 'idx_status'
    }
  ]
})

module.exports = Role

