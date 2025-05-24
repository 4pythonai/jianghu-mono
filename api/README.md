# API 模块使用说明

这是一个基于微信小程序 `wx.request` 封装的 API 模块，参考了 axios 的设计理念，提供了拦截器、统一错误处理等功能。

## 初始化

在小程序 `app.js` 中初始化 API：

```javascript
import api from './api/index'

App({
  onLaunch() {
    // 初始化 API
    api.init()
  }
})
```

## 使用示例

### 1. 用户相关 API

```javascript
import api from '../../api/index'

// 用户登录
api.user.login({
  username: 'test',
  password: '123456'
}).then(res => {
  console.log('登录成功：', res)
}).catch(err => {
  console.error('登录失败：', err)
})

// 获取用户信息
api.user.getUserInfo().then(res => {
  console.log('用户信息：', res)
})
```

### 2. 比赛相关 API

```javascript
import api from '../../api/index'

// 获取比赛列表
api.game.getGameList({
  page: 1,
  pageSize: 10,
  status: 'ongoing'
}).then(res => {
  console.log('比赛列表：', res)
})

// 获取比赛详情
api.game.getGameDetail('game123').then(res => {
  console.log('比赛详情：', res)
})
```

### 3. 团队相关 API

```javascript
import api from '../../api/index'

// 获取团队列表
api.team.getTeamList({
  page: 1,
  pageSize: 10
}).then(res => {
  console.log('团队列表：', res)
})

// 创建团队
api.team.createTeam({
  name: '测试团队',
  description: '这是一个测试团队'
}).then(res => {
  console.log('创建成功：', res)
})
```

### 4. 直接使用 http 实例

如果需要自定义请求，可以直接使用 http 实例：

```javascript
import api from '../../api/index'

// GET 请求
api.http.get('/custom/api', {
  data: { id: 123 }
})

// POST 请求
api.http.post('/custom/api', {
  name: 'test',
  age: 18
})

// PUT 请求
api.http.put('/custom/api', {
  name: 'new name'
})

// DELETE 请求
api.http.delete('/custom/api')
```

## 错误处理

API 模块已经集成了统一的错误处理，会自动处理以下情况：

1. 网络错误
2. 请求超时
3. 登录失效（会自动跳转到登录页）
4. 服务器错误
5. 权限错误

所有的错误都会通过微信小程序的 `wx.showToast` 显示给用户。

## 自定义拦截器

如果需要添加自定义拦截器，可以这样做：

```javascript
import api from '../../api/index'

// 添加请求拦截器
api.http.addRequestInterceptor(
  (config) => {
    // 在发送请求之前做些什么
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 添加响应拦截器
api.http.addResponseInterceptor(
  (response) => {
    // 对响应数据做点什么
    return response
  },
  (error) => {
    // 对响应错误做点什么
    return Promise.reject(error)
  }
)
```

## 配置说明

可以在 `api/config.js` 中修改配置：

1. 修改环境配置（开发环境、生产环境的 baseURL）
   ```javascript
   // 环境配置
   const ENV = {
     development: {
       baseURL: 'https://dev-api.example.com', // 开发环境接口地址
     },
     production: {
       baseURL: 'https://api.example.com', // 生产环境接口地址
     }
   }
   
   // 切换环境只需修改这里
   const currentEnv = 'development'
   ```

2. 修改超时时间和请求头
   ```javascript
   export const config = {
     ...ENV[currentEnv],
     timeout: 10000, // 请求超时时间（毫秒）
     header: {
       'content-type': 'application/json',
       // 可以添加其他全局请求头
     }
   }
   ```

3. 添加新的 API 接口地址
   ```javascript
   export const ApiUrls = {
     // 用户相关
     user: {
       login: '/api/user/login',
       // 添加新的接口地址
     },
     // 添加新的模块
     newModule: {
       list: '/api/new-module/list',
       detail: '/api/new-module/detail'
     }
   }
   ```

4. 手动更新配置（如果需要在运行时修改）
   ```javascript
   import api from '../../api/index'
   
   // 手动更新配置
   api.http.setConfig({
     baseURL: 'https://new-api.example.com',
     timeout: 15000
   })
   ```

## 注意事项

1. 所有的 API 请求都会自动带上 token（如果存在）
2. token 存储在小程序的 Storage 中，key 为 'token'
3. 登录失效会自动跳转到登录页
4. 所有的请求错误都会通过 toast 提示给用户