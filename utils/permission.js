const Role = require('../models/Role')
const RoleMenu = require('../models/RoleMenu')
const UserRole = require('../models/UserRole')
const Menu = require('../models/Menu')

/**
 * 获取用户的所有权限编码（基于菜单）
 * 方案一：通过角色 -> 菜单 -> permission_code 的路径获取权限
 * @param {number} userId - 用户ID
 * @returns {Promise<string[]>} 权限编码数组
 */
async function getUserPermissions(userId) {
  try {
    // 1. 获取用户的角色ID
    const userRoles = await UserRole.findAll({
      where: { userId },
      attributes: ['roleId']
    })
    
    if (userRoles.length === 0) {
      return []
    }
    
    const roleIds = userRoles.map(ur => ur.roleId)
    
    // 2. 验证角色是否启用
    const validRoles = await Role.findAll({
      where: {
        id: roleIds,
        status: 1
      },
      attributes: ['id']
    })
    
    if (validRoles.length === 0) {
      return []
    }
    
    const validRoleIds = validRoles.map(role => role.id)
    
    // 3. 获取角色对应的菜单ID
    const roleMenus = await RoleMenu.findAll({
      where: {
        roleId: validRoleIds
      },
      attributes: ['menuId']
    })
    
    if (roleMenus.length === 0) {
      return []
    }
    
    const menuIds = [...new Set(roleMenus.map(rm => rm.menuId))]
    
    // 4. 获取菜单的权限编码（permission_code）
    const menus = await Menu.findAll({
      where: {
        id: menuIds,
        status: 1,
        permission_code: {
          [require('sequelize').Op.ne]: null  // 只获取有 permission_code 的菜单
        }
      },
      attributes: ['permission_code']
    })
    
    // 5. 返回权限编码数组（过滤空值）
    return menus
      .map(m => m.permission_code)
      .filter(code => code && code.trim() !== '')
  } catch (error) {
    console.error('获取用户权限失败:', error)
    return []
  }
}

/**
 * 获取用户的所有菜单（基于角色和权限）
 * @param {number} userId - 用户ID
 * @returns {Promise<Array>} 菜单树数组
 */
async function getUserMenus(userId) {
  try {
    // 1. 获取用户的角色ID
    const userRoles = await UserRole.findAll({
      where: { userId },
      attributes: ['roleId']
    })

    if (userRoles.length === 0) {
      return []
    }

    const roleIds = userRoles.map(ur => ur.roleId)

    // 2. 获取有效角色
    const validRoles = await Role.findAll({
      where: { id: roleIds, status: 1 },
      attributes: ['id']
    })

    if (validRoles.length === 0) {
      return []
    }

    const validRoleIds = validRoles.map(r => r.id)

    // 3. 获取角色关联的菜单ID（role_menus 表）
    const roleMenus = await RoleMenu.findAll({
      where: { roleId: validRoleIds },
      attributes: ['menuId']
    })

    const assignedMenuIds = [...new Set(roleMenus.map(rm => rm.menuId))]

    if (assignedMenuIds.length === 0) {
      return []
    }

    // 4. 获取所有启用且未隐藏的菜单
    const menus = await Menu.findAll({
      where: {
        status: 1,
        hidden: false
      },
      order: [['sort', 'ASC'], ['id', 'ASC']],
      raw: true
    })

    // 5. 过滤菜单：只保留角色分配的菜单 + 目录类型（目录由后续空目录移除逻辑处理）
    const filteredMenus = menus.filter(menu => {
      // 目录类型保留（后续会移除空目录）
      if (menu.type === 'directory') {
        return true
      }
      // 非目录菜单必须在角色分配的菜单列表中
      return assignedMenuIds.includes(menu.id)
    })

    // 6. 构建菜单树
    const menuTree = buildMenuTree(filteredMenus)

    // 7. 移除没有子菜单的空目录
    const menuTree2 = removeEmptyDirectories(menuTree)
    return menuTree2
  } catch (error) {
    console.error('获取用户菜单失败:', error)
    return []
  }
}

/**
 * 移除没有子菜单的空目录
 * @param {Array} menuTree - 菜单树
 * @returns {Array} 过滤后的菜单树
 */
