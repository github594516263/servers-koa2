/**
 * 数据字典项模型
 * 字典具体选项，属于某个字典类型
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const DictItem = sequelize.define('DictItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dictId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '所属字典ID'
  },
  label: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '显示标签，如：进行中'
  },
  value: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '选项值，如：in_progress'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序号，越小越靠前'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：1启用 0禁用'
  },
  cssClass: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '样式属性，如 el-tag 的 type: success/warning/danger/info'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'dict_items',
  timestamps: true,
  underscored: true,
  comment: '数据字典项表'
})

module.exports = DictItem
