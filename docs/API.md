# API 接口文档

## 基本信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token（JWT）
- **请求头**: 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

## 响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "错误信息",
  "data": null
}
```

### 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或 Token 过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 一、认证模块 `/api/auth`

### 1.1 用户注册

**POST** `/api/auth/register`

**权限**: 无需认证

**请求参数**:
```json
{
  "username": "string",     // 必填，3-20字符
  "password": "string",     // 必填，至少6位
  "nickname": "string",     // 可选，昵称
  "email": "string",        // 可选，邮箱
  "phone": "string"         // 可选，手机号
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 1,
      "username": "user",
      "nickname": "普通用户",
      "avatar": null,
      "email": "user@example.com",
      "phone": "13800138000",
      "roles": ["user"],
      "permissions": ["dashboard:view"]
    }
  }
}
```

---

### 1.2 用户登录

**POST** `/api/auth/login`

**权限**: 无需认证

**请求参数**:
```json
{
  "username": "string",   // 必填
  "password": "string"    // 必填
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "avatar": "https://...",
      "email": "admin@example.com",
      "phone": "13800138000",
      "roles": ["admin"],
      "permissions": ["dashboard:view", "user:view", "user:create", ...]
    }
  }
}
```

---

### 1.3 用户登出

**POST** `/api/auth/logout`

**权限**: 需要认证

**响应示例**:
```json
{
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

---

### 1.4 获取当前用户信息

**GET** `/api/auth/userinfo`

**权限**: 需要认证

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "avatar": "https://...",
    "email": "admin@example.com",
    "phone": "13800138000",
    "roles": ["admin"],
    "permissions": ["dashboard:view", "user:view", ...]
  }
}
```

---

### 1.5 刷新 Token

**POST** `/api/auth/refresh`

**权限**: 需要认证

**响应示例**:
```json
{
  "code": 200,
  "message": "Token 刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.6 修改密码

**POST** `/api/auth/change-password`

**权限**: 需要认证

**请求参数**:
```json
{
  "oldPassword": "string",      // 必填，旧密码
  "newPassword": "string",      // 必填，新密码（至少6位）
  "confirmPassword": "string"   // 必填，确认新密码
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "密码修改成功",
  "data": null
}
```

---

## 二、用户管理模块 `/api/users`

### 2.1 获取用户列表

**GET** `/api/users`

**权限**: `user:view`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词（用户名/昵称/邮箱/手机号） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| status | number | 否 | 状态：1=正常，0=禁用 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "nickname": "管理员",
        "avatar": "https://...",
        "email": "admin@example.com",
        "phone": "13800138000",
        "status": 1,
        "lastLoginAt": "2025-12-11T10:00:00.000Z",
        "createdAt": "2025-12-11T08:00:00.000Z",
        "roles": [
          { "id": 1, "name": "管理员", "code": "admin" }
        ]
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

### 2.2 获取用户详情

**GET** `/api/users/:id`

**权限**: `user:view`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "avatar": "https://...",
    "email": "admin@example.com",
    "phone": "13800138000",
    "status": 1,
    "createdAt": "2025-12-11T08:00:00.000Z",
    "roles": [
      { "id": 1, "name": "管理员", "code": "admin" }
    ],
    "roleIds": [1]
  }
}
```

---

### 2.3 创建用户

**POST** `/api/users`

**权限**: `user:create`

**请求参数**:
```json
{
  "username": "string",    // 必填，3-50字符
  "password": "string",    // 必填，至少6位
  "nickname": "string",    // 可选
  "email": "string",       // 可选
  "phone": "string",       // 可选
  "roleIds": [1, 2],       // 可选，角色ID数组
  "status": 1              // 可选，默认 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建用户成功",
  "data": {
    "id": 4,
    "username": "newuser",
    "nickname": "新用户",
    "email": "new@example.com",
    "phone": "13800138003",
    "status": 1,
    "roles": [
      { "id": 3, "name": "普通用户", "code": "user" }
    ],
    "createdAt": "2025-12-11T12:00:00.000Z"
  }
}
```

---

### 2.4 更新用户信息

**PUT** `/api/users/:id`

**权限**: `user:edit`

**请求参数**:
```json
{
  "nickname": "string",    // 可选
  "email": "string",       // 可选
  "phone": "string",       // 可选
  "avatar": "string",      // 可选
  "status": 1,             // 可选
  "roleIds": [1, 2]        // 可选，更新角色
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新用户成功",
  "data": { ... }
}
```

---

### 2.5 更新用户状态

**PUT** `/api/users/:id/status`

**权限**: `user:edit`

**请求参数**:
```json
{
  "status": 0    // 必填，0=禁用，1=启用
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新用户状态成功",
  "data": {
    "id": 1,
    "status": 0
  }
}
```

---

### 2.6 删除用户

**DELETE** `/api/users/:id`

**权限**: `user:delete`

**响应示例**:
```json
{
  "code": 200,
  "message": "删除用户成功",
  "data": null
}
```

---

### 2.7 重置用户密码

**PUT** `/api/users/:id/reset-password`

**权限**: `user:edit`

**请求参数**:
```json
{
  "password": "string"    // 必填，新密码（至少6位）
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "重置密码成功",
  "data": null
}
```

---

### 2.8 为用户分配角色

**PUT** `/api/users/:id/roles`

**权限**: `user:assign_role`

**请求参数**:
```json
{
  "roleIds": [1, 2]    // 必填，角色ID数组
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "分配角色成功",
  "data": null
}
```

---

## 三、角色管理模块 `/api/roles`

### 3.1 获取所有角色（下拉选择用）

**GET** `/api/roles/all`

**权限**: 需要认证

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "id": 1, "name": "超级管理员", "code": "super_admin", "description": "拥有系统所有权限" },
    { "id": 2, "name": "管理员", "code": "admin", "description": "系统管理员" },
    { "id": 3, "name": "普通用户", "code": "user", "description": "普通用户" }
  ]
}
```

