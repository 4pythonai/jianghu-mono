const { generateLasiRuleName, generate8421RuleName } = require('@/utils/ruleNameGenerator.js')

Component({
  properties: {
    // 当前规则名称
    value: {
      type: String,
      value: ''
    },

    // 页面模式：'create' | 'edit' | 'view'
    pageMode: {
      type: String,
      value: 'edit'
    },

    // 游戏类型，用于生成规则名称
    gameType: {
      type: String,
      value: '4p-lasi'
    },

    // 用于自动生成规则名称的配置数据
    kpiConfig: {
      type: Object,
      value: null
    },



    drawConfig: {
      type: Object,
      value: null
    },

    meatRules: {
      type: Object,
      value: null
    },

    // 是否显示自动生成提示
    showGenerateHint: {
      type: Boolean,
      value: true
    }
  },

  data: {
    // 组件内部状态
    inputValue: '',           // 输入框的值
    isManualEdit: false,      // 是否手动编辑过
    generatedName: ''         // 自动生成的名称
  },

  observers: {
    // 监听外部value变化
    'value': function (newValue) {
      if (newValue !== this.data.inputValue) {
        this.setData({
          inputValue: newValue || ''
        })
      }
    },

    // 监听KPI配置变化，自动生成规则名称
    'kpiConfig': function (newConfig) {
      if (newConfig && this.data.gameType === '4p-lasi') {
        this._generateRuleName(newConfig)
      }
    },

  },

  methods: {
    // 输入框变化事件
    onInput(e) {
      const value = e.detail.value.trim()
      this.setData({
        inputValue: value,
        isManualEdit: true
      })

      // 向外部通知值变化
      this._emitChange(value)
    },


    // 根据配置生成规则名称
    _generateRuleName(config) {
      if (!config || this.data.gameType !== '4p-lasi') return

      const generatedName = generateLasiRuleName(
        config.indicators || [],
        config.kpiValues || {},
        config.totalCalculationType || 'add_total'
      )

      this.setData({ generatedName })

      // 如果是创建模式且未手动编辑过，自动使用生成的名称
      if (this.data.pageMode === 'create' && !this.data.isManualEdit) {
        this.setData({ inputValue: generatedName })
        this._emitChange(generatedName)
      }

    },

    // 根据8421配置生成规则名称
    _generate8421RuleName(drawConfig, meatRules) {
      if (this.data.gameType !== '4p-8421') return

      const generatedName = generate8421RuleName(drawConfig, meatRules)

      this.setData({ generatedName })

      // 如果是创建模式且未手动编辑过，自动使用生成的名称
      if (this.data.pageMode === 'create' && !this.data.isManualEdit) {
        this.setData({ inputValue: generatedName })
        this._emitChange(generatedName)
      }
    },

    // 向外部发送变化事件
    _emitChange(value) {
      this.triggerEvent('change', {
        value: value,
        isManualEdit: this.data.isManualEdit
      })
    },

    // 重置组件状态（用于外部调用）
    reset() {
      this.setData({
        inputValue: '',
        isManualEdit: false,
        generatedName: ''
      })
    }
  },

  // 组件生命周期
  ready() {
    // 初始化输入值
    this.setData({
      inputValue: this.properties.value || ''
    })

    // 如果有初始配置，生成规则名称
    if (this.properties.kpiConfig) {
      this._generateRuleName(this.properties.kpiConfig)
    }
  }
})