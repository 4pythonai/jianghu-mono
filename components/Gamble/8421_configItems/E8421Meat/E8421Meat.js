import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'
import { reaction } from 'mobx-miniprogram'
import { ConfigParser } from '../../../../utils/configParser.js'
import { DisplayFormatter } from '../../../../utils/displayFormatter.js'
import { ConfigConverter } from '../../../../utils/configConverter.js'

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
        console.log('🎯 [E8421Meat] SysConfig模式，使用独立配置');
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
        console.log('🎯 [E8421Meat] UserEdit模式，等待外部数据初始化');
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
      } else {
        // 默认模式：从store获取当前配置并初始化组件状态
        this.initializeFromStore();
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
        const displayValue = DisplayFormatter.formatMeatRule(store.meatValueConfig, store.meatMaxValue);

        this.setData({ displayValue });
      }
    },

    // 从Store初始化 - 使用工具类简化
    initializeFromStore() {
      const store = G4P8421Store;
      this.parseStoredConfig(store);
      this.updateDisplayValue();
    },

    // 解析存储的配置 - 使用工具类简化
    parseStoredConfig(config) {
      // 使用工具类解析eatingRange
      const eatingRange = ConfigParser.parseEatingRange(config.eatingRange);
      if (eatingRange) {
        this.setData({ eatingRange });
      }

      // 使用工具类解析meatValueConfig
      const meatResult = ConfigParser.parseMeatValueConfig(config.meatValueConfig);
      this.setData({
        meatValueOption: meatResult.index,
        meatScoreValue: meatResult.score
      });

      // 使用工具类解析meatMaxValue
      const maxResult = ConfigParser.parseMaxValue(config.meatMaxValue);
      this.setData({
        topSelected: maxResult.isUnlimited ? 0 : 1,
        topScoreLimit: maxResult.isUnlimited ? 3 : maxResult.value
      });
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
      const configData = ConfigConverter.convertE8421MeatToConfig(componentState);

      return configData;
    },

    // 初始化配置数据 - 使用工具类简化
    initConfigData(configData) {

      // 使用工具类转换配置数据为组件状态
      const componentState = ConfigConverter.convertConfigToE8421Meat(configData);

      this.setData(componentState);
      this.updateDisplayValue();

    }
  }
});