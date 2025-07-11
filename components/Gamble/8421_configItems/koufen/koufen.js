import { G_4P_8421_Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'

Component({
  properties: {
    value: String,
    visible: Boolean
  },
  data: {
    // 扣分开始条件 (sub8421_config_string)
    Sub8421ConfigString: ['从帕+X开始扣分', '从双帕+Y开始扣分', '不扣分'],
    selectedStart: 0,

    // 可编辑的数字变量
    paScore: 4, // 帕的分数，默认4
    doubleParScore: 0, // 双帕的分数，默认0
    maxSubScore: 2, // 封顶分数，默认2

    // 数字选择器范围
    paScoreRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    doubleParScoreRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    maxSubScoreRange: Array.from({ length: 21 }, (_, i) => i + 1), // 1-21

    // 扣分封顶 (max8421_sub_value)
    maxOptions: ['不封顶', '扣X分封顶'],
    selectedMax: 0,

    // 同伴惩罚 (duty_config)
    dutyOptions: ['不包负分', '同伴顶头包负分', '包负分'],
    selectedDuty: 0
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
      const storeData = G_4P_8421_Store.getKoufenRule();
      if (storeData) {
        // 解析已保存的配置
        this.parseStoredConfig(storeData);
      }
    },
    // 解析存储的配置
    parseStoredConfig(config) {
      // 这里可以根据实际的store数据结构来解析
      // 暂时保持默认值，实际使用时需要根据store的数据结构来修改
      console.log('从store加载配置:', config);
    },
    onSelectStart(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({ selectedStart: index });
    },
    onSelectMax(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({ selectedMax: index });
    },
    onSelectDuty(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({ selectedDuty: index });
    },
    // 帕分数改变
    onPaScoreChange(e) {
      const value = this.data.paScoreRange[e.detail.value];
      this.setData({ paScore: value });
    },
    // 双帕分数改变
    onDoubleParScoreChange(e) {
      const value = this.data.doubleParScoreRange[e.detail.value];
      this.setData({ doubleParScore: value });
    },
    // 封顶分数改变
    onMaxSubScoreChange(e) {
      const value = this.data.maxSubScoreRange[e.detail.value];
      this.setData({ maxSubScore: value });
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      const { Sub8421ConfigString, selectedStart, maxOptions, selectedMax, dutyOptions, selectedDuty, paScore, doubleParScore, maxSubScore } = this.data;

      // 构建动态文本
      const dynamicStartTexts = [
        `从帕+${paScore}开始扣分`,
        `从双帕+${doubleParScore}开始扣分`,
        '不扣分'
      ];

      const dynamicMaxTexts = [
        '不封顶',
        `扣${maxSubScore}分封顶`
      ];

      // 解析配置数据
      const start = dynamicStartTexts[selectedStart]; // 扣分开始  
      const meatMaxValue = dynamicMaxTexts[selectedMax]; // 封顶配置
      const punishment = dutyOptions[selectedDuty]; // 同伴惩罚

      // 调用store的action更新数据
      G_4P_8421_Store.updateKoufenRule(meatMaxValue, start, punishment);

      console.log('扣分组件已更新store:', {
        meatMaxValue,
        start,
        punishment,
        customValues: { paScore, doubleParScore, maxSubScore }
      });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        value: {
          Sub8421ConfigString,
          selectedStart,
          maxOptions,
          selectedMax,
          dutyOptions,
          selectedDuty,
          paScore,
          doubleParScore,
          maxSubScore
        },
        parsedData: { meatMaxValue, start, punishment }
      });
    }
  }
});