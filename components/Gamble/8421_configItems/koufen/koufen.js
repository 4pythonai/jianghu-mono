import { G_4P_8421_Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'

Component({
  properties: {
    value: String,
    visible: Boolean
  },
  data: {
    // 扣分开始条件 (sub8421_config_string)
    Sub8421ConfigString: ['从帕+4开始扣分', '从双帕+0开始扣分', '不扣分'],
    selectedStart: 0,

    // 扣分封顶 (max8421_sub_value)
    maxOptions: ['不封顶', '扣2分封顶'],
    selectedMax: 0,

    // 同伴惩罚 (duty_config)
    dutyOptions: ['不包负分', '同伴顶头包负分', '包负分'],
    selectedDuty: 0
  },
  methods: {
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
    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      const { Sub8421ConfigString, selectedStart, maxOptions, selectedMax, dutyOptions, selectedDuty } = this.data;

      // 解析配置数据
      const start = Sub8421ConfigString[selectedStart]; // 扣分开始  
      const meatMaxValue = maxOptions[selectedMax]; // 封顶配置
      const punishment = dutyOptions[selectedDuty]; // 同伴惩罚

      // 调用store的action更新数据
      G_4P_8421_Store.updateKoufenRule(meatMaxValue, start, punishment);

      console.log('扣分组件已更新store:', {
        meatMaxValue,
        start,
        punishment
      });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        value: {
          Sub8421ConfigString,
          selectedStart,
          maxOptions,
          selectedMax,
          dutyOptions,
          selectedDuty
        },
        parsedData: { meatMaxValue, start, punishment }
      });
    }
  }
});