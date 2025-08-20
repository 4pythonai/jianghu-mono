/**
 * 重构后的 G48421Store - 4P-8421模式标准化Store
 * 与Lasistore保持一致的API和结构
 */

import { observable, action } from 'mobx-miniprogram'
import { gameStore } from '../../../gameStore'
import GamesRegistry from '../../../../utils/GamesRegistry.js'

export const NewG48421Store = observable({
  
  // === 标准状态 ===
  mode: null,
  gameType: '4p-8421',
  isInitialized: false,
  
  // === 标准数据结构 ===
  config: {
    gameConfig: null,
    
    rules: {
      // 8421特有的扣分规则
      pointDeduction: {
        // 扣分矩阵配置
        deductionRules: [],
        multiplierOptions: [1, 2, 3, 4, 5]
      },
      
      // 8421的顶洞规则
      drawConfig: {
        mode: 'standard', // standard / strict / custom
        drawOptions: {},
        doubleDownEnabled: false
      },
      
      // 8412吃肉规则（简化版）
      meatRules: {
        eatingRange: {
          "Win": 2,
          "Lose": 0,
          "Draw": 1
        },
        meatValueConfig: 'SINGLE_DOUBLE',
        meatMaxValue: 10000000
      }
    },
    
    metadata: {
      ruleName: '',
      createTime: null,
      updateTime: null
    }
  },

  // === 统一初始化 ===
  initialize: action(function(mode, existingData = null) {
    console.log('🔄 [NewG48421Store] 初始化:', { mode, existingData });
    
    this.mode = mode;
    
    const gameConfig = GamesRegistry.getGambleConfig('4p-8421');
    const baseConfig = GamesRegistry.getDefaultConfig('4p-8421');
    
    if (mode === 'add') {
      this.config.rules = { ...baseConfig, defaultSettings: true };
    } else if (mode === 'edit' && existingData) {
      this.config.rules = this.normalizeConfig(existingData);
    }
    
    this.config.metadata = {
      ruleName: this.generateDefaultName(),
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };
    
    this.isInitialized = true;
  }),

  // === 4P-8421特殊解析 ===
  normalizeConfig: action(function(rawConfig) {
    const normalized = {
      ...this.config.rules
    };
    
    // 处理扣分明细
    if (rawConfig.deductionRules) {
      normalized.pointDeduction.deductionRules = rawConfig.deductionRules;
    }
    
    // 处理吃肉规则
    if (rawConfig.meatRules) {
      normalized.meatRules = { ...normalized.meatRules, ...rawConfig.meatRules };
    }
    
    // 处理顶洞设置
    if (rawConfig.drawConfig) {
      normalized.drawConfig = { ...normalized.drawConfig, ...rawConfig.drawConfig };
    }
    
    return normalized;
  }),

  // === 标准更新API ===
  updatePointDeduction: action(function(config) {
    console.log('📊 [NewG48421Store] 更新扣分规则:', config);
    Object.assign(this.config.rules.pointDeduction, config);
    this.updateTime();
  }),

  updateDrawConfig: action(function(config) {
    console.log('🎲 [NewG48421Store] 更新顶洞规则:', config);
    Object.assign(this.config.rules.drawConfig, config);
    this.updateTime();
  }),

  updateMeatRules: action(function(config) {
    console.log('🍖 [NewG48421Store] 更新吃肉规则:', config);
    Object.assign(this.config.rules.meatRules, config);
    this.updateTime();
  }),

  updateRuleName: action(function(name) {
    this.config.metadata.ruleName = name || this.generateDefaultName();
  }),

  // === 标准保存格式 ===
  getSaveData: action(function() {
    return {
      ...this.config.rules,
      gambleUserName: this.config.metadata.ruleName,
      gambleSysName: '4p-8421',
      metadata: this.config.metadata
    };
  }),

  // === 辅助方法 ===
  generateDefaultName: action(function() {
    return `四人8421规则_${Math.floor(Math.random() * 1000)}`;
  }),

  updateTime: action(function() {
    this.config.metadata.updateTime = new Date().toISOString();
  }),

  debugState: action(function() {
    console.log('🔍 [NewG48421Store] 8421状态:', {
      mode: this.mode,
      rules: this.config.rules,
      metadata: this.config.metadata
    });
  })
});