import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'
import { GOLF_SCORE_TYPES, EATMEAT_CONFIG, GameConstantsUtils } from '../../../../utils/gameConstants.js'

Component({
  properties: {
    noKoufen: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置吃肉规则',

    // 使用统一的常量配置
    eating_range: GameConstantsUtils.getDefaultEatingRange(),
    eatRangeLabels: GOLF_SCORE_TYPES.LABELS,
    eatRangeKeys: GOLF_SCORE_TYPES.KEYS,

    meatValueOption: 0,
    topOptions: ["不封顶", "X分封顶"],
    topSelected: 0,

    // 新增可编辑变量
    topScoreLimit: 3, // 封顶分数, 默认3

    // 数字选择器范围 - 使用统一配置
    eatValueRange: EATMEAT_CONFIG.RANGES.EAT_VALUE,
    topScoreRange: EATMEAT_CONFIG.RANGES.TOP_SCORE,
  },
  // 组件生命周期
  lifetimes: {
    attached() {
      // 从store获取当前配置并初始化组件状态
      this.initializeFromStore();
      // 计算显示值
      this.updateDisplayValue();
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
    // 计算显示值
    updateDisplayValue() {
      const store = G4P8421Store;
      let displayValue = '';

      // 格式化吃肉规则显示 - 适配新格式
      let meatValueText = '';
      if (store.meat_value_config_string) {
        if (store.meat_value_config_string?.startsWith('MEAT_AS_')) {
          meatValueText = '肉算1分';
        } else if (store.meat_value_config_string === 'SINGLE_DOUBLE') {
          meatValueText = '分值翻倍';
        } else if (store.meat_value_config_string === 'CONTINUE_DOUBLE') {
          meatValueText = '分值连续翻倍';
        } else {
          meatValueText = store.meat_value_config_string;
        }
      }

      // 格式化封顶值 - 适配新格式:数字, 10000000表示不封顶
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
      const eating_range = G4P8421Store.eating_range;
      const meatValue = G4P8421Store.meat_value_config_string;
      const meat_max_value = G4P8421Store.meat_max_value;

      if (eating_range || meatValue || meat_max_value !== 10000000) {
        // 解析已保存的配置
        this.parseStoredConfig({
          eating_range,
          meatValue,
          meat_max_value
        });
      }
    },
    // 解析存储的配置
    parseStoredConfig(config) {
      const { eating_range, meatValue, meat_max_value } = config;
      console.log('从store加载吃肉配置:', config);

      // 解析吃肉数量配置 - 新格式:JSON对象
      if (eating_range && typeof eating_range === 'object' && !Array.isArray(eating_range)) {
        this.setData({ eating_range });
      }

      // 解析肉分值计算方式 - 新格式:MEAT_AS_X, SINGLE_DOUBLE, CONTINUE_DOUBLE
      if (meatValue) {
        let meatValueOption = 0;
        if (meatValue?.startsWith('MEAT_AS_')) {
          meatValueOption = 0;
        } else if (meatValue === 'SINGLE_DOUBLE') {
          meatValueOption = 1;
        } else if (meatValue === 'CONTINUE_DOUBLE') {
          meatValueOption = 2;
        }
        this.setData({ meatValueOption });
      }

      // 解析封顶配置 - 新格式:数字, 10000000表示不封顶
      if (meat_max_value === 10000000) {
        this.setData({ topSelected: 0 });
      } else if (typeof meat_max_value === 'number' && meat_max_value < 10000000) {
        this.setData({
          topSelected: 1,
          topScoreLimit: meat_max_value
        });
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
      const index = Number.parseInt(e.currentTarget.dataset.index);
      this.setData({ meatValueOption: index });
    },

    onTopSelect(e) {
      this.setData({ topSelected: e.currentTarget.dataset.index });
    },
    // 封顶分数改变

    onTopScoreChange(e) {
      const value = this.data.topScoreRange[e.detail.value];
      this.setData({ topScoreLimit: value });
    },

    onShowConfig() {
      if (this.data.noKoufen || G4P8421Store.draw8421_config === 'NoDraw') return; // 如果禁用则不显示
      this.setData({ visible: true });
      // 每次显示时重新加载配置
      this.initializeFromStore();
    },

    onCancel() {
      this.setData({ visible: false });
      this.triggerEvent('cancel');
    },

    onConfirm() {
      const data = this.data;

      // 解析配置数据 - 使用新的JSON格式
      const eating_range = data.eating_range; // 吃肉得分配对, JSON格式

      // 肉分值计算方式改为新格式
      let meatValueConfig = null;
      switch (data.meatValueOption) {
        case 0:
          meatValueConfig = 'MEAT_AS_1'; // 固定为MEAT_AS_1, 如需要其他数值可以再扩展
          break;
        case 1:
          meatValueConfig = 'SINGLE_DOUBLE';
          break;
        case 2:
          meatValueConfig = 'CONTINUE_DOUBLE';
          break;
      }

      // 吃肉封顶改为数字格式, 10000000表示不封顶
      const meat_max_value = data.topSelected === 0 ? 10000000 : data.topScoreLimit;

      // 调用store的action更新数据
      G4P8421Store.updateEatmeatRule(eating_range, meatValueConfig, meat_max_value);

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