import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'
import { reaction } from 'mobx-miniprogram'
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

    meatValueOption: 4,
    topOptions: ["不封顶", "X分封顶"],
    topSelected: 0,

    // 新增可编辑变量
    topScoreLimit: 3, // 封顶分数, 默认3
    meatScoreValue: 1, // 肉算x分中的x值, 默认1

    // 数字选择器范围 - 直接定义
    eatValueRange: Array.from({ length: 20 }, (_, i) => i + 1), // 1-20, 吃肉数量范围
    topScoreRange: Array.from({ length: 20 }, (_, i) => i + 1),  // 1-20, 封顶分数范围
    meatScoreRange: [1, 2, 3, 4, 5], // 肉分值范围 1-5
  },

  // 组件生命周期
  lifetimes: {
    attached() {
      console.log('🎯 [LasiEatmeat] 组件加载，模式:', this.properties.mode);

      if (this.properties.mode === 'SysConfig') {
        // SysConfig模式：使用独立的配置数据，不依赖Store
        this.initializeWithDefaults();
      } else if (this.properties.mode === 'UserEdit') {
        // UserEdit模式：等待外部数据初始化，不自动从Store加载
        this.initializeWithDefaults();
      } else {
        // UserConfig模式：从store获取当前配置并初始化组件状态
        this.initializeFromStore();
      }

      // 计算显示值
      this.updateDisplayValue();
      // 检查禁用状态
      this.checkDisabledState();

      // 监听顶洞规则变化
      this._storeReaction = reaction(
        () => G4PLasiStore.drawConfig,
        () => {
          this.checkDisabledState();
        }
      );
    },

    detached() {
      // 清理reaction
      if (this._storeReaction) {
        this._storeReaction();
      }
    }
  },

  methods: {
    // 使用默认值初始化
    initializeWithDefaults() {
      const defaultEatingRange = {
        "BetterThanBirdie": 4,
        "Birdie": 2,
        "Par": 1,
        "WorseThanPar": 0
      };

      this.setData({
        eatingRange: defaultEatingRange,
        meatValueOption: this.data.meatValueOption || 4, // 保持为4（分值翻倍不含奖励）
        meatScoreValue: this.data.meatScoreValue || 1,   // 保持为1
        topSelected: this.data.topSelected || 0,         // 保持为0（不封顶）
        topScoreLimit: this.data.topScoreLimit || 3      // 保持为3
      });
    },

    // 检查禁用状态
    checkDisabledState() {
      const isDisabled = G4PLasiStore.drawConfig === 'NoDraw';
      this.setData({ isDisabled });
    },

    // 计算显示值
    updateDisplayValue() {
      if (this.properties.mode === 'SysConfig' || this.properties.mode === 'UserEdit' || this.properties.mode === undefined) {
        // 使用组件内部状态
        const displayValue = this.getDisplayValueFromComponentData();
        this.setData({ displayValue });
      }
    },

    // 从组件data获取显示值
    getDisplayValueFromComponentData() {
      const { meatValueOption, meatScoreValue, topSelected, topScoreLimit } = this.data;

      // 格式化吃肉规则显示
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

      // 格式化封顶值
      let meatMaxText = '';
      if (topSelected === 0) {
        meatMaxText = '不封顶';
      } else {
        meatMaxText = `${topScoreLimit || 3}分封顶`;
      }
      if (topScoreLimit == "10000000") {
        meatMaxText = '不封顶';
      }

      // 组合显示文本
      if (meatValueText && meatMaxText) {
        return `${meatValueText}/${meatMaxText}`;
      } else if (meatValueText) {
        return meatValueText;
      } else if (meatMaxText) {
        return meatMaxText;
      } else {
        return '请配置吃肉规则';
      }
    },

    // // 从store获取显示值
    // getDisplayValueFromStore() {
    //   const store = G4PLasiStore;
    //   // 使用工具类格式化显示值
    //   return ruleFormatter.formatMeatRule(store.meatValueConfig, store.meatMaxValue);
    // },

    // 从Store初始化配置
    initializeFromStore() {
      // 直接访问store的属性
      const eatingRange = G4PLasiStore.eatingRange;
      const meatValue = G4PLasiStore.meatValueConfig;
      const meatMaxValue = G4PLasiStore.meatMaxValue;

      // 检查store中是否有有效的配置
      const hasValidConfig = eatingRange &&
        typeof eatingRange === 'object' &&
        !Array.isArray(eatingRange) &&
        Object.keys(eatingRange).length > 0;

      if (hasValidConfig && meatValue) {
        // 解析已保存的配置
        this.parseStoredConfig({
          eatingRange,
          meatValue,
          meatMaxValue
        });
      } else {
        // 如果没有有效配置，使用默认值并保存到store
        const defaultEatingRange = {
          "BetterThanBirdie": 4,
          "Birdie": 2,
          "Par": 1,
          "WorseThanPar": 0
        };
        this.setData({ eatingRange: defaultEatingRange });

        // 保存默认配置到store
        G4PLasiStore.updateEatmeatRule(defaultEatingRange, 'MEAT_AS_1', 10000000);
      }
    },

    /**
     * 解析 MEAT_AS_X 格式的配置
     * @param {string} value - 配置值，如 "MEAT_AS_2"
     * @returns {Object|null} 解析结果，如 { type: 'MeatAs', score: 2 }
     */
    parseMeatAs(value) {
      if (!value || typeof value !== 'string') {
        return null;
      }

      if (value.startsWith('MEAT_AS_')) {
        const scoreStr = value.replace('MEAT_AS_', '');
        const score = Number.parseInt(scoreStr);

        if (!Number.isNaN(score)) {
          return {
            type: 'MeatAs',
            score: score,
            original: value
          };
        }
      }

      return null;
    },

    // 解析存储的配置
    parseStoredConfig(config) {
      const { eatingRange, meatValue, meatMaxValue } = config;

      // 使用统一的解析工具类解析吃肉数量配置
      this.setData({ eatingRange: eatingRange });

      // 解析肉分值计算方式
      if (meatValue) {
        let meatValueOption = 0;
        if (meatValue?.startsWith('MEAT_AS_')) {
          meatValueOption = 0;
          // 使用统一的解析工具
          const meatResult = this.parseMeatAs(meatValue);
          this.setData({ meatScoreValue: meatResult ? meatResult.score : 1 });
        } else if (meatValue === 'SINGLE_DOUBLE') {
          meatValueOption = 1;
        } else if (meatValue === 'CONTINUE_DOUBLE') {
          meatValueOption = 2;
        } else if (meatValue === 'DOUBLE_WITH_REWARD') {
          meatValueOption = 3;
        } else if (meatValue === 'DOUBLE_WITHOUT_REWARD') {
          meatValueOption = 4;
        }
        this.setData({ meatValueOption });
      }

      // 使用统一的解析工具类解析封顶配置
      const maxResult = configManager.parseMaxValue(meatMaxValue);
      if (maxResult.isUnlimited) {
        this.setData({
          topSelected: 0,
          topScoreLimit: 3 // 设置默认值，避免显示问题
        });
      } else {
        this.setData({
          topSelected: 1,
          topScoreLimit: maxResult.value
        });
      }
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
      // 如果肉分值选项不是"分值翻倍"，则不处理点击事件
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

    // 空操作，用于阻止事件冒泡
    noop() {
      // 什么都不做，只是阻止事件冒泡
    },

    // 封顶分数改变
    onTopScoreChange(e) {
      const value = this.data.topScoreRange[e.detail.value];
      this.setData({ topScoreLimit: value });
    },

    onShowConfig() {
      // 如果组件被禁用，则不显示配置弹窗
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

      // 解析配置数据
      const eatingRange = data.eatingRange; // 吃肉得分配对, JSON格式

      // 肉分值计算方式
      let meatValueConfig = null;
      switch (data.meatValueOption) {
        case 0:
          meatValueConfig = `MEAT_AS_${data.meatScoreValue}`; // 动态生成MEAT_AS_X格式
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

      // 吃肉封顶改为数字格式, 10000000表示不封顶
      const meatMaxValue = data.topSelected === 0 ? 10000000 : data.topScoreLimit;

      // 调用store的action更新数据
      G4PLasiStore.updateEatmeatRule(eatingRange, meatValueConfig, meatMaxValue);

      // 更新显示值
      this.updateDisplayValue();

      // 关闭弹窗
      this.setData({ visible: false });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        parsedData: { eatingRange, meatValueConfig, meatMaxValue }
      });
    },

    // 获取配置数据（供SysEdit页面调用）
    getConfigData() {
      return this.getCurrentConfig();
    },

    // 获取当前配置 - 使用统一的转换工具
    getCurrentConfig() {
      const componentState = {
        eatingRange: this.data.eatingRange,
        meatValueOption: this.data.meatValueOption,
        meatScoreValue: this.data.meatScoreValue,
        topSelected: this.data.topSelected,
        topScoreLimit: this.data.topScoreLimit
      };

      return this.convertLasiEatmeatToConfig(componentState);
    },

    /**
     * 将LasiEatmeat组件状态转换为配置数据
     * @param {Object} componentState - 组件状态
     * @returns {Object} 配置数据
     */
    convertLasiEatmeatToConfig(componentState) {
      const { eatingRange, meatValueOption, meatScoreValue, topSelected, topScoreLimit } = componentState;

      // 构建肉分值配置
      let meatValue = null;
      switch (meatValueOption) {
        case 0:
          meatValue = `MEAT_AS_${meatScoreValue}`;
          break;
        case 1:
          meatValue = 'SINGLE_DOUBLE';
          break;
        case 2:
          meatValue = 'CONTINUE_DOUBLE';
          break;
        case 3:
          meatValue = 'DOUBLE_WITH_REWARD';
          break;
        case 4:
          meatValue = 'DOUBLE_WITHOUT_REWARD';
          break;
      }

      // 构建封顶配置
      const meatMaxValue = topSelected === 0 ? 10000000 : topScoreLimit;

      return {
        eatingRange,
        meatValueConfig: meatValue, // 修正字段名
        meatMaxValue
      };
    },

    /**
     * 将配置数据转换为LasiEatmeat组件状态
     * @param {Object} configData - 配置数据
     * @returns {Object} 组件状态
     */
    convertConfigToLasiEatmeat(configData) {
      const { eatingRange, meatValueConfig, meatMaxValue } = configData;
      const state = {};

      // 处理eatingRange
      if (eatingRange) {
        if (typeof eatingRange === 'string') {
          try {
            state.eatingRange = JSON.parse(eatingRange);
          } catch (error) {
            console.error('解析eatingRange JSON字符串失败:', error);
            state.eatingRange = {
              "BetterThanBirdie": 4,
              "Birdie": 2,
              "Par": 1,
              "WorseThanPar": 0
            };
          }
        } else if (Array.isArray(eatingRange)) {
          console.warn('eatingRange是数组格式，转换为对象:', eatingRange);
          state.eatingRange = {
            "BetterThanBirdie": 4,
            "Birdie": 2,
            "Par": 1,
            "WorseThanPar": 0
          };
        } else {
          state.eatingRange = eatingRange;
        }
      }

      // 解析肉分值配置
      if (meatValueConfig?.startsWith('MEAT_AS_')) {
        state.meatValueOption = 0;
        const score = Number.parseInt(meatValueConfig.replace('MEAT_AS_', ''));
        state.meatScoreValue = Number.isNaN(score) ? 1 : score;
      } else {
        switch (meatValueConfig) {
          case 'SINGLE_DOUBLE':
            state.meatValueOption = 1;
            break;
          case 'CONTINUE_DOUBLE':
            state.meatValueOption = 2;
            break;
          case 'DOUBLE_WITH_REWARD':
            state.meatValueOption = 3;
            break;
          case 'DOUBLE_WITHOUT_REWARD':
            state.meatValueOption = 4;
            break;
          default:
            state.meatValueOption = 0;
            state.meatScoreValue = 1;
        }
      }

      // 解析封顶配置
      if (meatMaxValue === 10000000) {
        state.topSelected = 0;
        state.topScoreLimit = 3; // 设置默认值，避免显示问题
      } else {
        state.topSelected = 1;
        state.topScoreLimit = meatMaxValue;
      }

      return state;
    },

    // 初始化配置数据 - 供UserRuleEdit页面调用
    initConfigData(configData) {
      if (!configData) {
        return;
      }

      console.log('🎯 [LasiEatmeat] 配置数据已更新:', configData);

      const componentState = this.convertConfigToLasiEatmeat(configData);
      this.setData(componentState);
      this.updateDisplayValue();
    }
  }
});