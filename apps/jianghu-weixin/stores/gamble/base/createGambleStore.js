/**
 * Gamble Store 工厂函数
 * 用于创建各种玩法的 Store，减少重复代码
 */

import { observable, action } from 'mobx-miniprogram'

/**
 * 创建 Gamble Store
 * @param {Object} config - Store 配置
 * @param {string} config.gambleSysName - 玩法系统名称，如 '4p-lasi', '4p-8421'
 * @param {string} config.namePrefix - 规则名称前缀，如 '拉丝规则_', '8421规则_'
 * @param {number} config.playersNumber - 玩家人数
 * @param {Object} config.fields - 字段定义 { fieldName: { type: 'json'|'string'|'number', default: value } }
 * @param {Object} config.dependencies - 外部依赖 { gameStore, REWARD_DEFAULTS, ... }
 * @param {Object} [config.computedFields] - 计算属性定义 { name: (store) => value }
 * @param {Object} [config.customMethods] - 自定义方法
 * @returns {Object} MobX observable store
 */
export function createGambleStore(config) {
  const {
    gambleSysName,
    namePrefix,
    playersNumber,
    fields,
    dependencies,
    computedFields = {},
    customMethods = {}
  } = config

  // 构建 DEFAULTS 对象
  const DEFAULTS = {}
  Object.keys(fields).forEach(key => {
    DEFAULTS[key] = fields[key].default
  })

  // 构建初始字段值
  const initialFields = {}
  Object.keys(fields).forEach(key => {
    const field = fields[key]
    // 初始值为 null（用于 json 类型）或默认值（用于其他类型）
    initialFields[key] = field.type === 'json' ? null : field.default
  })

  // 构建 store 对象
  const storeDefinition = {
    // === 模式和状态管理 ===
    mode: null,              // 'create' | 'edit' | 'view'
    isInitialized: false,    // 是否已初始化
    isDirty: false,          // 数据是否被修改

    // === 基础信息 ===
    gambleSysName: gambleSysName,
    gambleUserName: '',
    creator_id: null,
    userRuleId: null,
    playersNumber: playersNumber,

    // === 字段值 ===
    ...initialFields,

    // === 默认值常量 ===
    DEFAULTS: DEFAULTS,

    // === 初始化方法 ===
    initializeStore: action(function (mode, sysname, existingData = null) {
      console.log(`🔄 [${gambleSysName}Store] 初始化:`, { mode, existingData })

      this.mode = mode
      this.isDirty = false

      if (mode === 'edit' && existingData) {
        this.initializeForEdit(existingData)
      } else if (mode === 'create') {
        this.initializeForCreate()
      } else if (mode === 'view' && existingData) {
        this.initializeForView(existingData)
      }

      this.isInitialized = true
      console.log(`✅ [${gambleSysName}Store] 初始化完成`)
    }),

    // 新建模式初始化 - 使用默认值
    initializeForCreate: action(function () {
      this.gambleSysName = gambleSysName
      this.gambleUserName = this.generateDefaultName()
      this.creator_id = null
      this.userRuleId = null
      this.playersNumber = playersNumber

      // 根据字段类型设置默认值
      Object.keys(fields).forEach(key => {
        const field = fields[key]
        if (field.type === 'json') {
          // JSON 字段需要深拷贝
          this[key] = JSON.parse(JSON.stringify(this.DEFAULTS[key]))
        } else {
          this[key] = this.DEFAULTS[key]
        }
      })
    }),

    // 编辑模式初始化 - 从数据库数据加载
    initializeForEdit: action(function (ruleData) {
      console.log(`🔍 [${gambleSysName}Store] 原始ruleData:`, ruleData)
      const existingData = JSON.parse(decodeURIComponent(ruleData))
      console.log(`🟡 [${gambleSysName}Store] 编辑模式数据:`, existingData)

      // 直接赋值数据库字段
      this.gambleSysName = gambleSysName
      this.gambleUserName = existingData.gambleUserName || this.generateDefaultName()
      this.creator_id = existingData.creator_id
      this.userRuleId = existingData.userRuleId
      this.playersNumber = parseInt(existingData.playersNumber) || playersNumber

      // 根据字段类型解析
      Object.keys(fields).forEach(key => {
        const field = fields[key]
        if (field.type === 'json') {
          this[key] = this.parseJsonField(existingData[key], this.DEFAULTS[key])
        } else if (field.type === 'number') {
          this[key] = parseInt(existingData[key]) || this.DEFAULTS[key]
        } else {
          // string 或其他类型
          this[key] = existingData[key] !== undefined ? existingData[key] : this.DEFAULTS[key]
        }
      })
    }),

    // 查看模式初始化
    initializeForView: action(function (existingData) {
      this.initializeForEdit(existingData)
    }),

    // === 工具方法 ===
    parseJsonField: function (field, defaultValue) {
      if (!field) return JSON.parse(JSON.stringify(defaultValue))
      try {
        return typeof field === 'string' ? JSON.parse(field) : field
      } catch (e) {
        console.error('JSON字段解析失败:', e)
        return JSON.parse(JSON.stringify(defaultValue))
      }
    },

    generateDefaultName: function () {
      const timestamp = new Date().toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
      return `${namePrefix}${timestamp}`
    },

    // === 辅助方法 ===
    markDirty: action(function () {
      this.isDirty = true
    }),

    // === 通用更新方法 ===
    updateRuleName: action(function (name) {
      this.gambleUserName = name
      this.markDirty()
    }),

    // === 数据导出方法 ===
    getSaveData: function () {
      const { gameStore } = dependencies
      const data = {
        gameid: gameStore.gameid,
        gambleUserName: this.gambleUserName,
        gambleSysName: this.gambleSysName,
        creator_id: this.creator_id,
        userRuleId: this.userRuleId,
        playersNumber: this.playersNumber.toString()
      }

      // 根据字段类型处理
      Object.keys(fields).forEach(key => {
        const field = fields[key]
        if (field.type === 'json') {
          data[key] = JSON.stringify(this[key])
        } else if (field.type === 'number') {
          data[key] = this[key].toString()
        } else {
          data[key] = this[key]
        }
      })

      return data
    },

    // === 重置和清理方法 ===
    reset: action(function () {
      this.mode = null
      this.isInitialized = false
      this.isDirty = false

      // 重置基础字段
      this.gambleSysName = gambleSysName
      this.gambleUserName = ''
      this.creator_id = null
      this.userRuleId = null
      this.playersNumber = playersNumber

      // 重置所有配置字段
      Object.keys(fields).forEach(key => {
        const field = fields[key]
        if (field.type === 'json') {
          this[key] = null
        } else {
          this[key] = field.default
        }
      })
    }),

    // === 调试方法 ===
    debugState: function () {
      const state = {
        mode: this.mode,
        isInitialized: this.isInitialized,
        isDirty: this.isDirty,
        gambleUserName: this.gambleUserName
      }
      // 添加所有字段到调试输出
      Object.keys(fields).forEach(key => {
        state[key] = this[key]
      })
      console.log(`🔍 [${gambleSysName}Store] 当前状态:`, state)
    }
  }

  // 动态生成字段更新方法
  Object.keys(fields).forEach(key => {
    const field = fields[key]
    // 方法名: updateFieldName (首字母大写)
    const methodName = 'update' + key.charAt(0).toUpperCase() + key.slice(1)

    if (!storeDefinition[methodName]) {
      if (field.type === 'json') {
        storeDefinition[methodName] = action(function (newValue) {
          this[key] = { ...newValue }
          this.markDirty()
        })
      } else if (field.type === 'number') {
        storeDefinition[methodName] = action(function (newValue) {
          this[key] = parseInt(newValue) || this.DEFAULTS[key]
          this.markDirty()
        })
      } else {
        storeDefinition[methodName] = action(function (newValue) {
          this[key] = newValue
          this.markDirty()
        })
      }
    }
  })

  // 添加计算属性（getter）
  Object.keys(computedFields).forEach(key => {
    Object.defineProperty(storeDefinition, key, {
      get: function () {
        return computedFields[key](this)
      },
      enumerable: true,
      configurable: true
    })
  })

  // 合并自定义方法
  Object.keys(customMethods).forEach(key => {
    const method = customMethods[key]
    // 包装为 action（如果需要修改状态）
    storeDefinition[key] = action(function (...args) {
      return method.call(this, ...args)
    })
  })

  return observable(storeDefinition)
}
