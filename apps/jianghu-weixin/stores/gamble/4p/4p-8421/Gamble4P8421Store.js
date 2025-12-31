/**
 * 4人8421Store - 使用工厂函数重构
 * 直接对应数据库表结构，不进行对象包装
 */

import { createGambleStore } from '../../base/createGambleStore'
import { gameStore } from '@/stores/game/gameStore'

// 字段定义
const fields = {
  drawConfig: { type: 'string', default: 'DrawEqual' },
  meatValueConfig: { type: 'string', default: 'MEAT_AS_1' },
  meatMaxValue: { type: 'number', default: 10000000 },
  dutyConfig: { type: 'string', default: 'NODUTY' },
  badScoreBaseLine: { type: 'string', default: 'Par+4' },
  badScoreMaxLost: { type: 'number', default: 10000000 },
  eatingRange: {
    type: 'json',
    default: {
      "BetterThanBirdie": 1,
      "Birdie": 1,
      "Par": 1,
      "WorseThanPar": 1
    }
  }
}

// 自定义复合更新方法
const customMethods = {
  // 扣分配置包含多个字段
  updateKoufenConfig: function (config) {
    if (config.badScoreBaseLine !== undefined) {
      this.badScoreBaseLine = config.badScoreBaseLine
    }
    if (config.badScoreMaxLost !== undefined) {
      this.badScoreMaxLost = config.badScoreMaxLost
    }
    if (config.dutyConfig !== undefined) {
      this.dutyConfig = config.dutyConfig
    }
    this.markDirty()
  },

  // 吃肉配置包含多个字段
  updateMeatConfig: function (config) {
    if (config.eatingRange !== undefined) {
      this.eatingRange = { ...config.eatingRange }
    }
    if (config.meatValueConfig !== undefined) {
      this.meatValueConfig = config.meatValueConfig
    }
    if (config.meatMaxValue !== undefined) {
      this.meatMaxValue = config.meatMaxValue
    }
    this.markDirty()
  },

  // 平局配置 - 从对象中提取drawConfig字符串
  updateDrawConfigAlias: function (config) {
    if (config && config.drawConfig !== undefined) {
      this.drawConfig = config.drawConfig
      this.markDirty()
    }
  }
}

// 创建并导出 Store
export const NewG48421Store = createGambleStore({
  gambleSysName: '4p-8421',
  namePrefix: '8421规则_',
  playersNumber: 4,
  fields,
  dependencies: { gameStore },
  customMethods
})
