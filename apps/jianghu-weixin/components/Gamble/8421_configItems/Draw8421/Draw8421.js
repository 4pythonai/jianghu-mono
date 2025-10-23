/**
 * Draw8421顶洞配置组件 - 简化版
 * 纯受控组件，所有数据通过props传入，UI变化通过事件通知父组件
 */
const ruleFormatter = require('@/utils/formatters/ruleFormatter.js')

Component({
  properties: {
    drawConfig: {
      type: String,
      value: 'DrawEqual',
      observer: function (newVal) {
        console.log('🔍 [Draw8421] drawConfig更新:', newVal);
      }
    },
    mode: {
      type: String,
      value: 'UserEdit'
    },
    disabled: {
      type: Boolean,
      value: false
    },
    configData: {
      type: String,
      value: null,
      observer: function (newVal) {
        console.log('🔍 [Draw8421] configData更新:', newVal);
        if (newVal) {
          this.initConfigData(newVal);
        }
      }
    }
  },

  data: {
    visible: false,

    // 静态配置数据
    options: ['得分打平', '得分X分以内', '无顶洞'],
    diffScores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

    // 默认配置
    defaultConfig: {
      drawConfig: 'DrawEqual'
    },

    currentConfig: null,
    currentSelected: 0,
    currentDiffScore: 1,
    displayValue: '请配置顶洞规则'
  },

  lifetimes: {
    attached() {
      this.updateCurrentConfig();
    }
  },

  observers: {
    'drawConfig': function (drawConfig) {
      console.log('🔍 [Draw8421] 属性变化:', { drawConfig });
      this.updateCurrentConfig();
    }
  },

  methods: {
    // 更新当前配置状态
    updateCurrentConfig() {
      const config = this.getCurrentConfig();

      // 解析drawConfig配置
      let selected = 0;
      let diffScore = 1;

      if (config.drawConfig === 'DrawEqual') {
        selected = 0;
      } else if (config.drawConfig === 'NoDraw') {
        selected = 2;
      } else if (config.drawConfig?.startsWith('Diff_')) {
        selected = 1;
        const score = Number.parseInt(config.drawConfig.replace('Diff_', ''));
        diffScore = Number.isNaN(score) ? 1 : score;
      }

      // 计算显示值
      const displayValue = this.computeDisplayValue(config);

      this.setData({
        currentConfig: config,
        currentSelected: selected,
        currentDiffScore: diffScore,
        displayValue: displayValue
      });
    },

    // UI事件处理
    onShowConfig() {
      if (this.properties.disabled) {
        wx.showToast({
          title: '当前规则下顶洞功能已禁用',
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
    onSelect(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      const currentConfig = this.data.currentConfig;

      let drawConfig = 'DrawEqual';
      if (index === 0) {
        drawConfig = 'DrawEqual';
      } else if (index === 1) {
        drawConfig = `Diff_${this.data.currentDiffScore}`;
      } else if (index === 2) {
        drawConfig = 'NoDraw';
      }

      const config = {
        ...currentConfig,
        drawConfig: drawConfig
      };

      this.handleConfigChange(config);
    },

    onDiffScoreChange(e) {
      const score = this.data.diffScores[e.detail.value];
      const currentConfig = this.data.currentConfig;

      const config = {
        ...currentConfig,
        drawConfig: `Diff_${score}`
      };

      this.handleConfigChange(config);
    },

    // 根据配置对象重新计算UI状态
    updateConfigFromObject(config) {
      // 解析drawConfig配置
      let selected = 0;
      let diffScore = 1;

      if (config.drawConfig === 'DrawEqual') {
        selected = 0;
      } else if (config.drawConfig === 'NoDraw') {
        selected = 2;
      } else if (config.drawConfig?.startsWith('Diff_')) {
        selected = 1;
        const score = Number.parseInt(config.drawConfig.replace('Diff_', ''));
        diffScore = Number.isNaN(score) ? 1 : score;
      }

      // 计算显示值
      const displayValue = this.computeDisplayValue(config);

      this.setData({
        currentConfig: config,
        currentSelected: selected,
        currentDiffScore: diffScore,
        displayValue: displayValue
      });
    },

    // 统一的配置变更处理
    handleConfigChange(config) {
      console.log('🎯 [Draw8421] 顶洞配置变化:', config);

      // 重新计算UI状态，确保界面正确显示
      this.updateConfigFromObject(config);

      // 直接发送对象格式，不要在组件层转换为字符串
      // Store层会在保存到数据库时统一处理字符串转换
      this.triggerEvent('configChange', {
        componentType: 'dingdong',
        config: config
      });
    },

    // 计算显示值
    computeDisplayValue(config) {
      if (!config) return '请配置顶洞规则';

      const { drawConfig } = config;

      // 使用工具类格式化显示值
      return ruleFormatter.formatDrawRule(drawConfig);
    },

    // 辅助方法
    getCurrentConfig() {
      return {
        drawConfig: this.properties.drawConfig || this.data.defaultConfig.drawConfig
      };
    },

    // ConfigWrapper接口：初始化配置数据
    initConfigData(configData) {
      console.log('🎯 [Draw8421] 初始化配置数据:', configData);

      if (!configData) return;

      // configData本身就是drawConfig字符串
      const drawConfig = configData || this.data.defaultConfig.drawConfig;

      // 设置配置对象
      const config = { drawConfig };

      // 更新UI状态
      this.updateConfigFromObject(config);
    },

    // ConfigWrapper接口：获取当前配置
    getConfigData() {
      return this.getCurrentConfig().drawConfig;
    }

  }
});