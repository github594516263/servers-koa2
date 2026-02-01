const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * 权限模型（简化版本）
 * 
 * 主要变更：
 * - 删除 parentId 字段（层级关系由 Menu 管理）
 * - 删除 type 字段（不再存储菜单类型）
 * - 删除 sort 字段（排序由 Menu 管理）
 * - 新增 category 字段（权限分类）
 * - 简化为纯权限管理
 */
const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '权限码（唯一标识）',
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '权限名称',
  },
  description: {
    type: DataTypes.STRING(200),
    defaultValue: null,
    comment: '权限描述',
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: null,
    comment: '权限分类（如：user, role, menu）',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1=启用，0=禁用',
  },
}, {
  tableName: 'permissions',
  timestamps: true,
  paranoid: true, // 软删除
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  indexes: [
    {
      unique: true,
      fields: ['code'],
      name: 'uk_code'
    },
    {
      fields: ['category'],
      name: 'idx_category'
    },
    {
      fields: ['status'],
      name: 'idx_status'
    }
  ]
})

module.exports = Permission

