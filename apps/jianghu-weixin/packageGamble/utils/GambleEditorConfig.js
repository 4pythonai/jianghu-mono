/**
 * 游戏编辑器配置 - 管理不同游戏类型的编辑器组件和Store
 */

// 静态导入所有Store类
import { Gamble4PLasiStore } from '../../../stores/gamble/4p/4p-lasi/Gamble4PLasiStore.js'
import { NewG48421Store } from '../../../stores/gamble/4p/4p-8421/Gamble4P8421Store.js'

// 游戏编辑器配置
const GAMBLE_EDITOR_CONFIGS = {
  '4p-lasi': {
    humanName: '四人拉丝',
    storeClass: Gamble4PLasiStore, // 直接引用Store类
    components: [
      { name: 'LasiKPI', title: 'KPI规则', eventType: 'kpi' },
      { name: 'LasiRewardConfig', title: '奖励配置', eventType: 'reward' },
      { name: 'LasiDingDong', title: '顶洞规则', eventType: 'dingdong' },
      { name: 'LasiEatmeat', title: '吃肉规则', eventType: 'eatmeat' },
      { name: 'LasiBaoDong', title: '包洞规则', eventType: 'baodong' }
    ],
    storeBindings: {
      fields: {
        // 从Store获取状态
        storeMode: 'mode',
        isStoreInitialized: 'isInitialized',
        isDirty: 'isDirty',

        // 直接绑定数据库字段
        gambleUserName: 'gambleUserName',
        kpis: 'kpis',
        eatingRange: 'eatingRange',
        RewardConfig: 'RewardConfig',
        meatValueConfig: 'meatValueConfig',
        meatMaxValue: 'meatMaxValue',
        drawConfig: 'drawConfig',
        dutyConfig: 'dutyConfig',
        PartnerDutyCondition: 'PartnerDutyCondition',
        badScoreBaseLine: 'badScoreBaseLine',
        badScoreMaxLost: 'badScoreMaxLost',

        // 计算属性
        isEatmeatDisabled: 'isEatmeatDisabled',
        showPreCondition: 'showPreCondition',
        kpiDisplayValue: 'kpiDisplayValue'
      },
      actions: {
        // 基础方法
        initializeStore: 'initializeStore',
        initializeForCreate: 'initializeForCreate',
        initializeForEdit: 'initializeForEdit',
        getSaveData: 'getSaveData',
        resetStore: 'reset',

        // 简化的配置更新方法
        updateKpis: 'updateKpis',
        updateRewardConfig: 'updateRewardConfig',
        updateBaoDongConfig: 'updateBaoDongConfig',
        updateEatmeatConfig: 'updateEatmeatConfig',
        updateDingDongConfig: 'updateDingDongConfig',
        updateRuleName: 'updateRuleName'
      }
    },
    actionMap: {
      'kpi': 'updateKpis',
      'dingdong': 'updateDingDongConfig',
      'baodong': 'updateBaoDongConfig',
      'eatmeat': 'updateEatmeatConfig',
      'reward': 'updateRewardConfig'
    }
  },

  '4p-8421': {
    humanName: '四人8421',
    storeClass: NewG48421Store, // 导入8421 Store类
    components: [
      { name: 'E8421Koufen', title: '扣分配置', eventType: 'koufen' },
      { name: 'Draw8421', title: '平局规则', eventType: 'draw' },
      { name: 'E8421Meat', title: '吃肉规则', eventType: 'meat' }
    ],
    storeBindings: {
      fields: {
        // 基础状态
        storeMode: 'mode',
        isStoreInitialized: 'isInitialized',
        isDirty: 'isDirty',
        gambleUserName: 'gambleUserName',

        // 配置数据 (与LasiStore保持一致)
        drawConfig: 'drawConfig',
        
        // 字符串/数值字段 (与LasiStore保持一致)
        badScoreBaseLine: 'badScoreBaseLine',
        badScoreMaxLost: 'badScoreMaxLost',
        dutyConfig: 'dutyConfig',
        meatValueConfig: 'meatValueConfig',
        meatMaxValue: 'meatMaxValue',
        eatingRange: 'eatingRange'
      },
      actions: {
        initializeStore: 'initializeStore',
        getSaveData: 'getSaveData',
        updateRuleName: 'updateRuleName',

        // 配置更新方法
        updateKoufenConfig: 'updateKoufenConfig',
        updateMeatConfig: 'updateMeatConfig',
        updateDrawConfigAlias: 'updateDrawConfigAlias'
      }
    },
    actionMap: {
      'koufen': 'updateKoufenConfig',
      'meat': 'updateMeatConfig',
      'dingdong': 'updateDrawConfigAlias'
    }
  }

  // 未来可以轻松添加更多游戏类型：
  // '2p-8421': { ... },
  // '3p-dizhupo': { ... },
  // 等等
};

/**
 * 游戏编辑器配置管理器
 */
const GambleEditorConfig = {
  /**
   * 获取游戏编辑器配置
   * @param {string} gambleType 游戏类型 (如 '4p-lasi')
   * @returns {object|null} 编辑器配置对象
   */
  getEditorConfig(gambleType) {
    return GAMBLE_EDITOR_CONFIGS[gambleType] || null;
  },

  /**
   * 获取支持的游戏类型列表
   * @returns {Array} 支持的游戏类型数组
   */
  getSupportedGameTypes() {
    return Object.keys(GAMBLE_EDITOR_CONFIGS);
  },

  /**
   * 检查游戏类型是否被支持
   * @param {string} gambleType 游戏类型
   * @returns {boolean} 是否支持
   */
  isGameTypeSupported(gambleType) {
    return gambleType in GAMBLE_EDITOR_CONFIGS;
  },

  /**
   * 获取游戏显示名称
   * @param {string} gambleType 游戏类型
   * @returns {string|null} 游戏显示名称
   */
  getGameHumanName(gambleType) {
    return GAMBLE_EDITOR_CONFIGS[gambleType]?.humanName || null;
  },

  /**
   * 获取Store类（静态导入方式）
   * @param {string} gambleType 游戏类型
   * @returns {object|null} Store类
   */
  getStoreClass(gambleType) {
    const config = this.getEditorConfig(gambleType);
    if (!config) {
      throw new Error(`不支持的游戏类型: ${gambleType}`);
    }

    const storeClass = config.storeClass;
    if (!storeClass) {
      throw new Error(`游戏类型 ${gambleType} 的Store类未配置`);
    }

    return storeClass;
  },

  /**
   * 创建Store实例（工厂方法）
   * @param {string} gambleType 游戏类型
   * @returns {object} Store实例
   */
  createStore(gambleType) {
    const StoreClass = this.getStoreClass(gambleType);
    return StoreClass;
  }
};

module.exports = {
  GambleEditorConfig,
  GAMBLE_EDITOR_CONFIGS
};
