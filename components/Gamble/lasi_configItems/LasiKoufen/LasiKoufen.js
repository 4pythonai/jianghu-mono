/**
 * 拉丝包洞配置组件 - 重构版
 * 纯展示组件，所有数据由父组件通过props传入
 */

Component({
  properties: {
    // 包洞配置数据
    config: {
      type: Object,
      value: null
    },
    // 显示值（由Store计算）
    displayValue: {
      type: String,
      value: '请配置包洞规则'
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
    
    // 包洞规则选项
    dutyOptions: [
      { label: '不包洞', value: 'NODUTY' },
      { label: '帕+X包洞', value: 'PAR_PLUS_X' },
      { label: '双帕+X包洞', value: 'DOUBLE_PAR_PLUS_X' },
      { label: '杆差X包洞', value: 'SCORE_DIFF_X' }
    ],
    
    // 队友责任条件选项
    partnerDutyOptions: [
      { label: '同伴顶头包洞', value: 'DUTY_DINGTOU' },
      { label: '与同伴成绩无关', value: 'PARTNET_IGNORE' }
    ],
    
    // 数值选择范围
    parPlusRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    doubleParPlusRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    scoreDiffRange: Array.from({ length: 21 }, (_, i) => i + 1), // 1-21
    maxLostRange: [1000, 2000, 3000, 5000, 10000, 10000000], // 包含"不封顶"(10000000)
    
    // 当前编辑中的配置
    editingConfig: {
      dutyConfig: 'NODUTY',
      partnerDutyCondition: 'DUTY_DINGTOU',
      badScoreBaseLine: 'Par+4',
      badScoreMaxLost: 10000000,
      // 辅助数值
      parPlusValue: 4,
      doubleParPlusValue: 1,
      scoreDiffValue: 3
    },
    
    // UI选择状态
    selectedDutyType: 0,           // 包洞规则类型选择
    selectedPartnerCondition: 0,   // 队友责任条件选择
    parPlusValue: 4,               // 帕+X的X值
    doubleParPlusValue: 1,         // 双帕+X的X值  
    scoreDiffValue: 3,             // 杆差X的X值
    maxLostValue: 10000000         // 最大损失
  },

  lifetimes: {
    attached() {
      console.log('🏳️ [LasiKoufen] 组件加载，props:', {
        config: this.properties.config,
        displayValue: this.properties.displayValue,
        mode: this.properties.mode
      });
    }
  },

  observers: {
    'config': function(newConfig) {
      console.log('🏳️ [LasiKoufen] observer触发, newConfig:', newConfig);
      if (newConfig) {
        console.log('🏳️ [LasiKoufen] 配置更新:', newConfig);
        this.updateEditingConfig(newConfig);
      } else {
        console.log('🏳️ [LasiKoufen] 配置为空，使用默认值');
        this.setDefaultValues();
      }
    }
  },

  methods: {
    // 设置默认值
    setDefaultValues() {
      this.setData({
        selectedDutyType: 0,
        selectedPartnerCondition: 0,
        parPlusValue: 4,
        doubleParPlusValue: 1,
        scoreDiffValue: 3,
        maxLostValue: 10000000
      });
    },

    // 根据传入的config更新编辑状态
    updateEditingConfig(config) {
      const { dutyConfig, partnerDutyCondition, badScoreBaseLine, badScoreMaxLost } = config;
      
      // 解析包洞规则类型和数值
      let selectedDutyType = 0;
      let parPlusValue = 4;
      let doubleParPlusValue = 1;
      let scoreDiffValue = 3;
      
      if (dutyConfig === 'NODUTY') {
        selectedDutyType = 0;
      } else if (badScoreBaseLine?.startsWith('Par+')) {
        selectedDutyType = 1;
        const value = Number.parseInt(badScoreBaseLine.replace('Par+', ''));
        parPlusValue = Number.isNaN(value) ? 4 : value;
      } else if (badScoreBaseLine?.startsWith('DoublePar+')) {
        selectedDutyType = 2;
        const value = Number.parseInt(badScoreBaseLine.replace('DoublePar+', ''));
        doubleParPlusValue = Number.isNaN(value) ? 1 : value;
      } else if (badScoreBaseLine?.startsWith('ScoreDiff_')) {
        selectedDutyType = 3;
        const value = Number.parseInt(badScoreBaseLine.replace('ScoreDiff_', ''));
        scoreDiffValue = Number.isNaN(value) ? 3 : value;
      }
      
      // 解析队友责任条件
      let selectedPartnerCondition = 0;
      if (partnerDutyCondition === 'DUTY_DINGTOU') {
        selectedPartnerCondition = 0;
      } else if (partnerDutyCondition === 'PARTNET_IGNORE') {
        selectedPartnerCondition = 1;
      }
      
      this.setData({
        editingConfig: config,
        selectedDutyType,
        selectedPartnerCondition,
        parPlusValue,
        doubleParPlusValue,
        scoreDiffValue,
        maxLostValue: badScoreMaxLost || 10000000
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
      
      console.log('🏳️ [LasiKoufen] 确认配置:', config);
      
      // 触发事件通知父组件
      this.triggerEvent('configChange', { config });
      
      this.setData({ visible: false });
    },

    // === 配置项变更事件 ===
    
    // 包洞规则类型选择
    onDutyTypeChange(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      this.setData({ selectedDutyType: index });
    },

    // 队友责任条件选择
    onPartnerConditionChange(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      this.setData({ selectedPartnerCondition: index });
    },

    // 帕+X值变更
    onParPlusChange(e) {
      const value = this.data.parPlusRange[e.detail.value];
      this.setData({ parPlusValue: value });
    },

    // 双帕+X值变更
    onDoubleParPlusChange(e) {
      const value = this.data.doubleParPlusRange[e.detail.value];
      this.setData({ doubleParPlusValue: value });
    },

    // 杆差X值变更
    onScoreDiffChange(e) {
      const value = this.data.scoreDiffRange[e.detail.value];
      this.setData({ scoreDiffValue: value });
    },

    // 最大损失值变更
    onMaxLostChange(e) {
      const value = this.data.maxLostRange[e.detail.value];
      this.setData({ maxLostValue: value });
    },

    // === 辅助方法 ===
    
    // 从UI状态构建配置对象
    buildConfigFromUI() {
      const { 
        selectedDutyType, 
        selectedPartnerCondition, 
        parPlusValue, 
        doubleParPlusValue, 
        scoreDiffValue,
        maxLostValue
      } = this.data;
      
      // 构建包洞配置
      let dutyConfig = 'NODUTY';
      let badScoreBaseLine = 'Par+4';
      
      if (selectedDutyType === 0) {
        dutyConfig = 'NODUTY';
        badScoreBaseLine = 'NoSub';
      } else if (selectedDutyType === 1) {
        dutyConfig = 'DUTY';
        badScoreBaseLine = `Par+${parPlusValue}`;
      } else if (selectedDutyType === 2) {
        dutyConfig = 'DUTY';
        badScoreBaseLine = `DoublePar+${doubleParPlusValue}`;
      } else if (selectedDutyType === 3) {
        dutyConfig = 'DUTY';
        badScoreBaseLine = `ScoreDiff_${scoreDiffValue}`;
      }
      
      // 构建队友责任条件
      let partnerDutyCondition = 'DUTY_DINGTOU';
      if (selectedPartnerCondition === 0) {
        partnerDutyCondition = 'DUTY_DINGTOU';
      } else if (selectedPartnerCondition === 1) {
        partnerDutyCondition = 'PARTNET_IGNORE';
      }
      
      return {
        dutyConfig,
        partnerDutyCondition,
        badScoreBaseLine,
        badScoreMaxLost: maxLostValue
      };
    },

    // 同步Store数据（供父组件调用）
    syncWithStore(storeData) {
      console.log('🏳️ [LasiKoufen] 同步Store数据:', storeData);
      
      if (storeData?.config?.baodongConfig) {
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