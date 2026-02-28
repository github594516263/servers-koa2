/**
 * 通知模型（站内信）
 * 支持系统通知、任务分配、状态变更等场景
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '接收用户ID',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '通知标题',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '通知内容',
  },
  type: {
    type: DataTypes.ENUM('system', 'task', 'article', 'other'),
    defaultValue: 'system',
    comment: '通知类型：system=系统通知, task=任务通知, article=文章通知, other=其他',
  },
  isRead: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否已读：0=未读, 1=已读',
  },
  readAt: {
    type: DataTypes.DATE,
    defaultValue: null,
    comment: '阅读时间',
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '发送者ID（系统通知为空）',
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联业务ID（如任务ID、文章ID）',
  },
  relatedType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '关联业务类型（如 task, article）',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  indexes: [
    {
      fields: ['userId'],
      name: 'idx_user_id'
    },
    {
      fields: ['isRead'],
      name: 'idx_is_read'
    },
    {
      fields: ['type'],
      name: 'idx_type'
    },
    {
      fields: ['userId', 'isRead'],
      name: 'idx_user_read'
    },
    {
      fields: ['createdAt'],
      name: 'idx_created_at'
    }
  ]
})

module.exports = Notification
