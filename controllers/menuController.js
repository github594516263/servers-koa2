const Menu = require('../models/Menu')
const { success, error } = require('../utils/response')
const { getUserMenus, buildMenuTree } = require('../utils/permission')
const { 
  validateMenuType, 
  validatePermissionCode, 
  validateMenuName, 
  validatePath 
} = require('../utils/menuValidator')

/**
 * 获取用户菜单树（基于权限）
 */
async function getUserMenuTree(ctx) {
  try {
    const userId = ctx.state.user.id
    
    // 获取用户有权限的菜单树
    const menuTree = await getUserMenus(userId)
    
    ctx.body = success(menuTree)
  } catch (err) {
    console.error('获取用户菜单失败:', err)
    ctx.status = 500
    ctx.body = error('获取用户菜单失败', 500)
  }
}

/**
 * 获取完整菜单树（管理用）
 */
async function getMenuTree(ctx) {
  try {
    const { status } = ctx.query
    
    // 构建查询条件
    const where = {}
    
    if (status !== undefined && status !== '') {
      where.status = parseInt(status)
    }
    
    // 获取所有菜单
    const menus = await Menu.findAll({
      where,
      order: [['sort', 'ASC'], ['id', 'ASC']],
      attributes: { exclude: ['deleted_at'] },
      raw: true
    })
    
    // 构建树形结构
    const tree = buildMenuTree(menus)
    
    ctx.body = success(tree)
  } catch (err) {
    console.error('获取菜单树失败:', err)
    ctx.status = 500
    ctx.body = error('获取菜单树失败', 500)
  }
}

/**
 * 获取菜单列表（扁平）
 */
async function getMenuList(ctx) {
  try {
    const { status, hidden } = ctx.query
    
    // 构建查询条件
    const where = {}
    
    if (status !== undefined && status !== '') {
      where.status = parseInt(status)
    }
    
    if (hidden !== undefined && hidden !== '') {
      where.hidden = hidden === 'true' || hidden === '1'
    }
    
    const menus = await Menu.findAll({
      where,
      order: [['sort', 'ASC'], ['id', 'ASC']],
      attributes: { exclude: ['deleted_at'] }
    })
    
    ctx.body = success(menus)
  } catch (err) {
    console.error('获取菜单列表失败:', err)
    ctx.status = 500
    ctx.body = error('获取菜单列表失败', 500)
  }
}

/**
 * 获取菜单详情
 */
async function getMenuDetail(ctx) {
  try {
    const { id } = ctx.params
    
    const menu = await Menu.findByPk(id, {
      attributes: { exclude: ['deleted_at'] }
    })
    
    if (!menu) {
      ctx.status = 404
      ctx.body = error('菜单不存在', 404)
      return
    }
    
    ctx.body = success(menu)
  } catch (err) {
    console.error('获取菜单详情失败:', err)
    ctx.status = 500
    ctx.body = error('获取菜单详情失败', 500)
  }
}

/**
 * 创建菜单
 */
async function createMenu(ctx) {
  try {
    const data = ctx.request.body
    
    const type = data.type || 'menu'
    
    // 基础字段验证
    const nameValidation = validateMenuName(data.name, type)
    if (!nameValidation.valid) {
      ctx.status = 400
      ctx.body = error(nameValidation.message, 400)
      return
    }
    
    if (!data.title) {
      ctx.status = 400
      ctx.body = error('菜单标题不能为空', 400)
      return
    }
    
    // 验证菜单类型的必填字段
    const typeValidation = validateMenuType(type, data)
    if (!typeValidation.valid) {
      ctx.status = 400
      ctx.body = error(typeValidation.message, 400)
      return
    }
    
    // 验证权限编码格式
    const permissionCode = data.permissionCode || data.permission_code
    const codeValidation = validatePermissionCode(permissionCode)
    if (!codeValidation.valid) {
      ctx.status = 400
      ctx.body = error(codeValidation.message, 400)
      return
    }
    
    // 验证路由路径格式
    const pathValidation = validatePath(data.path)
    if (!pathValidation.valid) {
      ctx.status = 400
      ctx.body = error(pathValidation.message, 400)
      return
    }
    
    // 如果有父菜单，验证父菜单是否存在
    const parentId = data.parentId || data.parent_id || 0
    if (parentId > 0) {
      const parentMenu = await Menu.findByPk(parentId)
      if (!parentMenu) {
        ctx.status = 400
        ctx.body = error('父菜单不存在', 400)
        return
      }
      
      // 按钮类型必须有父菜单，且父菜单不能是按钮
      if (type === 'button') {
        if (parentMenu.type === 'button') {
          ctx.status = 400
          ctx.body = error('按钮不能挂在按钮下', 400)
          return
        }
      }
    } else {
      // 按钮类型必须有父菜单
      if (type === 'button') {
        ctx.status = 400
        ctx.body = error('按钮类型必须指定父菜单', 400)
        return
      }
    }
    
    // 检查权限编码是否已存在（如果有权限编码）
    if (permissionCode) {
      const existMenu = await Menu.findOne({
        where: { permission_code: permissionCode }
      })
      if (existMenu) {
        ctx.status = 400
        ctx.body = error('权限编码已存在', 400)
        return
      }
    }
    
    // 创建菜单（使用下划线命名）
    const menu = await Menu.create({
      parent_id: parseInt(parentId),
      type: data.type || 'menu',
      name: data.name,
      title: data.title,
      path: data.path,
      component: data.component,
      redirect: data.redirect,
      active_path: data.activePath || data.active_path,
      icon: data.icon,
      active_icon: data.activeIcon || data.active_icon,
      // 徽标系统
      badge_type: data.badgeType || data.badge_type,
      badge_content: data.badgeContent || data.badge_content,
      badge_style: data.badgeStyle || data.badge_style,
      // 权限
      permission_code: data.permissionCode || data.permission_code,
      // 状态和显示控制
      status: data.status ?? 1,
      hidden: Boolean(data.hidden),
      hide_children: Boolean(data.hideChildren || data.hide_children),
      hide_breadcrumb: Boolean(data.hideBreadcrumb || data.hide_breadcrumb),
      hide_tab: Boolean(data.hideTab || data.hide_tab),
      // 缓存控制
      keep_alive: Boolean(data.keepAlive || data.keep_alive),
      fixed_tab: Boolean(data.fixedTab || data.fixed_tab),
      always_show: Boolean(data.alwaysShow || data.always_show),
      // 外链
      is_external: Boolean(data.isExternal || data.is_external),
      external_url: data.externalUrl || data.external_url,
      // 其他
      sort: data.sort || 0,
      description: data.description,
      meta: data.meta
    })
    
    ctx.body = success(menu, '创建菜单成功')
  } catch (err) {
    console.error('创建菜单失败:', err)
    ctx.status = 500
    ctx.body = error('创建菜单失败', 500)
  }
}

