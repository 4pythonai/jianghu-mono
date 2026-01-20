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

### 自定义导航栏内容被遮挡问题（重要）

**问题原因：** `CustomNavBar` 组件使用 `position: fixed` 固定在页面顶部，页面内容如果不添加顶部 padding，会被导航栏遮挡。

**解决方案：** 页面内容区域必须添加 `padding-top`，值为 `状态栏高度 + 导航栏高度(44px)`。

**正确写法：**

1. 在 JS 的 `onLoad` 中计算导航栏高度：
```javascript
Page({
  data: {
    navBarHeight: 88  // 默认值
  },
  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const navBarHeight = statusBarHeight + 44
    this.setData({ navBarHeight })
  }
})
```

2. 在 WXML 中给内容区域添加 padding-top：
```html
<view class="container">
  <CustomNavBar title="页面标题" showBack="{{true}}" />

  <!-- 内容区域必须添加 padding-top -->
  <view class="page-content" style="padding-top: {{navBarHeight}}px;">
    <!-- 页面实际内容 -->
  </view>
</view>
```

**常见错误：**
```html
<!-- 错误：内容直接放在 container 下，没有 padding-top -->
<view class="container">
  <CustomNavBar title="页面标题" />
  <view class="content">...</view>  <!-- 会被导航栏遮挡！ -->
</view>
```


# 获取当前用户信息
```
 const app = getApp()
 const currentUserId = app?.globalData?.userInfo?.id

```


# 永远不要对字段名进行猜测
禁止防御性编程,永远不要猜测后端返回的字段名称
宁可出错,也不要猜测后台返回字段的格式


# CustomNavBar 自定义导航栏使用指南

## 问题背景

当页面使用 `CustomNavBar` 组件时,由于导航栏是 `position: fixed` 固定定位,页面内容会被导航栏遮挡。

## 解决方案

### 1. 页面 JSON 配置

```json
{
  "usingComponents": {
    "CustomNavBar": "/components/CustomNavBar/CustomNavBar"
  },
  "navigationStyle": "custom"
}
```

### 2. WXSS 样式设置

**必须** 为页面容器添加顶部内边距:

```css
.container {
  min-height: 100vh;
  padding-top: 180rpx; /* 为固定导航栏预留空间 */
}
```

### 3. WXML 结构

```html
<view class="container">
  <CustomNavBar title="页面标题" showBack="{{true}}" />
  
  <!-- 页面内容 -->
</view>
```

## 关键参数说明

| 参数 | 说明 |
|------|------|
| `padding-top: 180rpx` | 约等于状态栏高度(~44px) + 导航栏高度(44px) + 安全间距 |

## 参考示例

已正确实现的页面:
- `pages/my-team/my-team.wxss` - 使用 `margin-top: 200rpx`
- `pages/contacts/contacts.wxss` - 使用 `padding-top: 180rpx`

## 常见错误

❌ **错误**: 忘记添加 `padding-top`,导致内容被导航栏遮挡

```css
/* 错误示例 */
.container {
  min-height: 100vh;
  /* 缺少 padding-top */
}
```

✅ **正确**: 添加足够的顶部间距

```css
/* 正确示例 */
.container {
  min-height: 100vh;
  padding-top: 180rpx;
}
```

## 新建页面检查清单

- [ ] `xxx.json` 配置了 `"navigationStyle": "custom"`
- [ ] `xxx.json` 引入了 `CustomNavBar` 组件
- [ ] `xxx.wxss` 的 `.container` 添加了 `padding-top: 180rpx`
- [ ] `xxx.wxml` 中 `CustomNavBar` 是 `container` 的第一个子元素


# Consistency / 一致性