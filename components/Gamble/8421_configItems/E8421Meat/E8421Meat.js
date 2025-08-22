/**
 * E8421吃肉配置组件 - 纯受控组件
 * 所有数据通过props传入，UI变化通过事件通知父组件
 */

Component({
  properties: {
    eatingRange: {
      type: Object,
      value: null,
      observer: function (newVal) {
        console.log('🔍 [E8421Meat] eatingRange更新:', newVal);
      }
    },
    meatValueConfig: {
      type: String,
      value: 'MEAT_AS_1',
      observer: function (newVal) {
        console.log('🔍 [E8421Meat] meatValueConfig更新:', newVal);
      }
    },
    meatMaxValue: {
      type: Number,
      value: 10000000,
      observer: function (newVal) {
        console.log('🔍 [E8421Meat] meatMaxValue更新:', newVal);
      }
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  data: {
    visible: false,

    // 静态配置数据
    eatRangeLabels: {
      'BetterThanBirdie': '比鸟更好',
      'Birdie': '鸟',
      'Par': '帕',
      'WorseThanPar': '比帕更差'
    },
    eatRangeKeys: ['BetterThanBirdie', 'Birdie', 'Par', 'WorseThanPar'],
    eatValueRange: Array.from({ length: 20 }, (_, i) => i + 1),
    meatScoreRange: [1, 2, 3, 4, 5],
    topScoreRange: Array.from({ length: 20 }, (_, i) => i + 1),
    meatValueOptions: [
      { label: '肉算固定分', value: 'MEAT_AS_X' },
      { label: '分值翻倍', value: 'SINGLE_DOUBLE' },
      { label: '分值连续翻倍', value: 'CONTINUE_DOUBLE' }
    ],
    topOptions: ["不封顶", "X分封顶"],

    // 默认配置
    defaultConfig: {
      eatingRange: {
        "BetterThanBirdie": 1,
        "Birdie": 1,
        "Par": 1,
        "WorseThanPar": 1
      },
      meatValueConfig: 'MEAT_AS_1',
      meatMaxValue: 10000000
    },

    currentConfig: null,
    currentMeatValueOption: 0,
    currentMeatScore: 1,
    currentTopSelected: 0,
    currentTopScoreLimit: 3,
    displayValue: '请配置吃肉规则'
  },
  lifetimes: {
    attached() {
      this.updateCurrentConfig();
    }
  },

  observers: {
    'eatingRange, meatValueConfig, meatMaxValue': function (eatingRange, meatValueConfig, meatMaxValue) {
      console.log('🔍 [E8421Meat] 属性变化:', { eatingRange, meatValueConfig, meatMaxValue });
      this.updateCurrentConfig();
    }
  },
  methods: {
    // 更新当前配置状态
    updateCurrentConfig() {
      const config = this.getCurrentConfig();

      // 计算肉分值选项
      let meatValueOption = 0;
      let meatScore = 1;

      if (config.meatValueConfig?.startsWith('MEAT_AS_')) {
        meatValueOption = 0;
        const score = Number.parseInt(config.meatValueConfig.replace('MEAT_AS_', ''));
        meatScore = Number.isNaN(score) ? 1 : score;
      } else {
        const index = this.data.meatValueOptions.findIndex(opt => opt.value === config.meatValueConfig);
        meatValueOption = index >= 0 ? index : 0;
      }

      // 计算封顶选项
      const topSelected = config.meatMaxValue === 10000000 ? 0 : 1;
      const topScoreLimit = config.meatMaxValue === 10000000 ? 3 : config.meatMaxValue;

      // 计算显示值
      const displayValue = this.computeDisplayValue(config);

      this.setData({
        currentConfig: config,
        currentMeatValueOption: meatValueOption,
        currentMeatScore: meatScore,
        currentTopSelected: topSelected,
        currentTopScoreLimit: topScoreLimit,
        displayValue: displayValue
      });
    },


    // UI事件处理
    onShowConfig() {
      if (this.properties.disabled) {
        wx.showToast({
          title: '当前规则下吃肉功能已禁用',
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
    onEatValueChange(e) {
      const keyIndex = e.currentTarget.dataset.index;
      const value = this.data.eatValueRange[e.detail.value];
      const key = this.data.eatRangeKeys[keyIndex];

      const currentConfig = this.data.currentConfig;
      const newEatingRange = { ...currentConfig.eatingRange };
      newEatingRange[key] = value;

      const config = {
        ...currentConfig,
        eatingRange: newEatingRange
      };

      this.handleConfigChange(config);
    },

    onMeatValueChange(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      const meatValueConfig = this.data.meatValueOptions[index].value;

      const currentConfig = this.data.currentConfig;
      let config = {
        ...currentConfig,
        meatValueConfig: meatValueConfig
      };

      // 如果不是固定分模式，重置为默认分值
      if (meatValueConfig !== 'MEAT_AS_X') {
        // 重置封顶配置
        config.meatMaxValue = 10000000;
      }

      this.handleConfigChange(config);
    },

    onMeatScoreChange(e) {
      const score = this.data.meatScoreRange[e.detail.value];
      const config = {
        ...this.data.currentConfig,
        meatValueConfig: `MEAT_AS_${score}`
      };
      this.handleConfigChange(config);
    },

    onTopSelect(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      const currentConfig = this.data.currentConfig;

      if (currentConfig.meatValueConfig !== 'SINGLE_DOUBLE') {
        wx.showToast({
          title: '请先选择"分值翻倍"',
          icon: 'none',
          duration: 1500
        });
        return;
      }

      const config = {
        ...currentConfig,
        meatMaxValue: index === 0 ? 10000000 : this.data.currentTopScoreLimit
      };

      this.handleConfigChange(config);
    },

    onTopScoreChange(e) {
      const topScore = this.data.topScoreRange[e.detail.value];
      const config = {
        ...this.data.currentConfig,
        meatMaxValue: topScore
      };
      this.handleConfigChange(config);
    },

    // 统一的配置变更处理
    handleConfigChange(config) {
      console.log('🥩 [E8421Meat] 吃肉配置变化:', config);

      // 更新本地显示值
      const displayValue = this.computeDisplayValue(config);
      this.setData({ displayValue });

      // 发送配置变更事件
      this.triggerEvent('configChange', {
        componentType: 'meat',
        config: config
      });
    },

    // 计算显示值
    computeDisplayValue(config) {
      if (!config) return '请配置吃肉规则';

      const { meatValueConfig, meatMaxValue } = config;

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
          default:
            meatValueText = '请配置吃肉规则';
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

      return result || '请配置吃肉规则';
    },

    // 辅助方法
    getCurrentConfig() {
      return {
        eatingRange: this.properties.eatingRange || this.data.defaultConfig.eatingRange,
        meatValueConfig: this.properties.meatValueConfig || this.data.defaultConfig.meatValueConfig,
        meatMaxValue: this.properties.meatMaxValue || this.data.defaultConfig.meatMaxValue
      };
    },

    getCurrentMeatValueOption() {
      const meatValueConfig = this.properties.meatValueConfig;
      if (meatValueConfig?.startsWith('MEAT_AS_')) {
        return 0;
      }
      const index = this.data.meatValueOptions.findIndex(opt => opt.value === meatValueConfig);
      return index >= 0 ? index : 0;
    },

    getCurrentMeatScore() {
      const meatValueConfig = this.properties.meatValueConfig;
      if (meatValueConfig?.startsWith('MEAT_AS_')) {
        const score = Number.parseInt(meatValueConfig.replace('MEAT_AS_', ''));
        return Number.isNaN(score) ? 1 : score;
      }
      return 1;
    },

    getCurrentTopSelected() {
      const meatMaxValue = this.properties.meatMaxValue;
      return meatMaxValue === 10000000 ? 0 : 1;
    },

    getCurrentTopScoreLimit() {
      const meatMaxValue = this.properties.meatMaxValue;
      return meatMaxValue === 10000000 ? 3 : meatMaxValue;
    }
  }
});