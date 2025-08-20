/**
 * 拉丝顶洞配置组件 - 重构版
 * 纯展示组件，所有数据由父组件通过props传入
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
    
    // 当前编辑中的配置
    editingConfig: {
      mode: 'DrawEqual',
      diffScore: 1
    },
    
    // UI选择状态
    selected: 0,           // 顶洞方式选择
    selectedDiffScore: 1   // 分数差选择
  },

  lifetimes: {
    attached() {
      console.log('🕳️ [LasiDingDong] 组件加载，props:', {
        config: this.properties.config,
        displayValue: this.properties.displayValue,
        mode: this.properties.mode
      });
    }
  },

  observers: {
    'config': function(newConfig) {
      console.log('🕳️ [LasiDingDong] observer触发, newConfig:', newConfig);
      if (newConfig) {
        console.log('🕳️ [LasiDingDong] 配置更新:', newConfig);
        this.updateEditingConfig(newConfig);
      } else {
        console.log('🕳️ [LasiDingDong] 配置为空，使用默认值');
        this.setData({
          selected: 0,
          selectedDiffScore: 1
        });
      }
    }
  },

  methods: {
    // 根据传入的config更新编辑状态
    updateEditingConfig(config) {
      const { mode } = config;
      
      let selected = 0;
      let selectedDiffScore = 1;
      
      if (mode === 'DrawEqual') {
        selected = 0;
      } else if (mode?.startsWith('Diff_')) {
        selected = 1;
        const score = Number.parseInt(mode.replace('Diff_', ''));
        selectedDiffScore = Number.isNaN(score) ? 1 : score;
      } else if (mode === 'NoDraw') {
        selected = 2;
      }
      
      this.setData({
        editingConfig: {
          mode: mode || 'DrawEqual',
          diffScore: selectedDiffScore
        },
        selected,
        selectedDiffScore
      });
    },

    // === UI事件处理 ===
    
    // 显示配置弹窗
    onShowConfig() {
      // 打开弹窗前同步当前配置
      if (this.properties.config) {
        this.updateEditingConfig(this.properties.config);
      }
      
      this.setData({ visible: true });
    },

    // 取消配置
    onCancel() {
      this.setData({ visible: false });
    },

    // 确认配置
    onConfirm() {
      const config = this.buildConfigFromUI();
      
      console.log('🕳️ [LasiDingDong] 确认配置:', config);
      
      // 触发事件通知父组件
      this.triggerEvent('configChange', { config });
      
      this.setData({ visible: false });
    },

    // === 配置项变更事件 ===
    
    // 顶洞方式选择
    onSelect(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      this.setData({ selected: index });
      
      // 立即同步到store（选择即保存）
      const config = this.buildConfigFromUI();
      console.log('🕳️ [LasiDingDong] 选择即保存配置:', config);
      this.triggerEvent('configChange', { config });
    },

    // 分数差选择
    onDiffScoreChange(e) {
      const selectedIndex = e.detail.value;
      const selectedScore = this.data.diffScores[selectedIndex];
      this.setData({ selectedDiffScore: selectedScore });
      
      // 立即同步到store（选择即保存）
      const config = this.buildConfigFromUI();
      console.log('🕳️ [LasiDingDong] 分数选择即保存配置:', config);
      this.triggerEvent('configChange', { config });
    },

    // === 辅助方法 ===
    
    // 从UI状态构建配置对象
    buildConfigFromUI() {
      const { selected, selectedDiffScore } = this.data;
      
      let mode = 'DrawEqual';
      let drawOptions = {};
      
      if (selected === 0) {
        mode = 'DrawEqual';
      } else if (selected === 1) {
        mode = `Diff_${selectedDiffScore}`;
        drawOptions = { diffScore: selectedDiffScore };
      } else if (selected === 2) {
        mode = 'NoDraw';
      }
      
      return {
        mode,
        drawOptions
      };
    },

    // 同步Store数据（供父组件调用）
    syncWithStore(storeData) {
      console.log('🕳️ [LasiDingDong] 同步Store数据:', storeData);
      
      if (storeData?.config?.dingdongConfig) {
        // 通过properties更新，会触发observer
        // 这里只是记录日志，实际更新通过父组件传props
      }
    },

    // 阻止事件冒泡的空方法
    noTap() {
      // 什么都不做，只是阻止事件冒泡
    }
  }
});