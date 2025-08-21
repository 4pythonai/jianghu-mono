/**
 * 拉丝KPI配置组件 - 简化版
 * 纯受控组件，所有数据通过props传入，UI变化通过事件通知父组件
 */

import { generateLasiRuleName } from '../../../../utils/ruleNameGenerator.js'

Component({
  properties: {
    config: {
      type: Object,
      value: null,
      observer: function(newVal) {
        console.log('🔍 [LasiKPI] config properties更新:', newVal);
      }
    },
    displayValue: {
      type: String,
      value: '请配置KPI规则'
    },
    mode: {
      type: String,
      value: 'UserEdit'
    }
  },

  data: {
    // 分值范围（1-5分）
    valueRange: [1, 2, 3, 4, 5],

    // UI计算状态（由observer更新）
    currentConfig: null,
    isSelected: {
      best: false,
      worst: false,
      total: false
    },
    totalCalculationType: 'add_total',
    kpiValues: {
      best: 1,
      worst: 1,
      total: 1
    },
    totalScore: 0,
    generatedRuleName: ''
  },

  lifetimes: {
    attached() {
      console.log('🎬 [LasiKPI] 组件初始化，当前config:', this.properties.config);
      this.updateCurrentConfig();
    }
  },

  observers: {
    'config': function(newConfig) {
      console.log('🔍 [LasiKPI] config变化:', newConfig);
      this.updateCurrentConfig();
    }
  },

  methods: {
    // 更新当前配置状态
    updateCurrentConfig() {
      const config = this.properties.config;
      
      // 完全受控：如果没有config，清空UI状态
      if (!config) {
        this.setData({
          currentConfig: null,
          isSelected: {
            best: false,
            worst: false,
            total: false
          },
          totalCalculationType: 'add_total',
          kpiValues: {
            best: 1,
            worst: 1,
            total: 1
          },
          totalScore: 0,
          generatedRuleName: ''
        });
        return;
      }
      
      // 构建选中状态映射
      const isSelected = {
        best: config.indicators.includes('best'),
        worst: config.indicators.includes('worst'),
        total: config.indicators.includes('total')
      };

      // 计算总分
      let totalScore = 0;
      for (const indicator of config.indicators) {
        totalScore += config.kpiValues[indicator] || 0;
      }

      // 生成规则名称
      const generatedRuleName = generateLasiRuleName(
        config.indicators, 
        config.kpiValues, 
        config.totalCalculationType
      );

      this.setData({
        currentConfig: config,
        isSelected: isSelected,
        totalCalculationType: config.totalCalculationType,
        kpiValues: config.kpiValues,
        totalScore: totalScore,
        generatedRuleName: generatedRuleName
      });
    },

    // UI事件处理
    onSelectIndicator(e) {
      const { value } = e.currentTarget.dataset;
      const config = this.data.currentConfig;
      
      const newIndicators = config.indicators.includes(value)
        ? config.indicators.filter(item => item !== value)
        : [...config.indicators, value];

      const newConfig = {
        ...config,
        indicators: newIndicators
      };
      
      this.handleConfigChange(newConfig);
    },

    onToggleTotalType() {
      const newType = this.data.totalCalculationType === 'add_total' ? 'multiply_total' : 'add_total';
      const config = {
        ...this.data.currentConfig,
        totalCalculationType: newType
      };
      this.handleConfigChange(config);
    },

    onKpiValueChange(e) {
      const { kpi } = e.currentTarget.dataset;
      const value = this.data.valueRange[e.detail.value];

      const newKpiValues = { ...this.data.currentConfig.kpiValues };
      newKpiValues[kpi] = value;

      const config = {
        ...this.data.currentConfig,
        kpiValues: newKpiValues
      };
      
      this.handleConfigChange(config);
    },

    // 统一的配置变更处理
    handleConfigChange(config) {
      console.log('🎯 [LasiKPI] KPI配置变化:', config);
      
      // 生成规则名称
      const generatedRuleName = generateLasiRuleName(
        config.indicators, 
        config.kpiValues, 
        config.totalCalculationType
      );
      
      this.triggerEvent('configChange', { 
        componentType: 'kpi',
        config: config,
        generatedRuleName: generatedRuleName
      });
    },

    // 辅助方法
    getCurrentConfig() {
      return this.properties.config;
    }
  }
});