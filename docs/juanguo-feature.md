# 捐锅配置回显功能

## 功能概述

在捐锅设置弹窗中，当用户打开弹窗时，系统会自动分析现有的捐锅配置并回显到UI中，让用户能够看到当前的设置状态。

## 实现逻辑

### 1. 数据来源

- 从 `listRuntimeConfig` API 获取的 `gambles` 数组中，每个配置项都包含 `donationCfg` 字段
- `donationCfg` 可能是一个JSON字符串或对象

### 2. 分析逻辑

在 `juanguo` 组件的 `attached` 生命周期中，会执行以下分析：

1. **遍历所有运行时配置**：检查每个配置项的 `donationCfg` 字段
2. **解析数据格式**：如果 `donationCfg` 是字符串，尝试解析为JSON对象
3. **分类处理**：
   - 如果 `donationCfg` 存在且不是 `{"donationType":"none"}`，则归类为有捐锅配置
   - 否则归类为没有捐锅配置
4. **设置选中状态**：
   - 有捐锅配置的项会被自动选中（设置到 `selectedIdList`）
   - 如果所有项都没有捐锅配置，则选中"不捐锅"选项

### 3. UI回显

根据分析结果，系统会：

1. **设置选中ID列表**：将有捐锅配置的项ID添加到 `selectedIdList`
2. **回显捐锅方式**：根据第一个有捐锅配置的项来设置UI状态
3. **回显具体数值**：
   - `normal` 模式：回显 `donationPoints` 和 `maxDonationPoints`
   - `all` 模式：回显 `maxDonationPoints`
   - `bigpot` 模式：回显 `totalFee`
   - `none` 模式：选中"不捐锅"选项

## 数据格式

### donationCfg 字段格式

```javascript
// 普通模式
{
  "donationType": "normal",
  "donationPoints": 2,
  "maxDonationPoints": 10
}

// 全捐模式
{
  "donationType": "all",
  "maxDonationPoints": 20
}

// 大锅版模式
{
  "donationType": "bigpot",
  "totalFee": 100
}

// 不捐锅
{
  "donationType": "none"
}
```

## 关键代码

### 分析逻辑

```javascript
analyzeAndRestoreDonationConfig() {
    const runtimeConfigs = this.properties.runtimeConfigs || [];
    
    // 收集所有有捐锅配置的项
    const configsWithDonation = [];
    const configsWithoutDonation = [];
    
    runtimeConfigs.forEach(config => {
        let donationCfg = config.donationCfg_parsed || config.donationCfg;
        
        // 解析JSON字符串
        if (donationCfg && typeof donationCfg === 'string') {
            try {
                donationCfg = JSON.parse(donationCfg);
            } catch (e) {
                donationCfg = null;
            }
        }
        
        // 分类处理
        if (donationCfg && typeof donationCfg === 'object' && Object.keys(donationCfg).length > 0) {
            if (donationCfg.donationType && donationCfg.donationType !== 'none') {
                configsWithDonation.push({
                    id: config.id,
                    donationCfg: donationCfg
                });
            } else {
                configsWithoutDonation.push(config.id);
            }
        } else {
            configsWithoutDonation.push(config.id);
        }
    });
    
    // 设置选中状态和UI回显
    const selectedIds = configsWithDonation.map(item => item.id);
    this.setData({ selectedIdList: selectedIds });
    
    if (configsWithDonation.length > 0) {
        this.restoreDonationUI(configsWithDonation[0].donationCfg);
    } else {
        this.setData({ donationType: 'none' });
    }
}
```

## 注意事项

1. **后台数据一致性**：后台确保所有有捐锅配置的项，配置数据都一样
2. **数据解析容错**：代码会处理JSON解析失败的情况
3. **默认值处理**：当配置数据缺失时，会使用合理的默认值
4. **UI状态同步**：选中状态和捐锅方式会同步更新

## 测试用例

1. **有捐锅配置**：应该自动选中对应的配置项，并回显捐锅方式
2. **没有捐锅配置**：应该选中"不捐锅"选项
3. **混合情况**：只选中有捐锅配置的项
4. **字符串格式**：正确解析JSON字符串格式的配置
5. **不捐锅配置**：正确识别 `donationType: "none"` 为不捐锅 