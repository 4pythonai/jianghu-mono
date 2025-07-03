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
    scoreOptions: [
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
      this.triggerEvent('confirm', { value: this.data });
    }
  }
});