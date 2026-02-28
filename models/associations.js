/**
 * 模型关联关系配置
 * 集中管理所有模型之间的关联关系
 */

const User = require('./User')
const Role = require('./Role')
const Menu = require('./Menu')
const UserRole = require('./UserRole')
const RoleMenu = require('./RoleMenu')
const Article = require('./Article')
const Task = require('./Task')
const OperationLog = require('./OperationLog')
// const Permission = require('./Permission')  // 方案一：不再需要独立的权限表
// const RolePermission = require('./RolePermission')  // 方案一：使用 RoleMenu 替代

/**
 * 设置模型关联关系
 */
function setupAssociations() {
  // 用户 - 角色 (多对多)
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'userId',
    otherKey: 'roleId',
    as: 'roles'
  })

  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'roleId',
    otherKey: 'userId',
    as: 'users'
  })

  // 角色 - 菜单 (多对多) - 方案一：角色直接关联菜单
  Role.belongsToMany(Menu, {
    through: RoleMenu,
    foreignKey: 'roleId',
    otherKey: 'menuId',
    as: 'menus'
  })

  Menu.belongsToMany(Role, {
    through: RoleMenu,
    foreignKey: 'menuId',
    otherKey: 'roleId',
    as: 'roles'
  })

  // 用户角色表关联
  UserRole.belongsTo(User, { foreignKey: 'userId', as: 'user' })
  UserRole.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })

  // 角色菜单表关联
  RoleMenu.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })
  RoleMenu.belongsTo(Menu, { foreignKey: 'menuId', as: 'menu' })

  // 菜单自关联（父子关系）
  // 注意：constraints: false 禁用外键约束，允许 parent_id = 0 表示顶级菜单
  Menu.hasMany(Menu, {
    foreignKey: 'parent_id',
    as: 'children',
    constraints: false
  })

  Menu.belongsTo(Menu, {
    foreignKey: 'parent_id',
    as: 'parent',
    constraints: false
  })

  // ========== 业务模块关联 ==========

  // 文章 - 用户（作者）
  Article.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author'
  })

  User.hasMany(Article, {
    foreignKey: 'authorId',
    as: 'articles'
  })

  // 任务 - 用户（创建者）
  Task.belongsTo(User, {
    foreignKey: 'creatorId',
    as: 'creator'
  })

  User.hasMany(Task, {
    foreignKey: 'creatorId',
    as: 'createdTasks'
  })

  // 任务 - 用户（执行者）
  Task.belongsTo(User, {
    foreignKey: 'assigneeId',
    as: 'assignee'
  })

  User.hasMany(Task, {
    foreignKey: 'assigneeId',
    as: 'assignedTasks'
  })

  // 操作日志 - 用户
  OperationLog.belongsTo(User, {
    foreignKey: 'userId',
    as: 'operator'
  })

  User.hasMany(OperationLog, {
    foreignKey: 'userId',
    as: 'operationLogs'
  })

  console.log('✅ 模型关联关系已设置')
}

module.exports = {
  setupAssociations,
  User,
  Role,
  Menu,
  UserRole,
  RoleMenu,
  Article,
  Task,
  OperationLog
  // Permission,      // 方案一：不再导出
  // RolePermission   // 方案一：不再导出
}

