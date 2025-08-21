/**
 * 拉丝顶洞配置组件 - 简化版
 * 纯受控组件，所有数据通过props传入，UI变化通过事件通知父组件
 */

Component({
  properties: {
    config: {
      type: Object,
      value: null,
      observer: function(newVal) {
        console.log('🔍 [LasiDingDong] config properties更新:', newVal);
      }
    },
    displayValue: {
      type: String,
      value: '请配置顶洞规则'
    },
    mode: {
      type: String,
      value: 'UserEdit'
    }
  },

  data: {
    visible: false,
    diffScores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // 提供选项数组给picker
  },

  lifetimes: {
    attached() {
      console.log('🎬 [LasiDingDong] 组件初始化，当前config:', this.properties.config);
    }
  },

  methods: {
    // UI事件处理
    onShowConfig() {
      this.setData({ visible: true });
    },

    onCancel() {
      this.setData({ visible: false });
    },

    onConfirm() {
      this.setData({ visible: false });
    },

    // 防止事件冒泡的空方法
    noTap() {
      // 阻止事件冒泡，什么都不做
    },

    // 配置变更事件
    onSelect(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      const config = this.buildConfigFromSelection(index);
      this.triggerEvent('configChange', { config });
    },

    onDiffScoreChange(e) {
      const selectedIndex = e.detail.value;
      const selectedScore = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10][selectedIndex];
      const config = this.buildConfigFromDiffScore(selectedScore);
      this.triggerEvent('configChange', { config });
    },

    // 辅助方法
    buildConfigFromSelection(index) {
      const currentDiffScore = this.getCurrentDiffScore(this.properties.config);

      let drawConfig = 'DrawEqual';
      let drawOptions = {};

      if (index === 0) {
        drawConfig = 'DrawEqual';
      } else if (index === 1) {
        drawConfig = `Diff_${currentDiffScore}`;
        drawOptions = { diffScore: currentDiffScore };
      } else if (index === 2) {
        drawConfig = 'NoDraw';
      }

      return { drawConfig, drawOptions };
    },

    buildConfigFromDiffScore(diffScore) {
      return {
        drawConfig: `Diff_${diffScore}`,
        drawOptions: { diffScore }
      };
    },

    getCurrentDiffScore(config) {
      const drawConfig = config?.drawConfig;
      if (drawConfig?.startsWith('Diff_')) {
        const score = Number.parseInt(drawConfig.replace('Diff_', ''));
        return Number.isNaN(score) ? 1 : score;
      }
      return 1;
    }
  }
});