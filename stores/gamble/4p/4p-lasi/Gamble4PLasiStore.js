/**
 * 重构后的统一4人拉丝Store
 * 支持新建/编辑模式，统一数据结构，标准化接口
 */

import { observable, action, computed } from 'mobx-miniprogram'
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

  // === 标准化数据结构 ===
  config: {
    // 1. 拉丝KPI配置
    kpiConfig: {
      indicators: [],                    // 选择的指标列表 ['best', 'worst', 'total']
      totalCalculationType: 'add_total', // 'add_total' | 'multiply_total'
      kpiValues: {
        best: 1,    // 较好成绩PK分值
        worst: 1,   // 较差成绩PK分值
        total: 1    // 双方总杆PK分值
      }
    },

    // 2. 吃肉规则配置
    eatmeatConfig: {
      eatingRange: {
        "BetterThanBirdie": 4,
        "Birdie": 2,
        "Par": 1,
        "WorseThanPar": 0
      },
      meatValueConfig: 'MEAT_AS_1',     // 肉分值计算方式
      meatMaxValue: 10000000            // 封顶值
    },

    // 3. 奖励规则配置
    rewardConfig: { ...REWARD_DEFAULTS.DEFAULT_REWARD_JSON },

    // 4. 顶洞规则配置
    dingdongConfig: {
      drawConfig: 'DrawEqual',     // 'NoDraw' | 'DrawEqual' | 'Diff_X'
      drawOptions: {}        // 平洞时的特殊配置
    },

    // 5. 包洞规则配置
    baodongConfig: {
      dutyConfig: 'NODUTY',                    // 包洞责任配置
      partnerDutyCondition: 'DUTY_DINGTOU',   // 队友责任条件
      badScoreBaseLine: 'Par+4',              // 坏球基准线
      badScoreMaxLost: 10000000               // 坏球最大损失
    }
  },

  // === 默认配置常量 ===
  DEFAULTS: {
    KPI_CONFIG: {
      indicators: [],
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
      partnerDutyCondition: 'DUTY_DINGTOU',
      badScoreBaseLine: 'Par+4',
      badScoreMaxLost: 10000000
    }
  },

  // === 初始化方法 ===
  initializeStore: action(function (mode, existingData = null) {
    console.log('🔄 [Gamble4PLasiStore] 初始化:', { mode, existingData });

    this.mode = mode;

    this.isDirty = false;
    if (mode === 'edit' && existingData) {
      this.initializeForEdit(existingData);
    }

    if (mode === 'create') {
      this.initializeForCreate();
    }


    if (mode === 'view' && existingData) {
      this.initializeForView(existingData);
    }

    this.isInitialized = true;
    console.log('✅ [Gamble4PLasiStore] 初始化完成');
  }),

  // 新建模式初始化
  initializeForCreate: action(function () {
    this.metadata = {
      gambleSysName: '4p-lasi',
      gambleUserName: this.generateDefaultName(),
      creator_id: null,
      userRuleId: null,
    };

    // 使用默认配置
    this.config = {
      kpiConfig: { ...this.DEFAULTS.KPI_CONFIG },
      eatmeatConfig: { ...this.DEFAULTS.EATMEAT_CONFIG },
      rewardConfig: { ...this.DEFAULTS.REWARD_CONFIG },
      dingdongConfig: { ...this.DEFAULTS.DINGDONG_CONFIG },
      baodongConfig: { ...this.DEFAULTS.BAODONG_CONFIG }
    };
  }),

  // 编辑模式初始化
  initializeForEdit: action(function (existingData) {
    // 标准化传入的数据
    const normalizedData = this.normalizeInputData(existingData);

    this.metadata = {
      gambleSysName: '4p-lasi',
      gambleUserName: normalizedData.gambleUserName || this.generateDefaultName(),
      creator_id: normalizedData.creator_id,
      userRuleId: normalizedData.userRuleId,
    };

    this.config = {
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
    console.log('🔍 [Gamble4PLasiStore] 原始顶洞配置:', inputData.drawConfig);
    normalized.dingdongConfig = {
      drawConfig: inputData.drawConfig || this.DEFAULTS.DINGDONG_CONFIG.drawConfig,
      drawOptions: {}
    };
    console.log('🔍 [Gamble4PLasiStore] 标准化后顶洞配置:', normalized.dingdongConfig);

    // 包洞配置处理
    normalized.baodongConfig = {
      dutyConfig: inputData.dutyConfig || this.DEFAULTS.BAODONG_CONFIG.dutyConfig,
      partnerDutyCondition: inputData.PartnerDutyCondition || this.DEFAULTS.BAODONG_CONFIG.partnerDutyCondition,
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
    Object.assign(this.config.kpiConfig, config);
    this.markDirty();
    this.autoUpdateRuleName();
  }),

  updateEatmeatConfig: action(function (config) {
    console.log('✏️ 更新吃肉配置:', config);
    Object.assign(this.config.eatmeatConfig, config);
    this.markDirty();
    this.autoUpdateRuleName();
  }),

  updateRewardConfig: action(function (config) {
    console.log('✏️ 更新奖励配置:', config);
    Object.assign(this.config.rewardConfig, config);
    this.markDirty();
    this.autoUpdateRuleName();
  }),

  updateDingdongConfig: action(function (config) {
    console.log('✏️ 更新顶洞配置:', config);
    console.log('🔍 [Gamble4PLasiStore] 更新前，当前dingdongConfig:', this.config.dingdongConfig);
    console.log('🔍 [Gamble4PLasiStore] 更新前，drawConfig值:', this.config.dingdongConfig.drawConfig);

    // 直接替换整个对象，而不是使用Object.assign
    this.config.dingdongConfig = { ...config };

    console.log('🔍 [Gamble4PLasiStore] 更新后，当前dingdongConfig:', this.config.dingdongConfig);
    console.log('🔍 [Gamble4PLasiStore] 更新后，drawConfig值:', this.config.dingdongConfig.drawConfig);

    this.markDirty();
    this.autoUpdateRuleName();

    // 检查autoUpdateRuleName后是否被修改
    console.log('🔍 [Gamble4PLasiStore] autoUpdateRuleName后，drawConfig值:', this.config.dingdongConfig.drawConfig);
  }),

  updateBaodongConfig: action(function (config) {
    console.log('✏️ 更新包洞配置:', config);
    Object.assign(this.config.baodongConfig, config);
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

  // === 计算属性（用于组件显示） ===

  // 获取KPI配置的显示值
  get kpiDisplayValue() {
    const { indicators, totalCalculationType, kpiValues } = this.config.kpiConfig;

    if (!indicators || indicators.length === 0) {
      return '请配置KPI规则';
    }

    // 格式化指标显示
    const indicatorTexts = [];
    if (indicators.includes('best')) {
      indicatorTexts.push(`较好${kpiValues.best}分`);
    }
    if (indicators.includes('worst')) {
      indicatorTexts.push(`较差${kpiValues.worst}分`);
    }
    if (indicators.includes('total')) {
      const totalTypeText = totalCalculationType === 'multiply_total' ? '杆数相乘' : '杆数相加';
      indicatorTexts.push(`总杆${kpiValues.total}分(${totalTypeText})`);
    }

    return indicatorTexts.join(' / ');
  },

  // 获取吃肉配置的显示值
  get eatmeatDisplayValue() {
    const { eatingRange, meatValueConfig, meatMaxValue } = this.config.eatmeatConfig;

    // 格式化肉分值计算方式
    let meatValueText = '';
    if (meatValueConfig?.startsWith('MEAT_AS_')) {
      const score = meatValueConfig.replace('MEAT_AS_', '');
      meatValueText = `肉算${score}分`;
    } else {
      switch (meatValueConfig) {
        case 'SINGLE_DOUBLE':
          meatValueText = '分值翻倍';
          break;
        case 'CONTINUE_DOUBLE':
          meatValueText = '分值连续翻倍';
          break;
        case 'DOUBLE_WITH_REWARD':
          meatValueText = '分值翻倍(含奖励)';
          break;
        case 'DOUBLE_WITHOUT_REWARD':
          meatValueText = '分值翻倍(不含奖励)';
          break;
        default:
          meatValueText = '请配置吃肉规则';
      }
    }

    // 格式化吃肉范围展示
    let eatingRangeText = '';
    if (eatingRange && typeof eatingRange === 'object') {
      const parts = [];
      if (eatingRange.BetterThanBirdie > 0) parts.push(`更好+${eatingRange.BetterThanBirdie}`);
      if (eatingRange.Birdie > 0) parts.push(`鸟+${eatingRange.Birdie}`);
      if (eatingRange.Par > 0) parts.push(`帕+${eatingRange.Par}`);
      if (eatingRange.WorseThanPar > 0) parts.push(`更差+${eatingRange.WorseThanPar}`);

      if (parts.length > 0) {
        eatingRangeText = `给${parts.join(', ')}`;
      }
    }

    // 格式化封顶值 - 只有在选择"分值翻倍"时才显示封顶信息
    let meatMaxText = '';
    if (meatValueConfig === 'SINGLE_DOUBLE') {
      if (meatMaxValue === 10000000) {
        meatMaxText = '不封顶';
      } else {
        meatMaxText = `${meatMaxValue}分封顶`;
      }
    }

    // 组合显示文本
    let result = meatValueText;
    if (meatMaxText) {
      result += `/${meatMaxText}`;
    }

    if (eatingRangeText) {
      result = `${result} (${eatingRangeText})`;
    }

    return result || '请配置吃肉规则';
  },

  // 获取顶洞配置的显示值
  get dingdongDisplayValue() {
    const { drawConfig } = this.config.dingdongConfig;

    switch (drawConfig) {
      case 'DrawEqual':
        return '得分打平';
      case 'NoDraw':
        return '无顶洞';
      default:
        // 处理 Diff_X 格式
        if (drawConfig?.startsWith('Diff_')) {
          const score = drawConfig.replace('Diff_', '');
          return `得分${score}分以内`;
        }
        return '请配置顶洞规则';
    }
  },

  // 获取包洞配置的显示值
  get baodongDisplayValue() {
    const { dutyConfig, partnerDutyCondition, badScoreBaseLine, badScoreMaxLost } = this.config.baodongConfig;

    // 格式化包洞规则显示
    let ruleText = '';
    if (dutyConfig === 'NODUTY') {
      ruleText = '不包洞';
    } else if (badScoreBaseLine?.startsWith('Par+')) {
      const value = badScoreBaseLine.replace('Par+', '');
      ruleText = `帕+${value}包洞`;
    } else if (badScoreBaseLine?.startsWith('DoublePar+')) {
      const value = badScoreBaseLine.replace('DoublePar+', '');
      ruleText = `双帕+${value}包洞`;
    } else if (badScoreBaseLine?.startsWith('ScoreDiff_')) {
      const value = badScoreBaseLine.replace('ScoreDiff_', '');
      ruleText = `杆差${value}包洞`;
    } else {
      ruleText = '不包洞';
    }

    // 如果是不包洞，直接返回
    if (dutyConfig === 'NODUTY') {
      return ruleText;
    }

    // 格式化队友责任条件显示
    let conditionText = '';
    switch (partnerDutyCondition) {
      case 'DUTY_DINGTOU':
        conditionText = '同伴顶头包洞';
        break;
      case 'PARTNET_IGNORE':
        conditionText = '与同伴成绩无关';
        break;
      default:
        conditionText = '同伴顶头包洞';
    }

    // 格式化封顶显示
    let maxLostText = '';
    if (badScoreMaxLost && badScoreMaxLost !== 10000000) {
      maxLostText = `/${badScoreMaxLost}分封顶`;
    }

    // 组合显示值
    return `${ruleText}/${conditionText}${maxLostText}`;
  },

  // 检查吃肉功能是否被禁用（根据顶洞配置）
  get isEatmeatDisabled() {
    return this.config.dingdongConfig?.drawConfig === 'NoDraw';
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
        indicators: this.config.kpiConfig.indicators,
        totalCalculationType: this.config.kpiConfig.totalCalculationType,
        kpiValues: this.config.kpiConfig.kpiValues
      }),

      // 吃肉配置
      eatingRange: JSON.stringify(this.config.eatmeatConfig.eatingRange),
      meatValueConfig: this.config.eatmeatConfig.meatValueConfig,
      meatMaxValue: this.config.eatmeatConfig.meatMaxValue.toString(),

      // 奖励配置 - 转为JSON字符串
      RewardConfig: JSON.stringify(this.config.rewardConfig),

      // 顶洞配置
      drawConfig: this.config.dingdongConfig.drawConfig,

      // 包洞配置
      dutyConfig: this.config.baodongConfig.dutyConfig,
      PartnerDutyCondition: this.config.baodongConfig.partnerDutyCondition,
      badScoreBaseLine: this.config.baodongConfig.badScoreBaseLine,
      badScoreMaxLost: this.config.baodongConfig.badScoreMaxLost.toString(),

      playersNumber: "4"
    };
  },

  // 获取组件使用的数据格式（标准化对象格式）
  getComponentData: function () {
    return {
      metadata: { ...this.metadata },
      config: {
        kpiConfig: { ...this.config.kpiConfig },
        eatmeatConfig: { ...this.config.eatmeatConfig },
        rewardConfig: { ...this.config.rewardConfig },
        dingdongConfig: { ...this.config.dingdongConfig },
        baodongConfig: { ...this.config.baodongConfig }
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
    this.config = {};
  }),

  // === 调试方法 ===
  debugState: function () {
    console.log('🔍 [Gamble4PLasiStore] 当前状态:', {
      mode: this.mode,
      isInitialized: this.isInitialized,
      isDirty: this.isDirty,
      metadata: this.metadata,
      config: this.config
    });
  }
});