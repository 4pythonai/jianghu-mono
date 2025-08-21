/**
 * 重构后的统一4人拉丝Store
 * 支持新建/编辑模式，统一数据结构，标准化接口
 */

import { observable, action } from 'mobx-miniprogram'
import { gameStore } from '../../../gameStore'
import { REWARD_DEFAULTS } from '../../../../utils/rewardDefaults.js'

export const Gamble4PLasiStore = observable({

  // === 模式和状态管理 ===
  mode: null,              // 'create' | 'edit' | 'view'
  isInitialized: false,    // 是否已初始化
  isDirty: false,          // 数据是否被修改

  // === 基础信息 ===
  metadata: {
    gambleSysName: '4p-lasi',
    gambleUserName: '',
    creator_id: null,
    userRuleId: null,       // 编辑模式时的规则ID
  },

  storeConfig: {},

  // === 默认配置常量 ===
  DEFAULTS: {
    KPI_CONFIG: {
      indicators: ['best', 'worst', 'total'],
      totalCalculationType: 'add_total',
      kpiValues: { best: 1, worst: 1, total: 1 }
    },

    EATMEAT_CONFIG: {
      eatingRange: {
        "BetterThanBirdie": 4,
        "Birdie": 2,
        "Par": 1,
        "WorseThanPar": 0
      },
      meatValueConfig: 'MEAT_AS_1',
      meatMaxValue: 10000000
    },

    REWARD_CONFIG: REWARD_DEFAULTS.DEFAULT_REWARD_JSON,

    DINGDONG_CONFIG: {
      drawConfig: 'DrawEqual',
      drawOptions: {}
    },

    BAODONG_CONFIG: {
      dutyConfig: 'NODUTY',
      PartnerDutyCondition: 'DUTY_DINGTOU',
      badScoreBaseLine: 'Par+4',
      badScoreMaxLost: 10000000
    }
  },

  // === 初始化方法 ===
  initializeStore: action(function (mode, sysname, existingData = null) {
    console.log('🔄 [Gamble4PLasiStore] 初始化:', { mode, existingData });

    this.mode = mode;

    this.isDirty = false;
    if (mode === 'edit' && existingData) {
      this.initializeForEdit(existingData);
    }

    if (mode === 'create') {
      this.initializeForCreate(sysname);
    }


    if (mode === 'view' && existingData) {
      this.initializeForView(existingData);
    }

    this.isInitialized = true;
    console.log('✅ [Gamble4PLasiStore] 初始化完成');
  }),

  // 新建模式初始化
  initializeForCreate: action(function (gambleSysName) {
    this.metadata = {
      gambleSysName: '4p-lasi',
      gambleUserName: this.generateDefaultName(),
      creator_id: null,
      userRuleId: null,
    };

    // 使用默认配置
    this.storeConfig = {
      kpiConfig: { ...this.DEFAULTS.KPI_CONFIG },
      eatmeatConfig: { ...this.DEFAULTS.EATMEAT_CONFIG },
      rewardConfig: { ...this.DEFAULTS.REWARD_CONFIG },
      dingdongConfig: { ...this.DEFAULTS.DINGDONG_CONFIG },
      baodongConfig: { ...this.DEFAULTS.BAODONG_CONFIG }
    };
  }),




  // 编辑模式初始化
  initializeForEdit: action(function (ruleData) {

    const existingData = JSON.parse(decodeURIComponent(ruleData))

    // 标准化传入的数据
    const normalizedData = this.normalizeInputData(existingData);

    this.metadata = {
      gambleSysName: '4p-lasi',
      gambleUserName: normalizedData.gambleUserName || this.generateDefaultName(),
      creator_id: normalizedData.creator_id,
      userRuleId: normalizedData.userRuleId,
    };

    this.storeConfig = {
      kpiConfig: normalizedData.kpiConfig || { ...this.DEFAULTS.KPI_CONFIG },
      eatmeatConfig: normalizedData.eatmeatConfig || { ...this.DEFAULTS.EATMEAT_CONFIG },
      rewardConfig: normalizedData.rewardConfig || { ...this.DEFAULTS.REWARD_CONFIG },
      dingdongConfig: normalizedData.dingdongConfig || { ...this.DEFAULTS.DINGDONG_CONFIG },
      baodongConfig: normalizedData.baodongConfig || { ...this.DEFAULTS.BAODONG_CONFIG }
    };
  }),

  // 查看模式初始化
  initializeForView: action(function (existingData) {
    this.initializeForEdit(existingData);
  }),

  // === 数据标准化方法 ===
  normalizeInputData: function (inputData) {
    console.log('🔄 标准化输入数据:', inputData);

    const normalized = {};

    // 基础信息
    normalized.gambleUserName = inputData.gambleUserName;
    normalized.creator_id = inputData.creator_id;
    normalized.userRuleId = inputData.userRuleId;

    // KPI配置处理
    if (inputData.kpis) {
      try {
        const kpis = typeof inputData.kpis === 'string' ? JSON.parse(inputData.kpis) : inputData.kpis;
        normalized.kpiConfig = {
          indicators: kpis.indicators || [],
          totalCalculationType: kpis.totalCalculationType || 'add_total',
          kpiValues: kpis.kpiValues || this.DEFAULTS.KPI_CONFIG.kpiValues
        };
      } catch (e) {
        console.error('KPI配置解析失败:', e);
        normalized.kpiConfig = { ...this.DEFAULTS.KPI_CONFIG };
      }
    }

    // 吃肉配置处理
    normalized.eatmeatConfig = {
      eatingRange: this.parseEatingRange(inputData.eatingRange),
      meatValueConfig: inputData.meatValueConfig || this.DEFAULTS.EATMEAT_CONFIG.meatValueConfig,
      meatMaxValue: parseInt(inputData.meatMaxValue) || this.DEFAULTS.EATMEAT_CONFIG.meatMaxValue
    };

    // 奖励配置处理
    normalized.rewardConfig = this.parseRewardConfig(inputData.RewardConfig);

    // 顶洞配置处理
    normalized.dingdongConfig = {
      drawConfig: inputData.drawConfig || this.DEFAULTS.DINGDONG_CONFIG.drawConfig,
      drawOptions: {}
    };

    // 包洞配置处理
    normalized.baodongConfig = {
      dutyConfig: inputData.dutyConfig || this.DEFAULTS.BAODONG_CONFIG.dutyConfig,
      PartnerDutyCondition: inputData.PartnerDutyCondition || this.DEFAULTS.BAODONG_CONFIG.PartnerDutyCondition,
      badScoreBaseLine: inputData.badScoreBaseLine || this.DEFAULTS.BAODONG_CONFIG.badScoreBaseLine,
      badScoreMaxLost: parseInt(inputData.badScoreMaxLost) || this.DEFAULTS.BAODONG_CONFIG.badScoreMaxLost
    };

    return normalized;
  },

  // 解析吃肉范围配置
  parseEatingRange: function (eatingRangeData) {
    if (!eatingRangeData) return { ...this.DEFAULTS.EATMEAT_CONFIG.eatingRange };

    try {
      return typeof eatingRangeData === 'string'
        ? JSON.parse(eatingRangeData)
        : eatingRangeData;
    } catch (e) {
      console.error('吃肉范围解析失败:', e);
      return { ...this.DEFAULTS.EATMEAT_CONFIG.eatingRange };
    }
  },

  // 解析奖励配置
  parseRewardConfig: function (rewardConfigData) {
    if (!rewardConfigData) return { ...this.DEFAULTS.REWARD_CONFIG };

    try {
      return typeof rewardConfigData === 'string'
        ? JSON.parse(rewardConfigData)
        : rewardConfigData;
    } catch (e) {
      console.error('奖励配置解析失败:', e);
      return { ...this.DEFAULTS.REWARD_CONFIG };
    }
  },

  // === 配置更新方法 ===
  updateKpiConfig: action(function (config) {
    console.log('✏️ 更新KPI配置:', config);
    Object.assign(this.storeConfig.kpiConfig, config);
    this.markDirty();
    this.autoUpdateRuleName();
  }),

  updateEatmeatConfig: action(function (config) {
    console.log('✏️ 更新吃肉配置:', config);
    Object.assign(this.storeConfig.eatmeatConfig, config);
    this.markDirty();
    this.autoUpdateRuleName();
  }),

  updateRewardConfig: action(function (config) {
    this.storeConfig.rewardConfig = { ...this.storeConfig.rewardConfig, ...config };
    this.markDirty();
    this.autoUpdateRuleName();
  }),

  updateDingdongConfig: action(function (config) {
    this.storeConfig.dingdongConfig = { ...config };
    this.markDirty();
    this.autoUpdateRuleName();
  }),

  updateBaodongConfig: action(function (config) {
    Object.assign(this.storeConfig.baodongConfig, config);
    this.markDirty();
    this.autoUpdateRuleName();
  }),

  updateRuleName: action(function (name) {
    this.metadata.gambleUserName = name;
    this.markDirty();
  }),

  // === 辅助方法 ===
  markDirty: action(function () {
    this.isDirty = true;
    this.metadata.updateTime = new Date().toISOString();
  }),

  autoUpdateRuleName: action(function () {
    if (this.mode === 'create') {
      this.metadata.gambleUserName = this.generateDefaultName();
    }
  }),

  generateDefaultName: function () {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    return `拉丝规则_${timestamp}`;
  },


  // 检查吃肉功能是否被禁用（根据顶洞配置）
  get isEatmeatDisabled() {
    return this.storeConfig.dingdongConfig?.drawConfig === 'NoDraw';
  },

  // 检查是否应该显示奖励前置条件（根据KPI中是否包含总杆类型）
  get showPreCondition() {
    return this.storeConfig.kpiConfig?.indicators?.includes('total') || false;
  },

  // === 数据导出方法 ===
  // 获取保存用的数据格式（后端接口格式）
  getSaveData: function () {
    return {
      gameid: gameStore.gameid,
      gambleUserName: this.metadata.gambleUserName,
      gambleSysName: this.metadata.gambleSysName,
      creator_id: this.metadata.creator_id,
      userRuleId: this.metadata.userRuleId,

      // KPI配置 - 转为JSON字符串
      kpis: JSON.stringify({
        indicators: this.storeConfig.kpiConfig.indicators,
        totalCalculationType: this.storeConfig.kpiConfig.totalCalculationType,
        kpiValues: this.storeConfig.kpiConfig.kpiValues
      }),

      // 吃肉配置
      eatingRange: JSON.stringify(this.storeConfig.eatmeatConfig.eatingRange),
      meatValueConfig: this.storeConfig.eatmeatConfig.meatValueConfig,
      meatMaxValue: this.storeConfig.eatmeatConfig.meatMaxValue.toString(),

      // 奖励配置 - 转为JSON字符串
      RewardConfig: JSON.stringify(this.storeConfig.rewardConfig),

      // 顶洞配置
      drawConfig: this.storeConfig.dingdongConfig.drawConfig,

      // 包洞配置
      dutyConfig: this.storeConfig.baodongConfig.dutyConfig,
      PartnerDutyCondition: this.storeConfig.baodongConfig.PartnerDutyCondition,
      badScoreBaseLine: this.storeConfig.baodongConfig.badScoreBaseLine,
      badScoreMaxLost: this.storeConfig.baodongConfig.badScoreMaxLost.toString(),

      playersNumber: "4"
    };
  },

  // 获取组件使用的数据格式（标准化对象格式）
  getComponentData: function () {
    return {
      metadata: { ...this.metadata },
      config: {
        kpiConfig: { ...this.storeConfig.kpiConfig },
        eatmeatConfig: { ...this.storeConfig.eatmeatConfig },
        rewardConfig: { ...this.storeConfig.rewardConfig },
        dingdongConfig: { ...this.storeConfig.dingdongConfig },
        baodongConfig: { ...this.storeConfig.baodongConfig }
      },
      mode: this.mode,
      isDirty: this.isDirty
    };
  },

  // === 重置和清理方法 ===
  reset: action(function () {
    this.mode = null;
    this.isInitialized = false;
    this.isDirty = false;
    this.metadata = {};
    this.storeConfig = {};
  }),

  // === 调试方法 ===
  debugState: function () {
    console.log('🔍 [Gamble4PLasiStore] 当前状态:', {
      mode: this.mode,
      isInitialized: this.isInitialized,
      isDirty: this.isDirty,
      metadata: this.metadata,
      storeConfig: this.storeConfig
    });
  }
});