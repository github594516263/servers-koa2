# 菜单创建/更新验证规则

## 优化说明

优化了 `menuController.js` 中的 `createMenu` 和 `updateMenu` 函数，根据不同的菜单类型进行严格的字段校验。

## 验证规则

### 1. 通用字段验证

| 字段 | 规则 | 说明 |
|------|------|------|
| name | 必填，大驼峰命名 | 如：`UserManage`、`Dashboard` |
| title | 必填 | 菜单显示标题 |
| permission_code | 格式：`模块:操作` | 如：`user:view`、`user:create` |
| path | 必须以 `/` 开头 | 如：`/system/user` |

### 2. 不同类型的必填字段

#### directory（目录）
```json
{
  "type": "directory",
  "name": "System",           // 必填
  "title": "系统管理",         // 必填
  "path": "/system",          // 必填
  "component": "Layout",      // 可选
  "permission_code": null     // 可选（目录不需要权限）
}
```

#### menu（菜单）
```json
{
  "type": "menu",
  "name": "User",                    // 必填
  "title": "用户管理",                // 必填
  "path": "/system/user",            // 必填
  "component": "system/user/index",  // 必填
  "permission_code": "user:view"     // 必填
}
```

#### button（按钮）
```json
{
  "type": "button",
  "parent_id": 3,                    // 必填（必须有父菜单）
  "name": "UserCreate",              // 必填
  "title": "新增用户",                // 必填
  "permission_code": "user:create",  // 必填
  "path": null,                      // 不需要
  "component": null                  // 不需要
}
```

#### link（外链）
```json
{
  "type": "link",
  "name": "Github",                        // 必填
  "title": "Github",                       // 必填
  "external_url": "https://github.com",    // 必填
  "path": null                             // 可选
}
```

#### embed（内嵌）
```json
{
  "type": "embed",
  "name": "Doc",                           // 必填
  "title": "文档",                         // 必填
  "path": "/doc",                          // 必填
  "external_url": "https://doc.com",       // 必填
  "component": "iframe"                    // 可选
}
```

## 3. 特殊规则

### 父子关系验证
- 按钮类型**必须**有父菜单（parent_id > 0）
- 按钮**不能**挂在按钮下
- 父菜单**不能**是自己
- **不能**形成循环引用

### 权限编码验证
- 格式：`模块:操作`（小写字母和下划线）
- 示例：`user:view`、`user:create`、`role:assign_permission`
- 必须唯一（不能重复）

### 菜单名称验证
- 格式：大驼峰命名（PascalCase）
- 只能包含字母
- 示例：`Dashboard`、`UserManage`、`RoleList`

## 4. 错误提示示例

```json
// 创建菜单类型但缺少 component
{
  "code": 400,
  "message": "菜单类型必须填写组件路径"
}

// 按钮类型没有父菜单
{
  "code": 400,
  "message": "按钮类型必须指定父菜单"
}

// 权限编码格式错误
{
  "code": 400,
  "message": "权限编码格式不正确，应为：模块:操作（如 user:view）"
}

// 菜单名称格式错误
{
  "code": 400,
  "message": "菜单名称格式不正确，应为大驼峰命名（如 UserManage）"
}

// 权限编码重复
{
  "code": 400,
  "message": "权限编码已存在"
}
```

## 5. 使用示例

### 创建目录
```bash
POST /api/menus
{
  "type": "directory",
  "name": "System",
  "title": "系统管理",
  "path": "/system",
  "icon": "setting",
  "sort": 1
}
```

### 创建菜单
```bash
POST /api/menus
{
  "type": "menu",
  "parent_id": 2,
  "name": "User",
  "title": "用户管理",
  "path": "/system/user",
  "component": "system/user/index",
  "icon": "user",
  "permission_code": "user:view",
  "keep_alive": true,
  "sort": 1
}
```

### 创建按钮权限
```bash
POST /api/menus
{
  "type": "button",
  "parent_id": 3,
  "name": "UserCreate",
  "title": "新增用户",
  "permission_code": "user:create",
  "sort": 1
}
```

## 6. 代码结构

```
controllers/
  └── menuController.js      # 菜单控制器（使用验证函数）

utils/
  └── menuValidator.js       # 菜单验证工具（独立的验证逻辑）
```

### 验证工具函数

- `validateMenuType(type, data)` - 验证菜单类型的必填字段
- `validatePermissionCode(code)` - 验证权限编码格式
- `validateMenuName(name)` - 验证菜单名称格式
- `validatePath(path)` - 验证路由路径格式
- `validateExternalUrl(url)` - 验证外链地址格式

## 7. 优势

✅ **类型安全**：不同类型的菜单有不同的必填字段要求  
✅ **格式规范**：统一的命名和编码规范  
✅ **防止错误**：提前校验，避免创建无效数据  
✅ **易于维护**：验证逻辑独立，便于复用和测试  
✅ **友好提示**：清晰的错误信息，方便前端处理
