/**
 * 4人拉丝Store - 直接对应数据库表结构
 * 不进行对象包装，字段直接映射到数据库
 */

import { observable, action } from 'mobx-miniprogram'
import { gameStore } from '../../../gameStore'
import { REWARD_DEFAULTS } from '../../../../utils/rewardDefaults.js'

export const Gamble4PLasiStore = observable({

  // === 模式和状态管理 ===
  mode: null,              // 'create' | 'edit' | 'view'
  isInitialized: false,    // 是否已初始化
  isDirty: false,          // 数据是否被修改

  // === 直接对应数据库字段 ===
  // 基础信息
  gambleSysName: '4p-lasi',
  gambleUserName: '',
  creator_id: null,
  userRuleId: null,
  playersNumber: 4,

  // JSON字段
  kpis: null,               // JSON - KPI配置
  eatingRange: null,        // JSON - 吃肉范围配置
  RewardConfig: null,       // JSON - 奖励配置

  // 字符串/数值字段
  meatValueConfig: 'MEAT_AS_1',      // varchar - 肉值配置
  meatMaxValue: 10000000,            // int - 最大肉值
  drawConfig: 'DrawEqual',           // varchar - 抽签配置
  dutyConfig: 'NODUTY',              // varchar - 责任配置
  PartnerDutyCondition: 'DUTY_DINGTOU',  // char - 搭档责任条件
  badScoreBaseLine: 'Par+4',         // varchar - 坏成绩基线
  badScoreMaxLost: 10000000,         // int - 最大损失

  // === 默认值常量 ===
  DEFAULTS: {

    kpis: {
      indicators: ['best', 'worst', 'total'],
      totalCalculationType: 'add_total',
      kpiValues: { best: 1, worst: 1, total: 1 }
    },

    eatingRange: {
      "BetterThanBirdie": 4,
      "Birdie": 2,
      "Par": 1,
      "WorseThanPar": 0
    },
    RewardConfig: REWARD_DEFAULTS.DEFAULT_REWARD_JSON,
    meatValueConfig: 'MEAT_AS_1',
    meatMaxValue: 10000000,
    drawConfig: 'DrawEqual',
    dutyConfig: 'NODUTY',
    PartnerDutyCondition: 'DUTY_DINGTOU',
    badScoreBaseLine: 'Par+4',
    badScoreMaxLost: 10000000
  },

  // === 初始化方法 ===
  initializeStore: action(function (mode, sysname, existingData = null) {
    console.log('🔄 [Gamble4PLasiStore] 初始化:', { mode, existingData });

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
    console.log('✅ [Gamble4PLasiStore] 初始化完成');
  }),

  // 新建模式初始化 - 使用默认值
  initializeForCreate: action(function () {
    this.gambleSysName = '4p-lasi';
    this.gambleUserName = this.generateDefaultName();
    this.creator_id = null;
    this.userRuleId = null;
    this.playersNumber = 4;

    // JSON字段使用默认值
    this.kpis = { ...this.DEFAULTS.kpis };
    this.eatingRange = { ...this.DEFAULTS.eatingRange };
    this.RewardConfig = { ...this.DEFAULTS.RewardConfig };

    // 字符串/数值字段使用默认值
    this.meatValueConfig = this.DEFAULTS.meatValueConfig;
    this.meatMaxValue = this.DEFAULTS.meatMaxValue;
    this.drawConfig = this.DEFAULTS.drawConfig;
    this.dutyConfig = this.DEFAULTS.dutyConfig;
    this.PartnerDutyCondition = this.DEFAULTS.PartnerDutyCondition;
    this.badScoreBaseLine = this.DEFAULTS.badScoreBaseLine;
    this.badScoreMaxLost = this.DEFAULTS.badScoreMaxLost;
  }),

  // 编辑模式初始化 - 从数据库数据加载
  initializeForEdit: action(function (ruleData) {
    const existingData = JSON.parse(decodeURIComponent(ruleData));
    console.log("🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴🟡🟠🔴", existingData)

    // 直接赋值数据库字段
    this.gambleSysName = '4p-lasi';
    this.gambleUserName = existingData.gambleUserName || this.generateDefaultName();
    this.creator_id = existingData.creator_id;
    this.userRuleId = existingData.userRuleId;
    this.playersNumber = parseInt(existingData.playersNumber) || 4;

    // JSON字段解析
    this.kpis = this.parseJsonField(existingData.kpis, this.DEFAULTS.kpis);
    this.eatingRange = this.parseJsonField(existingData.eatingRange, this.DEFAULTS.eatingRange);
    this.RewardConfig = this.parseJsonField(existingData.RewardConfig, this.DEFAULTS.RewardConfig);

    // 字符串/数值字段
    this.meatValueConfig = existingData.meatValueConfig || this.DEFAULTS.meatValueConfig;
    this.meatMaxValue = parseInt(existingData.meatMaxValue) || this.DEFAULTS.meatMaxValue;
    this.drawConfig = existingData.drawConfig || this.DEFAULTS.drawConfig;
    this.dutyConfig = existingData.dutyConfig || this.DEFAULTS.dutyConfig;
    // 处理历史数据中可能缺失的PartnerDutyCondition字段
    this.PartnerDutyCondition = existingData.PartnerDutyCondition;
    this.badScoreBaseLine = existingData.badScoreBaseLine || this.DEFAULTS.badScoreBaseLine;
    this.badScoreMaxLost = parseInt(existingData.badScoreMaxLost) || this.DEFAULTS.badScoreMaxLost;
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
    return `拉丝规则_${timestamp}`;
  },

  // === 直接字段更新方法 ===
  updateKpis: action(function (newKpis) {
    this.kpis = { ...newKpis };
    this.markDirty();
  }),

  updateEatingRange: action(function (newEatingRange) {
    this.eatingRange = { ...newEatingRange };
    this.markDirty();
  }),

  updateRewardConfig: action(function (newRewardConfig) {
    this.RewardConfig = { ...newRewardConfig };
    this.markDirty();
  }),

  updateMeatValueConfig: action(function (newValue) {
    this.meatValueConfig = newValue;
    this.markDirty();
  }),

  updateMeatMaxValue: action(function (newValue) {
    this.meatMaxValue = parseInt(newValue) || this.DEFAULTS.meatMaxValue;
    this.markDirty();
  }),

  updateDrawConfig: action(function (newValue) {
    this.drawConfig = newValue;
    this.markDirty();
  }),

  updateDutyConfig: action(function (newValue) {
    this.dutyConfig = newValue;
    this.markDirty();
  }),

  updatePartnerDutyCondition: action(function (newValue) {
    this.PartnerDutyCondition = newValue;
    this.markDirty();
  }),

  updateBadScoreBaseLine: action(function (newValue) {
    this.badScoreBaseLine = newValue;
    this.markDirty();
  }),

  updateBadScoreMaxLost: action(function (newValue) {
    this.badScoreMaxLost = parseInt(newValue) || this.DEFAULTS.badScoreMaxLost;
    this.markDirty();
  }),

  updateRuleName: action(function (name) {
    this.gambleUserName = name;
    this.markDirty();
  }),

  // === 复合更新方法（简化页面逻辑）===
  updateBaoDongConfig: action(function (config) {
    if (config.dutyConfig) this.dutyConfig = config.dutyConfig;
    if (config.PartnerDutyCondition) this.PartnerDutyCondition = config.PartnerDutyCondition;
    if (config.badScoreBaseLine) this.badScoreBaseLine = config.badScoreBaseLine;
    if (config.badScoreMaxLost) this.badScoreMaxLost = parseInt(config.badScoreMaxLost) || this.DEFAULTS.badScoreMaxLost;
    this.markDirty();
  }),

  updateEatmeatConfig: action(function (config) {
    if (config.eatingRange) this.eatingRange = { ...config.eatingRange };
    if (config.meatValueConfig) this.meatValueConfig = config.meatValueConfig;
    if (config.meatMaxValue) this.meatMaxValue = parseInt(config.meatMaxValue) || this.DEFAULTS.meatMaxValue;
    this.markDirty();
  }),

  updateDingDongConfig: action(function (config) {
    if (config.drawConfig) this.drawConfig = config.drawConfig;
    this.markDirty();
  }),

  // === 辅助方法 ===
  markDirty: action(function () {
    this.isDirty = true;
  }),

  // === 计算属性 ===
  // 检查吃肉功能是否被禁用（根据顶洞配置）
  get isEatmeatDisabled() {
    return this.drawConfig === 'NoDraw';
  },

  // 检查是否应该显示奖励前置条件（根据KPI中是否包含总杆类型）
  get showPreCondition() {
    return this.kpis?.indicators?.includes('total') || false;
  },

  // KPI显示值
  get kpiDisplayValue() {
    if (!this.kpis?.indicators) return '';
    return this.kpis.indicators.join(',');
  },

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
      kpis: JSON.stringify(this.kpis),
      eatingRange: JSON.stringify(this.eatingRange),
      RewardConfig: JSON.stringify(this.RewardConfig),

      // 字符串/数值字段
      meatValueConfig: this.meatValueConfig,
      meatMaxValue: this.meatMaxValue.toString(),
      drawConfig: this.drawConfig,
      dutyConfig: this.dutyConfig,
      PartnerDutyCondition: this.PartnerDutyCondition,
      badScoreBaseLine: this.badScoreBaseLine,
      badScoreMaxLost: this.badScoreMaxLost.toString()
    };
  },

  // === 重置和清理方法 ===
  reset: action(function () {
    this.mode = null;
    this.isInitialized = false;
    this.isDirty = false;

    // 重置所有字段到默认值
    this.gambleSysName = '4p-lasi';
    this.gambleUserName = '';
    this.creator_id = null;
    this.userRuleId = null;
    this.playersNumber = 4;

    this.kpis = null;
    this.eatingRange = null;
    this.RewardConfig = null;

    this.meatValueConfig = 'MEAT_AS_1';
    this.meatMaxValue = 10000000;
    this.drawConfig = 'DrawEqual';
    this.dutyConfig = 'NODUTY';
    this.PartnerDutyCondition = 'DUTY_DINGTOU';
    this.badScoreBaseLine = 'Par+4';
    this.badScoreMaxLost = 10000000;
  }),

  // === 调试方法 ===
  debugState: function () {
    console.log('🔍 [Gamble4PLasiStore] 当前状态:', {
      mode: this.mode,
      isInitialized: this.isInitialized,
      isDirty: this.isDirty,
      gambleUserName: this.gambleUserName,
      kpis: this.kpis,
      drawConfig: this.drawConfig
    });
  }
});