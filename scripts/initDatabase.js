const sequelize = require('../config/database')
const { setupAssociations, User, Role, Menu, UserRole, RoleMenu, Article, Task } = require('../models/associations')
const { hashPassword } = require('../utils/password')

/**
 * 初始化数据库
 */
async function initDatabase() {
  try {
    console.log('🔄 开始初始化数据库...')
    
    // 设置模型关联
    setupAssociations()
    
    // 同步数据库表（force: true 会删除已存在的表并重建）
    await sequelize.sync({ force: true })
    console.log('✅ 数据库表同步成功')
    
    // 1. 创建角色
    const roles = await Role.bulkCreate([
      {
        name: '超级管理员',
        code: 'super_admin',
        description: '拥有系统所有权限',
        status: 1,
        sort: 1,
      },
      {
        name: '管理员',
        code: 'admin',
        description: '系统管理员，拥有大部分权限',
        status: 1,
        sort: 2,
      },
      {
        name: '普通用户',
        code: 'user',
        description: '普通用户，拥有基本权限',
        status: 1,
        sort: 3,
      },
    ])
    console.log('✅ 角色创建成功')
    
    // 2. 创建菜单（方案一：菜单包含 permission_code，不再需要独立的权限表）
    // 2.1 先创建顶级菜单
    const topMenus = await Menu.bulkCreate([
      // 首页/仪表盘
      {
        parent_id: 0,
        type: 'menu',
        name: 'Dashboard',
        title: '仪表盘',
        path: '/dashboard',
        component: 'dashboard/index',
        icon: 'Odometer',
        permission_code: 'dashboard:view',
        status: 1,
        hidden: false,
        keep_alive: true,
        sort: 1,
      },
      // 业务管理（目录）
      {
        parent_id: 0,
        type: 'directory',
        name: 'Business',
        title: '业务管理',
        path: '/business',
        component: 'Layout',
        redirect: '/business/article',
        icon: 'Briefcase',
        permission_code: null,
        status: 1,
        hidden: false,
        always_show: true,
        sort: 2,
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
        icon: 'Setting',
        permission_code: null, // 目录不需要权限，由子菜单控制
        status: 1,
        hidden: false,
        always_show: true,
        sort: 3,
      },
    ])
    console.log('✅ 顶级菜单创建成功')
    
    // 2.2 获取目录菜单的ID
    const businessMenu = topMenus.find(m => m.name === 'Business')
    const systemMenu = topMenus.find(m => m.name === 'System')
    const businessMenuId = businessMenu.id
    const systemMenuId = systemMenu.id
    
    // 2.3 创建业务管理子菜单
    const businessChildMenus = await Menu.bulkCreate([
      // 文章管理
      {
        parent_id: businessMenuId,
        type: 'menu',
        name: 'Article',
        title: '文章管理',
        path: '/business/article',
        component: 'business/article-manage/index',
        icon: 'Document',
        permission_code: 'article:view',
        status: 1,
        hidden: false,
        keep_alive: true,
        sort: 1,
      },
      // 任务管理
      {
        parent_id: businessMenuId,
        type: 'menu',
        name: 'Task',
        title: '任务管理',
        path: '/business/task',
        component: 'business/task-manage/index',
        icon: 'List',
        permission_code: 'task:view',
        status: 1,
        hidden: false,
        keep_alive: true,
        sort: 2,
      },
    ])
    console.log('✅ 业务管理子菜单创建成功')
    
    // 2.4 创建系统管理子菜单
    const systemChildMenus = await Menu.bulkCreate([
      // 用户管理
      {
        parent_id: systemMenuId,
        type: 'menu',
        name: 'User',
        title: '用户管理',
        path: '/system/user',
        component: 'system/user-manage/index',
        icon: 'User',
        permission_code: 'user:view',
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
        component: 'system/role-manage/index',
        icon: 'UserFilled',
        permission_code: 'role:view',
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
        component: 'system/menu-manage/index',
        icon: 'Menu',
        permission_code: 'menu:view',
        status: 1,
        hidden: false,
        keep_alive: true,
        sort: 3,
      },
    ])
    console.log('✅ 系统管理子菜单创建成功')
    
    const menus = [...topMenus, ...businessChildMenus, ...systemChildMenus]
    
    // 3. 为角色分配菜单（方案一：角色直接关联菜单）
    const superAdminRole = roles.find(r => r.code === 'super_admin')
    const adminRole = roles.find(r => r.code === 'admin')
    const userRole = roles.find(r => r.code === 'user')
    
    // 3.1 为超级管理员分配所有菜单
    const allMenuIds = menus.map(m => m.id)
    const superAdminMenus = allMenuIds.map(menuId => ({
      roleId: superAdminRole.id,
      menuId: menuId,
    }))
    await RoleMenu.bulkCreate(superAdminMenus)
    console.log('✅ 超级管理员菜单分配成功')
    
    // 3.2 为管理员角色分配菜单（排除菜单管理）
    const adminMenuNames = ['Dashboard', 'Business', 'Article', 'Task', 'System', 'User', 'Role']
    const adminMenus = menus.filter(m => adminMenuNames.includes(m.name))
    const adminRoleMenus = adminMenus.map(m => ({
      roleId: adminRole.id,
      menuId: m.id,
    }))
    await RoleMenu.bulkCreate(adminRoleMenus)
    console.log('✅ 管理员菜单分配成功')
    
    // 3.3 为普通用户角色分配基本菜单（仪表盘 + 业务模块，但只有查看和创建权限）
    const userMenuNames = ['Dashboard', 'Business', 'Article', 'Task']
    const userMenus = menus.filter(m => userMenuNames.includes(m.name))
    const userRoleMenus = userMenus.map(m => ({
      roleId: userRole.id,
      menuId: m.id,
    }))
    await RoleMenu.bulkCreate(userRoleMenus)
    console.log('✅ 普通用户菜单分配成功')
    
    // 4. 创建测试用户
    const superAdminPassword = await hashPassword('123456')
    const adminPassword = await hashPassword('123456')
    const userPassword = await hashPassword('123456')
    
    const users = await User.bulkCreate([
      {
        username: 'superadmin',
        password: superAdminPassword,
        nickname: '超级管理员',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        email: 'superadmin@example.com',
        phone: '13800138000',
        status: 1,
      },
      {
        username: 'admin',
        password: adminPassword,
        nickname: '管理员',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        email: 'admin@example.com',
        phone: '13800138001',
        status: 1,
      },
      {
        username: 'user',
        password: userPassword,
        nickname: '普通用户',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        email: 'user@example.com',
        phone: '13800138002',
        status: 1,
      },
      {
        username: 'zhangsan',
        password: userPassword,
        nickname: '张三',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        email: 'zhangsan@example.com',
        phone: '13800138003',
        status: 1,
      },
      {
        username: 'lisi',
        password: userPassword,
        nickname: '李四',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        email: 'lisi@example.com',
        phone: '13800138004',
        status: 1,
      },
    ])
    console.log('✅ 测试用户创建成功')
    
    // 5. 为用户分配角色
    await UserRole.bulkCreate([
      { userId: users[0].id, roleId: superAdminRole.id }, // superadmin -> super_admin 角色
      { userId: users[1].id, roleId: adminRole.id },      // admin -> admin 角色
      { userId: users[2].id, roleId: userRole.id },       // user -> user 角色
      { userId: users[3].id, roleId: userRole.id },       // zhangsan -> user 角色
      { userId: users[4].id, roleId: userRole.id },       // lisi -> user 角色
    ])
    console.log('✅ 用户角色分配成功')
    
    // 6. 创建示例文章数据
    const articles = await Article.bulkCreate([
      {
        title: 'Vue 3 组合式 API 入门指南',
        content: '本文将介绍 Vue 3 组合式 API 的基本用法，包括 setup 函数、ref、reactive、computed 等核心概念...',
        summary: 'Vue 3 组合式 API 入门教程',
        category: '技术',
        tags: 'Vue,前端,JavaScript',
        status: 'published',
        authorId: users[1].id, // admin
        publishedAt: new Date(),
        viewCount: 128,
      },
      {
        title: 'Koa2 中间件机制详解',
        content: 'Koa2 的中间件采用洋葱模型，本文将详细讲解中间件的执行流程和最佳实践...',
        summary: 'Koa2 中间件原理分析',
        category: '技术',
        tags: 'Koa,Node.js,后端',
        status: 'published',
        authorId: users[1].id, // admin
        publishedAt: new Date(),
        viewCount: 89,
      },
      {
        title: 'RBAC 权限模型设计',
        content: '基于角色的访问控制（RBAC）是一种常用的权限管理方案，本文将介绍如何设计一个完整的 RBAC 系统...',
        summary: 'RBAC 权限系统设计指南',
        category: '架构',
        tags: '权限,RBAC,系统设计',
        status: 'draft',
        authorId: users[0].id, // superadmin
        viewCount: 0,
      },
      {
        title: '我的第一篇文章',
        content: '这是普通用户 user 创建的第一篇文章，用于测试数据权限...',
        summary: '普通用户的测试文章',
        category: '随笔',
        tags: '测试',
        status: 'published',
        authorId: users[2].id, // user
        publishedAt: new Date(),
        viewCount: 15,
      },
      {
        title: '张三的学习笔记',
        content: '这是张三写的学习笔记，记录日常学习心得...',
        summary: '学习笔记',
        category: '随笔',
        tags: '学习,笔记',
        status: 'draft',
        authorId: users[3].id, // zhangsan
        viewCount: 0,
      },
    ])
    console.log('✅ 示例文章创建成功')
    
    // 7. 创建示例任务数据
    const tasks = await Task.bulkCreate([
      {
        title: '完成用户管理模块开发',
        description: '需要完成用户的增删改查功能，包括角色分配',
        priority: 'high',
        status: 'completed',
        creatorId: users[0].id, // superadmin
        assigneeId: users[1].id, // admin
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: '设计权限系统方案',
        description: '设计基于 RBAC 的权限管理系统，包括数据权限和操作权限',
        priority: 'urgent',
        status: 'in_progress',
        creatorId: users[0].id, // superadmin
        assigneeId: users[0].id, // superadmin
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: '编写接口文档',
        description: '使用 Markdown 编写完整的 API 接口文档',
        priority: 'medium',
        status: 'pending',
        creatorId: users[1].id, // admin
        assigneeId: users[2].id, // user
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: '修复登录页面 Bug',
        description: '用户反馈登录页面在移动端显示异常',
        priority: 'high',
        status: 'in_progress',
        creatorId: users[1].id, // admin
        assigneeId: users[3].id, // zhangsan
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: '准备项目演示材料',
        description: '准备下周项目汇报的 PPT 和演示 Demo',
        priority: 'low',
        status: 'pending',
        creatorId: users[2].id, // user
        assigneeId: null, // 未分配
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        title: '代码评审',
        description: '评审张三提交的用户模块代码',
        priority: 'medium',
        status: 'pending',
        creatorId: users[1].id, // admin
        assigneeId: users[4].id, // lisi
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    ])
    console.log('✅ 示例任务创建成功')
    
    console.log('\n📋 测试账号:')
    console.log('   超级管理员 - 用户名: superadmin, 密码: 123456 (拥有所有权限)')
    console.log('   管理员     - 用户名: admin, 密码: 123456 (拥有大部分权限)')
    console.log('   普通用户   - 用户名: user, 密码: 123456 (仅查看自己的数据)')
    console.log('   普通用户   - 用户名: zhangsan, 密码: 123456')
    console.log('   普通用户   - 用户名: lisi, 密码: 123456')
    
    console.log('\n🔐 权限说明:')
    console.log('   文章管理权限: article:view, article:create, article:edit, article:delete, article:publish')
    console.log('   任务管理权限: task:view, task:create, task:edit, task:delete, task:assign')
    console.log('   - 普通用户只能看到自己创建的文章')
    console.log('   - 普通用户只能看到自己创建或分配给自己的任务')
    console.log('   - 管理员可以看到所有数据')
    
    console.log('\n📊 数据库统计:')
    console.log(`   角色数: ${roles.length}`)
    console.log(`   菜单数: ${menus.length}`)
    console.log(`   用户数: ${users.length}`)
    console.log(`   文章数: ${articles.length}`)
    console.log(`   任务数: ${tasks.length}`)
    
    console.log('\n🎉 数据库初始化完成!')
    process.exit(0)
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    process.exit(1)
  }
}

// 运行初始化
initDatabase()
