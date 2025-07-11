import { G_4P_8421_Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'

Component({
  properties: {
    value: Object,
    visible: Boolean
  },
  data: {
    eatList: [
      { label: '帕以上', value: 1 },
      { label: '帕', value: 1 },
      { label: '鸟', value: 1 },
      { label: '鸟以下', value: 1 }
    ],
    meatValueOptions: [
      '肉算1分', '分值翻倍', '分值连续翻倍'
    ],
    scoreSelected: 0,
    topOptions: ['不封顶', '3分封顶'],
    topSelected: 0
  },
  methods: {
    onEatInput(e) {
      const idx = e.currentTarget.dataset.index;
      const val = e.detail.value.replace(/\D/g, '');
      const key = `eatList[${idx}].value`;
      this.setData({ [key]: val });
    },
    onScoreSelect(e) {
      this.setData({ scoreSelected: e.currentTarget.dataset.index });
    },
    onTopSelect(e) {
      this.setData({ topSelected: e.currentTarget.dataset.index });
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      const data = this.data;

      // 解析配置数据
      const eatingRange = data.eatList; // 吃肉得分配对
      const meatValueConfigString = data.meatValueOptions[data.scoreSelected]; // 肉分值计算方式
      const meatMaxValue = data.topOptions[data.topSelected]; // 吃肉封顶

      // 调用store的action更新数据
      G_4P_8421_Store.updateEatmeatRule(eatingRange, meatValueConfigString, meatMaxValue);

      console.log('吃肉组件已更新store:', {
        eatingRange,
        meatValueConfigString,
        meatMaxValue
      });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        value: data,
        parsedData: { eatingRange, meatValueConfigString, meatMaxValue }
      });
    }
  }
});