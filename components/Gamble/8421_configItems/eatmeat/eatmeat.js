import { G_4P_8421_Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'

Component({
  properties: {
    value: Object,
    visible: Boolean
  },
  data: {
    // 新的JSON格式数据
    eating_range: {
      "BetterThanBirdie": 1,
      "Birdie": 1,
      "Par": 1,
      "WorseThanPar": 1
    },
    // 键到中文标签的映射
    eatRangeLabels: {
      "BetterThanBirdie": "帕以上",
      "Birdie": "鸟",
      "Par": "帕",
      "WorseThanPar": "鸟以下"
    },
    // 用于渲染的键数组
    eatRangeKeys: ["BetterThanBirdie", "Birdie", "Par", "WorseThanPar"],

    meatValueOptions: [
      '肉算1分', '分值翻倍', '分值连续翻倍'
    ],
    scoreSelected: 0,

    // 修改封顶选项, 支持可编辑数字
    topOptions: ['不封顶', 'X分封顶'],
    topSelected: 0,

    // 新增可编辑变量
    topScoreLimit: 3, // 封顶分数, 默认3

    // 数字选择器范围
    eatValueRange: Array.from({ length: 20 }, (_, i) => i + 1), // 1-20, 吃肉数量范围
    topScoreRange: Array.from({ length: 20 }, (_, i) => i + 1), // 1-20, 封顶分数范围
  },
  // 组件生命周期
  lifetimes: {
    attached() {
      // 从store获取当前配置并初始化组件状态
      this.initializeFromStore();
    }
  },
  // 属性变化监听
  observers: {
    'visible': function (newVal) {
      if (newVal) {
        // 每次显示时重新加载配置
        this.initializeFromStore();
      }
    }
  },
  methods: {
    // 从store初始化配置
    initializeFromStore() {
      // 直接访问store的属性
      const eating_range = G_4P_8421_Store.eating_range;
      const meatValue = G_4P_8421_Store.meat_value_config_string;
      const meat_max_value = G_4P_8421_Store.meat_max_value;

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
        let scoreSelected = 0;
        if (meatValue?.startsWith('MEAT_AS_')) {
          scoreSelected = 0;
        } else if (meatValue === 'SINGLE_DOUBLE') {
          scoreSelected = 1;
        } else if (meatValue === 'CONTINUE_DOUBLE') {
          scoreSelected = 2;
        }
        this.setData({ scoreSelected });
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
    onScoreSelect(e) {
      this.setData({ scoreSelected: e.currentTarget.dataset.index });
    },
    onTopSelect(e) {
      this.setData({ topSelected: e.currentTarget.dataset.index });
    },
    // 封顶分数改变
    onTopScoreChange(e) {
      const value = this.data.topScoreRange[e.detail.value];
      this.setData({ topScoreLimit: value });
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      const data = this.data;

      // 解析配置数据 - 使用新的JSON格式
      const eating_range = data.eating_range; // 吃肉得分配对, JSON格式

      // 肉分值计算方式改为新格式
      let meatValueConfig = null;
      switch (data.scoreSelected) {
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
      G_4P_8421_Store.updateEatmeatRule(eating_range, meatValueConfig, meat_max_value);

      console.log('吃肉组件已更新store:', {
        eating_range,
        meatValueConfig,
        meat_max_value,
        customValues: { topScoreLimit: data.topScoreLimit }
      });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        value: {
          ...data,
          topScoreLimit: data.topScoreLimit
        },
        parsedData: { eating_range, meatValueConfig, meat_max_value }
      });
    }
  }
});