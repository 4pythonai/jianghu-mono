# 组件按钮样式与全局复用指南

本项目按钮样式统一定义在 `jianghu-weixin/styles/buttons.wxss`，并已由 `jianghu-weixin/app.wxss` 引入。页面可以直接使用按钮类名；组件需要额外设置才能复用全局样式与变量。

## 组件中复用全局按钮样式

按钮样式依赖 `app.wxss` 里的 CSS 变量（`page` 作用域），组件需开启共享样式：

`jianghu-weixin/components/xxx/xxx.json`

```json
{
  "component": true,
  "options": {
    "addGlobalClass": true,
    "styleIsolation": "apply-shared"
  }
}
```

说明：
- `addGlobalClass: true` 允许组件接受外部的 class。
- `styleIsolation: "apply-shared"` 允许全局样式与变量进入组件。

## 按钮类名使用指南

按钮类名按「基础 + 类型 + 尺寸 + 布局/状态」组合使用：

- 基础：`btn`
- 类型：`btn-primary` `btn-secondary` `btn-cancel` `btn-confirm` `btn-danger` `btn-wechat`
- 尺寸：`btn-small` `btn-medium` `btn-large`
- 布局：`btn-block` `btn-circle`
- 状态：`disabled`（或 `disabled="{{true}}"`）、`loading`

推荐写法（示例）：

```html
<button class="btn btn-primary btn-medium">立即创建</button>
<button class="btn btn-secondary btn-small">取消</button>
<button class="btn btn-primary btn-block" disabled="{{!canSubmit}}">提交</button>
```

## 按钮组

统一按钮组容器：
- 横向：`btn-group-horizontal`
- 纵向：`btn-group-vertical`
- 底部固定：`btn-group-bottom`

```html
<view class="btn-group-horizontal">
  <button class="btn btn-secondary btn-medium">上一步</button>
  <button class="btn btn-primary btn-medium">下一步</button>
</view>
```

## 约定

- 新增按钮优先使用 `btn` 体系，避免自定义颜色。
- 需要特殊样式时，先在组件内添加轻量补充类，再考虑扩展全局按钮样式。
