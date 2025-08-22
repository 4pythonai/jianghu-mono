/**
 * E8421扣分配置组件 - 简化版
 * 纯受控组件，所有数据通过props传入，UI变化通过事件通知父组件
 */
const ruleFormatter = require('../../../../utils/formatters/ruleFormatter.js')

Component({
  properties: {
    badScoreBaseLine: {
      type: String,
      value: 'Par+4',
      observer: function (newVal) {
        console.log('🔍 [E8421Koufen] badScoreBaseLine更新:', newVal);
      }
    },
    badScoreMaxLost: {
      type: Number,
      value: 10000000,
      observer: function (newVal) {
        console.log('🔍 [E8421Koufen] badScoreMaxLost更新:', newVal);
      }
    },
    dutyConfig: {
      type: String,
      value: 'NODUTY',
      observer: function (newVal) {
        console.log('🔍 [E8421Koufen] dutyConfig更新:', newVal);
      }
    },
    mode: {
      type: String,
      value: 'UserEdit'
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  data: {
    visible: false,

    // 静态配置数据
    badScoreBaseLineOptions: ['从帕+X开始扣分', '从双帕+Y开始扣分', '不扣分'],
    paScoreRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    doubleParScoreRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    maxSubScoreRange: Array.from({ length: 21 }, (_, i) => i + 1), // 1-21
    maxOptions: ['不封顶', '扣X分封顶'],
    dutyOptions: ['不包负分', '同伴顶头包负分', '包负分'],

    // 默认配置
    defaultConfig: {
      badScoreBaseLine: 'Par+4',
      badScoreMaxLost: 10000000,
      dutyConfig: 'NODUTY'
    },

    currentConfig: null,
    currentSelectedStart: 0,
    currentPaScore: 4,
    currentDoubleParScore: 0,
    currentSelectedMax: 0,
    currentMaxSubScore: 2,
    currentSelectedDuty: 0,
    displayValue: '请配置扣分规则'
  },
  lifetimes: {
    attached() {
      this.updateCurrentConfig();
    }
  },

  observers: {
    'badScoreBaseLine, badScoreMaxLost, dutyConfig': function (badScoreBaseLine, badScoreMaxLost, dutyConfig) {
      console.log('🔍 [E8421Koufen] 属性变化:', { badScoreBaseLine, badScoreMaxLost, dutyConfig });
      this.updateCurrentConfig();
    }
  },

  methods: {
    // 更新当前配置状态
    updateCurrentConfig() {
      const config = this.getCurrentConfig();

      // 解析扣分基线配置
      let selectedStart = 0;
      let paScore = 4;
      let doubleParScore = 0;

      if (config.badScoreBaseLine === 'NoSub') {
        selectedStart = 2;
      } else if (config.badScoreBaseLine?.startsWith('Par+')) {
        selectedStart = 0;
        const score = Number.parseInt(config.badScoreBaseLine.replace('Par+', ''));
        paScore = Number.isNaN(score) ? 4 : score;
      } else if (config.badScoreBaseLine?.startsWith('DoublePar+')) {
        selectedStart = 1;
        const score = Number.parseInt(config.badScoreBaseLine.replace('DoublePar+', ''));
        doubleParScore = Number.isNaN(score) ? 0 : score;
      }

      // 解析封顶配置
      const selectedMax = config.badScoreMaxLost === 10000000 ? 0 : 1;
      const maxSubScore = config.badScoreMaxLost === 10000000 ? 2 : config.badScoreMaxLost;

      // 解析同伴惩罚配置
      let selectedDuty = 0;
      switch (config.dutyConfig) {
        case 'DUTY_DINGTOU':
          selectedDuty = 1;
          break;
        case 'DUTY_NEGATIVE':
          selectedDuty = 2;
          break;
        default:
          selectedDuty = 0;
      }

      // 计算显示值
      const displayValue = this.computeDisplayValue(config);

      this.setData({
        currentConfig: config,
        currentSelectedStart: selectedStart,
        currentPaScore: paScore,
        currentDoubleParScore: doubleParScore,
        currentSelectedMax: selectedMax,
        currentMaxSubScore: maxSubScore,
        currentSelectedDuty: selectedDuty,
        displayValue: displayValue
      });
    },




    // UI事件处理
    onShowConfig() {
      if (this.properties.disabled) {
        wx.showToast({
          title: '当前规则下扣分功能已禁用',
          icon: 'none',
          duration: 2000
        });
        return;
      }
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
    onSelectStart(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      const currentConfig = this.data.currentConfig;
      
      let badScoreBaseLine = 'NoSub';
      if (index === 0) {
        badScoreBaseLine = `Par+${this.data.currentPaScore}`;
      } else if (index === 1) {
        badScoreBaseLine = `DoublePar+${this.data.currentDoubleParScore}`;
      }

      const config = {
        ...currentConfig,
        badScoreBaseLine: badScoreBaseLine
      };

      this.handleConfigChange(config);
    },

    onSelectMax(e) {
      // 如果选择了"不扣分"，则禁用封顶选项
      if (this.data.currentSelectedStart === 2) {
        return;
      }
      
      const index = Number.parseInt(e.currentTarget.dataset.index);
      const currentConfig = this.data.currentConfig;
      
      const config = {
        ...currentConfig,
        badScoreMaxLost: index === 0 ? 10000000 : this.data.currentMaxSubScore
      };

      this.handleConfigChange(config);
    },

    onSelectDuty(e) {
      // 如果选择了"不扣分"，则禁用同伴惩罚选项
      if (this.data.currentSelectedStart === 2) {
        return;
      }
      
      const index = Number.parseInt(e.currentTarget.dataset.index);
      const currentConfig = this.data.currentConfig;
      
      let dutyConfig = 'NODUTY';
      switch (index) {
        case 1:
          dutyConfig = 'DUTY_DINGTOU';
          break;
        case 2:
          dutyConfig = 'DUTY_NEGATIVE';
          break;
        default:
          dutyConfig = 'NODUTY';
      }

      const config = {
        ...currentConfig,
        dutyConfig: dutyConfig
      };

      this.handleConfigChange(config);
    },

    onPaScoreChange(e) {
      const score = this.data.paScoreRange[e.detail.value];
      const currentConfig = this.data.currentConfig;
      
      const config = {
        ...currentConfig,
        badScoreBaseLine: `Par+${score}`
      };
      
      this.handleConfigChange(config);
    },

    onDoubleParScoreChange(e) {
      const score = this.data.doubleParScoreRange[e.detail.value];
      const currentConfig = this.data.currentConfig;
      
      const config = {
        ...currentConfig,
        badScoreBaseLine: `DoublePar+${score}`
      };
      
      this.handleConfigChange(config);
    },

    onMaxSubScoreChange(e) {
      const score = this.data.maxSubScoreRange[e.detail.value];
      const currentConfig = this.data.currentConfig;
      
      const config = {
        ...currentConfig,
        badScoreMaxLost: score
      };
      
      this.handleConfigChange(config);
    },

    // 根据配置对象重新计算UI状态
    updateConfigFromObject(config) {
      // 解析扣分基线配置
      let selectedStart = 0;
      let paScore = 4;
      let doubleParScore = 0;

      if (config.badScoreBaseLine === 'NoSub') {
        selectedStart = 2;
      } else if (config.badScoreBaseLine?.startsWith('Par+')) {
        selectedStart = 0;
        const score = Number.parseInt(config.badScoreBaseLine.replace('Par+', ''));
        paScore = Number.isNaN(score) ? 4 : score;
      } else if (config.badScoreBaseLine?.startsWith('DoublePar+')) {
        selectedStart = 1;
        const score = Number.parseInt(config.badScoreBaseLine.replace('DoublePar+', ''));
        doubleParScore = Number.isNaN(score) ? 0 : score;
      }

      // 解析封顶配置
      const selectedMax = config.badScoreMaxLost === 10000000 ? 0 : 1;
      const maxSubScore = config.badScoreMaxLost === 10000000 ? 2 : config.badScoreMaxLost;

      // 解析同伴惩罚配置
      let selectedDuty = 0;
      switch (config.dutyConfig) {
        case 'DUTY_DINGTOU':
          selectedDuty = 1;
          break;
        case 'DUTY_NEGATIVE':
          selectedDuty = 2;
          break;
        default:
          selectedDuty = 0;
      }

      // 计算显示值
      const displayValue = this.computeDisplayValue(config);

      this.setData({
        currentConfig: config,
        currentSelectedStart: selectedStart,
        currentPaScore: paScore,
        currentDoubleParScore: doubleParScore,
        currentSelectedMax: selectedMax,
        currentMaxSubScore: maxSubScore,
        currentSelectedDuty: selectedDuty,
        displayValue: displayValue
      });
    },

    // 统一的配置变更处理
    handleConfigChange(config) {
      console.log('📊 [E8421Koufen] 扣分配置变化:', config);

      // 重新计算UI状态，确保界面正确显示
      this.updateConfigFromObject(config);

      // 直接发送对象格式，不要在组件层转换为字符串
      // Store层会在保存到数据库时统一处理字符串转换
      this.triggerEvent('configChange', {
        componentType: 'koufen',
        config: config
      });
    },

    // 计算显示值
    computeDisplayValue(config) {
      if (!config) return '请配置扣分规则';

      const { badScoreBaseLine, badScoreMaxLost } = config;

      // 使用工具类格式化显示值
      return ruleFormatter.formatKoufenRule(badScoreBaseLine, badScoreMaxLost);
    },

    // 辅助方法
    getCurrentConfig() {
      return {
        badScoreBaseLine: this.properties.badScoreBaseLine || this.data.defaultConfig.badScoreBaseLine,
        badScoreMaxLost: this.properties.badScoreMaxLost || this.data.defaultConfig.badScoreMaxLost,
        dutyConfig: this.properties.dutyConfig || this.data.defaultConfig.dutyConfig
      };
    },

  }
});