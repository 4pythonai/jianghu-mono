/**
 * 拉丝KPI配置组件 - 重构版
 * 纯展示组件，所有数据由父组件通过props传入
 */

import { generateLasiRuleName } from '../../../../utils/ruleNameGenerator.js'

Component({
  properties: {
    // KPI配置数据
    config: {
      type: Object,
      value: null
    },
    // 显示值（由Store计算）
    displayValue: {
      type: String,
      value: '请配置KPI规则'
    },
    // 组件模式
    mode: {
      type: String,
      value: 'UserEdit' // 'UserEdit' | 'SysConfig' | 'view'
    }
  },

  data: {
    // KPI指标选项
    indicatorOptions: [
      { key: 'best', label: '较好成绩PK', value: 1 },
      { key: 'worst', label: '较差成绩PK', value: 1 },
      { key: 'total', label: '双方总杆PK', value: 1 }
    ],
    
    // 总杆计算方式选项
    totalCalculationOptions: [
      { key: 'add_total', label: '杆数相加' },
      { key: 'multiply_total', label: '杆数相乘' }
    ],
    
    // 分值范围（1-10分）
    valueRange: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    
    // 当前编辑中的配置
    editingConfig: {
      indicators: ['best', 'worst', 'total'],
      totalCalculationType: 'add_total',
      kpiValues: {
        best: 1,
        worst: 1,
        total: 1
      }
    },
    
    // UI选择状态
    selectedIndicators: ['best', 'worst', 'total'],
    isSelected: {
      best: true,
      worst: true,
      total: true
    },
    totalCalculationType: 'add_total',
    kpiValues: {
      best: 1,
      worst: 1,
      total: 1
    },
    
    // 计算属性
    totalScore: 3,
    generatedRuleName: ''
  },

  lifetimes: {
    attached() {
      console.log('🎯 [LasiKPI] 组件加载，props:', {
        config: this.properties.config,
        displayValue: this.properties.displayValue,
        mode: this.properties.mode
      });
      
      // 初始化默认配置
      this.initializeWithDefaults();
    }
  },

  observers: {
    'config': function(newConfig) {
      console.log('🎯 [LasiKPI] observer触发, newConfig:', newConfig);
      if (newConfig) {
        console.log('🎯 [LasiKPI] 配置更新:', newConfig);
        this.updateEditingConfig(newConfig);
      } else {
        console.log('🎯 [LasiKPI] 配置为空，使用默认值');
        this.initializeWithDefaults();
      }
    }
  },

  methods: {
    // 初始化默认配置
    initializeWithDefaults() {
      const defaultConfig = {
        indicators: ['best', 'worst', 'total'],
        totalCalculationType: 'add_total',
        kpiValues: {
          best: 1,
          worst: 1,
          total: 1
        }
      };
      
      this.updateEditingConfig(defaultConfig);
      
      // 新建模式下，初始化后立即通知父组件默认配置
      if (this.properties.mode === 'UserEdit') {
        this.notifyConfigChange();
      }
    },

    // 根据传入的config更新编辑状态
    updateEditingConfig(config) {
      const { indicators, totalCalculationType, kpiValues } = config;
      
      // 构建选中状态映射
      const isSelected = {
        best: indicators.includes('best'),
        worst: indicators.includes('worst'),
        total: indicators.includes('total')
      };
      
      this.setData({
        editingConfig: config,
        selectedIndicators: indicators || ['best', 'worst', 'total'],
        isSelected,
        totalCalculationType: totalCalculationType || 'add_total',
        kpiValues: kpiValues || { best: 1, worst: 1, total: 1 }
      });
      
      this.calculateTotalScore();
      this.generateRuleName();
    },

    // === UI事件处理 ===
    
    // 选择KPI指标
    onSelectIndicator(e) {
      const { value } = e.currentTarget.dataset;
      const { selectedIndicators, isSelected } = this.data;
      
      const newSelectedIndicators = selectedIndicators.includes(value)
        ? selectedIndicators.filter(item => item !== value)
        : [...selectedIndicators, value];
      
      const newIsSelected = { ...isSelected };
      newIsSelected[value] = !selectedIndicators.includes(value);
      
      this.setData({
        selectedIndicators: newSelectedIndicators,
        isSelected: newIsSelected
      });
      
      this.calculateTotalScore();
      this.generateRuleName();
      this.notifyConfigChange();
    },

    // 切换总杆计算方式
    onToggleTotalType() {
      const newType = this.data.totalCalculationType === 'add_total' ? 'multiply_total' : 'add_total';
      this.setData({
        totalCalculationType: newType
      });
      
      this.generateRuleName();
      this.notifyConfigChange();
    },

    // KPI分值变化处理
    onKpiValueChange(e) {
      const { kpi } = e.currentTarget.dataset;
      const value = this.data.valueRange[e.detail.value]; // 直接使用valueRange中的值
      
      const { kpiValues } = this.data;
      const newKpiValues = { ...kpiValues };
      newKpiValues[kpi] = value;
      
      this.setData({
        kpiValues: newKpiValues
      });
      
      this.calculateTotalScore();
      this.generateRuleName();
      this.notifyConfigChange();
    },

    // === 辅助方法 ===
    
    // 计算总分
    calculateTotalScore() {
      const { selectedIndicators, kpiValues } = this.data;
      let total = 0;
      
      for (const indicator of selectedIndicators) {
        total += kpiValues[indicator] || 0;
      }
      
      this.setData({
        totalScore: total
      });
    },

    // 生成规则名称
    generateRuleName() {
      const { selectedIndicators, kpiValues, totalCalculationType } = this.data;
      
      // 使用统一的规则名称生成器
      const ruleName = generateLasiRuleName(selectedIndicators, kpiValues, totalCalculationType);
      
      this.setData({ generatedRuleName: ruleName });
    },

    // 通知父组件配置变化
    notifyConfigChange() {
      const config = this.buildConfigFromUI();
      const { generatedRuleName } = this.data;
      
      console.log('🎯 [LasiKPI] 通知配置变化:', { config, generatedRuleName });
      
      // 触发事件通知父组件
      this.triggerEvent('kpiConfigChange', {
        config,
        selectedIndicators: this.data.selectedIndicators,
        hasTotalType: this.data.selectedIndicators.includes('total'),
        generatedRuleName
      });
    },

    // 从UI状态构建配置对象
    buildConfigFromUI() {
      const { selectedIndicators, totalCalculationType, kpiValues } = this.data;
      
      return {
        indicators: selectedIndicators,
        totalCalculationType,
        kpiValues: { ...kpiValues }
      };
    },

    // 同步Store数据（供父组件调用）
    syncWithStore(storeData) {
      console.log('🎯 [LasiKPI] 同步Store数据:', storeData);
      
      if (storeData?.config?.kpiConfig) {
        // 通过properties更新，会触发observer
        // 这里只是记录日志，实际更新通过父组件传props
      }
    },

    // === 兼容性方法（供旧代码调用） ===
    
    // 获取配置结果 - 返回指定格式的数组
    getConfigResult() {
      const { selectedIndicators, kpiValues, totalCalculationType } = this.data;
      const result = [];
      
      // 添加选中的KPI配置
      for (const indicator of selectedIndicators) {
        if (indicator === 'total') {
          // 总杆类型需要特殊处理
          result.push({
            kpi: totalCalculationType,
            value: kpiValues.total
          });
        } else {
          result.push({
            kpi: indicator,
            value: kpiValues[indicator]
          });
        }
      }
      
      return result;
    },

    // 获取配置数据（供SysEdit页面调用）
    getConfigData() {
      const config = this.buildConfigFromUI();
      
      // 返回扁平化的数据结构，与UserRuleEdit的collectConfigData方法兼容
      return {
        kpis: JSON.stringify(config)
      };
    }
  }
});