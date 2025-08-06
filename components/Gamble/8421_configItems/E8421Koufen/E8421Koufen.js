import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'

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
      console.log('🎯 [E8421Koufen] 组件加载，模式:', this.properties.mode);

      // 根据模式初始化组件
      if (this.properties.mode === 'UserEdit') {
        // UserEdit模式：等待外部数据初始化，不自动从Store加载
        console.log('🎯 [E8421Koufen] UserEdit模式，等待外部数据初始化');
      } else if (this.properties.mode === 'SysConfig') {
        // SysConfig模式：使用独立的配置数据，不依赖Store
        console.log('🎯 [E8421Koufen] SysConfig模式，使用独立配置');
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

    // 计算显示值
    updateDisplayValue() {
      let displayValue = '';

      if (this.properties.mode === 'SysConfig' || this.properties.mode === 'UserEdit' || this.properties.mode === undefined) {
        // SysConfig和UserEdit模式：使用组件内部数据
        const { selectedStart, selectedMax, paScore, doubleParScore, maxSubScore } = this.data;

        console.log('🚨🚨🚨 [E8421Koufen] updateDisplayValue 使用组件内部数据:', {
          selectedStart,
          selectedMax,
          paScore,
          doubleParScore,
          maxSubScore
        });

        // 格式化扣分开始值
        let startText = '';
        switch (selectedStart) {
          case 0:
            startText = `帕+${paScore}`;
            break;
          case 1:
            startText = `双帕+${doubleParScore}`;
            break;
          case 2:
            startText = '不扣分';
            break;
        }

        // 格式化封顶值
        let fengdingText = '';
        if (selectedMax === 0) {
          fengdingText = '不封顶';
        } else {
          fengdingText = `扣${maxSubScore}分封顶`;
        }

        // 组合显示值
        if (startText && fengdingText) {
          displayValue = `${startText}/${fengdingText}`;
        } else if (startText) {
          displayValue = startText;
        } else if (fengdingText) {
          displayValue = fengdingText;
        } else {
          displayValue = '请配置扣分规则';
        }
      } else {
        // 默认模式：使用Store数据
        const store = G4P8421Store;

        console.log('🚨🚨🚨 [E8421Koufen] updateDisplayValue 使用Store数据');

        // 格式化扣分开始值 - 适配新格式:NoSub, Par+X, DoublePar+X
        let startText = '';
        if (store.badScoreBaseLine) {
          if (store.badScoreBaseLine === 'NoSub') {
            startText = '不扣分';
          } else if (store.badScoreBaseLine?.startsWith('Par+')) {
            const score = store.badScoreBaseLine.replace('Par+', '');
            startText = `帕+${score}`;
          } else if (store.badScoreBaseLine?.startsWith('DoublePar+')) {
            const score = store.badScoreBaseLine.replace('DoublePar+', '');
            startText = `双帕+${score}`;
          } else {
            startText = store.badScoreBaseLine;
          }
        }

        // 格式化封顶值 - 适配新格式:数字, 10000000表示不封顶
        let fengdingText = '';
        if (store.badScoreMaxLost === 10000000) {
          fengdingText = '不封顶';
        } else if (typeof store.badScoreMaxLost === 'number' && store.badScoreMaxLost < 10000000) {
          fengdingText = `扣${store.badScoreMaxLost}分封顶`;
        }

        // 组合显示值
        if (startText && fengdingText) {
          displayValue = `${startText}/${fengdingText}`;
        } else if (startText) {
          displayValue = startText;
        } else if (fengdingText) {
          displayValue = fengdingText;
        } else {
          displayValue = '请配置扣分规则';
        }
      }

      this.setData({
        displayValue: displayValue
      });

      console.log('🚨🚨🚨 [E8421Koufen] 扣分规则显示值已更新:', displayValue);
    },

    // 从store初始化配置
    initializeFromStore() {
      // 直接访问store的属性
      const badScoreMaxLost = G4P8421Store.badScoreMaxLost;
      const koufenStart = G4P8421Store.badScoreBaseLine;
      const partnerPunishment = G4P8421Store.dutyConfig;

      console.log('🎯 [E8421Koufen] 从Store初始化配置:', {
        badScoreMaxLost,
        koufenStart,
        partnerPunishment
      });

      // 总是解析配置，不管是否是默认值
      this.parseStoredConfig({
        badScoreMaxLost,
        koufenStart,
        partnerPunishment
      });
    },
    // 解析存储的配置
    parseStoredConfig(config) {
      const { badScoreMaxLost, koufenStart, partnerPunishment } = config;
      console.log('🚨🚨🚨 [E8421Koufen] parseStoredConfig 开始解析:', config);

      // 解析扣分开始条件 - 新格式:NoSub, Par+X, DoublePar+X
      if (koufenStart) {
        console.log('🚨🚨🚨 [E8421Koufen] 解析koufenStart:', koufenStart);
        if (koufenStart === 'NoSub') {
          console.log('🚨🚨🚨 [E8421Koufen] 设置selectedStart为2 (NoSub)');
          this.setData({ selectedStart: 2 });
        } else if (koufenStart?.startsWith('Par+')) {
          console.log('🚨🚨🚨 [E8421Koufen] 设置selectedStart为0 (Par+)');
          this.setData({ selectedStart: 0 });
          // 提取帕分数
          const scoreStr = koufenStart.replace('Par+', '');
          const score = Number.parseInt(scoreStr);
          if (!Number.isNaN(score)) {
            console.log('🚨🚨🚨 [E8421Koufen] 设置paScore为:', score);
            this.setData({ paScore: score });
          }
        } else if (koufenStart?.startsWith('DoublePar+')) {
          console.log('🚨🚨🚨 [E8421Koufen] 设置selectedStart为1 (DoublePar+)');
          this.setData({ selectedStart: 1 });
          // 提取双帕分数
          const scoreStr = koufenStart.replace('DoublePar+', '');
          const score = Number.parseInt(scoreStr);
          if (!Number.isNaN(score)) {
            console.log('🚨🚨🚨 [E8421Koufen] 设置doubleParScore为:', score);
            this.setData({ doubleParScore: score });
          }
        }
      }

      // 解析封顶配置 - 新格式:数字, 10000000表示不封顶
      console.log('🚨🚨🚨 [E8421Koufen] 解析badScoreMaxLost:', badScoreMaxLost, '类型:', typeof badScoreMaxLost);
      const maxLostValue = Number(badScoreMaxLost);
      if (maxLostValue === 10000000) {
        console.log('🚨🚨🚨 [E8421Koufen] 设置selectedMax为0 (不封顶)');
        this.setData({ selectedMax: 0 });
      } else if (maxLostValue < 10000000) {
        console.log('🚨🚨🚨 [E8421Koufen] 设置selectedMax为1，maxSubScore为:', maxLostValue);
        this.setData({
          selectedMax: 1,
          maxSubScore: maxLostValue
        });
      }

      // 解析同伴惩罚配置 - 新格式:NODUTY, DUTY_NEGATIVE, DUTY_DINGTOU
      if (partnerPunishment) {
        let selectedDuty = 0;
        switch (partnerPunishment) {
          case 'NODUTY':
            selectedDuty = 0;
            break;
          case 'DUTY_DINGTOU':
            selectedDuty = 1;
            break;
          case 'DUTY_NEGATIVE':
            selectedDuty = 2;
            break;
          default: {
            // 兼容旧格式
            const index = this.data.dutyOptions.indexOf(partnerPunishment);
            if (index !== -1) {
              selectedDuty = index;
            }
          }
        }
        this.setData({ selectedDuty });
      }
    },
    onSelectStart(e) {
      this.setData({ selectedStart: e.currentTarget.dataset.index });
    },
    onSelectMax(e) {
      this.setData({ selectedMax: e.currentTarget.dataset.index });
    },
    onSelectDuty(e) {
      this.setData({ selectedDuty: e.currentTarget.dataset.index });
    },
    // 帕分数改变
    onPaScoreChange(e) {
      const value = this.data.paScoreRange[e.detail.value];
      this.setData({ paScore: value });
    },
    // 双帕分数改变
    onDoubleParScoreChange(e) {
      const value = this.data.doubleParScoreRange[e.detail.value];
      this.setData({ doubleParScore: value });
    },
    // 封顶分数改变
    onMaxSubScoreChange(e) {
      const value = this.data.maxSubScoreRange[e.detail.value];
      this.setData({ maxSubScore: value });
    },
    onShowConfig() {
      this.setData({ visible: true });

      if (this.properties.mode === 'SysConfig') {
        // SysConfig模式：确保当前状态正确显示
        console.log('🎯 [E8421Koufen] SysConfig模式显示配置，当前状态:', {
          selectedStart: this.data.selectedStart,
          selectedMax: this.data.selectedMax,
          selectedDuty: this.data.selectedDuty,
          paScore: this.data.paScore,
          doubleParScore: this.data.doubleParScore,
          maxSubScore: this.data.maxSubScore
        });
      } else {
        // 每次显示时重新加载配置
        this.initializeFromStore();
      }
    },

    onCancel() {
      this.setData({ visible: false });
      this.triggerEvent('cancel');
    },
    onConfirm() {
      const { selectedStart, selectedMax, selectedDuty, paScore, doubleParScore, maxSubScore } = this.data;

      // 构建新格式的配置数据
      let badScoreBaseLine = null;
      switch (selectedStart) {
        case 0:
          badScoreBaseLine = `Par+${paScore}`;
          break;
        case 1:
          badScoreBaseLine = `DoublePar+${doubleParScore}`;
          break;
        case 2:
          badScoreBaseLine = 'NoSub';
          break;
      }

      // 封顶配置改为数字格式, 10000000表示不封顶
      const badScoreMaxLost = selectedMax === 0 ? 10000000 : maxSubScore;

      // 同伴惩罚配置改为枚举格式
      let dutyConfig = null;
      switch (selectedDuty) {
        case 0:
          dutyConfig = 'NODUTY';
          break;
        case 1:
          dutyConfig = 'DUTY_DINGTOU';
          break;
        case 2:
          dutyConfig = 'DUTY_NEGATIVE';
          break;
      }

      if (this.properties.mode === 'SysConfig') {
        // SysConfig模式：不更新Store，只更新显示值
        console.log('🎯 [E8421Koufen] SysConfig模式，不更新Store');
      } else {
        // 调用store的action更新数据
        G4P8421Store.updateKoufenRule(badScoreMaxLost, badScoreBaseLine, dutyConfig);
      }

      console.log('扣分组件已更新:', {
        badScoreMaxLost,
        badScoreBaseLine,
        dutyConfig,
        customValues: { paScore, doubleParScore, maxSubScore }
      });

      // 更新显示值
      this.updateDisplayValue();

      // 关闭弹窗
      this.setData({ visible: false });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        parsedData: { badScoreMaxLost, badScoreBaseLine, dutyConfig }
      });
    },

    // 从配置数据初始化（UserEdit模式）
    initializeFromConfigData(configData) {
      console.log('📋 [E8421Koufen] 从配置数据初始化:', configData);

      if (!configData) return;

      // 解析配置数据
      const { badScoreMaxLost, badScoreBaseLine, dutyConfig } = configData;

      console.log('🚨🚨🚨 [E8421Koufen] 解析到的字段:', {
        badScoreMaxLost,
        badScoreBaseLine,
        dutyConfig
      });

      // 设置组件状态
      this.parseStoredConfig({
        badScoreMaxLost,
        koufenStart: badScoreBaseLine,
        partnerPunishment: dutyConfig
      });
    },

    // 获取配置数据（供父组件调用）
    getConfigData() {
      const { selectedStart, selectedMax, selectedDuty, paScore, doubleParScore, maxSubScore } = this.data;

      // 构建新格式的配置数据
      let badScoreBaseLine = null;
      switch (selectedStart) {
        case 0:
          badScoreBaseLine = `Par+${paScore}`;
          break;
        case 1:
          badScoreBaseLine = `DoublePar+${doubleParScore}`;
          break;
        case 2:
          badScoreBaseLine = 'NoSub';
          break;
      }

      // 封顶配置改为数字格式, 10000000表示不封顶
      const badScoreMaxLost = selectedMax === 0 ? 10000000 : maxSubScore;

      // 同伴惩罚配置改为枚举格式
      let dutyConfig = null;
      switch (selectedDuty) {
        case 0:
          dutyConfig = 'NODUTY';
          break;
        case 1:
          dutyConfig = 'DUTY_DINGTOU';
          break;
        case 2:
          dutyConfig = 'DUTY_NEGATIVE';
          break;
      }

      return {
        badScoreBaseLine: badScoreBaseLine,
        badScoreMaxLost: badScoreMaxLost,
        dutyConfig: dutyConfig,
      };
    },

    // 初始化配置数据（供父组件调用）
    initConfigData(configData) {
      console.log('🚨🚨🚨 [E8421Koufen] ========== 开始初始化配置数据 ==========');
      console.log('🚨🚨🚨 [E8421Koufen] 接收到的configData:', JSON.stringify(configData, null, 2));

      this.initializeFromConfigData(configData);
      this.updateDisplayValue();

      console.log('🚨🚨🚨 [E8421Koufen] 初始化完成，当前组件状态:', {
        selectedStart: this.data.selectedStart,
        selectedMax: this.data.selectedMax,
        selectedDuty: this.data.selectedDuty,
        paScore: this.data.paScore,
        doubleParScore: this.data.doubleParScore,
        maxSubScore: this.data.maxSubScore,
        displayValue: this.data.displayValue
      });
      console.log('🚨🚨🚨 [E8421Koufen] ========== 初始化配置数据完成 ==========');
    }
  }
});