import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'
import { reaction } from 'mobx-miniprogram'

Component({
  properties: {
  },

  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置吃肉规则',
    isDisabled: false, // 新增：禁用状态

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
      // 从store获取当前配置并初始化组件状态
      this.initializeFromStore();
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
      const isDisabled = G4P8421Store.drawConfig === 'NoDraw';
      this.setData({ isDisabled });
      console.log('吃肉组件禁用状态:', isDisabled);
    },

    // 计算显示值
    updateDisplayValue() {
      const store = G4P8421Store;
      let displayValue = '';

      // 格式化吃肉规则显示 - 适配新格式
      let meatValueText = '';
      if (store.meatValueConfig) {
        if (store.meatValueConfig?.startsWith('MEAT_AS_')) {
          const score = store.meatValueConfig.replace('MEAT_AS_', '');
          meatValueText = `肉算${score}分`;
        } else if (store.meatValueConfig === 'SINGLE_DOUBLE') {
          meatValueText = '分值翻倍';
        } else if (store.meatValueConfig === 'CONTINUE_DOUBLE') {
          meatValueText = '分值连续翻倍';
        } else {
          meatValueText = store.meatValueConfig;
        }
      }

      // 格式化封顶值 - 适配新格式:数字, 10000000表示不封顶
      let meatMaxText = '';
      if (store.meatMaxValue === 10000000) {
        meatMaxText = '不封顶';
      } else if (typeof store.meatMaxValue === 'number' && store.meatMaxValue < 10000000) {
        meatMaxText = `${store.meatMaxValue}分封顶`;
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
      const eatingRange = G4P8421Store.eatingRange;
      const meatValue = G4P8421Store.meatValueConfig;
      const meatMaxValue = G4P8421Store.meatMaxValue;

      // 检查store中是否有有效的配置，并且不是旧的2,2,1,0配置
      const hasValidConfig = eatingRange &&
        typeof eatingRange === 'object' &&
        !Array.isArray(eatingRange) &&
        Object.keys(eatingRange).length > 0 &&
        eatingRange.BetterThanBirdie !== 2; // 检查是否是旧的配置

      if (hasValidConfig && meatValue) {
        // 解析已保存的配置
        this.parseStoredConfig({
          eatingRange,
          meatValue,
          meatMaxValue
        });
      } else {
        // 如果没有有效配置或检测到旧配置，使用默认值并保存到store
        const defaultEatingRange = {
          "BetterThanBirdie": 1,
          "Birdie": 1,
          "Par": 1,
          "WorseThanPar": 1
        };
        this.setData({ eatingRange: defaultEatingRange });

        // 保存默认配置到store
        G4P8421Store.updateEatmeatRule(defaultEatingRange, 'MEAT_AS_1', 10000000);
        console.log('使用默认吃肉配置:', defaultEatingRange);
      }
    },
    // 解析存储的配置
    parseStoredConfig(config) {
      const { eatingRange, meatValue, meatMaxValue } = config;
      console.log('从store加载吃肉配置:', config);

      // 解析吃肉数量配置 - 新格式:JSON对象
      if (eatingRange && typeof eatingRange === 'object' && !Array.isArray(eatingRange)) {
        this.setData({ eatingRange });
      }

      // 解析肉分值计算方式 - 新格式:MEAT_AS_X, SINGLE_DOUBLE, CONTINUE_DOUBLE
      if (meatValue) {
        let meatValueOption = 0;
        if (meatValue?.startsWith('MEAT_AS_')) {
          meatValueOption = 0;
          // 解析肉分值
          const score = Number.parseInt(meatValue.replace('MEAT_AS_', ''));
          this.setData({ meatScoreValue: score || 1 });
        } else if (meatValue === 'SINGLE_DOUBLE') {
          meatValueOption = 1;
        } else if (meatValue === 'CONTINUE_DOUBLE') {
          meatValueOption = 2;
        }
        this.setData({ meatValueOption });
      }

      // 解析封顶配置 - 新格式:数字, 10000000表示不封顶
      if (meatMaxValue === 10000000) {
        this.setData({ topSelected: 0 });
      } else if (typeof meatMaxValue === 'number' && meatMaxValue < 10000000) {
        this.setData({
          topSelected: 1,
          topScoreLimit: meatMaxValue
        });
      }
    },
    // 修改为适应新的JSON格式
    onEatValueChange(e) {
      const keyIndex = e.currentTarget.dataset.index;
      const value = this.data.eatValueRange[e.detail.value];
      const key = this.data.eatRangeKeys[keyIndex];
      const newEatingRange = { ...this.data.eatingRange };
      newEatingRange[key] = value;
      this.setData({ eatingRange: newEatingRange });
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

      // 解析配置数据 - 使用新的JSON格式
      const eatingRange = data.eatingRange; // 吃肉得分配对, JSON格式

      // 肉分值计算方式改为新格式
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
      }

      // 吃肉封顶改为数字格式, 10000000表示不封顶
      const meatMaxValue = data.topSelected === 0 ? 10000000 : data.topScoreLimit;

      // 调用store的action更新数据
      G4P8421Store.updateEatmeatRule(eatingRange, meatValueConfig, meatMaxValue);

      // 更新显示值
      this.updateDisplayValue();

      // 关闭弹窗
      this.setData({ visible: false });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        parsedData: { eatingRange, meatValueConfig, meatMaxValue }
      });
    }
  }
});