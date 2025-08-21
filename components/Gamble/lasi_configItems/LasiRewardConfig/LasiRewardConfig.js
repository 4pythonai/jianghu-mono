/**
 * 拉丝奖励配置组件 - 简化版
 * 纯受控组件，所有数据通过props传入，UI变化通过事件通知父组件
 */

import { REWARD_DEFAULTS } from './rewardDefaults.js'

Component({
  properties: {
    config: {
      type: Object,
      value: null,
      observer: function (newVal) {
        console.log('🔍 [LasiRewardConfig] config properties更新:', newVal);
      }
    },
    mode: {
      type: String,
      value: 'UserEdit'
    },
    showPreCondition: {
      type: Boolean,
      value: false
    }
  },

  data: {
    visible: false,

    // UI计算状态（由observer更新）
    currentConfig: null,
    rewardType: 'add',
    rewardPreCondition: 'total_ignore',
    addRewardItems: [],
    multiplyRewardItems: [],

    // 输入禁用状态控制
    addInputDisabled: false,
    multiplyInputDisabled: false,

    // 计算的显示值
    displayValue: '请配置奖励规则'
  },


  lifetimes: {
    attached() {
      console.log('🎬 [LasiRewardConfig] 组件初始化，当前config:', this.properties.config);
      this.updateCurrentConfig();
    }
  },

  observers: {
    'config': function (newConfig) {
      console.log('🔍 [LasiRewardConfig] config变化:', {
        newConfig,
        '当前data.rewardPreCondition': this.data.rewardPreCondition,
        'newConfig.rewardPreCondition': newConfig?.rewardPreCondition
      });
      // 纯受控组件：始终根据外部config更新内部状态
      this.updateCurrentConfig();
    },

    'rewardType': function (newRewardType) {
      console.log('🎯 [LasiRewardConfig] rewardType变化:', newRewardType);
      this.updatePanelDisabledStates(newRewardType);
    }
  },

  methods: {
    // 从Store获取缺省配置（新建模式时使用）
    _getStoreDefaults() {
      try {
        const app = getApp();
        const store = app.globalData?.Gamble4PLasiStore;

        if (store && store.DEFAULTS && store.DEFAULTS.REWARD_CONFIG) {
          return store.DEFAULTS.REWARD_CONFIG;
        }
      } catch (error) {
        console.warn('⚠️ [LasiRewardConfig] 无法从Store获取缺省配置:', error);
      }

      // 降级到本地默认配置
      return REWARD_DEFAULTS.DEFAULT_REWARD_JSON;
    },

    // 更新面板禁用状态
    updatePanelDisabledStates(rewardType) {
      // 只禁用输入区域，不禁用面板头部的切换功能
      this.setData({
        addInputDisabled: rewardType === 'multiply',
        multiplyInputDisabled: rewardType === 'add'
      });
    },

    // 计算显示值
    computeDisplayValue(config) {
      if (!config) return '请配置奖励规则';

      const typeText = config.rewardType === 'add' ? '加法奖励' : '乘法奖励';
      const items = config.rewardType === 'add' ? config.addRewardItems : config.multiplyRewardItems;

      if (!items || items.length === 0) return typeText;

      // 获取有效奖励值（非0值）
      const validRewards = items.filter(item => item.rewardValue > 0);
      if (validRewards.length === 0) return typeText;

      // 显示前2个有效奖励
      const prefix = config.rewardType === 'add' ? '+' : '×';
      const rewardTexts = validRewards.slice(0, 2).map(item => {
        const scoreName = item.scoreName === 'Par' ? '帕' :
          item.scoreName === 'Birdie' ? '鸟' :
            item.scoreName === 'Eagle' ? '鹰' :
              item.scoreName === 'Albatross/HIO' ? '信天翁/HIO' : item.scoreName;
        return `${scoreName}${prefix}${item.rewardValue}`;
      });

      const displayText = typeText + ":" + rewardTexts.join('，');
      return validRewards.length > 2 ? `${displayText}...` : displayText;
    },

    // 更新当前配置状态 - 纯受控组件模式
    updateCurrentConfig() {
      const config = this.getCurrentConfig();
      
      console.log('🔄 [LasiRewardConfig] 更新配置状态:', {
        'config.rewardPreCondition': config.rewardPreCondition,
        'config.rewardType': config.rewardType
      });

      // 计算显示值
      const displayValue = this.computeDisplayValue(config);

      this.setData({
        currentConfig: config,
        rewardType: config.rewardType,
        rewardPreCondition: config.rewardPreCondition,
        addRewardItems: config.addRewardItems,
        multiplyRewardItems: config.multiplyRewardItems,
        displayValue: displayValue
      });

      // 触发禁用状态更新
      this.updatePanelDisabledStates(config.rewardType);
    },

    // UI事件处理
    onShowConfig() {
      this.setData({ visible: true });
    },

    onCancel() {
      this.setData({ visible: false });
    },

    onConfirm() {
      this.setData({ visible: false });
    },

    // 防止事件冒泡的空方法
    noTap() {
      // 阻止事件冒泡，什么都不做
    },

    onInputTap(e) {
      // 阻止事件冒泡，防止触发面板切换
      return false;
    },

    // 配置变更事件
    onRewardTypeChange(e) {
      const { type } = e.currentTarget.dataset;
      // ✅ 使用getCurrentConfig()获取最新完整配置
      const config = {
        ...this.getCurrentConfig(),
        rewardType: type
      };
      this.handleConfigChange(config);
    },

    onRewardValueChange(e) {
      const { scoreName, rewardType } = e.currentTarget.dataset;
      const value = Number.parseInt(e.detail.value) || 0;
      
      // ✅ 使用getCurrentConfig()获取最新完整配置，确保不丢失任何字段
      const config = { ...this.getCurrentConfig() };

      if (rewardType === 'add') {
        config.addRewardItems = config.addRewardItems.map(item => {
          if (item.scoreName === scoreName) {
            return { ...item, rewardValue: value };
          }
          return item;
        });
      } else {
        config.multiplyRewardItems = config.multiplyRewardItems.map(item => {
          if (item.scoreName === scoreName) {
            return { ...item, rewardValue: value };
          }
          return item;
        });
      }

      this.handleConfigChange(config);
    },

    onPreConditionChange(e) {
      const { value } = e.currentTarget.dataset;
      
      // 纯受控组件：直接构建新配置并触发变更
      const config = {
        ...this.getCurrentConfig(),
        rewardPreCondition: value
      };
      this.handleConfigChange(config);
    },

    // 统一的配置变更处理
    handleConfigChange(config) {
      // 更新本地显示值
      const displayValue = this.computeDisplayValue(config);
      this.setData({
        displayValue: displayValue
      });

      // 构建完整的配置数据
      const fullConfig = {
        rewardType: config.rewardType,
        rewardPreCondition: config.rewardPreCondition,
        rewardPair: config.rewardType === 'add' ? config.addRewardItems : config.multiplyRewardItems,
        addRewardItems: config.addRewardItems,
        multiplyRewardItems: config.multiplyRewardItems
      };

      this.triggerEvent('configChange', {
        componentType: 'reward',
        config: fullConfig
      });
    },

    // 辅助方法 - 根据模式获取配置
    getCurrentConfig() {
      // 新建模式且没有传入config时，从Store获取缺省数据
      if (!this.properties.config && this.properties.mode === 'UserEdit') {
        console.log('🆕 [LasiRewardConfig] 新建模式，从Store获取缺省配置');
        return this._getStoreDefaults();
      }

      // ✅ 深拷贝，避免污染原始config对象
      const config = JSON.parse(JSON.stringify(this.properties.config || this._getStoreDefaults()));

      // 确保有默认的奖励项目数据
      if (!config.addRewardItems || config.addRewardItems.length === 0) {
        config.addRewardItems = [...REWARD_DEFAULTS.ADD_REWARD_ITEMS];
      }
      if (!config.multiplyRewardItems || config.multiplyRewardItems.length === 0) {
        config.multiplyRewardItems = [...REWARD_DEFAULTS.MULTIPLY_REWARD_ITEMS];
      }

      // 如果有rewardPair，将数据映射到对应的数组中
      if (config.rewardPair && config.rewardPair.length > 0) {

        if (config.rewardType === 'add') {
          // 将rewardPair的数据合并到addRewardItems中，保持现有结构
          config.addRewardItems = config.addRewardItems.map(item => {
            const pairItem = config.rewardPair.find(p => p.scoreName === item.scoreName);
            return pairItem ? { ...item, rewardValue: pairItem.rewardValue } : item;
          });
        } else if (config.rewardType === 'multiply') {
          // 将rewardPair的数据合并到multiplyRewardItems中，保持现有结构  
          config.multiplyRewardItems = config.multiplyRewardItems.map(item => {
            const pairItem = config.rewardPair.find(p => p.scoreName === item.scoreName);
            return pairItem ? { ...item, rewardValue: pairItem.rewardValue } : item;
          });
          console.log('✅ [LasiRewardConfig] 处理后multiplyRewardItems:', config.multiplyRewardItems);
        }
      }

      return config;
    }

  }
});