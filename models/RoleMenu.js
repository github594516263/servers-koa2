const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * 角色菜单关联表
 * 用于管理角色和菜单的多对多关系
 */
const RoleMenu = sequelize.define('RoleMenu', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '角色ID',
  },
  menuId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '菜单ID',
  },
}, {
  tableName: 'role_menus',
  timestamps: true,
  paranoid: false, // 不需要软删除
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      unique: true,
      fields: ['roleId', 'menuId'],
      name: 'uk_role_menu'
    },
    {
      fields: ['roleId'],
      name: 'idx_role_id'
    },
    {
      fields: ['menuId'],
      name: 'idx_menu_id'
    }
  ]
})

module.exports = RoleMenu

