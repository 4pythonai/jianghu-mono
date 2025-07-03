Component({
  properties: {
    value: String,
    visible: Boolean
  },
  data: {
    groups: [
      {
        options: ['不封顶', '扣2分封顶'],
        selected: 0
      },
      {
        options: ['从帕+4开始扣分', '从双帕+0开始扣分', '不扣分'],
        selected: 0
      },
      {
        options: ['不包负分', '同伴顶头包负分', '包负分'],
        selected: 0
      }
    ]
  },
  methods: {
    onSelectGroup(e) {
      const groupIdx = e.currentTarget.dataset.group;
      const optIdx = e.currentTarget.dataset.index;
      const key = `groups[${groupIdx}].selected`;
      this.setData({ [key]: optIdx });
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      this.triggerEvent('confirm', { value: this.data.groups });
    }
  }
});