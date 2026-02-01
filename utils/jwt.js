const jwt = require('jsonwebtoken')
const config = require('../config')

/**
 * 生成 Token
 * @param {Object} payload - 要加密的数据
 * @returns {string} Token
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

/**
 * 验证 Token
 * @param {string} token - Token
 * @returns {Object|null} 解密后的数据或 null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret)
  } catch (error) {
    return null
  }
}

/**
 * 解码 Token（不验证）
 * @param {string} token - Token
 * @returns {Object|null} 解码后的数据或 null
 */
function decodeToken(token) {
  try {
    return jwt.decode(token)
  } catch (error) {
    return null
  }
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
}

