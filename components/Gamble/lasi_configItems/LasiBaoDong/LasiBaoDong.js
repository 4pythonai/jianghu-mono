/**
 * 拉丝包洞配置组件 - 简化版
 * 纯受控组件，所有数据通过props传入，UI变化通过事件通知父组件
 */

Component({
  properties: {
    config: {
      type: Object,
      value: null,
      observer: function (newVal) {
        console.log('🔍 [LasiBaoDong] config properties更新:', newVal);
      }
    },
    displayValue: {
      type: String,
      value: '请配置包洞规则'
    },
    mode: {
      type: String,
      value: 'UserEdit'
    }
  },

  data: {
    visible: false,

    // 数值选择范围
    parPlusRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    doubleParPlusRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    strokeDiffRange: Array.from({ length: 21 }, (_, i) => i + 1), // 1-21

    // 默认配置
    defaultConfig: {
      dutyConfig: 'NODUTY',
      partnerDutyCondition: 'DUTY_DINGTOU',
      badScoreBaseLine: 'Par+4',
      badScoreMaxLost: 10000000
    },

    // UI计算状态（由observer更新）
    currentConfig: null,
    dutyConfig: 'NODUTY',
    PartnerDutyCondition: 'DUTY_DINGTOU',
    parPlusValue: 4,
    doubleParPlusValue: 1,
    strokeDiffValue: 3
  },

  lifetimes: {
    attached() {
      console.log('🎬 [LasiBaoDong] 组件初始化，当前config:', this.properties.config);
      this.updateCurrentConfig();
    }
  },

  observers: {
    'config': function (newConfig) {
      console.log('🔍 [LasiBaoDong] config变化:', newConfig);
      this.updateCurrentConfig();
    }
  },

  methods: {
    // 更新当前配置状态
    updateCurrentConfig() {
      const config = this.getCurrentConfig();

      // 解析包洞规则类型
      let dutyConfig = 'NODUTY';
      let parPlusValue = 4;
      let doubleParPlusValue = 1;
      let strokeDiffValue = 3;

      if (config.dutyConfig === 'NODUTY') {
        dutyConfig = 'NODUTY';
      } else if (config.badScoreBaseLine?.startsWith('Par+')) {
        dutyConfig = 'par_plus_x';
        const value = Number.parseInt(config.badScoreBaseLine.replace('Par+', ''));
        parPlusValue = Number.isNaN(value) ? 4 : value;
      } else if (config.badScoreBaseLine?.startsWith('DoublePar+')) {
        dutyConfig = 'double_par_plus_x';
        const value = Number.parseInt(config.badScoreBaseLine.replace('DoublePar+', ''));
        doubleParPlusValue = Number.isNaN(value) ? 1 : value;
      } else if (config.badScoreBaseLine?.startsWith('ScoreDiff_')) {
        dutyConfig = 'stroke_diff_x';
        const value = Number.parseInt(config.badScoreBaseLine.replace('ScoreDiff_', ''));
        strokeDiffValue = Number.isNaN(value) ? 3 : value;
      }

      this.setData({
        currentConfig: config,
        dutyConfig: dutyConfig,
        PartnerDutyCondition: config.partnerDutyCondition || 'DUTY_DINGTOU',
        parPlusValue: parPlusValue,
        doubleParPlusValue: doubleParPlusValue,
        strokeDiffValue: strokeDiffValue
      });
    },

    // UI事件处理
    onShowConfig() {
      this.setData({ visible: true });
    },

    onCancel() {
      this.setData({ visible: false });
    },

    onConfirm() {
      this.setData({ visible: false });
    },

    // 防止事件冒泡的空方法
    noTap() {
      // 阻止事件冒泡，什么都不做
    },

    // 配置变更事件
    onHoleRuleChange(e) {
      const type = e.currentTarget.dataset.type;
      const currentConfig = this.data.currentConfig;

      let config = { ...currentConfig };

      if (type === 'NODUTY') {
        config.dutyConfig = 'NODUTY';
        config.badScoreBaseLine = 'NoSub';
      } else if (type === 'par_plus_x') {
        config.dutyConfig = 'DUTY';
        config.badScoreBaseLine = `Par+${this.data.parPlusValue}`;
      } else if (type === 'double_par_plus_x') {
        config.dutyConfig = 'DUTY';
        config.badScoreBaseLine = `DoublePar+${this.data.doubleParPlusValue}`;
      } else if (type === 'stroke_diff_x') {
        config.dutyConfig = 'DUTY';
        config.badScoreBaseLine = `ScoreDiff_${this.data.strokeDiffValue}`;
      }

      this.handleConfigChange(config);
    },

    onPartnerDutyConditionChange(e) {
      const condition = e.currentTarget.dataset.condition;
      const config = {
        ...this.data.currentConfig,
        partnerDutyCondition: condition
      };
      this.handleConfigChange(config);
    },

    onParPlusChange(e) {
      const value = this.data.parPlusRange[e.detail.value];
      if (this.data.dutyConfig === 'par_plus_x') {
        const config = {
          ...this.data.currentConfig,
          badScoreBaseLine: `Par+${value}`
        };
        this.handleConfigChange(config);
      }
    },

    onDoubleParPlusChange(e) {
      const value = this.data.doubleParPlusRange[e.detail.value];
      if (this.data.dutyConfig === 'double_par_plus_x') {
        const config = {
          ...this.data.currentConfig,
          badScoreBaseLine: `DoublePar+${value}`
        };
        this.handleConfigChange(config);
      }
    },

    onStrokeDiffChange(e) {
      const value = this.data.strokeDiffRange[e.detail.value];
      if (this.data.dutyConfig === 'stroke_diff_x') {
        const config = {
          ...this.data.currentConfig,
          badScoreBaseLine: `ScoreDiff_${value}`
        };
        this.handleConfigChange(config);
      }
    },

    // 统一的配置变更处理
    handleConfigChange(config) {
      console.log('🏳️ [LasiBaoDong] 包洞配置变化:', config);

      this.triggerEvent('configChange', {
        componentType: 'baodong',
        config: config
      });
    },

    // 辅助方法
    getCurrentConfig() {
      return this.properties.config || this.data.defaultConfig;
    }
  }
});