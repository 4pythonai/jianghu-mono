import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'

Component({
  properties: {
  },

  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置顶洞规则',

    options: [
      'DrawEqual',
      'Diff_1',
      'NoDraw'
    ],
    selected: 0,
    // 分数选择器相关
    diffScores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    selectedDiffScore: 1
  },
  attached() {
    console.log('🎯 [Draw8421] 组件加载，模式:', this.properties.mode);

    if (this.properties.mode === 'SysConfig') {
      // SysConfig模式：使用独立的配置数据，不依赖Store
      console.log('🎯 [Draw8421] SysConfig模式，使用独立配置');
      // 使用默认配置初始化，但保持用户之前的选择
      this.setData({
        selected: this.data.selected || 0,
        selectedDiffScore: this.data.selectedDiffScore || 1
      });
    } else if (this.properties.mode === 'UserEdit') {
      // UserEdit模式：等待外部数据初始化，不自动从Store加载
      console.log('🎯 [Draw8421] UserEdit模式，等待外部数据初始化');
    } else {
      // 默认模式：从store获取当前配置并初始化组件状态
      this.syncSelectedFromStore();
    }
    // 计算显示值
    this.updateDisplayValue();
  },

  methods: {
    // 计算显示值
    updateDisplayValue() {
      let displayValue = '';

      if (this.properties.mode === 'SysConfig' || this.properties.mode === 'UserEdit' || this.properties.mode === undefined) {
        // SysConfig和UserEdit模式：使用组件内部数据
        const { selected, selectedDiffScore } = this.data;

        console.log('🚨🚨🚨 [Draw8421] updateDisplayValue 使用组件内部数据:', {
          selected,
          selectedDiffScore
        });

        switch (selected) {
          case 0:
            displayValue = '得分打平';
            break;
          case 1:
            displayValue = `得分${selectedDiffScore}分以内`;
            break;
          case 2:
            displayValue = '无顶洞';
            break;
          default:
            displayValue = '请配置顶洞规则';
        }
      } else {
        // 默认模式：使用Store数据
        const store = G4P8421Store;

        console.log('🚨🚨🚨 [Draw8421] updateDisplayValue 使用Store数据');

        // 映射英文格式到中文显示
        if (store.drawConfig) {
          switch (store.drawConfig) {
            case 'DrawEqual':
              displayValue = '得分打平';
              break;
            case 'Diff_1':
              displayValue = '得分1分以内';
              break;
            case 'NoDraw':
              displayValue = '无顶洞';
              break;
            default:
              // 处理 Diff_X 格式
              if (store.drawConfig.startsWith('Diff_')) {
                const score = store.drawConfig.replace('Diff_', '');
                displayValue = `得分${score}分以内`;
              } else {
                displayValue = store.drawConfig;
              }
              break;
          }
        } else {
          displayValue = '请配置顶洞规则';
        }
      }

      this.setData({
        displayValue: displayValue
      });

      console.log('🚨🚨🚨 [Draw8421] 顶洞规则显示值已更新:', displayValue);
    },

    syncSelectedFromStore() {
      const currentValue = G4P8421Store.drawConfig;
      console.log('syncSelectedFromStore被调用，store值:', currentValue);
      if (currentValue) {
        if (currentValue === 'DrawEqual') {
          this.setData({ selected: 0 });
          console.log('设置selected为0');
        } else if (currentValue.startsWith('Diff_')) {
          // 解析分数值
          const score = Number.parseInt(currentValue.replace('Diff_', ''));
          this.setData({
            selected: 1,
            selectedDiffScore: score || 1
          });
          console.log('设置selected为1，分数:', score || 1);
        } else if (currentValue === 'NoDraw') {
          this.setData({ selected: 2 });
          console.log('设置selected为2');
        }
      }
    },

    onSelect(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      console.log('选择选项:', index, '当前selected:', this.data.selected);
      this.setData({ selected: index });
      console.log('设置后selected:', index);
    },

    // 分数选择器相关方法
    onDiffScoreChange(e) {
      const selectedIndex = e.detail.value;
      const selectedScore = this.data.diffScores[selectedIndex];
      this.setData({ selectedDiffScore: selectedScore });
      console.log('选择分数:', selectedScore);
    },

    onShowConfig() {
      // 直接显示弹窗，因为已经用view替代了input
      this.setData({ visible: true });

      if (this.properties.mode === 'SysConfig') {
        // SysConfig模式：确保当前状态正确显示
        console.log('🎯 [Draw8421] SysConfig模式显示配置，当前状态:', {
          selected: this.data.selected,
          selectedDiffScore: this.data.selectedDiffScore
        });
      } else {
        // 总是重新加载配置，确保与Store同步
        this.syncSelectedFromStore();
      }
    },

    onCancel() {
      this.setData({ visible: false });
      this.triggerEvent('cancel');
    },

    // 阻止事件冒泡的方法
    noTap() {
      // 空方法，用于阻止事件冒泡
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

      if (this.properties.mode === 'SysConfig') {
        // SysConfig模式：不更新Store，只更新显示值
        console.log('🎯 [Draw8421] SysConfig模式，不更新Store');
      } else {
        // 调用store的action更新数据
        G4P8421Store.updateDingdongRule(selectedValue);
      }

      // 更新显示值
      this.updateDisplayValue();
      console.log('📋 [Draw8421] 初始化完成，当前状态:', {
        selected: this.data.selected,
        selectedDiffScore: this.data.selectedDiffScore,
        displayValue: this.data.displayValue
      });
      // 关闭弹窗
      this.setData({ visible: false });
      // 向父组件传递事件
      this.triggerEvent('confirm', {
        value: selectedValue
      });
    },

    // 获取配置数据（供父组件调用）
    getConfigData() {
      const { selected, selectedDiffScore } = this.data;

      // 根据选择的选项生成配置值
      let selectedValue = '';
      if (selected === 0) {
        selectedValue = 'DrawEqual';
      } else if (selected === 1) {
        selectedValue = `Diff_${selectedDiffScore}`;
      } else if (selected === 2) {
        selectedValue = 'NoDraw';
      }

      return { drawConfig: selectedValue };
    },

    // 初始化配置数据（供父组件调用）
    initConfigData(configData) {
      console.log('🚨🚨🚨 [Draw8421] ========== 开始初始化配置数据 ==========');
      console.log('🚨🚨🚨 [Draw8421] 接收到的configData:', JSON.stringify(configData, null, 2));

      if (!configData) {
        console.log('🚨🚨🚨 [Draw8421] ❌ configData为空，退出初始化');
        return;
      }

      // 解析 drawConfig 字段
      const drawConfig = configData.drawConfig;
      console.log('🚨🚨🚨 [Draw8421] 解析到的drawConfig:', drawConfig);
      
      if (drawConfig) {
        if (drawConfig === 'DrawEqual') {
          console.log('🚨🚨🚨 [Draw8421] 设置selected为0 (DrawEqual)');
          this.setData({ selected: 0 });
        } else if (drawConfig.startsWith('Diff_')) {
          const score = parseInt(drawConfig.replace('Diff_', ''));
          console.log('🚨🚨🚨 [Draw8421] 设置selected为1，分数为:', score);
          this.setData({
            selected: 1,
            selectedDiffScore: score || 1
          });
        } else if (drawConfig === 'NoDraw') {
          console.log('🚨🚨🚨 [Draw8421] 设置selected为2 (NoDraw)');
          this.setData({ selected: 2 });
        }
      } else {
        console.log('🚨🚨🚨 [Draw8421] ❌ 未找到drawConfig字段');
      }

      // 更新显示值
      this.updateDisplayValue();
      console.log('🚨🚨🚨 [Draw8421] 初始化完成，当前状态:', {
        selected: this.data.selected,
        selectedDiffScore: this.data.selectedDiffScore,
        displayValue: this.data.displayValue
      });
      console.log('🚨🚨🚨 [Draw8421] ========== 初始化配置数据完成 ==========');
    }
  }
});