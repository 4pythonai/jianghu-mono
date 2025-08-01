import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'

Component({
  properties: {
    // 组件属性
  },

  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置包洞规则',

    // 包洞规则类型: 'no_hole' | 'double_par_plus_1' | 'plus_4' | 'stroke_diff_3'
    holeRuleType: 'no_hole',
    // 包洞条件: 'partner_tops' | 'irrelevant'
    holeCondition: 'partner_tops'
  },

  lifetimes: {
    attached() {
      console.log('🎯 [LasiBaodong] 包洞规则组件加载');
      this.loadConfigFromStore();
      this.updateDisplayValue();
    }
  },

  methods: {
    // 计算显示值
    updateDisplayValue() {
      const { holeRuleType, holeCondition } = this.data;
      let displayValue = '';

      // 格式化包洞规则显示
      let ruleText = '';
      switch (holeRuleType) {
        case 'no_hole':
          ruleText = '不包洞';
          break;
        case 'double_par_plus_1':
          ruleText = '双帕+1包洞';
          break;
        case 'plus_4':
          ruleText = '+4包洞';
          break;
        case 'stroke_diff_3':
          ruleText = '杆差3包洞';
          break;
        default:
          ruleText = '不包洞';
      }

      // 格式化包洞条件显示
      let conditionText = '';
      switch (holeCondition) {
        case 'partner_tops':
          conditionText = '同伴顶头包洞';
          break;
        case 'irrelevant':
          conditionText = '与同伴成绩无关';
          break;
        default:
          conditionText = '同伴顶头包洞';
      }

      // 组合显示值
      if (holeRuleType === 'no_hole') {
        displayValue = ruleText;
      } else {
        displayValue = `${ruleText}/${conditionText}`;
      }

      this.setData({
        displayValue: displayValue
      });

      console.log('包洞规则显示值已更新:', displayValue);
    },

    // 从Store加载配置
    loadConfigFromStore() {
      const config = G4PLasiStore.lasi_baodong_config || {};

      this.setData({
        holeRuleType: config.holeRuleType || 'no_hole',
        holeCondition: config.holeCondition || 'partner_tops'
      });

      this.printCurrentConfig();
    },

    // 显示配置弹窗
    onShowConfig() {
      this.setData({ visible: true });
      // 每次显示时重新加载配置
      this.loadConfigFromStore();
    },

    // 包洞规则类型变化
    onHoleRuleChange(e) {
      const { type } = e.currentTarget.dataset;
      this.setData({
        holeRuleType: type
      });

      this.printCurrentConfig();
    },

    // 包洞条件变化
    onHoleConditionChange(e) {
      const { condition } = e.currentTarget.dataset;
      this.setData({
        holeCondition: condition
      });

      this.printCurrentConfig();
    },

    // 空事件处理（当包洞规则为"不包洞"时）
    noTap() {
      // 不执行任何操作
      return;
    },

    // 取消
    onCancel() {
      this.setData({ visible: false });
      this.loadConfigFromStore();
      this.triggerEvent('cancel');
    },

    // 确定保存
    onConfirm() {
      const config = this.getCurrentConfig();

      // 更新Store
      G4PLasiStore.updateBaodongConfig(config);

      // 更新显示值
      this.updateDisplayValue();

      // 关闭弹窗
      this.setData({ visible: false });

      this.printCurrentConfig();
      this.triggerEvent('confirm', config);
    },

    // 获取当前配置
    getCurrentConfig() {
      const { holeRuleType, holeCondition } = this.data;

      return {
        enabled: holeRuleType !== 'no_hole',
        holeRuleType,
        holeCondition
      };
    },

    // 打印当前配置
    printCurrentConfig() {
      const config = this.getCurrentConfig();
      console.log('🎯 [LasiBaodong] ===== 当前包洞配置 =====');
      console.log('🎯 [LasiBaodong] 配置对象:', config);
      console.log('🎯 [LasiBaodong] 包洞规则类型:', config.holeRuleType);
      console.log('🎯 [LasiBaodong] 包洞条件:', config.holeCondition);
      console.log('🎯 [LasiBaodong] 是否启用:', config.enabled);
      console.log('🎯 [LasiBaodong] ========================');
    },

    // 设置配置
    setConfig(config) {
      if (config.holeRuleType) {
        this.setData({ holeRuleType: config.holeRuleType });
      }
      if (config.holeCondition) {
        this.setData({ holeCondition: config.holeCondition });
      }

      this.updateDisplayValue();
      this.printCurrentConfig();
    },

    // 重置配置
    resetConfig() {
      this.setData({
        holeRuleType: 'no_hole',
        holeCondition: 'partner_tops'
      });

      this.updateDisplayValue();
      this.printCurrentConfig();
    }
  }
});