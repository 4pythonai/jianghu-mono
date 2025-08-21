/**
 * 拉丝吃肉配置组件 - 简化版
 * 纯受控组件，所有数据通过props传入，UI变化通过事件通知父组件
 */

Component({
  properties: {
    config: {
      type: Object,
      value: null,
      observer: function (newVal) {
        console.log('🔍 [LasiEatmeat] config properties更新:', newVal);
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
      { label: '分值连续翻倍', value: 'CONTINUE_DOUBLE' },
      { label: '分值翻倍(含奖励)', value: 'DOUBLE_WITH_REWARD' },
      { label: '分值翻倍(不含奖励)', value: 'DOUBLE_WITHOUT_REWARD' }
    ],
    topOptions: ["不封顶", "X分封顶"],

    // 默认配置
    defaultConfig: {
      eatingRange: {
        "BetterThanBirdie": 4,
        "Birdie": 2,
        "Par": 1,
        "WorseThanPar": 0
      },
      meatValueConfig: 'DOUBLE_WITHOUT_REWARD',
      meatMaxValue: 10000000
    },

    // UI计算状态（由observer更新）
    currentConfig: null,
    currentMeatValueOption: 4,
    currentMeatScore: 1,
    currentTopSelected: 0,
    currentTopScoreLimit: 3,
    displayValue: '请配置吃肉规则'
  },

  lifetimes: {
    attached() {
      console.log('🎬 [LasiEatmeat] 组件初始化，当前config:', this.properties.config);
      this.updateCurrentConfig();
    }
  },

  observers: {
    'config': function (newConfig) {
      console.log('🔍 [LasiEatmeat] config变化:', newConfig);
      this.updateCurrentConfig();
    }
  },

  methods: {
    // 更新当前配置状态
    updateCurrentConfig() {
      const config = this.getCurrentConfig();

      // 计算肉分值选项
      let meatValueOption = 4;
      let meatScore = 1;

      if (config.meatValueConfig?.startsWith('MEAT_AS_')) {
        meatValueOption = 0;
        const score = Number.parseInt(config.meatValueConfig.replace('MEAT_AS_', ''));
        meatScore = Number.isNaN(score) ? 1 : score;
      } else {
        const index = this.data.meatValueOptions.findIndex(opt => opt.value === config.meatValueConfig);
        meatValueOption = index >= 0 ? index : 4;
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
      console.log('🥩 [LasiEatmeat] 吃肉配置变化:', config);

      // 更新本地显示值
      const displayValue = this.computeDisplayValue(config);
      this.setData({ displayValue });

      // 直接发送对象格式，不要在组件层转换为字符串
      // Store层会在保存到数据库时统一处理字符串转换
      this.triggerEvent('configChange', {
        componentType: 'eatmeat',
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
          case 'DOUBLE_WITH_REWARD':
            meatValueText = '分值翻倍(含奖励)';
            break;
          case 'DOUBLE_WITHOUT_REWARD':
            meatValueText = '分值翻倍(不含奖励)';
            break;
          default:
            meatValueText = '请配置吃肉规则';
        }
      }

      // 格式化封顶值 - 只有在选择“分值翻倍”时才显示封顶信息
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
      return this.properties.config || this.data.defaultConfig;
    },

    getCurrentMeatValueOption() {
      const config = this.getCurrentConfig();
      if (config.meatValueConfig?.startsWith('MEAT_AS_')) {
        return 0;
      }
      const index = this.data.meatValueOptions.findIndex(opt => opt.value === config.meatValueConfig);
      return index >= 0 ? index : 4; // 默认 DOUBLE_WITHOUT_REWARD
    },

    getCurrentMeatScore() {
      const config = this.getCurrentConfig();
      if (config.meatValueConfig?.startsWith('MEAT_AS_')) {
        const score = Number.parseInt(config.meatValueConfig.replace('MEAT_AS_', ''));
        return Number.isNaN(score) ? 1 : score;
      }
      return 1;
    },

    getCurrentTopSelected() {
      const config = this.getCurrentConfig();
      return config.meatMaxValue === 10000000 ? 0 : 1;
    },

    getCurrentTopScoreLimit() {
      const config = this.getCurrentConfig();
      return config.meatMaxValue === 10000000 ? 3 : config.meatMaxValue;
    }
  }
});