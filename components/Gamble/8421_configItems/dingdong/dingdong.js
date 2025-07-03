Component({
  properties: {
    value: String,
    visible: Boolean
  },
  data: {
    options: [
      '得分打平',
      '得分1分以内',
      '无顶洞'
    ],
    selected: 0
  },
  methods: {
    onSelect(e) {
      this.setData({ selected: e.currentTarget.dataset.index });
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      this.triggerEvent('confirm', { value: this.data.options[this.data.selected] });
    }
  }
});