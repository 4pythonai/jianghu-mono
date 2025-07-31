import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'

Component({
  properties: {
    visible: Boolean,
    noKoufen: {
      type: Boolean,
      value: false
    }
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
    selected: 0,
    // 分数选择器相关
    diffScores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    selectedDiffScore: 1
  },
  attached() {
    // 组件初始化时, 根据store中的值设置选中状态
    this.syncSelectedFromStore();
    // 更新显示选项
    this.updateDisplayOptions();
  },

  methods: {
    syncSelectedFromStore() {
      const currentValue = G4P8421Store.draw8421_config;
      if (currentValue) {
        if (currentValue === 'DrawEqual') {
          this.setData({ selected: 0 });
        } else if (currentValue.startsWith('Diff_')) {
          // 解析分数值
          const score = parseInt(currentValue.replace('Diff_', ''));
          this.setData({
            selected: 1,
            selectedDiffScore: score || 1
          });
        } else if (currentValue === 'NoDraw') {
          this.setData({ selected: 2 });
        }
      }
    },

    updateDisplayOptions() {
      const score = this.data.selectedDiffScore;
      const newDisplayOptions = [...this.data.displayOptions];
      newDisplayOptions[1] = `得分${score}分以内`;
      this.setData({ displayOptions: newDisplayOptions });
    },

    onSelect(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({ selected: index });
    },

    // 分数选择器相关方法
    onDiffScoreChange(e) {
      const selectedIndex = e.detail.value;
      const selectedScore = this.data.diffScores[selectedIndex];
      this.setData({ selectedDiffScore: selectedScore });
      this.updateDisplayOptions();
      console.log('选择分数:', selectedScore);
    },


    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      let selectedValue = '';

      // 根据选择的选项生成配置值
      if (this.data.selected === 0) {
        selectedValue = 'DrawEqual';
      } else if (this.data.selected === 1) {
        selectedValue = `Diff_${this.data.selectedDiffScore}`;
      } else if (this.data.selected === 2) {
        selectedValue = 'NoDraw';
      }

      // 调用store的action更新数据
      G4P8421Store.updateDingdongRule(selectedValue);

      console.log('顶洞组件已更新store:', selectedValue);

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        value: selectedValue
      });
    }
  }
});