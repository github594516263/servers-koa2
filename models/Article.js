/**
 * 文章模型
 * 用于练习数据权限：普通用户只能看自己的，管理员可以看所有
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '文章标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '文章内容'
  },
  summary: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '文章摘要'
  },
  cover: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图片'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'default',
    comment: '文章分类'
  },
  tags: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '标签，逗号分隔'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft',
    comment: '状态：draft草稿/published发布/archived归档'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览次数'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '作者ID'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '发布时间'
  }
}, {
  tableName: 'articles',
  timestamps: true,
  underscored: true,
  comment: '文章表'
})

module.exports = Article

