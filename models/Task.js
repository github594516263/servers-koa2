/**
 * 任务模型
 * 用于练习操作权限和状态流转权限
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '任务标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '任务描述'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    comment: '优先级'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
    comment: '状态：pending待处理/in_progress进行中/completed已完成/cancelled已取消'
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '创建者ID'
  },
  assigneeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '执行者ID（被分配人）'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '截止日期'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '完成时间'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
  comment: '任务表'
})

module.exports = Task

