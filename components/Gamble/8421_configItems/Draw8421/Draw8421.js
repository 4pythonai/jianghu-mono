import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'
import configManager from '../../../../utils/configManager.js'
import ruleFormatter from '../../../../utils/formatters/ruleFormatter.js'

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

    if (this.properties.mode === 'SysConfig') {
      // SysConfig模式：使用独立的配置数据，不依赖Store
      // 使用默认配置初始化，但保持用户之前的选择
      this.setData({
        selected: this.data.selected || 0,
        selectedDiffScore: this.data.selectedDiffScore || 1
      });
    } else if (this.properties.mode === 'UserEdit') {
      // UserEdit模式：等待外部数据初始化，不自动从Store加载
      // 设置默认值，避免显示"请配置顶洞规则"
      this.setData({
        selected: 0,
        selectedDiffScore: 1
      });
    }
    // 计算显示值
    this.updateDisplayValue();
  },

  methods: {
    // 计算显示值 - 使用工具类简化
    updateDisplayValue() {
      if (this.properties.mode === 'SysConfig' || this.properties.mode === 'UserEdit' || this.properties.mode === undefined) {
        // 使用工具类格式化显示值
        const { selected, selectedDiffScore } = this.data;

        // 构建配置数据用于格式化
        let drawConfig = '';
        if (selected === 0) {
          drawConfig = 'DrawEqual';
        } else if (selected === 1) {
          drawConfig = `Diff_${selectedDiffScore}`;
        } else if (selected === 2) {
          drawConfig = 'NoDraw';
        }


        // 使用工具类格式化
        const displayValue = ruleFormatter.formatDrawRule(drawConfig);

        this.setData({ displayValue });
      } else {
        // 使用Store数据
        const store = G4P8421Store;
        const displayValue = ruleFormatter.formatDrawRule(store.drawConfig);

        this.setData({ displayValue });
      }
    },


    // 事件处理方法
    onSelect(e) {
      const index = Number.parseInt(e.currentTarget.dataset.index);
      this.setData({ selected: index });
    },

    onDiffScoreChange(e) {
      const selectedIndex = e.detail.value;
      const selectedScore = this.data.diffScores[selectedIndex];
      this.setData({ selectedDiffScore: selectedScore });
    },

    // UI控制方法
    onShowConfig() {
      this.setData({ visible: true });
    },

    onCancel() {
      this.setData({ visible: false });
    },

    noTap() {
      // 空方法，用于处理禁用状态下的点击事件
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

      // 更新显示值
      this.updateDisplayValue();
      // 关闭弹窗
      this.setData({ visible: false });
      // 向父组件传递事件
      this.triggerEvent('confirm', {
        value: selectedValue
      });
    },


    /**
     * 将Draw8421组件状态转换为配置数据
     * @param {Object} componentState - 组件状态
     * @returns {Object} 配置数据
     */
    convertDraw8421ToConfig(componentState) {
      const { selected, selectedDiffScore } = componentState;

      // 根据选择的选项生成配置值
      let drawConfig = '';
      if (selected === 0) {
        drawConfig = 'DrawEqual';
      } else if (selected === 1) {
        drawConfig = `Diff_${selectedDiffScore}`;
      } else if (selected === 2) {
        drawConfig = 'NoDraw';
      }

      return { drawConfig };
    },

    // 获取配置数据 - 使用工具类简化
    getConfigData() {
      const componentState = {
        selected: this.data.selected,
        selectedDiffScore: this.data.selectedDiffScore
      };
      const configData = this.convertDraw8421ToConfig(componentState);
      return configData;
    },

    /**
     * 将配置数据转换为Draw8421组件状态
     * @param {Object} configData - 配置数据
     * @returns {Object} 组件状态
     */
    convertConfigToDraw8421(configData) {
      const { drawConfig } = configData;
      const state = {};

      if (drawConfig === 'DrawEqual') {
        state.selected = 0;
      } else if (drawConfig === 'NoDraw') {
        state.selected = 2;
      } else if (drawConfig?.startsWith('Diff_')) {
        state.selected = 1;
        const score = Number.parseInt(drawConfig.replace('Diff_', ''));
        state.selectedDiffScore = Number.isNaN(score) ? 1 : score;
      } else {
        state.selected = 0;
        state.selectedDiffScore = 1;
      }

      return state;
    },

    // 初始化配置数据 - 使用工具类简化
    initConfigData(configData) {
      const componentState = this.convertConfigToDraw8421(configData);
      this.setData(componentState);
      this.updateDisplayValue();
    }
  }
});