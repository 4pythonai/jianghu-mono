/**
 * 4人8421Store - 与拉丝Store保持一致的API结构
 * 直接对应数据库表结构，不进行对象包装
 */

import { observable, action } from 'mobx-miniprogram'
import { gameStore } from '@/stores//gameStore'

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

  // 8421配置字段 (与LasiStore保持一致的结构)
  drawConfig: null,        // 字符串 - 平局配置

  // 字符串/数值字段 (与LasiStore一致)
  meatValueConfig: 'MEAT_AS_1',      // varchar - 肉值配置
  meatMaxValue: 10000000,            // int - 最大肉值
  dutyConfig: 'NODUTY',              // varchar - 责任配置
  badScoreBaseLine: 'Par+4',         // varchar - 坏成绩基线
  badScoreMaxLost: 10000000,         // int - 最大损失
  eatingRange: null,                 // JSON - 吃肉范围配置

  // === 默认值常量 ===
  DEFAULTS: {
    drawConfig: 'DrawEqual',
    // 字符串/数值字段默认值
    meatValueConfig: 'MEAT_AS_1',
    meatMaxValue: 10000000,
    dutyConfig: 'NODUTY',
    badScoreBaseLine: 'Par+4',
    badScoreMaxLost: 10000000,
    eatingRange: {
      "BetterThanBirdie": 1,
      "Birdie": 1,
      "Par": 1,
      "WorseThanPar": 1
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

    // JSON字段使用默认值 (暂无)

    // 字符串/数值字段使用默认值
    this.drawConfig = this.DEFAULTS.drawConfig;
    this.meatValueConfig = this.DEFAULTS.meatValueConfig;
    this.meatMaxValue = this.DEFAULTS.meatMaxValue;
    this.dutyConfig = this.DEFAULTS.dutyConfig;
    this.badScoreBaseLine = this.DEFAULTS.badScoreBaseLine;
    this.badScoreMaxLost = this.DEFAULTS.badScoreMaxLost;
    this.eatingRange = { ...this.DEFAULTS.eatingRange };
  }),

  // 编辑模式初始化 - 从数据库数据加载
  initializeForEdit: action(function (ruleData) {
    console.log('🔍 [NewG48421Store] 原始ruleData:', ruleData);
    console.log('🔍 [NewG48421Store] ruleData类型:', typeof ruleData);
    const existingData = JSON.parse(decodeURIComponent(ruleData));
    console.log('🟡 [NewG48421Store] 编辑模式数据:', existingData);

    // 直接赋值数据库字段
    this.gambleSysName = '4p-8421';
    this.gambleUserName = existingData.gambleUserName;
    this.creator_id = existingData.creator_id;
    this.userRuleId = existingData.userRuleId;
    this.playersNumber = parseInt(existingData.playersNumber);

    // JSON字段解析 (只有真正的JSON字段才用parseJsonField)
    // 暂无JSON字段需要解析

    // 字符串/数值字段直接赋值 (像LasiStore一样)
    this.drawConfig = existingData.drawConfig;
    this.meatValueConfig = existingData.meatValueConfig;
    this.meatMaxValue = existingData.meatMaxValue;
    this.dutyConfig = existingData.dutyConfig;
    this.badScoreBaseLine = existingData.badScoreBaseLine;
    this.badScoreMaxLost = existingData.badScoreMaxLost;
    this.eatingRange = existingData.eatingRange;
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

  // === 直接字段更新方法 (与LasiStore保持一致) ===

  updateDrawConfig: action(function (newValue) {
    this.drawConfig = newValue;  // 字符串直接赋值
    this.markDirty();
  }),


  updateEatingRange: action(function (newEatingRange) {
    this.eatingRange = { ...newEatingRange };  // 对象展开
    this.markDirty();
  }),

  updateMeatValueConfig: action(function (newValue) {
    this.meatValueConfig = newValue;  // 字符串直接赋值
    this.markDirty();
  }),

  updateMeatMaxValue: action(function (newValue) {
    this.meatMaxValue = newValue;  // 数值直接赋值
    this.markDirty();
  }),

  updateDutyConfig: action(function (newValue) {
    this.dutyConfig = newValue;  // 字符串直接赋值
    this.markDirty();
  }),

  updateBadScoreBaseLine: action(function (newValue) {
    this.badScoreBaseLine = newValue;  // 字符串直接赋值
    this.markDirty();
  }),

  updateBadScoreMaxLost: action(function (newValue) {
    this.badScoreMaxLost = newValue;  // 数值直接赋值
    this.markDirty();
  }),

  updateRuleName: action(function (name) {
    this.gambleUserName = name;
    this.markDirty();
  }),

  // === 复合更新方法（简化页面逻辑）===
  updateKoufenConfig: action(function (config) {
    // 扣分配置包含多个字段
    if (config.badScoreBaseLine !== undefined) {
      this.badScoreBaseLine = config.badScoreBaseLine;
    }
    if (config.badScoreMaxLost !== undefined) {
      this.badScoreMaxLost = config.badScoreMaxLost;
    }
    if (config.dutyConfig !== undefined) {
      this.dutyConfig = config.dutyConfig;
    }
    this.markDirty();
  }),

  updateMeatConfig: action(function (config) {
    // 吃肉配置包含多个字段
    if (config.eatingRange !== undefined) {
      this.eatingRange = { ...config.eatingRange };
    }
    if (config.meatValueConfig !== undefined) {
      this.meatValueConfig = config.meatValueConfig;
    }
    if (config.meatMaxValue !== undefined) {
      this.meatMaxValue = config.meatMaxValue;
    }
    this.markDirty();
  }),

  updateDrawConfigAlias: action(function (config) {
    // 平局配置 - 从对象中提取drawConfig字符串
    if (config && config.drawConfig !== undefined) {
      this.drawConfig = config.drawConfig;
      this.markDirty();
    }
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
      eatingRange: JSON.stringify(this.eatingRange),

      // 字符串/数值字段 (与LasiStore保持一致)
      drawConfig: this.drawConfig,
      meatValueConfig: this.meatValueConfig,
      meatMaxValue: this.meatMaxValue,
      dutyConfig: this.dutyConfig,
      badScoreBaseLine: this.badScoreBaseLine,
      badScoreMaxLost: this.badScoreMaxLost
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

    this.drawConfig = null;
  }),

  // === 调试方法 ===
  debugState: function () {
    console.log('🔍 [NewG48421Store] 当前状态:', {
      mode: this.mode,
      isInitialized: this.isInitialized,
      isDirty: this.isDirty,
      gambleUserName: this.gambleUserName,
      drawConfig: this.drawConfig,
      badScoreBaseLine: this.badScoreBaseLine,
      badScoreMaxLost: this.badScoreMaxLost,
      dutyConfig: this.dutyConfig
    });
  }
});