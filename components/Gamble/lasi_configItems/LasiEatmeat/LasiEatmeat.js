/**
 * 拉丝吃肉配置组件 - 重构版
 * 纯展示组件，所有数据由父组件通过props传入
 */

Component({
  properties: {
    // 吃肉配置数据
    config: {
      type: Object,
      value: null
    },
    // 显示值（由Store计算）
    displayValue: {
      type: String,
      value: '请配置吃肉规则'
    },
    // 组件模式
    mode: {
      type: String,
      value: 'UserEdit' // 'UserEdit' | 'SysConfig' | 'view'
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // UI状态
    visible: false,

    // 吃肉选项的静态配置
    eatRangeLabels: {
      'BetterThanBirdie': '比鸟更好',
      'Birdie': '鸟',
      'Par': '帕',
      'WorseThanPar': '比帕更差'
    },
    eatRangeKeys: ['BetterThanBirdie', 'Birdie', 'Par', 'WorseThanPar'],

    // 选项范围
    eatValueRange: Array.from({ length: 20 }, (_, i) => i + 1),
    meatScoreRange: [1, 2, 3, 4, 5],
    topScoreRange: Array.from({ length: 20 }, (_, i) => i + 1),

    // 肉分值计算选项
    meatValueOptions: [
      { label: '肉算固定分', value: 'MEAT_AS_X' },
      { label: '分值翻倍', value: 'SINGLE_DOUBLE' },
      { label: '分值连续翻倍', value: 'CONTINUE_DOUBLE' },
      { label: '分值翻倍(含奖励)', value: 'DOUBLE_WITH_REWARD' },
      { label: '分值翻倍(不含奖励)', value: 'DOUBLE_WITHOUT_REWARD' }
    ],

    // 封顶选项
    topOptions: ["不封顶", "X分封顶"],

    // 当前编辑中的配置（仅在弹窗打开时使用）
    editingConfig: {
      eatingRange: {
        "BetterThanBirdie": 4,
        "Birdie": 2,
        "Par": 1,
        "WorseThanPar": 0
      },
      meatValueConfig: 'DOUBLE_WITHOUT_REWARD',
      meatMaxValue: 10000000
    },

    // UI选择状态
    meatValueOption: 4,      // 肉分值计算方式选择索引
    meatScoreValue: 1,       // 肉固定分值
    topSelected: 0,          // 封顶选择
    topScoreLimit: 3         // 封顶分值
  },

  lifetimes: {
    attached() {
      console.log(' 🟢🟡🟠🔴 this.properties   组件加载，🟢🟡🟠🔴 props:', this.properties);
    }
  },

  observers: {
    'config': function (newConfig) {
      if (newConfig) {
        console.log('🎯 [LasiEatmeat] 配置更新:', newConfig);
        this.updateEditingConfig(newConfig);
      }
    }
  },

  methods: {
    // 根据传入的config更新编辑状态
    updateEditingConfig(config) {
      const { eatingRange, meatValueConfig, meatMaxValue } = config;

      // 解析肉分值计算方式
      let meatValueOption = 4;  // 默认'DOUBLE_WITHOUT_REWARD'
      let meatScoreValue = 1;

      if (meatValueConfig?.startsWith('MEAT_AS_')) {
        meatValueOption = 0;
        const score = Number.parseInt(meatValueConfig.replace('MEAT_AS_', ''));
        meatScoreValue = Number.isNaN(score) ? 1 : score;
      } else {
        switch (meatValueConfig) {
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
      const topSelected = (meatMaxValue === 10000000) ? 0 : 1;
      const topScoreLimit = (meatMaxValue === 10000000) ? 3 : meatMaxValue;

      this.setData({
        editingConfig: {
          eatingRange: eatingRange || this.data.editingConfig.eatingRange,
          meatValueConfig: meatValueConfig || 'DOUBLE_WITHOUT_REWARD',
          meatMaxValue: meatMaxValue || 10000000
        },
        meatValueOption,
        meatScoreValue,
        topSelected,
        topScoreLimit
      });
    },

    // === UI事件处理 ===

    // 显示配置弹窗
    onShowConfig() {
      if (this.properties.disabled) {
        wx.showToast({
          title: '当前规则下吃肉功能已禁用',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      // 打开弹窗前同步当前配置
      if (this.properties.config) {
        this.updateEditingConfig(this.properties.config);
      }

      this.setData({ visible: true });
    },

    // 取消配置
    onCancel() {
      this.setData({ visible: false });
    },

    // 确认配置
    onConfirm() {
      const config = this.buildConfigFromUI();

      console.log('🎯 [LasiEatmeat] 确认配置:', config);

      // 触发事件通知父组件
      this.triggerEvent('configChange', { config });

      this.setData({ visible: false });
    },

    // === 配置项变更事件 ===

    // 吃肉数量改变
    onEatValueChange(e) {
      const keyIndex = e.currentTarget.dataset.index;
      const value = this.data.eatValueRange[e.detail.value];
      const key = this.data.eatRangeKeys[keyIndex];

      const newEatingRange = { ...this.data.editingConfig.eatingRange };
      newEatingRange[key] = value;

      this.setData({
        'editingConfig.eatingRange': newEatingRange
      });
    },

    // 肉分值计算方式改变
    onMeatValueChange(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      this.setData({ meatValueOption: index });
    },

    // 肉固定分值改变
    onMeatScoreChange(e) {
      const value = this.data.meatScoreRange[e.detail.value];
      this.setData({ meatScoreValue: value });
    },

    // 封顶选择改变
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

    // 封顶分值改变
    onTopScoreChange(e) {
      const value = this.data.topScoreRange[e.detail.value];
      this.setData({ topScoreLimit: value });
    },

    // === 辅助方法 ===

    // 从UI状态构建配置对象
    buildConfigFromUI() {
      const { meatValueOption, meatScoreValue, topSelected, topScoreLimit, editingConfig } = this.data;

      // 构建肉分值配置
      let meatValueConfig = 'DOUBLE_WITHOUT_REWARD';
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
        case 3:
          meatValueConfig = 'DOUBLE_WITH_REWARD';
          break;
        case 4:
          meatValueConfig = 'DOUBLE_WITHOUT_REWARD';
          break;
      }

      // 构建封顶配置
      const meatMaxValue = (meatValueOption === 1 && topSelected === 1) ? topScoreLimit : 10000000;

      return {
        eatingRange: editingConfig.eatingRange,
        meatValueConfig,
        meatMaxValue
      };
    },

    // 同步Store数据（供父组件调用）
    syncWithStore(storeData) {
      console.log('🎯 [LasiEatmeat] 同步Store数据:', storeData);

      if (storeData?.config?.eatmeatConfig) {
        // 通过properties更新，会触发observer
        // 这里只是记录日志，实际更新通过父组件传props
      }
    }
  }
});