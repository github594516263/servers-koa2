/**
 * 操作日志模型
 * 记录用户的增删改操作
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const OperationLog = sequelize.define('OperationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作用户名'
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作模块：auth/user/role/menu/task/article'
  },
  action: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '操作类型：create/update/delete/login/logout'
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: '请求方法：POST/PUT/DELETE'
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '请求路径'
  },
  ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '请求IP'
  },
  params: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '请求参数（JSON）'
  },
  result: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'success',
    comment: '操作结果：success/fail'
  },
  detail: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '操作描述'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '耗时（ms）'
  }
}, {
  tableName: 'operation_logs',
  timestamps: true,
  updatedAt: false,
  underscored: true,
  comment: '操作日志表'
})

module.exports = OperationLog
