const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const RolePermission = sequelize.define('RolePermission', {
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
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '权限ID',
  },
}, {
  tableName: 'role_permissions',
  timestamps: true,
  paranoid: false, // 不需要软删除
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      unique: true,
      fields: ['roleId', 'permissionId']
    }
  ]
})

module.exports = RolePermission

