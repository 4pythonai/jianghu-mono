import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'
import { reaction } from 'mobx-miniprogram'
import configManager from '../../../../utils/configManager.js'
import ruleFormatter from '../../../../utils/formatters/ruleFormatter.js'

Component({
  properties: {
  },

  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置吃肉规则',
    isDisabled: false,

    // 直接使用固定的默认配置
    eatingRange: {
      "BetterThanBirdie": 1,
      "Birdie": 1,
      "Par": 1,
      "WorseThanPar": 1
    },
    eatRangeLabels: {
      'BetterThanBirdie': '比鸟更好',
      'Birdie': '鸟',
      'Par': '帕',
      'WorseThanPar': '比帕更差'
    },
    eatRangeKeys: ['BetterThanBirdie', 'Birdie', 'Par', 'WorseThanPar'],

    meatValueOption: 0,
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
      console.log('🎯 [E8421Meat] 组件加载，模式:', this.properties.mode);

      if (this.properties.mode === 'SysConfig') {
        // SysConfig模式：使用独立的配置数据，不依赖Store
        // 使用默认配置初始化，但保持用户之前的选择
        this.setData({
          eatingRange: this.data.eatingRange || {
            "BetterThanBirdie": 1,
            "Birdie": 1,
            "Par": 1,
            "WorseThanPar": 1
          },
          meatValueOption: this.data.meatValueOption || 0,
          meatScoreValue: this.data.meatScoreValue || 1,
          topSelected: this.data.topSelected || 0,
          topScoreLimit: this.data.topScoreLimit || 3
        });
      } else if (this.properties.mode === 'UserEdit') {
        // UserEdit模式：等待外部数据初始化，不自动从Store加载
        // 设置默认值，避免显示"请配置吃肉规则"
        this.setData({
          eatingRange: {
            "BetterThanBirdie": 1,
            "Birdie": 1,
            "Par": 1,
            "WorseThanPar": 1
          },
          meatValueOption: 0,
          meatScoreValue: 1,
          topSelected: 0,
          topScoreLimit: 3
        });
      }

      // 计算显示值
      this.updateDisplayValue();
      // 检查禁用状态
      this.checkDisabledState();

      // 监听顶洞规则变化
      this._storeReaction = reaction(
        () => G4P8421Store.drawConfig,
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
    // 检查禁用状态
    checkDisabledState() {
      const isDisabled = G4P8421Store.drawConfig === 'NoDraw';
      this.setData({ isDisabled });
    },

    // 计算显示值
    updateDisplayValue() {
      if (this.properties.mode === 'SysConfig' || this.properties.mode === 'UserEdit' || this.properties.mode === undefined) {
        // 使用组件内部状态
        const { meatValueOption, meatScoreValue, topSelected, topScoreLimit } = this.data;
        let displayValue = '';

        // 映射英文格式到中文显示
        if (meatValueOption === 0) {
          displayValue = `肉算${meatScoreValue}分`;
        } else if (meatValueOption === 1) {
          displayValue = '分值翻倍';
        } else if (meatValueOption === 2) {
          displayValue = '分值连续翻倍';
        } else {
          displayValue = '请配置吃肉规则';
        }

        // 添加封顶信息
        if (meatValueOption === 1 && topSelected === 1) {
          displayValue += `/${topScoreLimit}分封顶`;
        } else if (meatValueOption === 1 && topSelected === 0) {
          displayValue += '/不封顶';
        }

        this.setData({ displayValue });
        console.log('🎯 [E8421Meat] 吃肉规则显示值已更新:', displayValue);
      } else {
        // 使用Store数据
        const store = G4P8421Store;
        const displayValue = ruleFormatter.formatMeatRule(store.meatValueConfig, store.meatMaxValue);

        this.setData({ displayValue });
      }
    },

    /**
    * 解析 meatValueConfig 配置
    * @param {string} value - 配置值，如 "SINGLE_DOUBLE"
    * @returns {Object} 解析结果，如 { type: 'SINGLE_DOUBLE', index: 1 }
    */
    parseMeatValueConfig(value) {
      if (!value || typeof value !== 'string') {
        return {
          type: 'MEAT_AS_1',
          index: 0,
          score: 1
        };
      }

      if (value === 'SINGLE_DOUBLE') {
        return { type: value, index: 1 };
      }
      if (value === 'CONTINUE_DOUBLE') {
        return { type: value, index: 2 };
      }
      if (value.startsWith('MEAT_AS_')) {
        const meatResult = this.parseMeatAs(value);
        return {
          type: 'MEAT_AS',
          index: 0,
          score: meatResult ? meatResult.score : 1
        };
      }

      return {
        type: 'MEAT_AS_1',
        index: 0,
        score: 1
      };
    },


    // 事件处理方法
    onEatValueChange(e) {
      const key = e.currentTarget.dataset.key;
      const selectedIndex = e.detail.value;
      const selectedValue = this.data.eatValueRange[selectedIndex];
      console.log('🎯 [E8421Meat] 选择吃肉数量:', key, selectedValue);
      const eatingRange = { ...this.data.eatingRange };
      eatingRange[key] = selectedValue;
      this.setData({ eatingRange });
    },

    onMeatValueChange(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      console.log('🎯 [E8421Meat] 选择选项:', index, '当前meatValueOption:', this.data.meatValueOption);
      this.setData({ meatValueOption: index });
      console.log('🎯 [E8421Meat] 设置后meatValueOption:', index);
    },

    onMeatScoreChange(e) {
      const selectedIndex = e.detail.value;
      const selectedScore = this.data.meatScoreRange[selectedIndex];
      console.log('🎯 [E8421Meat] 选择肉分值:', selectedScore);
      this.setData({ meatScoreValue: selectedScore });
    },

    onTopSelect(e) {
      // 如果选择了"分值翻倍"以外的选项，则禁用封顶选项
      if (Number(this.data.meatValueOption) !== 1) {
        console.log('🎯 [E8421Meat] onTopSelect 被调用，但当前状态不是分值翻倍，忽略操作');
        return;
      }
      const index = Number.parseInt(e.currentTarget.dataset.index);
      console.log('🎯 [E8421Meat] 选择封顶选项:', index);
      this.setData({ topSelected: index });
    },

    noop() {
      // 空方法，用于处理禁用状态下的点击事件
    },

    onTopScoreChange(e) {
      const selectedIndex = e.detail.value;
      const selectedScore = this.data.topScoreRange[selectedIndex];
      console.log('🎯 [E8421Meat] 选择封顶分数:', selectedScore);
      this.setData({ topScoreLimit: selectedScore });
    },

    // UI控制方法
    onShowConfig() {
      this.setData({ visible: true });
    },

    onCancel() {
      this.setData({ visible: false });
    },

    onConfirm() {
      // 更新显示值
      this.updateDisplayValue();
      // 关闭弹窗
      this.setData({ visible: false });
      // 向父组件传递事件
      this.triggerEvent('confirm', {
        value: this.getConfigData()
      });
    },


    /**
 * 将E8421Meat组件状态转换为配置数据
 * @param {Object} componentState - 组件状态
 * @returns {Object} 配置数据
 */
    convertE8421MeatToConfig(componentState) {
      const { eatingRange, meatValueOption, meatScoreValue, topSelected, topScoreLimit } = componentState;

      // 构建肉分值配置
      let meatValueConfig = null;
      switch (meatValueOption) {
        case 0:
          meatValueConfig = `MEAT_AS_${meatScoreValue}`;
          break;
        case 1:
          meatValueConfig = 'SINGLE_DOUBLE';
          break;
        case 2:
          meatValueConfig = 'CONTINUE_DOUBLE';
          break;
      }

      // 构建封顶配置
      const meatMaxValue = topSelected === 0 ? 10000000 : topScoreLimit;

      return {
        eatingRange,
        meatValueConfig,
        meatMaxValue
      };
    },


    // 获取配置数据 - 使用工具类简化
    getConfigData() {
      const componentState = {
        eatingRange: this.data.eatingRange,
        meatValueOption: this.data.meatValueOption,
        meatScoreValue: this.data.meatScoreValue,
        topSelected: this.data.topSelected,
        topScoreLimit: this.data.topScoreLimit
      };

      // 使用工具类转换组件状态为配置数据
      const configData = this.convertE8421MeatToConfig(componentState);

      return configData;
    },


    /**
     * 将配置数据转换为E8421Meat组件状态
     * @param {Object} configData - 配置数据
     * @returns {Object} 组件状态
     */
    convertConfigToE8421Meat(configData) {
      const { eatingRange, meatValueConfig, meatMaxValue } = configData;
      const state = {};

      // 解析eatingRange
      if (eatingRange) {
        if (typeof eatingRange === 'string') {
          try {
            state.eatingRange = JSON.parse(eatingRange);
          } catch (error) {
            state.eatingRange = {
              "BetterThanBirdie": 1,
              "Birdie": 1,
              "Par": 1,
              "WorseThanPar": 1
            };
          }
        } else {
          state.eatingRange = eatingRange;
        }
      }

      // 解析meatValueConfig
      if (meatValueConfig?.startsWith('MEAT_AS_')) {
        state.meatValueOption = 0;
        const score = Number.parseInt(meatValueConfig.replace('MEAT_AS_', ''));
        state.meatScoreValue = Number.isNaN(score) ? 1 : score;
      } else if (meatValueConfig === 'SINGLE_DOUBLE') {
        state.meatValueOption = 1;
      } else if (meatValueConfig === 'CONTINUE_DOUBLE') {
        state.meatValueOption = 2;
      } else {
        state.meatValueOption = 0;
        state.meatScoreValue = 1;
      }

      // 解析meatMaxValue
      const maxValue = Number(meatMaxValue);
      if (maxValue === 10000000) {
        state.topSelected = 0;
      } else {
        state.topSelected = 1;
        state.topScoreLimit = maxValue > 0 ? maxValue : 3;
      }

      return state;
    },

    // 初始化配置数据 - 使用工具类简化
    initConfigData(configData) {

      // 使用工具类转换配置数据为组件状态
      const componentState = this.convertConfigToE8421Meat(configData);

      this.setData(componentState);
      this.updateDisplayValue();

    }
  }
});