function removeEmptyDirectories(menuTree) {
  return menuTree.filter(menu => {
    // 递归处理子菜单
    if (menu.children && menu.children.length > 0) {
      menu.children = removeEmptyDirectories(menu.children)
    }
    
    // 如果是目录类型，但没有子菜单，则移除
    if (menu.type === 'directory' && (!menu.children || menu.children.length === 0)) {
      return false
    }
    
    return true
  })
}

/**
 * 构建菜单树
 * @param {Array} menus - 扁平菜单数组
 * @param {number} parentId - 父菜单ID
 * @returns {Array} 菜单树
 */
function buildMenuTree(menus, parentId = 0) {
  const tree = []
  
  for (const menu of menus) {
    // 使用下划线命名
    const menuParentId = menu.parent_id ?? 0
    
    if (menuParentId === parentId) {
      const children = buildMenuTree(menus, menu.id)
      
      // 构建菜单节点
      const menuNode = {
        id: menu.id,
        type: menu.type,
        name: menu.name,
        path: menu.path,
        component: menu.component,
        redirect: menu.redirect,
        status: menu.status,
        meta: {
          title: menu.title,
          icon: menu.icon,
          activeIcon: menu.active_icon,
          hidden: menu.hidden,
          hideChildren: menu.hide_children,
          hideBreadcrumb: menu.hide_breadcrumb,
          hideTab: menu.hide_tab,
          keepAlive: menu.keep_alive,
          fixedTab: menu.fixed_tab,
          alwaysShow: menu.always_show,
          activePath: menu.active_path,
          isExternal: menu.is_external,
          externalUrl: menu.external_url,
          // 徽标系统
          badge: menu.badge_type ? {
            type: menu.badge_type,
            content: menu.badge_content,
            style: menu.badge_style
          } : null,
          // 权限
          permission_code: menu.permission_code,
          // 自定义元数据
          ...menu.meta
        }
      }
      
      if (children.length > 0) {
        menuNode.children = children
      }
      
      tree.push(menuNode)
    }
  }
  
  return tree
}

/**
 * 检查用户是否有指定权限
 * @param {number} userId - 用户ID
 * @param {string|string[]} requiredPermissions - 需要的权限编码（单个或数组）
 * @param {string} mode - 验证模式：'AND' 或 'OR'，默认 'OR'
 * @returns {Promise<boolean>} 是否有权限
 */
async function hasPermission(userId, requiredPermissions, mode = 'OR') {
  try {
    const userPermissions = await getUserPermissions(userId)
    
    if (!Array.isArray(requiredPermissions)) {
      requiredPermissions = [requiredPermissions]
    }
    
    if (mode === 'AND') {
      // AND 模式：必须拥有所有权限
      return requiredPermissions.every(perm => userPermissions.includes(perm))
    } else {
      // OR 模式：拥有任一权限即可
      return requiredPermissions.some(perm => userPermissions.includes(perm))
    }
  } catch (error) {
    console.error('权限检查失败:', error)
    return false
  }
}

/**
 * 获取用户的角色编码列表
 * @param {number} userId - 用户ID
 * @returns {Promise<string[]>} 角色编码数组
 */
async function getUserRoles(userId) {
  try {
    const userRoles = await UserRole.findAll({
      where: { userId },
      include: [{
        model: Role,
        as: 'role',
        where: { status: 1 },
        attributes: ['code']
      }]
    })
    
    return userRoles.map(ur => ur.role?.code).filter(Boolean)
  } catch (error) {
    console.error('获取用户角色失败:', error)
    return []
  }
}

/**
 * 检查用户是否有指定角色
 * @param {number} userId - 用户ID
 * @param {string|string[]} requiredRoles - 需要的角色编码
 * @param {string} mode - 验证模式：'AND' 或 'OR'，默认 'OR'
 * @returns {Promise<boolean>} 是否有角色
 */
async function hasRole(userId, requiredRoles, mode = 'OR') {
  try {
    const userRoles = await getUserRoles(userId)
    
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles]
    }
    
    if (mode === 'AND') {
      return requiredRoles.every(role => userRoles.includes(role))
    } else {
      return requiredRoles.some(role => userRoles.includes(role))
    }
  } catch (error) {
    console.error('角色检查失败:', error)
    return false
  }
}

module.exports = {
  getUserPermissions,
  getUserMenus,
  buildMenuTree,
  hasPermission,
  getUserRoles,
  hasRole,
}
