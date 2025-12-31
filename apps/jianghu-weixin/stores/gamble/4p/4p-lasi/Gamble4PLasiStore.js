/**
 * 4人拉丝Store - 使用工厂函数重构
 * 直接对应数据库表结构，不进行对象包装
 */

import { createGambleStore } from '../../base/createGambleStore'
import { gameStore } from '@/stores/game/gameStore'
import { REWARD_DEFAULTS } from '@/utils/rewardDefaults.js'

// 字段定义
const fields = {
  // JSON字段
  kpis: {
    type: 'json',
    default: {
      indicators: ['best', 'worst', 'total'],
      totalCalculationType: 'add_total',
      kpiValues: { best: 1, worst: 1, total: 1 }
    }
  },
  eatingRange: {
    type: 'json',
    default: {
      "BetterThanBirdie": 4,
      "Birdie": 2,
      "Par": 1,
      "WorseThanPar": 0
    }
  },
  RewardConfig: {
    type: 'json',
    default: REWARD_DEFAULTS.DEFAULT_REWARD_JSON
  },

  // 字符串/数值字段
  meatValueConfig: { type: 'string', default: 'MEAT_AS_1' },
  meatMaxValue: { type: 'number', default: 10000000 },
  drawConfig: { type: 'string', default: 'DrawEqual' },
  dutyConfig: { type: 'string', default: 'NODUTY' },
  PartnerDutyCondition: { type: 'string', default: 'DUTY_DINGTOU' },
  badScoreBaseLine: { type: 'string', default: 'Par+4' },
  badScoreMaxLost: { type: 'number', default: 10000000 }
}

// 计算属性
const computedFields = {
  // 检查吃肉功能是否被禁用（根据顶洞配置）
  isEatmeatDisabled: (store) => store.drawConfig === 'NoDraw',

  // 检查是否应该显示奖励前置条件（根据KPI中是否包含总杆类型）
  showPreCondition: (store) => store.kpis?.indicators?.includes('total') || false,

  // KPI显示值
  kpiDisplayValue: (store) => {
    if (!store.kpis?.indicators) return ''
    return store.kpis.indicators.join(',')
  }
}

// 自定义复合更新方法
const customMethods = {
  // 包洞配置 - 包含责任相关字段
  updateBaoDongConfig: function (config) {
    if (config.dutyConfig) this.dutyConfig = config.dutyConfig
    if (config.PartnerDutyCondition) this.PartnerDutyCondition = config.PartnerDutyCondition
    if (config.badScoreBaseLine) this.badScoreBaseLine = config.badScoreBaseLine
    if (config.badScoreMaxLost) this.badScoreMaxLost = parseInt(config.badScoreMaxLost) || this.DEFAULTS.badScoreMaxLost
    this.markDirty()
  },

  // 吃肉配置
  updateEatmeatConfig: function (config) {
    if (config.eatingRange) this.eatingRange = { ...config.eatingRange }
    if (config.meatValueConfig) this.meatValueConfig = config.meatValueConfig
    if (config.meatMaxValue) this.meatMaxValue = parseInt(config.meatMaxValue) || this.DEFAULTS.meatMaxValue
    this.markDirty()
  },

  // 顶洞配置
  updateDingDongConfig: function (config) {
    if (config.drawConfig) this.drawConfig = config.drawConfig
    this.markDirty()
  }
}

// 创建并导出 Store
export const Gamble4PLasiStore = createGambleStore({
  gambleSysName: '4p-lasi',
  namePrefix: '拉丝规则_',
  playersNumber: 4,
  fields,
  dependencies: { gameStore, REWARD_DEFAULTS },
  computedFields,
  customMethods
})
