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


