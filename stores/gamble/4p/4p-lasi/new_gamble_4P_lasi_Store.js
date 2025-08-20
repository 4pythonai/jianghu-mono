/**
 * 重构后的 G4PLasiStore - 基于统一模式的简化和标准化
 * 消除复杂的数据转换，维护单一数据源
 */

import { observable, action } from 'mobx-miniprogram'
import { gameStore } from '../../../gameStore'
import GamesRegistry from '../../../../utils/GamesRegistry.js'

export const NewG4PLasiStore = observable({

  // === 状态管理 ===
  mode: null,              // 'add' | 'edit' | 'view'
  gameType: '4p-lasi',     // 比赛类型
  isInitialized: false,    // 初始化状态

  // === 标准化数据模型 ===
  config: {
    // 核心配置（从GamesRegistry获取默认值）
    gameConfig: null,       // 由GamesRegistry生成

    // 赌博规则配置（统一结构）
    rules: {
      // 拉丝相关
      kpiConfiguration: {
        indicators: [],
        totalCalculationType: 'add_total',
        kpiValues: { best: 1, worst: 1, total: 1 }
      },

      // 奖励规则
      rewardConfig: {
        rewardMatrix: {},
        autoApply: true
      },

      // 吃肉相关（统一格式）
      meatRules: {
        eatingRange: {
          "BetterThanBirdie": 4,
          "Birdie": 2,
          "Par": 1,
          "WorseThanPar": 0
        },
        meatValueConfig: 'DOUBLE_WITHOUT_REWARD',
        meatMaxValue: 10000000
      },

      // 顶洞规则
      dingdong: {
        mode: 'DrawEqual',
        drawOptions: {}
      },

      // 包洞规则  
      baodong: {
        dutyConfig: 'NODUTY',
        partnerDutyCondition: 'DUTY_DINGTOU'
      }
    },

    // 元数据
    metadata: {
      ruleName: '',
      createTime: null,
      updateTime: null
    }
  },

  // === LasiEatmeat 组件缺省值配置 ===
  eatmeatDefaults: {
    // 吃肉范围标签
    eatRangeLabels: {
      'BetterThanBirdie': '比鸟更好',
      'Birdie': '鸟',
      'Par': '帕',
      'WorseThanPar': '比帕更差'
    },

    // 吃肉范围键值
    eatRangeKeys: ['BetterThanBirdie', 'Birdie', 'Par', 'WorseThanPar'],

    // 默认选择值
    meatValueOption: 4, // 默认值：分值翻倍(不含奖励)
    topOptions: ["不封顶", "X分封顶"],
    topSelected: 0,
    meatScoreValue: 1, // 肉算x分中的x值

    // 数字选择器范围
    eatValueRange: Array.from({ length: 20 }, (_, i) => i + 1), // 1-20
    topScoreRange: Array.from({ length: 20 }, (_, i) => i + 1), // 1-20
    meatScoreRange: [1, 2, 3, 4, 5], // 肉分值范围 1-5

    // 系统默认配置
    systemDefaults: {
      eatingRange: {
        "BetterThanBirdie": 4,
        "Birdie": 2,
        "Par": 1,
        "WorseThanPar": 0
      },
      meatValueConfig: 'DOUBLE_WITHOUT_REWARD',
      meatMaxValue: 10000000,
      meatValueOption: 4,
      meatScoreValue: 1,
      topSelected: 0,
      topScoreLimit: 3
    }
  },

  // === 统一初始化 ===
  initialize: action(function (mode, existingData = null) {
    console.log('🔄 [NewG4PLasiStore] 初始化:', { mode, existingData });

    this.mode = mode;

    // 基于模式获取标准配置
    const gameConfig = GamesRegistry.getGambleConfig('4p-lasi');
    const baseConfig = GamesRegistry.getDefaultConfig('4p-lasi');

    if (mode === 'add') {
      // 新建模式：使用默认值
      this.config.rules = { ...baseConfig, ...gameConfig.defaults };
    } else if (mode === 'edit' && existingData) {
      // 编辑模式：标准化现有数据
      this.config.rules = this.normalizeConfig(existingData);
    }

    this.config.metadata = {
      ruleName: this.generateDefaultName(),
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };

    this.isInitialized = true;
  }),

  // === 模式驱动的数据标准化 ===
  normalizeConfig: action(function (rawConfig) {
    // 统一格式处理，兼容旧数据
    const normalized = {
      ...this.config.rules // 从默认值开始
    };

    // 处理吃肉规则
    if (rawConfig.eatingRange) {
      normalized.meatRules.eatingRange = rawConfig.eatingRange;
    }
    if (rawConfig.meatValueConfig) {
      normalized.meatRules.meatValueConfig = rawConfig.meatValueConfig;
    }
    if (rawConfig.meatMaxValue !== undefined) {
      normalized.meatRules.meatMaxValue = rawConfig.meatMaxValue;
    }

    // 处理拉丝KPI
    if (rawConfig.kpiValues) {
      normalized.rules.kpiConfiguration.kpiValues = rawConfig.kpiValues;
    }
    if (rawConfig.indicators) {
      normalized.rules.kpiConfiguration.indicators = rawConfig.indicators;
    }

    return normalized;
  }),

  // === 统一更新Action ===
  updateMeatRules: action(function (config) {
    console.log('✏️ [NewG4PLasiStore] 更新吃肉规则:', config);
    Object.assign(this.config.rules.meatRules, config);
    this.config.metadata.updateTime = new Date().toISOString();
    this.updateRuleName();
  }),

  updateKPIConfig: action(function (config) {
    console.log('✏️ [NewG4PLasiStore] 更新KPI配置:', config);
    Object.assign(this.config.rules.kpiConfiguration, config);
    this.config.metadata.updateTime = new Date().toISOString();
    this.updateRuleName();
  }),

  updateDingdong: action(function (config) {
    console.log('✏️ [NewG4PLasiStore] 更新顶洞规则:', config);
    Object.assign(this.config.rules.dingdong, config);
    this.config.metadata.updateTime = new Date().toISOString();
  }),

  updateBaodong: action(function (config) {
    console.log('✏️ [NewG4PLasiStore] 更新包洞规则:', config);
    Object.assign(this.config.rules.baodong, config);
    this.config.metadata.updateTime = new Date().toISOString();
  }),

  // === 规则名称管理 ===
  updateRuleName: action(function (name) {
    this.config.metadata.ruleName = name || this.generateDefaultName();
  }),

  generateDefaultName: action(function () {
    return `四人拉丝规则_${Math.floor(Math.random() * 1000)}`;
  }),

  // === 统一保存格式 ===
  getSaveData: action(function () {
    return {
      ...this.config.rules,
      gambleUserName: this.config.metadata.ruleName,
      gambleSysName: '4p-lasi',
      metadata: this.config.metadata
    };
  }),

  // === 调试工具 ===
  debugState: action(function () {
    console.log('🔍 [NewG4PLasiStore] 当前状态:', {
      mode: this.mode,
      config: this.config,
      isInitialized: this.isInitialized
    });
  }),

  // === 重置功能 ===
  reset: action(function () {
    this.initialize(this.mode);
  })
});