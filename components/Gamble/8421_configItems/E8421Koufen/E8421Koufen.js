import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'
import configManager from '../../../../utils/configManager.js'
import ruleFormatter from '../../../../utils/formatters/ruleFormatter.js'

Component({
  properties: {
    // 模式：SysConfig | UserEdit
    mode: {
      type: String,
      value: 'SysConfig'
    },
    // 配置数据
    configData: {
      type: Object,
      value: null
    }
  },
  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置扣分规则',

    // 扣分开始条件 (badScoreBaseLine)
    badScoreBaseLine: ['从帕+X开始扣分', '从双帕+Y开始扣分', '不扣分'],
    selectedStart: 0,

    // 可编辑的数字变量
    paScore: 4, // 帕的分数, 默认4
    doubleParScore: 0, // 双帕的分数, 默认0
    maxSubScore: 2, // 封顶分数, 默认2

    // 数字选择器范围
    paScoreRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    doubleParScoreRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    maxSubScoreRange: Array.from({ length: 21 }, (_, i) => i + 1), // 1-21

    // 扣分封顶 (badScoreMaxLost)
    maxOptions: ['不封顶', '扣X分封顶'],
    selectedMax: 0,

    // 同伴惩罚 (dutyConfig)
    dutyOptions: ['不包负分', '同伴顶头包负分', '包负分'],
    selectedDuty: 0
  },
  // 组件生命周期
  lifetimes: {
    attached() {

      // 根据模式初始化组件
      if (this.properties.mode === 'UserEdit') {
        // UserEdit模式：等待外部数据初始化，不自动从Store加载
        // 设置默认值，避免显示"请配置扣分规则"
        this.setData({
          selectedStart: 0,
          selectedMax: 0,
          selectedDuty: 0,
          paScore: 4,
          doubleParScore: 0,
          maxSubScore: 2
        });
      } else if (this.properties.mode === 'SysConfig') {
        // SysConfig模式：使用独立的配置数据，不依赖Store
        // 使用默认配置初始化，但保持用户之前的选择
        this.setData({
          selectedStart: this.data.selectedStart || 0,
          selectedMax: this.data.selectedMax || 0,
          selectedDuty: this.data.selectedDuty || 0,
          paScore: this.data.paScore || 4,
          doubleParScore: this.data.doubleParScore || 0,
          maxSubScore: this.data.maxSubScore || 2
        });
      } else {
        // 默认模式：从store获取当前配置并初始化组件状态
        this.initializeFromStore();
      }
      // 计算显示值
      this.updateDisplayValue();
    }
  },

  observers: {
    // 监听配置数据变化
    'configData': function (configData) {
      if (configData && this.properties.mode === 'UserEdit') {
        this.initializeFromConfigData(configData);
        this.updateDisplayValue();
      }
    }
  },

  methods: {
    // 空方法，用于处理禁用状态下的点击事件
    noTap() {
      // 什么都不做，阻止事件处理
    },

    // 计算显示值 - 使用工具类简化
    updateDisplayValue() {
      if (this.properties.mode === 'SysConfig' || this.properties.mode === 'UserEdit' || this.properties.mode === undefined) {
        // 使用工具类格式化显示值
        const { selectedStart, selectedMax, paScore, doubleParScore, maxSubScore } = this.data;

        // 构建配置数据用于格式化
        let badScoreBaseLine = '';
        const selectedStartNum = Number(selectedStart); // 转换为数字
        if (selectedStartNum === 0) {
          badScoreBaseLine = `Par+${paScore}`;
        } else if (selectedStartNum === 1) {
          badScoreBaseLine = `DoublePar+${doubleParScore}`;
        } else if (selectedStartNum === 2) {
          badScoreBaseLine = 'NoSub';
        }

        const selectedMaxNum = Number(selectedMax); // 转换为数字
        const badScoreMaxLost = selectedMaxNum === 0 ? 10000000 : maxSubScore;

        // 使用工具类格式化
        const displayValue = ruleFormatter.formatKoufenRule(badScoreBaseLine, badScoreMaxLost);

        this.setData({ displayValue });
      } else {
        // 使用Store数据
        const store = G4P8421Store;
        let displayValue = '';

        if (store.badScoreBaseLine === 'NoSub') {
          displayValue = '不扣分';
        } else if (store.badScoreBaseLine?.startsWith('Par+')) {
          const score = store.badScoreBaseLine.replace('Par+', '');
          displayValue = `帕+${score}`;
        } else if (store.badScoreBaseLine?.startsWith('DoublePar+')) {
          const score = store.badScoreBaseLine.replace('DoublePar+', '');
          displayValue = `双帕+${score}`;
        }

        if (store.badScoreMaxLost === 10000000) {
          displayValue += '/不封顶';
        } else {
          displayValue += `/扣${store.badScoreMaxLost}分封顶`;
        }

        this.setData({ displayValue });
      }
    },

    // 从Store初始化 - 保持原有逻辑
    initializeFromStore() {
      const store = G4P8421Store;
      this.parseStoredConfig(store);
      this.updateDisplayValue();
    },

    // 解析存储的配置 - 使用工具类简化
    parseStoredConfig(config) {
      // 使用工具类解析扣分基线
      let selectedStart = 0;
      let paScore = 4;
      let doubleParScore = 0;

      if (config.badScoreBaseLine === 'NoSub') {
        selectedStart = 2;
      } else if (config.badScoreBaseLine?.startsWith('Par+')) {
        selectedStart = 0;
        const result = configManager.parseParPlus(config.badScoreBaseLine);
        paScore = result ? result.score : 4;
      } else if (config.badScoreBaseLine?.startsWith('DoublePar+')) {
        selectedStart = 1;
        const result = configManager.parseDoubleParPlus(config.badScoreBaseLine);
        doubleParScore = result ? result.score : 0;
      }

      // 使用工具类解析封顶配置
      const maxResult = configManager.parseMaxValue(config.badScoreMaxLost);
      const selectedMax = maxResult.isUnlimited ? 0 : 1;
      const maxSubScore = maxResult.isUnlimited ? 2 : maxResult.value;

      // 使用工具类解析同伴惩罚配置
      const dutyResult = configManager.parseDutyConfig(config.dutyConfig);
      const selectedDuty = dutyResult.index;

      this.setData({
        selectedStart,
        selectedMax,
        selectedDuty,
        paScore,
        doubleParScore,
        maxSubScore
      });
    },

    // 事件处理方法
    onSelectStart(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({ selectedStart: index });
      this.updateDisplayValue();
    },

    onSelectMax(e) {
      // 如果选择了"不扣分"，则禁用封顶和同伴惩罚选项
      if (Number(this.data.selectedStart) === 2) {
        return;
      }
      const index = e.currentTarget.dataset.index;
      this.setData({ selectedMax: index });
      this.updateDisplayValue();
    },

    onSelectDuty(e) {
      // 如果选择了"不扣分"，则禁用封顶和同伴惩罚选项
      if (Number(this.data.selectedStart) === 2) {
        return;
      }
      const index = e.currentTarget.dataset.index;
      this.setData({ selectedDuty: index });
      this.updateDisplayValue();
    },

    onPaScoreChange(e) {
      this.setData({ paScore: e.detail.value });
      this.updateDisplayValue();
    },

    onDoubleParScoreChange(e) {
      this.setData({ doubleParScore: e.detail.value });
      this.updateDisplayValue();
    },

    onMaxSubScoreChange(e) {
      this.setData({ maxSubScore: e.detail.value });
      this.updateDisplayValue();
    },

    // UI控制方法
    onShowConfig() {
      this.setData({ visible: true });
    },

    onCancel() {
      this.setData({ visible: false });
    },

    onConfirm() {
      this.setData({ visible: false });
      this.updateDisplayValue();
    },

    // 从配置数据初始化 - 使用工具类简化
    initializeFromConfigData(configData) {

      // 使用工具类转换配置数据为组件状态
      const componentState = configManager.convertConfigToE8421Koufen(configData);

      this.setData(componentState);
    },

    // 获取配置数据 - 使用工具类简化
    getConfigData() {
      const componentState = {
        selectedStart: this.data.selectedStart,
        selectedMax: this.data.selectedMax,
        selectedDuty: this.data.selectedDuty,
        paScore: this.data.paScore,
        doubleParScore: this.data.doubleParScore,
        maxSubScore: this.data.maxSubScore
      };

      // 使用工具类转换组件状态为配置数据
      const configData = configManager.convertE8421KoufenToConfig(componentState);

      return configData;
    },

    // 初始化配置数据 - 兼容性方法
    initConfigData(configData) {
      this.initializeFromConfigData(configData);
      this.updateDisplayValue();
    }
  }
});