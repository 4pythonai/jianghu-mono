import { G_4P_8421_Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'

Component({
  properties: {
    value: String,
    visible: Boolean
  },
  data: {
    groups: [
      {
        options: ['从帕+4开始扣分', '从双帕+0开始扣分', '不扣分'],
        selected: 0
      },
      {
        options: ['不封顶', '扣2分封顶'],
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
      const groups = this.data.groups;

      // 解析配置数据
      const fengding = groups[0].options[groups[0].selected]; // 封顶配置
      const start = groups[1].options[groups[1].selected]; // 扣分开始
      const punishment = groups[2].options[groups[2].selected]; // 同伴惩罚

      // 调用store的action更新数据
      G_4P_8421_Store.updateKoufenRule(fengding, start, punishment);

      console.log('扣分组件已更新store:', {
        fengding,
        start,
        punishment
      });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        value: groups,
        parsedData: { fengding, start, punishment }
      });
    }
  }
});