---

### 3.2 获取角色列表（分页）

**GET** `/api/roles`

**权限**: 管理员（`super_admin` 或 `admin`）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词 |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| status | number | 否 | 状态 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "超级管理员",
        "code": "super_admin",
        "description": "拥有系统所有权限",
        "status": 1,
        "sort": 1,
        "createdAt": "2025-12-11T08:00:00.000Z"
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 10
  }
}
```

---

### 3.3 获取角色详情

**GET** `/api/roles/:id`

**权限**: 管理员

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "超级管理员",
    "code": "super_admin",
    "description": "拥有系统所有权限",
    "status": 1,
    "sort": 1,
    "permissionIds": [1, 2, 3, 4, 5, ...]
  }
}
```

---

### 3.4 创建角色

**POST** `/api/roles`

**权限**: 管理员

**请求参数**:
```json
{
  "name": "string",         // 必填，角色名称
  "code": "string",         // 必填，角色编码（唯一）
  "description": "string",  // 可选，描述
  "status": 1,              // 可选，默认 1
  "sort": 0                 // 可选，排序
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建角色成功",
  "data": { ... }
}
```

---

### 3.5 更新角色

**PUT** `/api/roles/:id`

**权限**: 管理员

**请求参数**:
```json
{
  "name": "string",
  "code": "string",
  "description": "string",
  "status": 1,
  "sort": 0
}
```

---

### 3.6 删除角色

**DELETE** `/api/roles/:id`

**权限**: 管理员

**注意**: 系统预设角色（`super_admin`、`admin`、`user`）不能删除

---

### 3.7 为角色分配权限

**POST** `/api/roles/:id/permissions`

**权限**: 管理员

**请求参数**:
```json
{
  "permissionIds": [1, 2, 3, 4, 5]    // 权限ID数组
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "分配权限成功",
  "data": null
}
```

---

## 四、菜单管理模块 `/api/menus`

### 4.1 获取用户菜单树

**GET** `/api/menus`

**权限**: 需要认证

