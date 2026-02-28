const sequelize = require('../config/database')
const User = require('../models/User')
const Role = require('../models/Role')
const Permission = require('../models/Permission')
const Menu = require('../models/Menu')
const RolePermission = require('../models/RolePermission')
const UserRole = require('../models/UserRole')
const { hashPassword } = require('../utils/password')

/**
 * 自动初始化数据库（仅在表不存在或为空时）
 * 创建完整的 RBAC 系统数据
 */
async function autoInitDatabase() {
  try {
    console.log('🔍 Checking database...')
    
    // 同步数据库表
    // alter: true - 会自动添加新字段，修改字段类型，但不会删除字段和数据
    // force: false - 不会删除表重建（保留数据）
    await sequelize.sync({ alter: true })
    console.log('✅ Database tables synced')
    
    // 检查是否已有数据（检查用户表作为标志）
    const userCount = await User.count()
    
    if (userCount === 0) {
      console.log('📝 Database is empty, initializing RBAC system...')
      
      // 1. 创建角色
      const roles = await Role.bulkCreate([
        {
          name: '管理员',
          code: 'admin',
          description: '系统管理员，拥有所有权限',
          status: 1,
          sort: 1,
        },
        {
          name: '普通用户',
          code: 'user',
          description: '普通用户，拥有基本权限',
          status: 1,
          sort: 2,
        },
      ])
      console.log('✅ Roles created')
      
      // 2. 创建权限
      const permissions = await Permission.bulkCreate([
        // 系统管理
        { parentId: 0, name: '系统管理', code: 'system', type: 'menu', description: '系统管理模块', status: 1, sort: 1 },
        { parentId: 1, name: '用户管理', code: 'system:user', type: 'menu', description: '用户管理', status: 1, sort: 1 },
        { parentId: 2, name: '查看用户', code: 'system:user:view', type: 'button', description: '查看用户列表', status: 1, sort: 1 },
        { parentId: 2, name: '新增用户', code: 'system:user:add', type: 'button', description: '新增用户', status: 1, sort: 2 },
        { parentId: 2, name: '编辑用户', code: 'system:user:edit', type: 'button', description: '编辑用户', status: 1, sort: 3 },
        { parentId: 2, name: '删除用户', code: 'system:user:delete', type: 'button', description: '删除用户', status: 1, sort: 4 },
        
        { parentId: 1, name: '角色管理', code: 'system:role', type: 'menu', description: '角色管理', status: 1, sort: 2 },
        { parentId: 7, name: '查看角色', code: 'system:role:view', type: 'button', description: '查看角色列表', status: 1, sort: 1 },
        { parentId: 7, name: '新增角色', code: 'system:role:add', type: 'button', description: '新增角色', status: 1, sort: 2 },
        { parentId: 7, name: '编辑角色', code: 'system:role:edit', type: 'button', description: '编辑角色', status: 1, sort: 3 },
        { parentId: 7, name: '删除角色', code: 'system:role:delete', type: 'button', description: '删除角色', status: 1, sort: 4 },
        { parentId: 7, name: '分配权限', code: 'system:role:permission', type: 'button', description: '为角色分配权限', status: 1, sort: 5 },
        
        { parentId: 1, name: '菜单管理', code: 'system:menu', type: 'menu', description: '菜单管理', status: 1, sort: 3 },
        { parentId: 13, name: '查看菜单', code: 'system:menu:view', type: 'button', description: '查看菜单列表', status: 1, sort: 1 },
        { parentId: 13, name: '新增菜单', code: 'system:menu:add', type: 'button', description: '新增菜单', status: 1, sort: 2 },
        { parentId: 13, name: '编辑菜单', code: 'system:menu:edit', type: 'button', description: '编辑菜单', status: 1, sort: 3 },
        { parentId: 13, name: '删除菜单', code: 'system:menu:delete', type: 'button', description: '删除菜单', status: 1, sort: 4 },
        
        { parentId: 1, name: '权限管理', code: 'system:permission', type: 'menu', description: '权限管理', status: 1, sort: 4 },
        { parentId: 18, name: '查看权限', code: 'system:permission:view', type: 'button', description: '查看权限列表', status: 1, sort: 1 },
        { parentId: 18, name: '新增权限', code: 'system:permission:add', type: 'button', description: '新增权限', status: 1, sort: 2 },
        { parentId: 18, name: '编辑权限', code: 'system:permission:edit', type: 'button', description: '编辑权限', status: 1, sort: 3 },
        { parentId: 18, name: '删除权限', code: 'system:permission:delete', type: 'button', description: '删除权限', status: 1, sort: 4 },
      ])
      console.log('✅ Permissions created')
      
      // 3. 创建菜单（注意：使用正确的字段名）
      // 先创建顶级菜单
      const topMenus = await Menu.bulkCreate([
        // 首页/仪表盘
        {
          parent_id: 0,
          type: 'menu',
          name: 'Dashboard',
          title: '仪表盘',
          path: '/dashboard',
          component: 'dashboard/index',
          icon: 'dashboard',
          permission_code: 'system:user:view', // 使用现有权限
          status: 1,
          hidden: false,
          keep_alive: true,
          sort: 1,
        },
        // 系统管理（目录）
        {
          parent_id: 0,
          type: 'directory',
          name: 'System',
          title: '系统管理',
          path: '/system',
          component: 'Layout',
          redirect: '/system/user',
          icon: 'setting',
          permission_code: null, // 目录不需要权限
          status: 1,
          hidden: false,
          always_show: true,
          sort: 2,
        },
      ])
      
      // 获取系统管理目录的ID
      const systemMenu = topMenus.find(m => m.name === 'System')
      const systemMenuId = systemMenu.id
      
      // 创建子菜单
      await Menu.bulkCreate([
        // 用户管理
        {
          parent_id: systemMenuId,
          type: 'menu',
          name: 'User',
          title: '用户管理',
          path: '/system/user',
          component: 'system/user/index',
          icon: 'user',
          permission_code: 'system:user:view',
          status: 1,
          hidden: false,
          keep_alive: true,
          sort: 1,
        },
        // 角色管理
        {
          parent_id: systemMenuId,
          type: 'menu',
          name: 'Role',
          title: '角色管理',
          path: '/system/role',
          component: 'system/role/index',
          icon: 'peoples',
          permission_code: 'system:role:view',
          status: 1,
          hidden: false,
          keep_alive: true,
          sort: 2,
        },
        // 菜单管理
        {
          parent_id: systemMenuId,
          type: 'menu',
          name: 'Menu',
          title: '菜单管理',
          path: '/system/menu',
          component: 'system/menu/index',
          icon: 'tree-table',
          permission_code: 'system:menu:view',
          status: 1,
          hidden: false,
          keep_alive: true,
          sort: 3,
        },
        // 权限管理
        {
          parent_id: systemMenuId,
          type: 'menu',
          name: 'Permission',
          title: '权限管理',
          path: '/system/permission',
          component: 'system/permission/index',
          icon: 'lock',
          permission_code: 'system:permission:view',
          status: 1,
          hidden: false,
          keep_alive: true,
          sort: 4,
        },
        // 操作日志
        {
          parent_id: systemMenuId,
          type: 'menu',
          name: 'OperationLog',
          title: '操作日志',
          path: '/system/operation-log',
          component: 'system/operation-log/index',
          icon: 'document',
          permission_code: null,
          status: 1,
          hidden: false,
          keep_alive: false,
          sort: 5,
        },
      ])
      console.log('✅ Menus created')
      
      // 4. 为管理员角色分配所有权限
      const adminRole = roles.find(r => r.code === 'admin')
      const allPermissionIds = permissions.map(p => p.id)
      const adminRolePermissions = allPermissionIds.map(permissionId => ({
        roleId: adminRole.id,
        permissionId: permissionId,
      }))
      await RolePermission.bulkCreate(adminRolePermissions)
      console.log('✅ Admin role permissions assigned')
      
      // 5. 为普通用户角色分配基本权限
      const userRole = roles.find(r => r.code === 'user')
      const userPermissionCodes = ['system:user:view', 'system:user:edit']
      const userPermissions = permissions.filter(p => userPermissionCodes.includes(p.code))
      const userRolePermissions = userPermissions.map(p => ({
        roleId: userRole.id,
        permissionId: p.id,
      }))
      await RolePermission.bulkCreate(userRolePermissions)
      console.log('✅ User role permissions assigned')
      
      // 6. 创建测试用户
      const adminPassword = await hashPassword('123456')
      const userPassword = await hashPassword('123456')
      
      const users = await User.bulkCreate([
        {
          username: 'admin',
          password: adminPassword,
          nickname: '管理员',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
          email: 'admin@example.com',
          phone: '13800138000',
          status: 1,
        },
        {
          username: 'user',
          password: userPassword,
          nickname: '普通用户',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
          email: 'user@example.com',
          phone: '13800138001',
          status: 1,
        },
      ])
      
      console.log('✅ Test users created')
      
      // 7. 为用户分配角色
      const adminUser = users.find(u => u.username === 'admin')
      const normalUser = users.find(u => u.username === 'user')
      
      await UserRole.bulkCreate([
        {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
        {
          userId: normalUser.id,
          roleId: userRole.id,
        },
      ])
      
      console.log('✅ User roles assigned')
      console.log('   Admin: admin / 123456')
      console.log('   User:  user / 123456')
      console.log('🎉 RBAC system initialized successfully!')
    } else {
      console.log(`✅ Database ready (${userCount} users found)`)
    }
  } catch (error) {
    console.error('⚠️ Database auto-init warning:', error.message)
    console.log('💡 You can manually run: npm run init')
  }
}

module.exports = autoInitDatabase

