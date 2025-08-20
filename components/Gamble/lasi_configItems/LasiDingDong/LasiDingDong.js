/**
 * 拉丝顶洞配置组件 - 纯受控组件版本
 * 不维护内部状态，所有数据通过props传入，UI变化通过事件通知父组件
 */

Component({
  properties: {
    // 顶洞配置数据
    config: {
      type: Object,
      value: null
    },
    // 显示值（由Store计算）
    displayValue: {
      type: String,
      value: '请配置顶洞规则'
    },
    // 组件模式
    mode: {
      type: String,
      value: 'UserEdit' // 'UserEdit' | 'SysConfig' | 'view'
    }
  },

  data: {
    // UI状态
    visible: false,

    // 顶洞选项配置
    dingdongOptions: [
      { label: '得分打平', value: 'DrawEqual' },
      { label: '得分X分以内', value: 'Diff_X' },
      { label: '无顶洞', value: 'NoDraw' }
    ],

    // 分数选择器
    diffScores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

    // 当前选中状态（从config计算得出）
    selected: 0,
    selectedDiffScore: 1,

    // 防抖机制
    updateTimer: null
  },

  lifetimes: {
    attached() {
      console.log('🕳️ [LasiDingDong] 组件加载，props:', this.properties);
      this.updateSelectedState();
    }
  },

  observers: {
    'config': function (newConfig) {
      console.log('🔄 [LasiDingDong] observer触发，新config:', newConfig);
      console.log('🔄 [LasiDingDong] observer触发，新config.drawConfig:', newConfig?.drawConfig);
      this.updateSelectedState(newConfig);
    }
  },

  methods: {
    // 根据config更新选中状态
    updateSelectedState(configToUse = null) {
      const config = configToUse || this.properties.config;
      console.log('🔄 [LasiDingDong] updateSelectedState被调用，config:', config);

      if (!config) {
        console.log('⚠️ [LasiDingDong] config为空，跳过更新');
        return;
      }

      // 清除之前的定时器
      if (this.data.updateTimer) {
        clearTimeout(this.data.updateTimer);
      }

      // 设置防抖定时器
      this.data.updateTimer = setTimeout(() => {
        const selected = this.getCurrentSelectedIndex(config);
        const selectedDiffScore = this.getCurrentDiffScore(config);

        console.log('🔄 [LasiDingDong] 计算出的选中状态:', { selected, selectedDiffScore });

        this.setData({
          selected,
          selectedDiffScore
        }, () => {
          console.log('✅ [LasiDingDong] Radio选中状态已更新:', this.data.selected);
        });
      }, 100); // 100ms防抖
    },

    // === UI事件处理 ===

    // 显示配置弹窗
    onShowConfig() {
      this.setData({ visible: true });
    },

    // 取消配置
    onCancel() {
      this.setData({ visible: false });
    },

    // 确认配置
    onConfirm() {
      this.setData({ visible: false });
    },

    // === 配置项变更事件 ===

    // 顶洞方式选择
    onSelect(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      const config = this.buildConfigFromSelection(index);

      console.log('🕳️ [LasiDingDong] 选择顶洞方式:', config);
      this.triggerEvent('configChange', { config });
    },

    // 分数差选择
    onDiffScoreChange(e) {
      const selectedIndex = e.detail.value;
      const selectedScore = this.data.diffScores[selectedIndex];
      const config = this.buildConfigFromDiffScore(selectedScore);

      console.log('🕳️ [LasiDingDong] 选择分数差:', config);
      this.triggerEvent('configChange', { config });
    },


    // 根据选择索引构建配置
    buildConfigFromSelection(index) {
      const currentDiffScore = this.getCurrentDiffScore();

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

      return {
        drawConfig,
        drawOptions
      };
    },

    // 根据分数差构建配置
    buildConfigFromDiffScore(diffScore) {
      const { config } = this.properties;

      return {
        drawConfig: `Diff_${diffScore}`,
        drawOptions: { diffScore }
      };
    },

    // 获取当前选中的分数差
    getCurrentDiffScore(config) {
      const drawConfig = config?.drawConfig;
      if (drawConfig?.startsWith('Diff_')) {
        const score = Number.parseInt(drawConfig.replace('Diff_', ''));
        return Number.isNaN(score) ? 1 : score;
      }
      return 1;
    },

    // 获取当前选中的选项索引
    getCurrentSelectedIndex(config) {
      const { drawConfig } = config || {};

      if (drawConfig === 'DrawEqual') {
        console.log('🟡🟠🔴 [LasiDingDong] 当前选中选项索引: 0/DrawEqual');
        return 0;
      } else if (drawConfig?.startsWith('Diff_')) {
        console.log('🟡🟠🔴 [LasiDingDong] 当前选中选项索引: 1/Diff_X');
        return 1;
      } else if (drawConfig === 'NoDraw') {
        console.log('🟡🟠🔴 [LasiDingDong] 当前选中选项索引: 2/NoDraw');
        return 2;
      }
      return 0; // 默认选中第一个
    },

    // 同步Store数据（供父组件调用）
    syncWithStore(storeData) {
      console.log('🕳️ [LasiDingDong] 同步Store数据:', storeData);
      // 纯受控组件，不需要额外处理，数据通过properties更新
    },

    // 阻止事件冒泡的空方法
    noTap() {
      // 什么都不做，只是阻止事件冒泡
    }
  }
});