**说明**: 根据当前用户权限返回可访问的菜单树

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "type": "menu",
      "name": "Dashboard",
      "path": "/dashboard",
      "component": "dashboard/index",
      "redirect": null,
      "meta": {
        "title": "仪表盘",
        "icon": "dashboard",
        "hidden": false,
        "keepAlive": true,
        "permissions": ["dashboard:view"]
      }
    },
    {
      "id": 2,
      "type": "directory",
      "name": "System",
      "path": "/system",
      "component": "Layout",
      "redirect": "/system/user",
      "meta": {
        "title": "系统管理",
        "icon": "setting",
        "alwaysShow": true
      },
      "children": [
        {
          "id": 3,
          "type": "menu",
          "name": "User",
          "path": "/system/user",
          "component": "system/user/index",
          "meta": {
            "title": "用户管理",
            "icon": "user",
            "keepAlive": true
          }
        }
      ]
    }
  ]
}
```

---

### 4.2 获取完整菜单树（管理用）

**GET** `/api/menus/tree`

**权限**: 管理员

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | number | 否 | 状态筛选 |

---

### 4.3 获取菜单列表（扁平）

**GET** `/api/menus/list`

**权限**: 管理员

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | number | 否 | 状态筛选 |
| hidden | boolean | 否 | 是否隐藏 |

---

### 4.4 获取菜单详情

**GET** `/api/menus/:id`

**权限**: 管理员

---

### 4.5 创建菜单

**POST** `/api/menus`

**权限**: 管理员

**请求参数**:
```json
{
  "parent_id": 0,              // 父菜单ID，0表示顶级
  "type": "menu",              // 类型：directory/menu/button/embed/link
  "name": "string",            // 必填，菜单名称（唯一标识）
  "title": "string",           // 必填，显示标题
  "path": "/path",             // 路由路径
  "component": "component",    // 组件路径
  "redirect": "/redirect",     // 重定向路径
  "icon": "icon-name",         // 图标
  "permission_code": "code",   // 必填，权限编码
  "status": 1,                 // 状态
  "hidden": false,             // 是否隐藏
  "keep_alive": true,          // 是否缓存
  "always_show": false,        // 是否始终显示
  "sort": 0                    // 排序
}
```

---

### 4.6 更新菜单

**PUT** `/api/menus/:id`

**权限**: 管理员

---

### 4.7 删除菜单

**DELETE** `/api/menus/:id`

**权限**: 管理员

**注意**: 有子菜单的菜单不能删除

---

## 五、权限管理模块 `/api/permissions`

### 5.1 获取权限列表（分页）

**GET** `/api/permissions`

**权限**: `permission:view`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词 |
| category | string | 否 | 权限分类 |
| status | number | 否 | 状态 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "code": "dashboard:view",
        "name": "查看仪表盘",
        "description": "查看系统仪表盘",
        "category": "dashboard",
        "status": 1,
        "createdAt": "2025-12-11T08:00:00.000Z"
      }
    ],
    "total": 19,
    "page": 1,
    "pageSize": 10
  }
}
```

---

### 5.2 获取所有权限（角色分配用）

**GET** `/api/permissions/all`

**权限**: `permission:view`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "grouped": {
      "dashboard": [...],
      "user": [...],
      "role": [...],
      "menu": [...],
      "permission": [...]
    }
  }
}
```

---

### 5.3 获取权限分类列表

**GET** `/api/permissions/categories`

**权限**: `permission:view`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": ["dashboard", "user", "role", "menu", "permission"]
}
```

---

### 5.4 获取权限详情

**GET** `/api/permissions/:id`

**权限**: `permission:view`

---

### 5.5 创建权限

**POST** `/api/permissions`

**权限**: `permission:create`

**请求参数**:
```json
{
  "code": "string",         // 必填，权限编码（唯一）
  "name": "string",         // 必填，权限名称
  "description": "string",  // 可选，描述
  "category": "string",     // 可选，分类
  "status": 1               // 可选，默认 1
}
```

---

### 5.6 更新权限

**PUT** `/api/permissions/:id`

**权限**: `permission:edit`

---

### 5.7 删除权限

**DELETE** `/api/permissions/:id`

**权限**: `permission:delete`

**注意**: 正在被角色使用的权限不能删除

---

### 5.8 批量删除权限

**POST** `/api/permissions/batch-delete`

**权限**: `permission:delete`

**请求参数**:
```json
{
  "ids": [1, 2, 3]    // 权限ID数组
}
```

---

## 六、健康检查

### 6.1 健康检查

**GET** `/api/health`

**权限**: 无需认证

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-11T12:00:00.000Z"
}
```

---

## 测试账号

| 账号类型 | 用户名 | 密码 | 角色 | 权限 |
|---------|--------|------|------|------|
| 超级管理员 | superadmin | 123456 | super_admin | 全部权限 |
| 管理员 | admin | 123456 | admin | 除权限管理外的全部权限 |
| 普通用户 | user | 123456 | user | dashboard:view, user:view |

---

## 权限编码列表

| 分类 | 权限编码 | 说明 |
|------|----------|------|
| dashboard | dashboard:view | 查看仪表盘 |
| user | user:view | 查看用户 |
| user | user:create | 创建用户 |
| user | user:edit | 编辑用户 |
| user | user:delete | 删除用户 |
| user | user:assign_role | 分配角色 |
| role | role:view | 查看角色 |
| role | role:create | 创建角色 |
| role | role:edit | 编辑角色 |
| role | role:delete | 删除角色 |
| role | role:assign_permission | 分配权限 |
| menu | menu:view | 查看菜单 |
| menu | menu:create | 创建菜单 |
| menu | menu:edit | 编辑菜单 |
| menu | menu:delete | 删除菜单 |
| permission | permission:view | 查看权限 |
| permission | permission:create | 创建权限 |
| permission | permission:edit | 编辑权限 |
| permission | permission:delete | 删除权限 |

