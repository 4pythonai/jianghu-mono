# 头像组件重构计划

## 1. 目标

- 抽象出一个公共的 `jh-avatar` 头像组件，统一整个小程序中的头像显示。
- 减少 wxml 和 wxss 中的重复代码。
- 增加性别和差点（handicap）的显示。
- 规范化组件命名。

## 2. 现有问题分析

通过对代码库的检索，我们发现存在以下问题：

1.  **组件使用不统一**: 已经存在 `PlayerAvatar` 和 `AvatarGroup` 两个组件，但很多页面仍然直接使用 `<image>` 标签来显示头像，导致逻辑（如默认图片处理）重复。
2.  **功能缺失**: 现有的 `PlayerAvatar` 虽然定义了 `gender` 属性，但并未在界面上展示。同时，缺少了差点（handicap）的显示。
3.  **命名不够规范**: 组件名称 `PlayerAvatar` 可以更通用化，如 `jh-avatar`。

## 3. 重构方案

### 3.1 创建 `jh-avatar` 组件

我们将基于现有的 `PlayerAvatar` 组件进行增强和重命名。

**文件和组件名变更：**

-   `components/PlayerAvatar/*` -> `components/jh-avatar/*`
-   `PlayerAvatar` -> `jh-avatar`

**API 设计 (`jh-avatar.json`):**

```json
{
  "component": true,
  "usingComponents": {}
}
```

**属性 (`jh-avatar.js`):**

| 属性         | 类型    | 默认值   | 说明                                           |
| :----------- | :------ | :------- | :--------------------------------------------- |
| `avatar`     | String  | `''`     | 头像 URL                                       |
| `show_name`     | String  | `''`     | 显示的昵称                                     |
| `gender`     | String  | `''`     | 性别: 'male' 或 'female'                       |
| `handicap`   | String/Number  | `''`     | 差点，如 "10.1" 或 10                          |
| `size`       | String  | `medium` | 尺寸: `mini`, `xs`, `small`, `medium`, `large` |
| `shape`      | String  | `round`  | 形状: `round` (圆形), `square` (方形)        |
| `user_id`    | Number  | `0`      | 用户 ID，用于点击跳转                            |
| `clickable`  | Boolean | `true`   | 是否可点击跳转                                 |
| `avatar_only` | Boolean | `false`  | 是否只显示头像，不显示昵称、性别等信息         |

**WXML (`jh-avatar.wxml`):**

-   在昵称旁边增加性别图标（如 ♂ 和 ♀）。
-   在性别图标旁边显示差点（H:xx.x）。

### 3.2 创建 `jh-avatar-group` 组件

同样，我们将 `AvatarGroup` 重命名为 `jh-avatar-group`。

**文件和组件名变更：**

-   `components/AvatarGroup/*` -> `components/jh-avatar-group/*`
-   `AvatarGroup` -> `jh-avatar-group`

该组件内部将使用 `jh-avatar` 组件来渲染单个头像。

### 3.3 代码替换步骤

1.  **创建新组件**：
    -   复制 `components/PlayerAvatar` 到 `components/jh-avatar`。
    -   修改 `jh-avatar` 的 `.js`, `.wxml`, `.wxss` 文件，实现新功能（性别、差点显示）。
    -   复制 `components/AvatarGroup` 到 `components/jh-avatar-group`。
    -   修改 `jh-avatar-group`，使其调用 `jh-avatar`。
2.  **全局替换**：
    -   在整个项目中，搜索并替换所有 `<PlayerAvatar` 为 `<jh-avatar`。
    -   搜索并替换所有 `<AvatarGroup` 为 `<jh-avatar-group`。
    -   搜索所有使用了形如 `<image class="...-avatar..."` 的地方，将其替换为 `<jh-avatar>` 组件。
3.  **删除旧组件**：
    -   在确认所有替换无误后，删除 `components/PlayerAvatar` 和 `components/AvatarGroup` 目录。

## 4. 执行计划

-   [ ] **步骤 1:** 创建并实现 `components/jh-avatar`。
-   [ ] **步骤 2:** 创建并实现 `components/jh-avatar-group`。
-   [ ] **步骤 3:** 逐步替换项目中的旧实现。
-   [ ] **步骤 4:** 测试所有相关页面，确保显示和功能正常。
-   [ ] **步骤 5:** 删除旧的 `PlayerAvatar` 和 `AvatarGroup` 组件。
