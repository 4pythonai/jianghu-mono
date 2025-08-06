import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'
const configManager = require('../../../../utils/configManager.js');

Component({
  properties: {
    // 组件属性
  },

  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置包洞规则',

    // 包洞规则类型: 'NODUTY' | 'DoublePar+11' | 'ParP+4' | 'ScoreDiff_3'    
    // 包洞条件: 'DUTY_DINGTOU' | 'PARTNET_IGNORE'
    PartnerDutyCondition: 'DUTY_DINGTOU',

    // 可编辑的数字变量 - 参考E8421Meat.js的变量命名方式
    doubleParPlusValue: 1, // 双帕+X中的X值，默认1
    parPlusValue: 4, // 帕+X中的X值，默认4
    strokeDiffValue: 3, // 杆差X中的X值，默认3

    // 数字选择器范围 - 参考E8421Koufen.js的实现
    doubleParPlusRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    parPlusRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    strokeDiffRange: Array.from({ length: 21 }, (_, i) => i + 1), // 1-20
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
      const { dutyConfig, PartnerDutyCondition, doubleParPlusValue, parPlusValue, strokeDiffValue } = this.data;
      let displayValue = '';

      // 格式化包洞规则显示 - 使用动态数值
      let ruleText = '';
      switch (dutyConfig) {
        case 'NODUTY':
          ruleText = '不包洞';
          break;
        case 'double_par_plus_x':
          ruleText = `双帕+${doubleParPlusValue}包洞`;
          break;
        case 'par_plus_x':
          ruleText = `帕+${parPlusValue}包洞`;
          break;
        case 'stroke_diff_x':
          ruleText = `杆差${strokeDiffValue}包洞`;
          break;
        default:
          ruleText = '不包洞';
      }

      // 格式化包洞条件显示
      let conditionText = '';
      switch (PartnerDutyCondition) {
        case 'DUTY_DINGTOU':
          conditionText = '同伴顶头包洞';
          break;
        case 'PARTNET_IGNORE':
          conditionText = '与同伴成绩无关';
          break;
        default:
          conditionText = '同伴顶头包洞';
      }

      // 组合显示值
      if (dutyConfig === 'NODUTY') {
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

      // 解析配置，支持新格式
      let dutyConfig = config.dutyConfig || 'NODUTY';
      let doubleParPlusValue = 1;
      let parPlusValue = 4;
      let strokeDiffValue = 3;

      // 解析规则类型和数值
      if (config.dutyConfig) {
        if (config.dutyConfig.startsWith('DoublePar')) {
          dutyConfig = 'double_par_plus_x';
          const value = Number.parseInt(config.dutyConfig.replace('DoublePar+', ''));
          if (!Number.isNaN(value)) {
            doubleParPlusValue = value;
          }
        } else if (config.dutyConfig.startsWith('Par')) {
          dutyConfig = 'par_plus_x';
          const value = Number.parseInt(config.dutyConfig.replace('Par+', ''));
          if (!Number.isNaN(value)) {
            parPlusValue = value;
          }
        } else if (config.dutyConfig.startsWith('ScoreDiff')) {
          dutyConfig = 'stroke_diff_x';
          const value = Number.parseInt(config.dutyConfig.replace('ScoreDiff_', ''));
          if (!Number.isNaN(value)) {
            strokeDiffValue = value;
          }
        }
      }

      this.setData({
        dutyConfig: dutyConfig,
        PartnerDutyCondition: config.PartnerDutyCondition || 'DUTY_DINGTOU',
        doubleParPlusValue: doubleParPlusValue,
        parPlusValue: parPlusValue,
        strokeDiffValue: strokeDiffValue
      });

      this.printCurrentConfig();
    },

    // 显示配置弹窗
    onShowConfig() {
      // 直接显示弹窗，因为已经用view替代了input
      this.setData({ visible: true });
      // 每次显示时重新加载配置
      this.loadConfigFromStore();
    },

    // 包洞规则类型变化
    onHoleRuleChange(e) {
      const { type } = e.currentTarget.dataset;
      this.setData({
        dutyConfig: type
      });

      this.printCurrentConfig();
    },

    // 包洞条件变化
    onPartnerDutyConditionChange(e) {
      const { condition } = e.currentTarget.dataset;
      this.setData({
        PartnerDutyCondition: condition
      });

      this.printCurrentConfig();
    },

    // 双帕+X值改变 - 参考E8421Koufen.js的实现
    onDoubleParPlusChange(e) {
      const value = this.data.doubleParPlusRange[e.detail.value];
      this.setData({ doubleParPlusValue: value });
      console.log('更新双帕+X值:', value);
    },

    // 帕+X值改变
    onParPlusChange(e) {
      const value = this.data.parPlusRange[e.detail.value];
      this.setData({ parPlusValue: value });
      console.log('更新帕+X值:', value);
    },

    // 杆差X值改变
    onStrokeDiffChange(e) {
      const value = this.data.strokeDiffRange[e.detail.value];
      this.setData({ strokeDiffValue: value });
      console.log('更新杆差X值:', value);
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

    // 获取当前配置 - 使用统一的转换工具
    getCurrentConfig() {
      const componentState = {
        dutyConfig: this.data.dutyConfig,
        PartnerDutyCondition: this.data.PartnerDutyCondition,
        doubleParPlusValue: this.data.doubleParPlusValue,
        parPlusValue: this.data.parPlusValue,
        strokeDiffValue: this.data.strokeDiffValue
      };

      return configManager.convertLasiKoufenToConfig(componentState);
    },

    // 打印当前配置
    printCurrentConfig() {
      const config = this.getCurrentConfig();
      console.log('🎯 [LasiBaodong] ===== 当前包洞配置 =====');
      console.log('🎯 [LasiBaodong] 配置对象:', config);
      console.log('🎯 [LasiBaodong] 包洞规则类型:', config.dutyConfig);
      console.log('🎯 [LasiBaodong] 包洞条件:', config.PartnerDutyCondition);
      console.log('🎯 [LasiBaodong] 是否启用:', config.dutyConfig !== 'NODUTY');
      console.log('🎯 [LasiBaodong] 自定义数值:', config.customValues);
      console.log('🎯 [LasiBaodong] ========================');
    },

    // 设置配置
    setConfig(config) {
      if (config.dutyConfig) {
        this.setData({ dutyConfig: config.dutyConfig });
      }
      if (config.PartnerDutyCondition) {
        this.setData({ PartnerDutyCondition: config.PartnerDutyCondition });
      }
      if (config.customValues) {
        const { doubleParPlusValue, parPlusValue, strokeDiffValue } = config.customValues;
        if (doubleParPlusValue !== undefined) {
          this.setData({ doubleParPlusValue });
        }
        if (parPlusValue !== undefined) {
          this.setData({ parPlusValue });
        }
        if (strokeDiffValue !== undefined) {
          this.setData({ strokeDiffValue });
        }
      }

      this.updateDisplayValue();
      this.printCurrentConfig();
    },

    // 重置配置
    resetConfig() {
      this.setData({
        dutyConfig: 'NODUTY',
        PartnerDutyCondition: 'DUTY_DINGTOU',
        doubleParPlusValue: 1,
        parPlusValue: 4,
        strokeDiffValue: 3
      });

      this.updateDisplayValue();
      this.printCurrentConfig();
    },

    // 获取配置数据（供SysEdit页面调用）
    getConfigData() {
      return this.getCurrentConfig();
    },

    // 初始化配置数据 - 供UserRuleEdit页面调用
    initConfigData(configData) {
      console.log('🎯 [LasiKoufen] 初始化配置数据:', configData);

      if (!configData) {
        console.warn('🎯 [LasiKoufen] 配置数据为空，使用默认值');
        return;
      }

      // 从配置数据中提取包洞相关配置
      // 支持两种数据结构：
      // 1. 直接包含包洞相关字段
      // 2. 从badScoreBaseLine、badScoreMaxLost、dutyConfig等字段解析
      let koufenConfig = configData;

      // 如果存在badScoreBaseLine字段，说明是扁平化结构，需要解析
      if (configData.badScoreBaseLine) {
        console.log('🎯 [LasiKoufen] 检测到扁平化数据结构，开始解析');

        // 使用统一的解析工具类
        let dutyConfig = 'NODUTY';
        let parPlusValue = 4;
        let doubleParPlusValue = 1;

        if (configData.badScoreBaseLine === 'NoSub') {
          dutyConfig = 'NODUTY';
        } else {
          // 使用统一的解析工具
          const parResult = configManager.parseParPlus(configData.badScoreBaseLine);
          const doubleParResult = configManager.parseDoubleParPlus(configData.badScoreBaseLine);

          if (parResult) {
            dutyConfig = 'Par+';
            parPlusValue = parResult.score;
          } else if (doubleParResult) {
            dutyConfig = 'DoublePar+';
            doubleParPlusValue = doubleParResult.score;
          }
        }

        // 解析dutyConfig
        let PartnerDutyCondition = 'DUTY_DINGTOU';
        if (configData.dutyConfig) {
          const parResult = configManager.parseParPlus(configData.dutyConfig);
          const doubleParResult = configManager.parseDoubleParPlus(configData.dutyConfig);

          if (parResult) {
            PartnerDutyCondition = 'DUTY_PAR';
            parPlusValue = parResult.score;
          } else if (doubleParResult) {
            PartnerDutyCondition = 'DUTY_DOUBLE_PAR';
            doubleParPlusValue = doubleParResult.score;
          }
        }

        koufenConfig = {
          dutyConfig,
          PartnerDutyCondition,
          customValues: {
            doubleParPlusValue,
            parPlusValue,
            strokeDiffValue: 3
          }
        };

        console.log('🎯 [LasiKoufen] 解析后的配置:', koufenConfig);
      }

      const dutyConfig = koufenConfig.dutyConfig || 'NODUTY';
      const PartnerDutyCondition = koufenConfig.PartnerDutyCondition || 'DUTY_DINGTOU';
      const customValues = koufenConfig.customValues || {
        doubleParPlusValue: 1,
        parPlusValue: 4,
        strokeDiffValue: 3
      };

      this.setData({
        dutyConfig,
        PartnerDutyCondition,
        doubleParPlusValue: customValues.doubleParPlusValue,
        parPlusValue: customValues.parPlusValue,
        strokeDiffValue: customValues.strokeDiffValue
      });

      this.updateDisplayValue();
      this.printCurrentConfig();

      console.log('🎯 [LasiKoufen] 配置数据初始化完成');
    }
  }
});