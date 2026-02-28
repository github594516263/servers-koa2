/**
 * 数据字典模型
 * 字典类型表，存储字典分组信息
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Dict = sequelize.define('Dict', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '字典名称，如：任务状态'
  },
  code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '字典编码，如：task_status'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '字典描述'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：1启用 0禁用'
  }
}, {
  tableName: 'dicts',
  timestamps: true,
  underscored: true,
  comment: '数据字典表'
})

module.exports = Dict
