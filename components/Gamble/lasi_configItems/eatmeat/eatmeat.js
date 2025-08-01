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
  data: {
    visible: false,
    displayValue: '请配置吃肉规则',
    isDisabled: false,
    eating_range: DEFAULT_EATING_RANGE,
    eatRangeLabels: GOLF_SCORE_TYPES.LABELS,
    eatRangeKeys: GOLF_SCORE_TYPES.KEYS,
    meatValueOption: 0,
    meatScoreValue: 1,
    eatValueRange: Array.from({ length: 20 }, (_, i) => i + 1),
    meatScoreRange: [1, 2, 3, 4, 5],
  },
  lifetimes: {
    attached() {
      this.initializeFromStore();
      this.updateDisplayValue();
      this.checkDisabledState();

      this._storeReaction = reaction(
        () => G4PLasiStore.draw8421_config,
        () => {
          this.checkDisabledState();
        }
      );
    },

    detached() {
      if (this._storeReaction) {
        this._storeReaction();
      }
    }
  },
  methods: {
    checkDisabledState() {
      const isDisabled = G4PLasiStore.draw8421_config === 'NoDraw';
      this.setData({ isDisabled });
    },

    updateDisplayValue() {
      const store = G4PLasiStore;
      const config = MEAT_VALUE_CONFIGS[store.meat_value_config_string];
      const displayValue = config?.display || '请配置吃肉规则';
      this.setData({ displayValue });
    },

    initializeFromStore() {
      const eating_range = G4PLasiStore.eating_range;
      const meatValue = G4PLasiStore.meat_value_config_string;

      const hasValidConfig = eating_range &&
        typeof eating_range === 'object' &&
        !Array.isArray(eating_range) &&
        Object.keys(eating_range).length > 0 &&
        eating_range.BetterThanBirdie !== 2;

      if (hasValidConfig && meatValue) {
        this.parseStoredConfig({ eating_range, meatValue });
      } else {
        this.setData({ eating_range: DEFAULT_EATING_RANGE });
        G4PLasiStore.updateEatmeatRule(DEFAULT_EATING_RANGE, 'MEAT_AS_1', 10000000);
      }
    },
    parseStoredConfig(config) {
      const { eating_range, meatValue } = config;

      if (eating_range && typeof eating_range === 'object' && !Array.isArray(eating_range)) {
        this.setData({ eating_range });
      }

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
    onEatValueChange(e) {
      const keyIndex = e.currentTarget.dataset.index;
      const value = this.data.eatValueRange[e.detail.value];
      const key = this.data.eatRangeKeys[keyIndex];
      const newEatingRange = { ...this.data.eating_range };
      newEatingRange[key] = value;
      this.setData({ eating_range: newEatingRange });
    },

    onMeatValueChange(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      this.setData({ meatValueOption: index });
    },

    onMeatScoreChange(e) {
      const value = this.data.meatScoreRange[e.detail.value];
      this.setData({ meatScoreValue: value });
    },

    noop() {
      // 阻止事件冒泡
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
      const eating_range = data.eating_range;

      let meatValueConfig;
      if (data.meatValueOption === 0) {
        meatValueConfig = `MEAT_AS_${data.meatScoreValue}`;
      } else if (data.meatValueOption === 1) {
        meatValueConfig = 'SINGLE_DOUBLE';
      } else {
        meatValueConfig = 'CONTINUE_DOUBLE';
      }

      const meat_max_value = 10000000;

      G4PLasiStore.updateEatmeatRule(eating_range, meatValueConfig, meat_max_value);
      this.updateDisplayValue();
      this.setData({ visible: false });

      this.triggerEvent('confirm', {
        parsedData: { eating_range, meatValueConfig, meat_max_value }
      });
    }
  }
});