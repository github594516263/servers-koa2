const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * 菜单模型（优化版）
 * 支持：目录、菜单、按钮、内嵌、外链五种类型
 * 支持：徽标系统、细粒度显示控制、固定标签页等功能
 */
const Menu = sequelize.define('Menu', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '菜单ID'
  },
  parent_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '父级菜单ID（0表示顶级）',
    field: 'parent_id'
  },
  type: {
    type: DataTypes.ENUM('directory', 'menu', 'button', 'embed', 'link'),
    allowNull: false,
    defaultValue: 'menu',
    comment: '类型：directory=目录、menu=菜单、button=按钮、embed=内嵌、link=外链'
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '菜单名称（唯一标识）'
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '菜单标题（显示文本）'
  },
  
  // ========== 路由相关 ==========
  path: {
    type: DataTypes.STRING(200),
    defaultValue: null,
    comment: '路由路径'
  },
  component: {
    type: DataTypes.STRING(200),
    defaultValue: null,
    comment: '组件路径'
  },
  redirect: {
    type: DataTypes.STRING(200),
    defaultValue: null,
    comment: '重定向路径'
  },
  active_path: {
    type: DataTypes.STRING(200),
    defaultValue: null,
    comment: '激活路径（高亮菜单用）',
    field: 'active_path'
  },
  
  // ========== 图标相关 ==========
  icon: {
    type: DataTypes.STRING(100),
    defaultValue: null,
    comment: '图标'
  },
  active_icon: {
    type: DataTypes.STRING(100),
    defaultValue: null,
    comment: '激活状态图标',
    field: 'active_icon'
  },
  
  // ========== 徽标系统 ==========
  badge_type: {
    type: DataTypes.ENUM('dot', 'text', 'number'),
    defaultValue: null,
    comment: '徽标类型：dot=圆点、text=文本、number=数字',
    field: 'badge_type'
  },
  badge_content: {
    type: DataTypes.STRING(50),
    defaultValue: null,
    comment: '徽标内容',
    field: 'badge_content'
  },
  badge_style: {
    type: DataTypes.ENUM('primary', 'success', 'warning', 'danger', 'info'),
    defaultValue: null,
    comment: '徽标样式',
    field: 'badge_style'
  },
  
  // ========== 权限相关 ==========
  permission_code: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true, // 允许为空，目录类型不需要权限
    comment: '权限编码（唯一标识，目录类型可为空）',
    field: 'permission_code'
  },
  
  // ========== 状态和显示控制 ==========
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: false,
    comment: '状态：1=启用、0=禁用'
  },
  hidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否隐藏菜单'
  },
  hide_children: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否隐藏子菜单',
    field: 'hide_children'
  },
  hide_breadcrumb: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否在面包屑中隐藏',
    field: 'hide_breadcrumb'
  },
  hide_tab: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否在标签栏中隐藏',
    field: 'hide_tab'
  },
  
  // ========== 缓存和标签页控制 ==========
  keep_alive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否缓存页面',
    field: 'keep_alive'
  },
  fixed_tab: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否固定在标签页',
    field: 'fixed_tab'
  },
  always_show: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否始终显示根菜单',
    field: 'always_show'
  },
  
  // ========== 外链相关 ==========
  is_external: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否外链',
    field: 'is_external'
  },
  external_url: {
    type: DataTypes.STRING(500),
    defaultValue: null,
    comment: '外链地址',
    field: 'external_url'
  },
  
  // ========== 其他字段 ==========
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序（数字越小越靠前）'
  },
  description: {
    type: DataTypes.STRING(500),
    defaultValue: null,
    comment: '菜单描述'
  },
  meta: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: '扩展元数据'
  }
}, {
  tableName: 'menus',
  timestamps: true,
  paranoid: true, // 软删除
  underscored: true, // 自动转换驼峰到下划线
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    {
      name: 'idx_parent_id',
      fields: ['parent_id']
    },
    {
      name: 'idx_type',
      fields: ['type']
    },
    {
      name: 'idx_status',
      fields: ['status']
    },
    {
      name: 'idx_sort',
      fields: ['sort']
    }
  ]
})

module.exports = Menu

