import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'
import { GOLF_SCORE_TYPES } from '../../../../utils/gameConstants.js'
import { reaction } from 'mobx-miniprogram'

// 默认吃肉配置常量
const DEFAULT_EATING_RANGE = {
  "BetterThanBirdie": 4,
  "Birdie": 2,
  "Par": 1,
  "WorseThanPar": 0
};

// 肉分值配置映射 - 简化逻辑
const MEAT_VALUE_CONFIGS = {
  MEAT_AS_1: { option: 0, score: 1, display: '肉算1分' },
  MEAT_AS_2: { option: 0, score: 2, display: '肉算2分' },
  MEAT_AS_3: { option: 0, score: 3, display: '肉算3分' },
  MEAT_AS_4: { option: 0, score: 4, display: '肉算4分' },
  MEAT_AS_5: { option: 0, score: 5, display: '肉算5分' },
  SINGLE_DOUBLE: { option: 1, display: '分值翻倍(含奖励)' },
  CONTINUE_DOUBLE: { option: 2, display: '分值翻倍(不含奖励)' }
};

Component({
  properties: {
  },

  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置吃肉规则',
    isDisabled: false, // 新增：禁用状态

    // 直接使用固定的默认配置
    eating_range: DEFAULT_EATING_RANGE,
    eatRangeLabels: GOLF_SCORE_TYPES.LABELS,
    eatRangeKeys: GOLF_SCORE_TYPES.KEYS,

    meatValueOption: 0,

    // 新增可编辑变量
    meatScoreValue: 1, // 肉算x分中的x值, 默认1

    // 数字选择器范围 - 使用统一配置
    eatValueRange: Array.from({ length: 20 }, (_, i) => i + 1),
    meatScoreRange: [1, 2, 3, 4, 5], // 肉分值范围 1-5
  },
  // 组件生命周期
  lifetimes: {
    attached() {
      // 从store获取当前配置并初始化组件状态
      this.initializeFromStore();
      // 计算显示值
      this.updateDisplayValue();
      // 检查禁用状态
      this.checkDisabledState();

      // 监听顶洞规则变化
      this._storeReaction = reaction(
        () => G4PLasiStore.draw8421_config,
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
  // 属性变化监听
  observers: {
    'noKoufen': function (noKoufen) {
      // 当noKoufen变化时，更新显示值
      this.updateDisplayValue();
    }
  },
  methods: {
    // 检查禁用状态
    checkDisabledState() {
      const isDisabled = G4PLasiStore.draw8421_config === 'NoDraw';
      this.setData({ isDisabled });
      console.log('吃肉组件禁用状态:', isDisabled);
    },

    // 计算显示值
    updateDisplayValue() {
      const store = G4PLasiStore;
      const config = MEAT_VALUE_CONFIGS[store.meat_value_config_string];

      const displayValue = config?.display || '请配置吃肉规则';

      this.setData({ displayValue });
      console.log('吃肉规则显示值已更新:', displayValue);
    },

    // 从store初始化配置
    initializeFromStore() {
      // 直接访问store的属性
      const eating_range = G4PLasiStore.eating_range;
      const meatValue = G4PLasiStore.meat_value_config_string;

      const hasValidConfig = eating_range &&
        typeof eating_range === 'object' &&
        !Array.isArray(eating_range) &&
        Object.keys(eating_range).length > 0 &&
        eating_range.BetterThanBirdie !== 2; // 检查是否是旧的配置

      if (hasValidConfig && meatValue) {
        // 解析已保存的配置
        this.parseStoredConfig({
          eating_range,
          meatValue
        });
      } else {
        this.setData({ eating_range: DEFAULT_EATING_RANGE });

        // 保存默认配置到store
        G4PLasiStore.updateEatmeatRule(DEFAULT_EATING_RANGE, 'MEAT_AS_1', 10000000);
        console.log('使用默认吃肉配置:', DEFAULT_EATING_RANGE);
      }
    },
    // 解析存储的配置
    parseStoredConfig(config) {
      const { eating_range, meatValue } = config;
      console.log('从store加载吃肉配置:', config);

      // 解析吃肉数量配置
      if (eating_range && typeof eating_range === 'object' && !Array.isArray(eating_range)) {
        this.setData({ eating_range });
      }

      // 解析肉分值计算方式
      if (meatValue) {
        const config = MEAT_VALUE_CONFIGS[meatValue];
        if (config) {
          this.setData({
            meatValueOption: config.option,
            meatScoreValue: config.score || 1
          });
        }
      }
    },
    // 修改为适应新的JSON格式
    onEatValueChange(e) {
      const keyIndex = e.currentTarget.dataset.index;
      const value = this.data.eatValueRange[e.detail.value];
      const key = this.data.eatRangeKeys[keyIndex];
      const newEatingRange = { ...this.data.eating_range };
      newEatingRange[key] = value;
      this.setData({ eating_range: newEatingRange });
      console.log('更新吃肉配置:', key, value);
    },

    onMeatValueChange(e) {
      console.log('onMeatValueChange 💞💞💞💞💞💞💞💞💞💞💞💞💞', e);
      const index = Number.parseInt(e.currentTarget.dataset.index);
      this.setData({ meatValueOption: index });
    },

    // 新增：肉分值改变事件
    onMeatScoreChange(e) {
      const value = this.data.meatScoreRange[e.detail.value];
      this.setData({ meatScoreValue: value });
      console.log('更新肉分值:', value);
    },

    // 空操作，用于阻止事件冒泡
    noop() {
      // 什么都不做，只是阻止事件冒泡
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
      const eating_range = data.eating_range;

      // 根据选项生成配置字符串
      let meatValueConfig;
      if (data.meatValueOption === 0) {
        meatValueConfig = `MEAT_AS_${data.meatScoreValue}`;
      } else if (data.meatValueOption === 1) {
        meatValueConfig = 'SINGLE_DOUBLE';
      } else {
        meatValueConfig = 'CONTINUE_DOUBLE';
      }

      const meat_max_value = 10000000; // 不封顶

      // 更新store
      G4PLasiStore.updateEatmeatRule(eating_range, meatValueConfig, meat_max_value);

      // 更新显示值并关闭弹窗
      this.updateDisplayValue();
      this.setData({ visible: false });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        parsedData: { eating_range, meatValueConfig, meat_max_value }
      });
    }
  }
});