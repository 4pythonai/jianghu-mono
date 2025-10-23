/**
 * 拉丝顶洞配置组件 - 简化版
 * 纯受控组件，所有数据通过props传入，UI变化通过事件通知父组件
 */

Component({
  properties: {
    drawConfig: {
      type: String,
      value: 'DrawEqual',
      observer: function (newVal) {
        console.log('🔍 [LasiDingDong] drawConfig properties更新:', newVal);
      }
    },
    mode: {
      type: String,
      value: 'UserEdit'
    }
  },

  data: {
    visible: false,
    defaultDiffScore: 1, // 统一默认值管理
    diffScores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // 提供选项数组给picker
    displayValue: '请配置顶洞规则'
  },

  lifetimes: {
    attached() {

      console.log('🎬 [顶洞] 组件初始化 ❤️🧡💛💚❤️🧡💛💚 当前drawConfig:', this.properties.drawConfig);

      this.updateDisplayValue();
    }
  },

  observers: {
    'drawConfig': function (newDrawConfig) {
      console.log('🔍 [LasiDingDong] drawConfig变化:', newDrawConfig);
      this.updateDisplayValue();
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
      this.handleConfigChange(config);
    },

    onDiffScoreChange(e) {
      const selectedIndex = e.detail.value;
      const selectedScore = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10][selectedIndex];
      const config = this.buildConfigFromDiffScore(selectedScore);
      this.handleConfigChange(config);
    },

    // 统一的配置变更处理 - 组件内部处理具体逻辑
    handleConfigChange(config) {
      console.log('🕳️ [LasiDingDong] 顶洞配置变化:', config);

      // 提取drawConfig字符串值
      const drawConfigValue = typeof config === 'string' ? config : config.drawConfig;
      
      // 更新本地显示值
      const displayValue = this.computeDisplayValue(drawConfigValue);
      this.setData({ displayValue });

      // 触发通用的配置变更事件，只传递必要信息
      this.triggerEvent('configChange', {
        componentType: 'dingdong',
        config: { drawConfig: drawConfigValue }
      });
    },

    // 辅助方法
    buildConfigFromSelection(index) {
      const currentDiffScore = this.getCurrentDiffScore(this.properties.drawConfig);

      let drawConfig = 'DrawEqual';

      if (index === 0) {
        drawConfig = 'DrawEqual';
      } else if (index === 1) {
        drawConfig = `Diff_${currentDiffScore}`;
      } else if (index === 2) {
        drawConfig = 'NoDraw';
      }

      return { drawConfig };
    },

    buildConfigFromDiffScore(diffScore) {
      return {
        drawConfig: `Diff_${diffScore}`
      };
    },

    getCurrentDiffScore(drawConfig) {
      if (drawConfig?.startsWith('Diff_')) {
        const score = Number.parseInt(drawConfig.replace('Diff_', ''));
        return Number.isNaN(score) ? this.data.defaultDiffScore : score;
      }
      return this.data.defaultDiffScore;
    },

    // 计算显示值
    computeDisplayValue(drawConfig) {
      if (!drawConfig) return '请配置顶洞规则';

      switch (drawConfig) {
        case 'DrawEqual':
          return '得分打平';
        case 'NoDraw':
          return '无顶洞';
        default:
          // 处理 Diff_X 格式
          if (drawConfig?.startsWith('Diff_')) {
            const score = drawConfig.replace('Diff_', '');
            return `得分${score}分以内`;
          }
          return '请配置顶洞规则';
      }
    },

    // 更新显示值
    updateDisplayValue() {
      const drawConfig = this.properties.drawConfig;
      const displayValue = this.computeDisplayValue(drawConfig);
      this.setData({ displayValue });
    }
  }
});