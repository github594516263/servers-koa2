const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * 用户模型（重新设计版本）
 * 
 * 主要变更：
 * - 删除 roles JSON 字段，通过 user_roles 表关联
 * - 删除 permissions JSON 字段，权限通过角色获得
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名',
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码（加密）',
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '昵称',
  },
  avatar: {
    type: DataTypes.STRING(255),
    defaultValue: null,
    comment: '头像URL',
  },
  email: {
    type: DataTypes.STRING(100),
    defaultValue: null,
    comment: '邮箱',
  },
  phone: {
    type: DataTypes.STRING(20),
    defaultValue: null,
    comment: '手机号',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1=正常，0=禁用',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    defaultValue: null,
    comment: '最后登录时间',
  },
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true, // 软删除
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  indexes: [
    {
      fields: ['username'],
      name: 'idx_username'
    },
    {
      fields: ['status'],
      name: 'idx_status'
    }
  ]
})

module.exports = User

