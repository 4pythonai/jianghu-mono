# HoleJump 跳洞设置弹框组件

## 功能描述
这是一个跳洞设置的弹框组件，集成了 `HolesDrag` 拖拽排序功能，允许用户在弹框中拖拽排序球洞。

## 组件特点
- **弹框形式**: 使用模态弹框展示拖拽功能
- **集成拖拽**: 内置 `HolesDrag` 组件实现球洞排序
- **事件通信**: 通过事件向父组件传递操作结果
- **响应式设计**: 适配不同屏幕尺寸

## 使用方法

### 在父组件中使用
```xml
<holejump 
  bind:holesortend="onHoleSortEnd"
  bind:reset="onReset"
  bind:complete="onComplete"
  bind:close="onClose"
></holejump>
```

### 事件说明
- `holesortend`: 拖拽排序结束时触发，返回排序后的数据
- `reset`: 点击重置按钮时触发
- `complete`: 点击确定按钮时触发
- `close`: 点击取消或遮罩层时触发

### 事件处理示例
```javascript
// 在父组件中处理事件
onHoleSortEnd(e) {
    console.log("排序结果:", e.detail.listData);
    // 处理排序结果
},

onReset() {
    console.log("重置排序");
    // 重置逻辑
},

onComplete() {
    console.log("完成设置");
    // 完成逻辑
},

onClose() {
    console.log("关闭弹框");
    // 关闭逻辑
}
```

## 组件结构

### 弹框布局
```
modal-mask (遮罩层)
└── modal-content (弹框内容)
    ├── modal-title (标题)
    ├── drag-section (拖拽区域)
    │   ├── section-title (区域标题)
    │   └── drag-container (拖拽容器)
    │       └── HolesDrag (拖拽组件)
    └── modal-actions (操作按钮)
        ├── 重置按钮
        ├── 取消按钮
        └── 确定按钮
```

### 样式特点
- **固定高度**: 拖拽容器高度为 600rpx
- **圆角设计**: 使用圆角边框美化界面
- **背景色**: 使用浅灰色背景区分区域
- **响应式**: 适配不同屏幕尺寸

## 技术实现

### 组件依赖
- `HolesDrag`: 核心拖拽组件
- `modal.wxss`: 弹框基础样式

### 数据流
1. **用户拖拽** → `HolesDrag` 组件处理
2. **排序完成** → 触发 `sortend` 事件
3. **弹框接收** → 处理 `onSortEnd` 方法
4. **向上传递** → 触发 `holesortend` 事件给父组件

### 注意事项
1. **弹框层级**: 确保弹框在正确的层级显示
2. **事件冒泡**: 使用 `catchtap` 防止事件冒泡
3. **滚动处理**: 弹框内的滚动需要特殊处理
4. **内存管理**: 组件销毁时清理相关资源

## 扩展功能
- 支持自定义球洞数据
- 支持预设排序方案
- 支持拖拽动画效果
- 支持键盘快捷键操作 