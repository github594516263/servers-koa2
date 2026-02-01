/**
 * 成功响应
 * @param {*} data - 返回的数据
 * @param {string} message - 提示信息
 * @param {number} code - 状态码
 * @returns {Object} 响应对象
 */
function success(data = null, message = '操作成功', code = 0) {
  return {
    code,
    message,
    data,
  }
}

/**
 * 失败响应
 * @param {string} message - 错误信息
 * @param {number} code - 错误码
 * @returns {Object} 响应对象
 */
function error(message = '操作失败', code = 1) {
  return {
    code,
    message,
    data: null,
  }
}

/**
 * 分页响应
 * @param {Array} list - 数据列表
 * @param {number} total - 总数
 * @param {number} page - 当前页
 * @param {number} pageSize - 每页数量
 * @returns {Object} 响应对象
 */
function page(list, total, page, pageSize) {
  return success({
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

module.exports = {
  success,
  error,
  page,
}

