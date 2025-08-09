# 微信小程序API更新总结

## 更新概述
本次更新解决了微信小程序中 `wx.getSystemInfoSync()` API 废弃的问题，将其替换为新的推荐API。

## 废弃的API
- `wx.getSystemInfoSync()` - 已废弃，不再推荐使用

## 新的推荐API
根据微信小程序官方文档，以下API替代了 `wx.getSystemInfoSync()`：

1. **`wx.getWindowInfo()`** - 获取窗口信息
   - 返回：`windowWidth`, `windowHeight`, `screenWidth`, `screenHeight`, `pixelRatio` 等

2. **`wx.getAppBaseInfo()`** - 获取应用基础信息
   - 返回：`platform`, `SDKVersion`, `version`, `language` 等

3. **`wx.getDeviceInfo()`** - 获取设备信息
   - 返回：`brand`, `model`, `system`, `platform` 等

4. **`wx.getSystemSetting()`** - 获取系统设置
   - 返回：`bluetoothEnabled`, `locationEnabled`, `wifiEnabled` 等

5. **`wx.getAppAuthorizeSetting()`** - 获取应用授权设置
   - 返回：`locationAuthorized`, `notificationAuthorized` 等

## 本次更新的文件

### 1. `components/HolesDrag/dragComponent/index.js`
**更新内容：**
- 将 `wx.getSystemInfoSync()` 替换为 `wx.getWindowInfo()` 和 `wx.getAppBaseInfo()`
- 保持原有功能不变，确保兼容性

**更新前：**
```javascript
const { windowWidth, windowHeight, platform, SDKVersion } = wx.getSystemInfoSync();
```

**更新后：**
```javascript
// 使用新的API替代废弃的wx.getSystemInfoSync()
const windowInfo = wx.getWindowInfo();
const appBaseInfo = wx.getAppBaseInfo();

const { windowWidth, windowHeight } = windowInfo;
const { platform, SDKVersion } = appBaseInfo;
```

### 2. `app.js` (已正确实现)
**现状：**
- 已经正确使用了新的API
- 包含降级处理机制，确保兼容性
- 使用 `wx.getDeviceInfo()`, `wx.getWindowInfo()`, `wx.getAppBaseInfo()` 组合获取完整系统信息

## 兼容性说明
- 新API支持基础库 2.11.0 及以上版本
- 对于低版本基础库，建议保留降级处理机制
- 本次更新保持了原有功能的完整性

## 测试建议
1. 在不同设备上测试拖拽功能是否正常
2. 验证窗口尺寸计算是否正确
3. 确认平台检测功能正常工作
4. 测试在不同微信版本下的兼容性

## 注意事项
- 新API是同步调用，性能更好
- 建议在项目中使用统一的系统信息获取方法
- 定期检查微信小程序官方文档，及时更新废弃的API 