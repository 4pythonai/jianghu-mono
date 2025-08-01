import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'
import { reaction } from 'mobx-miniprogram'

Component({
  properties: {
  },

  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置吃肉规则',
    isDisabled: false,

    // 直接使用固定的默认配置
    eating_range: {
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
      let displayValue = '';

      // 格式化吃肉规则显示
      let meatValueText = '';
      if (store.meat_value_config_string) {
        if (store.meat_value_config_string?.startsWith('MEAT_AS_')) {
          const score = store.meat_value_config_string.replace('MEAT_AS_', '');
          meatValueText = `肉算${score}分`;
        } else if (store.meat_value_config_string === 'DOUBLE_WITH_REWARD') {
          meatValueText = '分值翻倍(含奖励)';
        } else if (store.meat_value_config_string === 'DOUBLE_WITHOUT_REWARD') {
          meatValueText = '分值翻倍(不含奖励)';
        } else {
          meatValueText = store.meat_value_config_string;
        }
      }

      // 格式化封顶值 - 10000000表示不封顶
      let meatMaxText = '';
      if (store.meat_max_value === 10000000) {
        meatMaxText = '不封顶';
      } else if (typeof store.meat_max_value === 'number' && store.meat_max_value < 10000000) {
        meatMaxText = `${store.meat_max_value}分封顶`;
      }

      // 简化显示, 只显示主要的肉分值计算方式
      if (meatValueText && meatMaxText) {
        displayValue = `${meatValueText}/${meatMaxText}`;
      } else if (meatValueText) {
        displayValue = meatValueText;
      } else if (meatMaxText) {
        displayValue = meatMaxText;
      } else {
        displayValue = '请配置吃肉规则';
      }

      this.setData({
        displayValue: displayValue
      });

      console.log('吃肉规则显示值已更新:', displayValue);
    },

    // 从store初始化配置
    initializeFromStore() {
      // 直接访问store的属性
      const eating_range = G4PLasiStore.eating_range;
      const meatValue = G4PLasiStore.meat_value_config_string;
      const meat_max_value = G4PLasiStore.meat_max_value;

      // 检查store中是否有有效的配置
      const hasValidConfig = eating_range &&
        typeof eating_range === 'object' &&
        !Array.isArray(eating_range) &&
        Object.keys(eating_range).length > 0;

      if (hasValidConfig && meatValue) {
        // 解析已保存的配置
        this.parseStoredConfig({
          eating_range,
          meatValue,
          meat_max_value
        });
      } else {
        // 如果没有有效配置，使用默认值并保存到store
        const defaultEatingRange = {
          "BetterThanBirdie": 4,
          "Birdie": 2,
          "Par": 1,
          "WorseThanPar": 0
        };
        this.setData({ eating_range: defaultEatingRange });

        // 保存默认配置到store
        G4PLasiStore.updateEatmeatRule(defaultEatingRange, 'MEAT_AS_1', 10000000);
        console.log('使用默认吃肉配置:', defaultEatingRange);
      }
    },

    // 解析存储的配置
    parseStoredConfig(config) {
      const { eating_range, meatValue, meat_max_value } = config;
      console.log('从store加载吃肉配置:', config);

      // 解析吃肉数量配置
      if (eating_range && typeof eating_range === 'object' && !Array.isArray(eating_range)) {
        this.setData({ eating_range });
      }

      // 解析肉分值计算方式
      if (meatValue) {
        let meatValueOption = 0;
        if (meatValue?.startsWith('MEAT_AS_')) {
          meatValueOption = 0;
          // 解析肉分值
          const score = Number.parseInt(meatValue.replace('MEAT_AS_', ''));
          this.setData({ meatScoreValue: score || 1 });
        } else if (meatValue === 'DOUBLE_WITH_REWARD') {
          meatValueOption = 1;
        } else if (meatValue === 'DOUBLE_WITHOUT_REWARD') {
          meatValueOption = 2;
        }
        this.setData({ meatValueOption });
      }

      // 解析封顶配置 - 10000000表示不封顶
      if (meat_max_value === 10000000) {
        this.setData({ topSelected: 0 });
      } else if (typeof meat_max_value === 'number' && meat_max_value < 10000000) {
        this.setData({
          topSelected: 1,
          topScoreLimit: meat_max_value
        });
      }
    },

    // 吃肉数量改变事件
    onEatValueChange(e) {
      const keyIndex = e.currentTarget.dataset.index;
      const value = this.data.eatValueRange[e.detail.value];
      const key = this.data.eatRangeKeys[keyIndex];
      const newEatingRange = { ...this.data.eating_range };
      newEatingRange[key] = value;
      this.setData({ eating_range: newEatingRange });
      console.log('更新吃肉配置:', key, value);
    },

    // 肉分值计算方式改变事件
    onMeatValueChange(e) {
      console.log('onMeatValueChange 💞💞💞💞💞💞💞💞💞💞💞💞💞', e);
      const index = Number.parseInt(e.currentTarget.dataset.index);
      this.setData({ meatValueOption: index });
    },

    // 肉分值改变事件
    onMeatScoreChange(e) {
      const value = this.data.meatScoreRange[e.detail.value];
      this.setData({ meatScoreValue: value });
      console.log('更新肉分值:', value);
    },

    // 封顶选择事件
    onTopSelect(e) {
      console.log('🎯 onTopSelect 被调用了！', e);
      console.log('当前meatValueOption:', this.data.meatValueOption);
      console.log('点击的index:', e.currentTarget.dataset.index);

      // 如果肉分值选项不是"分值翻倍"，则不处理点击事件
      if (this.data.meatValueOption !== 1) {
        console.log('肉分值选项不是"分值翻倍"，忽略点击事件');
        wx.showToast({
          title: '请先选择"分值翻倍"',
          icon: 'none',
          duration: 1500
        });
        return;
      }
      console.log('设置topSelected为:', e.currentTarget.dataset.index);
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
      const eating_range = data.eating_range; // 吃肉得分配对, JSON格式

      // 肉分值计算方式
      let meatValueConfig = null;
      switch (data.meatValueOption) {
        case 0:
          meatValueConfig = `MEAT_AS_${data.meatScoreValue}`; // 动态生成MEAT_AS_X格式
          break;
        case 1:
          meatValueConfig = 'DOUBLE_WITH_REWARD';
          break;
        case 2:
          meatValueConfig = 'DOUBLE_WITHOUT_REWARD';
          break;
      }

      // 吃肉封顶改为数字格式, 10000000表示不封顶
      const meat_max_value = data.topSelected === 0 ? 10000000 : data.topScoreLimit;

      // 调用store的action更新数据
      G4PLasiStore.updateEatmeatRule(eating_range, meatValueConfig, meat_max_value);

      // 更新显示值
      this.updateDisplayValue();

      // 关闭弹窗
      this.setData({ visible: false });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        parsedData: { eating_range, meatValueConfig, meat_max_value }
      });
    }
  }
});