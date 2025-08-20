const configManager = require('../../../../utils/configManager.js');

Component({
  properties: {
    // 可选：显式定义mode属性
    mode: {
      type: String,
      value: 'UserConfig' // 默认模式
    }
  },

  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置吃肉规则',
    isDisabled: false,

    // 配置相关数据
    eatingRange: {
      "BetterThanBirdie": 4,
      "Birdie": 2,
      "Par": 1,
      "WorseThanPar": 0
    },

    eatRangeLabels: {
      'BetterThanBirdie': '比鸟更好',
      'Birdie': '鸟',
      'Par': '帕',
      'WorseThanPar': '比帕更差'
    },

    eatRangeKeys: ['BetterThanBirdie', 'Birdie', 'Par', 'WorseThanPar'],
    meatValueOption: 4, // 默认值：分值翻倍(不含奖励)
    topOptions: ["不封顶", "X分封顶"],
    topSelected: 0,
    meatScoreValue: 1, // 肉算x分中的x值

    // 数字选择器范围
    eatValueRange: Array.from({ length: 20 }, (_, i) => i + 1), // 1-20
    topScoreRange: Array.from({ length: 20 }, (_, i) => i + 1), // 1-20
    meatScoreRange: [1, 2, 3, 4, 5], // 肉分值范围 1-5
  },

  // 组件生命周期
  lifetimes: {
    attached() {
      console.log('🎯 [LasiEatmeat] 组件加载，模式:', this.properties.mode);

      if (this.properties.mode === 'SysConfig') {
        // SysConfig模式：使用独立的配置数据
        this.initializeWithDefaults();
      } else {
        // UserEdit模式：从configManager获取配置
        this.initializeFromConfigManager();
      }

      // 计算显示值
      this.updateDisplayValue();
      // 检查禁用状态
      this.checkDisabledState();

      // 设置页面上下文供configManager使用
      const pages = getCurrentPages();
      this.pageContext = pages[pages.length - 1];

      // 确保显示值被正确初始化
      setTimeout(() => {
        this.updateDisplayValue();
      }, 0);
    }
  },

  methods: {
    // 获取当前赌博配置
    getCurrentGambleConfigs() {
      if (!this.pageContext) {
        const pages = getCurrentPages();
        this.pageContext = pages[pages.length - 1];
      }

      // 尝试从configManager获取当前配置
      if (configManager && typeof configManager.getCurrentGambleConfigs === 'function') {
        return configManager.getCurrentGambleConfigs(this.pageContext) || {};
      }

      // 回退到从页面上下文中获取
      const page = this.pageContext;
      return page.data?.gameData?.gambleCardData || page.data?.gambleCardData || {};
    },

    // 获取系统默认值
    getSystemDefaultConfig() {
      return {
        eatingRange: {
          "BetterThanBirdie": 4,
          "Birdie": 2,
          "Par": 1,
          "WorseThanPar": 0
        },
        meatValueConfig: 'DOUBLE_WITHOUT_REWARD',
        meatMaxValue: 10000000,
        meatValueOption: 4,
        meatScoreValue: 1,
        topSelected: 0,
        topScoreLimit: 3
      };
    },

    // 使用默认值初始化
    initializeWithDefaults() {
      const defaults = this.getSystemDefaultConfig();
      this.setData({
        eatingRange: { ...defaults.eatingRange },
        meatValueOption: defaults.meatValueOption,
        meatScoreValue: defaults.meatScoreValue,
        topSelected: defaults.topSelected,
        topScoreLimit: defaults.topScoreLimit
      });
    },

    // 从configManager初始化配置
    initializeFromConfigManager() {
      console.log('🎯 [LasiEatmeat] 从configManager初始化配置');

      const allConfigs = this.getCurrentGambleConfigs();

      // 获取完整配置
      let eatmeatConfig = allConfigs.eatmeat || {};
      const config = {
        eatingRange: eatmeatConfig.eatingRange || allConfigs.eatingRange,
        meatValue: eatmeatConfig.meatValue || allConfigs.meatValue,
        meatMaxValue: eatmeatConfig.meatMaxValue || allConfigs.meatMaxValue
      };

      console.log('🎯 [LasiEatmeat] ConfigManager配置数据:', config);
      this.parseStoredConfig(config);
    },

    // 解析存储的配置
    parseStoredConfig(config) {
      const { eatingRange, meatValue, meatValueConfig, meatMaxValue } = config;

      // 使用统一的解析工具类解析吃肉数量配置
      this.setData({ eatingRange: eatingRange || this.data.eatingRange });

      // 解析肉分值计算方式
      const meatValueToParse = meatValueConfig || meatValue || 'DOUBLE_WITHOUT_REWARD';
      let meatValueOption = 4;
      let meatScoreValue = 1;

      if (meatValueToParse?.startsWith('MEAT_AS_')) {
        meatValueOption = 0;
        const score = Number.parseInt(meatValueToParse.replace('MEAT_AS_', ''));
        meatScoreValue = Number.isNaN(score) ? 1 : score;
      } else {
        switch (meatValueToParse) {
          case 'SINGLE_DOUBLE':
            meatValueOption = 1;
            break;
          case 'CONTINUE_DOUBLE':
            meatValueOption = 2;
            break;
          case 'DOUBLE_WITH_REWARD':
            meatValueOption = 3;
            break;
          case 'DOUBLE_WITHOUT_REWARD':
            meatValueOption = 4;
            break;
        }
      }

      // 解析封顶配置
      const maxResult = meatMaxValue !== undefined 
        ? (meatMaxValue === 10000000 ? { isUnlimited: true } : { isUnlimited: false, value: meatMaxValue })
        : { isUnlimited: true, value: 10000000 };

      this.setData({
        meatValueOption,
        meatScoreValue,
        topSelected: maxResult.isUnlimited ? 0 : 1,
        topScoreLimit: maxResult.isUnlimited ? 3 : maxResult.value
      });
    },

    // 检查禁用状态
    checkDisabledState() {
      const allConfigs = this.getCurrentGambleConfigs();
      const lasiConfig = allConfigs.dingdong || {};
      const isDisabled = lasiConfig.dingdongType === 'NoDraw';
      this.setData({ isDisabled });
    },

    // 计算显示值
    updateDisplayValue() {
      const displayValue = this.getDisplayValueFromComponentData();
      this.setData({ displayValue });
      console.log('🎯 [LasiEatmeat] 吃肉规则显示值已更新:', displayValue);
    },

    // 获取显示值 - 完整显示包括肉分值计算
    getDisplayValueFromComponentData() {
      const { meatValueOption, meatScoreValue, topSelected, topScoreLimit, eatingRange } = this.data;

      // 格式化肉分值计算方式
      let meatValueText = '';
      switch (meatValueOption) {
        case 0:
          meatValueText = `肉算${meatScoreValue}分`;
          break;
        case 1:
          meatValueText = '分值翻倍';
          break;
        case 2:
          meatValueText = '分值连续翻倍';
          break;
        case 3:
          meatValueText = '分值翻倍(含奖励)';
          break;
        case 4:
          meatValueText = '分值翻倍(不含奖励)';
          break;
        default:
          meatValueText = '请配置吃肉规则';
      }

      // 格式化吃肉范围展示
      let eatingRangeText = '';
      if (eatingRange && typeof eatingRange === 'object') {
        const parts = [];
        if (eatingRange.BetterThanBirdie > 0) parts.push(`更好+${eatingRange.BetterThanBirdie}`);
        if (eatingRange.Birdie > 0) parts.push(`鸟+${eatingRange.Birdie}`);
        if (eatingRange.Par > 0) parts.push(`帕+${eatingRange.Par}`);
        if (eatingRange.WorseThanPar > 0) parts.push(`更差+${eatingRange.WorseThanPar}`);

        if (parts.length > 0) {
          eatingRangeText = `给${parts.join(', ')}`;
        }
      }

      // 格式化封顶值 - 只有在选择"分值翻倍"时才显示封顶信息
      let meatMaxText = '';
      if (meatValueOption === 1) {
        if (topSelected === 0 || topScoreLimit == "10000000") {
          meatMaxText = '不封顶';
        } else {
          meatMaxText = `${topScoreLimit}分封顶`;
        }
      }

      // 组合显示文本
      let result = meatValueText;
      if (meatMaxText) {
        result += `/${meatMaxText}`;
      }

      if (eatingRangeText) {
        result = `${result} (${eatingRangeText})`;
      }

      return result || '请配置吃肉规则';
    },






    // 吃肉数量改变事件
    onEatValueChange(e) {
      const keyIndex = e.currentTarget.dataset.index;
      const value = this.data.eatValueRange[e.detail.value];
      const key = this.data.eatRangeKeys[keyIndex];
      const newEatingRange = { ...this.data.eatingRange };
      newEatingRange[key] = value;
      this.setData({ eatingRange: newEatingRange });
    },

    // 肉分值计算方式改变事件
    onMeatValueChange(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      this.setData({ meatValueOption: index });
    },

    // 肉分值改变事件
    onMeatScoreChange(e) {
      const value = this.data.meatScoreRange[e.detail.value];
      this.setData({ meatScoreValue: value });
    },

    // 封顶选择事件
    onTopSelect(e) {
      if (this.data.meatValueOption !== 1) {
        wx.showToast({
          title: '请先选择"分值翻倍"',
          icon: 'none',
          duration: 1500
        });
        return;
      }
      this.setData({ topSelected: e.currentTarget.dataset.index });
    },

    onShowConfig() {
      if (this.data.isDisabled) {
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
      this.triggerEvent('cancel');
    },

    onConfirm() {
      const data = this.data;

      // 构建肉分值配置
      let meatValueConfig = null;
      switch (data.meatValueOption) {
        case 0:
          meatValueConfig = `MEAT_AS_${data.meatScoreValue}`;
          break;
        case 1:
          meatValueConfig = 'SINGLE_DOUBLE';
          break;
        case 2:
          meatValueConfig = 'CONTINUE_DOUBLE';
          break;
        case 3:
          meatValueConfig = 'DOUBLE_WITH_REWARD';
          break;
        case 4:
          meatValueConfig = 'DOUBLE_WITHOUT_REWARD';
          break;
      }

      // 构建封顶配置
      const meatMaxValue = data.meatValueOption === 1 
        ? (data.topSelected === 0 ? 10000000 : data.topScoreLimit)
        : 10000000;

      if (this.properties.mode === 'UserEdit') {
        this.saveConfigToManager(data.eatingRange, meatValueConfig, meatMaxValue);
      }

      this.updateDisplayValue();
      this.setData({ visible: false });

      this.triggerEvent('confirm', {
        eatingRange: data.eatingRange,
        meatValueConfig,
        meatMaxValue
      });
    },

    // 获取配置数据
    getConfigData() {
      const data = this.data;
      let meatValueConfig = null;
      switch (data.meatValueOption) {
        case 0:
          meatValueConfig = `MEAT_AS_${data.meatScoreValue}`;
          break;
        case 1:
          meatValueConfig = 'SINGLE_DOUBLE';
          break;
        case 2:
          meatValueConfig = 'CONTINUE_DOUBLE';
          break;
        case 3:
          meatValueConfig = 'DOUBLE_WITH_REWARD';
          break;
        case 4:
          meatValueConfig = 'DOUBLE_WITHOUT_REWARD';
          break;
      }

      return {
        eatingRange: data.eatingRange,
        meatValueConfig,
        meatMaxValue: data.meatValueOption === 1 
          ? (data.topSelected === 0 ? 10000000 : data.topScoreLimit)
          : 10000000
      };
    },

    saveConfigToManager(eatingRange, meatValueConfig, meatMaxValue) {
      if (!this.pageContext) return;

      // 使用configManager更新配置
      const config = {
        eatingRange,
        meatValue: meatValueConfig,
        meatMaxValue
      };

      if (configManager.updateGambleConfig) {
        configManager.updateGambleConfig(this.pageContext, { eatmeat: config });
      }
    },

    // 初始化配置数据
    initConfigData(configData) {
      this.parseStoredConfig(configData || {});
      this.updateDisplayValue();
    }
  }
});