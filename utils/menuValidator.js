/**
 * 菜单验证工具
 */

/**
 * 验证菜单类型的必填字段
 * @param {string} type - 菜单类型
 * @param {object} data - 菜单数据
 * @returns {object} { valid: boolean, message: string }
 */
function validateMenuType(type, data) {
  switch (type) {
    case 'directory':
      // 目录：需要 path
      if (!data.path) {
        return { valid: false, message: '目录类型必须填写路由路径' }
      }
      break
      
    case 'menu':
      // 菜单：需要 path, component, permission_code
      if (!data.path) {
        return { valid: false, message: '菜单类型必须填写路由路径' }
      }
      if (!data.component) {
        return { valid: false, message: '菜单类型必须填写组件路径' }
      }
      // if (!data.permissionCode && !data.permission_code) {
      //   return { valid: false, message: '菜单类型必须填写权限编码' }
      // }
      break
      
    case 'button':
      // 按钮：需要 permission_code
      if (!data.permissionCode && !data.permission_code) {
        return { valid: false, message: '按钮类型必须填写权限编码' }
      }
      break
      
    case 'link':
      // 外链：需要 external_url
      if (!data.externalUrl && !data.external_url) {
        return { valid: false, message: '外链类型必须填写外链地址' }
      }
      break
      
    case 'embed':
      // 内嵌：需要 path 和 external_url
      if (!data.path) {
        return { valid: false, message: '内嵌类型必须填写路由路径' }
      }
      if (!data.externalUrl && !data.external_url) {
        return { valid: false, message: '内嵌类型必须填写内嵌地址' }
      }
      break
      
    default:
      return { valid: false, message: '菜单类型不合法' }
  }
  
  return { valid: true }
}

/**
 * 验证权限编码格式
 * @param {string} code - 权限编码
 * @returns {object} { valid: boolean, message: string }
 */
function validatePermissionCode(code) {
  if (!code) {
    return { valid: true } // 允许为空（目录类型）
  }
  
  // 权限编码格式：模块:操作，例如 user:view, user:create
  const pattern = /^[a-z_]+:[a-z_]+$/
  if (!pattern.test(code)) {
    return { 
      valid: false, 
      message: '权限编码格式不正确，应为：模块:操作（如 user:view）' 
    }
  }
  
  return { valid: true }
}

/**
 * 验证菜单名称格式
 * @param {string} name - 菜单名称
 * @param {string} type - 菜单类型
 * @returns {object} { valid: boolean, message: string }
 */
function validateMenuName(name, type) {
  // 按钮类型不需要菜单名称
  if (type === 'button') {
    return { valid: true }
  }
  
  if (!name) {
    return { valid: false, message: '菜单名称不能为空' }
  }
  
  // 菜单名称：只能包含字母和数字
  const pattern = /^[a-zA-Z0-9]+$/
  if (!pattern.test(name)) {
    return { 
      valid: false, 
      message: '菜单名称格式不正确，只能包含字母和数字' 
    }
  }
  
  return { valid: true }
}

/**
 * 验证路由路径格式
 * @param {string} path - 路由路径
 * @returns {object} { valid: boolean, message: string }
 */
function validatePath(path) {
  if (!path) {
    return { valid: true } // 允许为空（按钮类型）
  }
  
  // 路由路径必须以 / 开头
  if (!path.startsWith('/')) {
    return { 
      valid: false, 
      message: '路由路径必须以 / 开头' 
    }
  }
  
  return { valid: true }
}

/**
 * 验证外链地址格式
 * @param {string} url - 外链地址
 * @returns {object} { valid: boolean, message: string }
 */
function validateExternalUrl(url) {
  if (!url) {
    return { valid: true } // 允许为空
  }
  
  try {
    new URL(url)
    return { valid: true }
  } catch (err) {
    return { 
      valid: false, 
      message: '外链地址格式不正确' 
    }
  }
}

module.exports = {
  validateMenuType,
  validatePermissionCode,
  validateMenuName,
  validatePath,
  validateExternalUrl,
}