/**
 * 更新菜单
 */
async function updateMenu(ctx) {
  try {
    const { id } = ctx.params
    const data = ctx.request.body
    
    // 查找菜单
    const menu = await Menu.findByPk(id)
    if (!menu) {
      ctx.status = 404
      ctx.body = error('菜单不存在', 404)
      return
    }
    
    // 获取更新后的类型（如果有修改）
    const type = data.type !== undefined ? data.type : menu.type
    
    // 根据类型进行校验
    if (data.type !== undefined) {
      switch (type) {
        case 'directory':
          // 目录类型检查是否有子菜单
          const childCount = await Menu.count({
            where: { parent_id: id }
          })
          if (childCount > 0 && data.type !== 'directory') {
            ctx.status = 400
            ctx.body = error('该菜单有子菜单，不能修改为非目录类型', 400)
            return
          }
          break
          
        case 'button':
          // 按钮类型必须有父菜单
          const currentParentId = data.parentId ?? data.parent_id ?? menu.parent_id
          if (currentParentId === 0) {
            ctx.status = 400
            ctx.body = error('按钮类型必须指定父菜单', 400)
            return
          }
          break
          
        case 'link':
          // 外链需要 external_url
          if (!data.externalUrl && !data.external_url && !menu.external_url) {
            ctx.status = 400
            ctx.body = error('外链类型必须填写外链地址', 400)
            return
          }
          break
          
        case 'embed':
          // 内嵌需要 path 和 external_url
          const embedPath = data.path !== undefined ? data.path : menu.path
          const embedUrl = data.externalUrl || data.external_url || menu.external_url
          if (!embedPath || !embedUrl) {
            ctx.status = 400
            ctx.body = error('内嵌类型必须填写路由路径和内嵌地址', 400)
            return
          }
          break
      }
    }
    
    // 如果修改了父菜单，验证父菜单是否存在且不能是自己
    const parentId = data.parentId ?? data.parent_id
    if (parentId !== undefined) {
      if (parentId > 0) {
        if (parseInt(parentId) === parseInt(id)) {
          ctx.status = 400
          ctx.body = error('父菜单不能是自己', 400)
          return
        }
        
        const parentMenu = await Menu.findByPk(parentId)
        if (!parentMenu) {
          ctx.status = 400
          ctx.body = error('父菜单不存在', 400)
          return
        }
        
        // 按钮不能挂在按钮下
        if (type === 'button' && parentMenu.type === 'button') {
          ctx.status = 400
          ctx.body = error('按钮不能挂在按钮下', 400)
          return
        }
        
        // 检查是否会形成循环引用
        let checkParent = parentMenu
        while (checkParent.parent_id > 0) {
          if (checkParent.parent_id === parseInt(id)) {
            ctx.status = 400
            ctx.body = error('不能将菜单移动到自己的子菜单下', 400)
            return
          }
          checkParent = await Menu.findByPk(checkParent.parent_id)
          if (!checkParent) break
        }
      } else if (type === 'button') {
        // 按钮类型不能是顶级菜单
        ctx.status = 400
        ctx.body = error('按钮类型必须指定父菜单', 400)
        return
      }
    }
    
    // 如果修改了权限编码，检查是否已存在
    const permissionCode = data.permissionCode || data.permission_code
    if (permissionCode && permissionCode !== menu.permission_code) {
      const existMenu = await Menu.findOne({
        where: { permission_code: permissionCode }
      })
      if (existMenu) {
        ctx.status = 400
        ctx.body = error('权限编码已存在', 400)
        return
      }
    }
    
    // 构建更新数据（使用下划线命名）
    const updateData = {}
    
    // 基础字段
    if (parentId !== undefined) updateData.parent_id = parseInt(parentId)
    if (data.type !== undefined) updateData.type = data.type
    if (data.name !== undefined) updateData.name = data.name
    if (data.title !== undefined) updateData.title = data.title
    
    // 路由字段
    if (data.path !== undefined) updateData.path = data.path
    if (data.component !== undefined) updateData.component = data.component
    if (data.redirect !== undefined) updateData.redirect = data.redirect
    if (data.activePath !== undefined || data.active_path !== undefined) {
      updateData.active_path = data.activePath || data.active_path
    }
    
    // 图标字段
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.activeIcon !== undefined || data.active_icon !== undefined) {
      updateData.active_icon = data.activeIcon || data.active_icon
    }
    
    // 徽标字段
    if (data.badgeType !== undefined || data.badge_type !== undefined) {
      updateData.badge_type = data.badgeType || data.badge_type
    }
    if (data.badgeContent !== undefined || data.badge_content !== undefined) {
      updateData.badge_content = data.badgeContent || data.badge_content
    }
    if (data.badgeStyle !== undefined || data.badge_style !== undefined) {
      updateData.badge_style = data.badgeStyle || data.badge_style
    }
    
    // 权限字段
    if (data.permissionCode !== undefined || data.permission_code !== undefined) {
      updateData.permission_code = data.permissionCode || data.permission_code
    }
    
    // 状态和显示控制
    if (data.status !== undefined) updateData.status = parseInt(data.status)
    if (data.hidden !== undefined) updateData.hidden = Boolean(data.hidden)
    if (data.hideChildren !== undefined || data.hide_children !== undefined) {
      updateData.hide_children = Boolean(data.hideChildren || data.hide_children)
    }
    if (data.hideBreadcrumb !== undefined || data.hide_breadcrumb !== undefined) {
      updateData.hide_breadcrumb = Boolean(data.hideBreadcrumb || data.hide_breadcrumb)
    }
    if (data.hideTab !== undefined || data.hide_tab !== undefined) {
      updateData.hide_tab = Boolean(data.hideTab || data.hide_tab)
    }
    
    // 缓存控制
    if (data.keepAlive !== undefined || data.keep_alive !== undefined) {
      updateData.keep_alive = Boolean(data.keepAlive || data.keep_alive)
    }
    if (data.fixedTab !== undefined || data.fixed_tab !== undefined) {
      updateData.fixed_tab = Boolean(data.fixedTab || data.fixed_tab)
    }
    if (data.alwaysShow !== undefined || data.always_show !== undefined) {
      updateData.always_show = Boolean(data.alwaysShow || data.always_show)
    }
    
    // 外链字段
    if (data.isExternal !== undefined || data.is_external !== undefined) {
      updateData.is_external = Boolean(data.isExternal || data.is_external)
    }
    if (data.externalUrl !== undefined || data.external_url !== undefined) {
      updateData.external_url = data.externalUrl || data.external_url
    }
    
    // 其他字段
    if (data.sort !== undefined) updateData.sort = parseInt(data.sort)
    if (data.description !== undefined) updateData.description = data.description
    if (data.meta !== undefined) updateData.meta = data.meta
    
    await menu.update(updateData)
    
    ctx.body = success(menu, '更新菜单成功')
  } catch (err) {
    console.error('更新菜单失败:', err)
    ctx.status = 500
    ctx.body = error('更新菜单失败', 500)
  }
}

/**
 * 删除菜单
 */
async function deleteMenu(ctx) {
  try {
    const { id } = ctx.params
    
    // 查找菜单
    const menu = await Menu.findByPk(id)
    if (!menu) {
      ctx.status = 404
      ctx.body = error('菜单不存在', 404)
      return
    }
    
    // 检查是否有子菜单
    const childMenus = await Menu.findAll({
      where: { parent_id: id }
    })
    
    if (childMenus.length > 0) {
      ctx.status = 400
      ctx.body = error('该菜单下有子菜单，不能删除', 400)
      return
    }
    
    // 软删除菜单
    await menu.destroy()
    
    ctx.body = success(null, '删除菜单成功')
  } catch (err) {
    console.error('删除菜单失败:', err)
    ctx.status = 500
    ctx.body = error('删除菜单失败', 500)
  }
}

module.exports = {
  getUserMenuTree,
  getMenuTree,
  getMenuList,
  getMenuDetail,
  createMenu,
  updateMenu,
  deleteMenu,
}
