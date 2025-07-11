import { G_4P_8421_Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'

Component({
  properties: {
    value: String,
    visible: Boolean
  },
  data: {
    options: [
      'DrawEqual',
      'Diff_1',
      'NoDraw'
    ],
    displayOptions: [
      '得分打平',
      '得分1分以内',
      '无顶洞'
    ],
    selected: 0
  },
  attached() {
    // 组件初始化时，根据store中的值设置选中状态
    this.syncSelectedFromStore();
  },

  methods: {
    syncSelectedFromStore() {
      const currentValue = G_4P_8421_Store.draw8421Config;
      if (currentValue) {
        const index = this.data.options.findIndex(option => option === currentValue);
        if (index !== -1) {
          this.setData({ selected: index });
        }
      }
    },

    onSelect(e) {
      this.setData({ selected: e.currentTarget.dataset.index });
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      const selectedValue = this.data.options[this.data.selected];

      // 调用store的action更新数据
      G_4P_8421_Store.updateDingdongRule(selectedValue);

      console.log('顶洞组件已更新store:', selectedValue);

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        value: selectedValue,
        selectedIndex: this.data.selected
      });
    }
  }
});