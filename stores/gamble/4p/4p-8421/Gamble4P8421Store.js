/**
 * 4人8421Store - 与拉丝Store保持一致的API结构
 * 直接对应数据库表结构，不进行对象包装
 */

import { observable, action } from 'mobx-miniprogram'
import { gameStore } from '../../../gameStore'

export const NewG48421Store = observable({

  // === 模式和状态管理 ===
  mode: null,              // 'create' | 'edit' | 'view'
  isInitialized: false,    // 是否已初始化
  isDirty: false,          // 数据是否被修改

  // === 直接对应数据库字段 ===
  // 基础信息
  gambleSysName: '4p-8421',
  gambleUserName: '',      // 直接字段，与拉丝Store一致
  creator_id: null,
  userRuleId: null,
  playersNumber: 4,

  // 8421特有的配置字段
  pointDeduction: null,    // JSON - 扣分配置
  drawConfig: null,        // JSON - 平局配置
  meatRules: null,         // JSON - 吃肉规则

  // === 默认值常量 ===
  DEFAULTS: {
    pointDeduction: {
      deductionRules: [],
      multiplierOptions: [1, 2, 3, 4, 5]
    },
    drawConfig: {
      mode: 'standard',
      drawOptions: {},
      doubleDownEnabled: false
    },
    meatRules: {
      eatingRange: {
        "BetterThanBirdie": 1,
        "Birdie": 1,
        "Par": 1,
        "WorseThanPar": 1
      },
      meatValueConfig: 'MEAT_AS_1',
      meatMaxValue: 10000000
    }
  },

  // === 初始化方法 - 与拉丝Store保持一致 ===
  initializeStore: action(function (mode, sysname, existingData = null) {
    console.log('🔄 [NewG48421Store] 初始化:', { mode, existingData });

    this.mode = mode;
    this.isDirty = false;

    if (mode === 'edit' && existingData) {
      this.initializeForEdit(existingData);
    } else if (mode === 'create') {
      this.initializeForCreate();
    } else if (mode === 'view' && existingData) {
      this.initializeForView(existingData);
    }

    this.isInitialized = true;
    console.log('✅ [NewG48421Store] 初始化完成');
  }),

  // 新建模式初始化 - 使用默认值
  initializeForCreate: action(function () {
    this.gambleSysName = '4p-8421';
    this.gambleUserName = this.generateDefaultName();
    this.creator_id = null;
    this.userRuleId = null;
    this.playersNumber = 4;

    // JSON字段使用默认值
    this.pointDeduction = { ...this.DEFAULTS.pointDeduction };
    this.drawConfig = { ...this.DEFAULTS.drawConfig };
    this.meatRules = { ...this.DEFAULTS.meatRules };
  }),

  // 编辑模式初始化 - 从数据库数据加载
  initializeForEdit: action(function (ruleData) {
    const existingData = JSON.parse(decodeURIComponent(ruleData));
    console.log('🟡 [NewG48421Store] 编辑模式数据:', existingData);

    // 直接赋值数据库字段
    this.gambleSysName = '4p-8421';
    this.gambleUserName = existingData.gambleUserName || this.generateDefaultName();
    this.creator_id = existingData.creator_id;
    this.userRuleId = existingData.userRuleId;
    this.playersNumber = parseInt(existingData.playersNumber) || 4;

    // JSON字段解析
    this.pointDeduction = this.parseJsonField(existingData.pointDeduction, this.DEFAULTS.pointDeduction);
    this.drawConfig = this.parseJsonField(existingData.drawConfig, this.DEFAULTS.drawConfig);
    this.meatRules = this.parseJsonField(existingData.meatRules, this.DEFAULTS.meatRules);
  }),

  // 查看模式初始化
  initializeForView: action(function (existingData) {
    this.initializeForEdit(existingData);
  }),

  // === 工具方法 ===
  parseJsonField: function (field, defaultValue) {
    if (!field) return { ...defaultValue };
    try {
      return typeof field === 'string' ? JSON.parse(field) : field;
    } catch (e) {
      console.error('JSON字段解析失败:', e);
      return { ...defaultValue };
    }
  },

  generateDefaultName: function () {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    return `8421规则_${timestamp}`;
  },

  // === 直接字段更新方法 ===
  updatePointDeduction: action(function (config) {
    this.pointDeduction = { ...config };
    this.markDirty();
  }),

  updateDrawConfig: action(function (config) {
    this.drawConfig = { ...config };
    this.markDirty();
  }),

  updateMeatRules: action(function (config) {
    this.meatRules = { ...config };
    this.markDirty();
  }),

  updateRuleName: action(function (name) {
    this.gambleUserName = name;
    this.markDirty();
  }),

  // === 复合更新方法（简化页面逻辑）===
  updateKoufenConfig: action(function (config) {
    this.updatePointDeduction(config);
  }),

  updateMeatConfig: action(function (config) {
    this.updateMeatRules(config);
  }),

  updateDrawConfig: action(function (config) {
    this.updateDrawConfig(config);
  }),

  // === 辅助方法 ===
  markDirty: action(function () {
    this.isDirty = true;
  }),

  // === 数据导出方法 ===
  // 获取保存用的数据格式（后端接口格式）
  getSaveData: function () {
    return {
      gameid: gameStore.gameid,
      gambleUserName: this.gambleUserName,
      gambleSysName: this.gambleSysName,
      creator_id: this.creator_id,
      userRuleId: this.userRuleId,
      playersNumber: this.playersNumber.toString(),

      // JSON字段 - 转为JSON字符串
      pointDeduction: JSON.stringify(this.pointDeduction),
      drawConfig: JSON.stringify(this.drawConfig),
      meatRules: JSON.stringify(this.meatRules)
    };
  },

  // === 重置和清理方法 ===
  reset: action(function () {
    this.mode = null;
    this.isInitialized = false;
    this.isDirty = false;

    // 重置所有字段到默认值
    this.gambleSysName = '4p-8421';
    this.gambleUserName = '';
    this.creator_id = null;
    this.userRuleId = null;
    this.playersNumber = 4;

    this.pointDeduction = null;
    this.drawConfig = null;
    this.meatRules = null;
  }),

  // === 调试方法 ===
  debugState: function () {
    console.log('🔍 [NewG48421Store] 当前状态:', {
      mode: this.mode,
      isInitialized: this.isInitialized,
      isDirty: this.isDirty,
      gambleUserName: this.gambleUserName,
      pointDeduction: this.pointDeduction,
      drawConfig: this.drawConfig
    });
  }
});