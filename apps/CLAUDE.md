# 高尔夫江湖项目
这是一个高尔夫江湖项目，主要用于管理高尔夫比赛，主要功能:比赛创建、赌球,记分.

# 项目结构
- jianghu-api: 后台API
- jianghu-weixin: 小程序

## jianghu-api
Codeigniter PHP 框架
数据库:MySQL

### php api 控制器(Controller) 接收参数的写法

```
    $json_paras = json_decode(file_get_contents('php://input'), true);
    $para1 = $json_paras['para1'];
    $para2 = $json_paras['para2'];
```

## jianghu-weixin
微信小程序,主要功能:
- 比赛相关:创建,报名,记分
- 赌球相关:规则,结果展示

### api 端点定义与调用

```
//获取全局的app对象,在app.js中定义

App({
    api: api,
    ...
})
```

在组件中调用的方式

```
const app = getApp();

Page({
    data: {
        gambleid: '',
        loading: true,
        error: null
    },
    onLoad(options) {
        const gambleid = options.gambleid;
        this.fetchGambleResult(gambleid);
    },
    async fetchGambleResult(gambleid) {
        const result = await app.api.gamble.getSingleGambleResult({ gambleid });
        // 消费 result
    }
}); 

``` 



### 小程序图标目录

 jianghu-weixin/assets/icons

### 自定义导航栏配置注意事项

使用 `CustomNavBar` 组件时，页面的 `.json` 文件必须同时配置以下两项，否则会导致输入框无法点击等布局问题：

```json
{
    "navigationStyle": "custom",
    "usingComponents": {
        "CustomNavBar": "/components/CustomNavBar/CustomNavBar"
    }
}
```

**常见错误：** 只在 `.wxml` 中使用 `<CustomNavBar />`，但 `.json` 中缺少声明，会导致：
1. 原生导航栏仍然显示
2. CustomNavBar 组件标签被忽略或作为空元素渲染
3. 页面布局混乱，输入框等元素可能被不可见元素覆盖，无法获取焦点

**正确示例（参考 addPlayerHub.json）：**
```json
{
    "navigationStyle": "custom",
    "navigationBarTitleText": "页面标题",
    "usingComponents": {
        "CustomNavBar": "/components/CustomNavBar/CustomNavBar"
    }
}
```


# 获取当前用户信息
```
 const app = getApp()
 const currentUserId = app?.globalData?.userInfo?.id
           


```
