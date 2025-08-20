/**
 * 拉丝奖励配置组件 - 重构版
 * 纯展示组件，所有数据由父组件通过props传入
 */

import { REWARD_DEFAULTS } from '../../../../utils/rewardDefaults.js'

Component({
  properties: {
    // 奖励配置数据
    config: {
      type: Object,
      value: null
    },
    // 显示值（由Store计算）
    displayValue: {
      type: String,
      value: '请配置奖励规则'
    },
    // 组件模式
    mode: {
      type: String,
      value: 'UserEdit' // 'UserEdit' | 'SysConfig' | 'view'
    },
    // 是否显示前置条件（根据KPI中是否有total类型）
    showPreCondition: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // UI状态
    visible: false,
    
    // 当前编辑中的配置
    editingConfig: {
      rewardType: 'add',
      rewardPreCondition: 'total_ignore',
      addRewardItems: [],
      multiplyRewardItems: []
    }
  },

  lifetimes: {
    attached() {
      console.log('🎯 [LasiRewardConfig] 组件加载，props:', {
        config: this.properties.config,
        displayValue: this.properties.displayValue,
        mode: this.properties.mode,
        showPreCondition: this.properties.showPreCondition
      });
      
      // 初始化默认配置
      this.initializeEditingConfig();
    }
  },
  
  observers: {
    'config': function(newConfig) {
      console.log('🎯 [LasiRewardConfig] observer触发, newConfig:', newConfig);
      if (newConfig) {
        console.log('🎯 [LasiRewardConfig] 配置更新:', newConfig);
        this.updateEditingConfig(newConfig);
      } else {
        console.log('🎯 [LasiRewardConfig] 配置为空，使用默认值');
        this.initializeEditingConfig();
      }
    }
  },

  methods: {
    // 初始化编辑配置
    initializeEditingConfig() {
      this.setData({
        editingConfig: {
          rewardType: 'add',
          rewardPreCondition: 'total_ignore',
          addRewardItems: [...REWARD_DEFAULTS.ADD_REWARD_ITEMS],
          multiplyRewardItems: [...REWARD_DEFAULTS.MULTIPLY_REWARD_ITEMS]
        }
      });
    },
    
    // 根据传入的config更新编辑状态
    updateEditingConfig(config) {
      const rewardType = config.rewardType || 'add';
      const rewardPreCondition = config.rewardPreCondition || 'total_ignore';
      const rewardPair = config.rewardPair || [];
      
      let addRewardItems = [...REWARD_DEFAULTS.ADD_REWARD_ITEMS];
      let multiplyRewardItems = [...REWARD_DEFAULTS.MULTIPLY_REWARD_ITEMS];
      
      // 如果有rewardPair数据，映射到对应的数组
      if (rewardPair.length > 0) {
        if (rewardType === 'add') {
          addRewardItems = rewardPair;
        } else if (rewardType === 'multiply') {
          multiplyRewardItems = rewardPair;
        }
      }
      
      this.setData({
        editingConfig: {
          rewardType,
          rewardPreCondition,
          addRewardItems,
          multiplyRewardItems
        }
      });
    },

    // === UI事件处理 ===
    
    // 显示配置弹窗
    onShowConfig() {
      // 打开弹窗前同步当前配置
      if (this.properties.config) {
        this.updateEditingConfig(this.properties.config);
      }
      
      this.setData({ visible: true });
    },
    
    // 取消配置
    onCancel() {
      this.setData({ visible: false });
    },
    
    // 确认配置
    onConfirm() {
      const config = this.buildConfigFromUI();
      
      console.log('🎯 [LasiRewardConfig] 确认配置:', config);
      
      // 触发事件通知父组件
      this.triggerEvent('configChange', { config });
      
      this.setData({ visible: false });
    },

    // === 配置项变更事件 ===
    
    // 切换奖励类型
    onRewardTypeChange(e) {
      const { type } = e.currentTarget.dataset;
      
      this.setData({
        [`editingConfig.rewardType`]: type
      });
      
      // 立即同步到store（选择即保存）
      const config = this.buildConfigFromUI();
      console.log('🎯 [LasiRewardConfig] 类型切换即保存配置:', config);
      this.triggerEvent('configChange', { config });
    },
    
    // 输入框点击处理
    onInputTap(e) {
      // 阻止事件冒泡，防止触发面板切换
      return false;
    },

    // 奖励数值变化
    onRewardValueChange(e) {
      const { scoreName, rewardType } = e.currentTarget.dataset;
      const value = Number.parseInt(e.detail.value) || 0;
      
      const editingConfig = { ...this.data.editingConfig };
      
      if (rewardType === 'add') {
        editingConfig.addRewardItems = editingConfig.addRewardItems.map(item => {
          if (item.scoreName === scoreName) {
            return { ...item, rewardValue: value };
          }
          return item;
        });
      } else {
        editingConfig.multiplyRewardItems = editingConfig.multiplyRewardItems.map(item => {
          if (item.scoreName === scoreName) {
            return { ...item, rewardValue: value };
          }
          return item;
        });
      }
      
      this.setData({ editingConfig });
      
      // 立即同步到store（选择即保存）
      const config = this.buildConfigFromUI();
      console.log('🎯 [LasiRewardConfig] 数值变化即保存配置:', config);
      this.triggerEvent('configChange', { config });
    },

    // 前置条件变化
    onPreConditionChange(e) {
      const { value } = e.currentTarget.dataset;
      
      this.setData({
        [`editingConfig.rewardPreCondition`]: value
      });
      
      // 立即同步到store（选择即保存）
      const config = this.buildConfigFromUI();
      console.log('🎯 [LasiRewardConfig] 前置条件变化即保存配置:', config);
      this.triggerEvent('configChange', { config });
    },


    // === 辅助方法 ===
    
    // 从 UI 状态构建配置对象
    buildConfigFromUI() {
      const { rewardType, rewardPreCondition, addRewardItems, multiplyRewardItems } = this.data.editingConfig;
      
      return {
        rewardType,
        rewardPreCondition,
        rewardPair: rewardType === 'add' ? addRewardItems : multiplyRewardItems,
        addRewardItems, // 保留完整配置用于后续处理
        multiplyRewardItems
      };
    },

    // 同步Store数据（供父组件调用）
    syncWithStore(storeData) {
      console.log('🎯 [LasiRewardConfig] 同步Store数据:', storeData);
      
      if (storeData?.config?.rewardConfig) {
        // 通过properties更新，会触发observer
        // 这里只是记录日志，实际更新通过父组件传props
      }
    },
    
    // 阻止事件冒泡的空方法
    noTap() {
      // 什么都不做，只是阻止事件冒泡
    }

  }
});