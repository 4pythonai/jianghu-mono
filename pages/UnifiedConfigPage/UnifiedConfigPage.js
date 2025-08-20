/**
 * UnifiedConfigPage - 统一的赌博规则配置入口
 * 统一SysEdit和UserRuleEdit的功能，基于模式驱动
 */

const { GambleMetaConfig } = require('../../utils/GambleMetaConfig.js');
const GamesRegistry = require('../../utils/GamesRegistry.js');
const app = getApp()

Page({
    data: {
        // === 统一配置 ===
        mode: '',              // 'add' | 'edit' | 'system-add'
        gameType: '',          // 比赛类型 '4p-lasi', '4p-8421'
        ruleData: null,        // 规则数据

        // === Store引用 === 
        store: null,           // 对应的Store实例
        storeName: '',         // '4p-lasi' or '4p-8421'

        // === 组件配置 ===
        configComponents: [],  // 组件列表（从GamesRegistry获取）

        // === 显示数据 ===
        ruleName: '',
        gameName: '',
        saving: false,

        // === 状态管理 ===
        isManualEdit: false,
        isInitialized: false
    },

    onLoad(options) {
        console.log('🎪 [UnifiedConfigPage] 页面加载:', options);

        const {
            mode = 'system-add',
            gameType = '4p-lasi',
            ruleData: rawRuleData
        } = options;

        this.initializeMode(mode, gameType, rawRuleData);
    },

    // === 初始化逻辑 ===
    initializeMode(mode, gameType, rawRuleData) {
        if (!this.validateInput(mode, gameType)) {
            return;
        }

        // 设置基本数据
        this.setData({
            mode,
            gameType,
            gameName: GambleMetaConfig.getGambleHumanName(gameType)
        });

        // 初始化对应的Store
        this.initializeStore(mode, gameType, rawRuleData);

        // 加载组件配置
        this.loadComponents(gameType);

        // 渲染完成标记
        setTimeout(() => {
            this.setData({ isInitialized: true });
        }, 100);
    },

    validateInput(mode, gameType) {
        const validGameTypes = ['4p-lasi', '4p-8421'];

        if (!validGameTypes.includes(gameType)) {
            wx.showToast({
                title: `不支持的比赛类型: ${gameType}`,
                icon: 'none'
            });
            setTimeout(() => wx.navigateBack(), 1500);
            return false;
        }

        return true;
    },

    // === Store初始化 === 
    initializeStore(mode, gameType, rawRuleData) {
        let store = null;
        let storeName = '';

        if (gameType === '4p-lasi') {
            store = require('../../stores/gamble/4p/4p-lasi/new_gamble_4P_lasi_Store.js').NewG4PLasiStore;
            storeName = '4p-lasi';
        } else if (gameType === '4p-8421') {
            store = require('../../stores/gamble/4p/4p-8421/new_gamble_4P_8421_Store.js').NewG48421Store;
            storeName = '4p-8421';
        }

        // 初始化Store
        const existingData = rawRuleData ? JSON.parse(decodeURIComponent(rawRuleData)) : null;
        store.initialize(mode, existingData);

        // 设置数据和监听
        this.setData({ store, storeName });

        // 同步规则名称
        this.syncRuleName();
    },

    // === 组件加载 === 
    loadComponents(gameType) {
        const components = GamesRegistry.getGambleComponents(gameType);

        this.setData({ configComponents: components });
        console.log('🎪 [UnifiedConfigPage] 加载组件:', components);
    },

    // === 同步状态 ===
    syncRuleName() {
        if (!this.data.store) return;

        const ruleName = this.data.store.config.metadata.ruleName;
        this.setData({ ruleName });
    },

    // === 生命周期 ===
    onReady() {
        // 初始化所有组件
        setTimeout(() => {
            this.initAllComponents();
        }, 200);
    },

    initAllComponents() {
        const { store, configComponents } = this.data;

        configComponents.forEach(component => {
            const instance = this.selectComponent(`#${component.name}`);
            if (instance && instance.initConfigData) {
                const componentData = this.extractComponentData(component, store);
                instance.initConfigData(componentData);
            }
        });
    },

    extractComponentData(component, store) {
        const { rules } = store.config;

        switch (component.type) {
            case 'lasi-eatmeat':
            case 'e8421-meat':
                return {
                    eatingRange: rules.meatRules.eatingRange,
                    meatValueConfig: rules.meatRules.meatValueConfig,
                    meatMaxValue: rules.meatRules.meatMaxValue
                };

            case 'lasi-kpi':
                return {
                    indicators: rules.kpiConfiguration.indicators,
                    kpiValues: rules.kpiConfiguration.kpiValues
                };

            case 'lasi-dingdong':
                return { mode: rules.dingdong.mode };

            case 'e8421-koufen':
                return { deductionRules: rules.pointDeduction.deductionRules };

            case 'draw-8421':
                return { drawConfig: rules.drawConfig };

            default:
                return {};
        }
    },

    // === 事件处理 ===
    onRuleNameInput(e) {
        const name = e.detail.value;
        if (!this.data.store) return;

        this.data.store.updateRuleName(name);
        this.setData({
            ruleName: name,
            isManualEdit: true
        });
    },

    onComponentConfigChange(e) {
        const { component, data } = e.detail;
        console.log('🎪 [UnifiedConfigPage] 组件配置变化:', component, data);

        if (!this.data.store) return;

        // 根据组件类型更新Store中的相应配置
        switch (component) {
            case 'LasiEatmeat':
            case 'E8421Meat':
                this.data.store.updateMeatRules(data);
                break;

            case 'LasiKPI':
                this.data.store.updateKPIConfig(data);
                break;

            case 'LasiDingDong':
                this.data.store.updateDingdong(data);
                break;

            case 'E8421Koufen':
                this.data.store.updatePointDeduction(data);
                break;

            case 'Draw8421':
                this.data.store.updateDrawConfig(data);
                break;
        }
    },

    // === 保存功能 ===
    onSaveRule() {
        if (!this.validateSave()) {
            return;
        }

        this.setData({ saving: true });

        const saveData = this.data.store.getSaveData();
        const isEdit = this.data.mode === 'edit';

        const apiMethod = isEdit ? app.api.gamble.updateGambleRule : app.api.gamble.addGambleRule;

        apiMethod(saveData)
            .then(res => {
                if (res.code === 200) {
                    wx.showToast({
                        title: isEdit ? '规则更新成功' : '规则保存成功',
                        icon: 'success'
                    });

                    setTimeout(() => {
                        wx.redirectTo({ url: '/pages/rules/rules?activeTab=0' });
                    }, 1000);
                } else {
                    throw new Error(res.message);
                }
            })
            .catch(err => {
                console.error('🎪 [UnifiedConfigPage] 保存失败:', err);
                wx.showToast({
                    title: err.message || '保存失败',
                    icon: 'none'
                });
            })
            .finally(() => {
                this.setData({ saving: false });
            });
    },

    validateSave() {
        const ruleName = this.data.ruleName.trim();

        if (!ruleName) {
            wx.showToast({
                title: '请输入规则名称',
                icon: 'none'
            });
            return false;
        }

        if (ruleName.length < 2) {
            wx.showToast({
                title: '规则名称至少2个字符',
                icon: 'none'
            });
            return false;
        }

        return true;
    },

    // === 工具方法 ===
    onCancel() {
        wx.showModal({
            title: '确认取消',
            content: '确定要取消' +
                (this.data.mode === 'add' ? '新建' : '编辑') +
                '？未保存的内容将丢失。',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateBack();
                }
            }
        });
    },

    onBack() {
        wx.navigateBack();
    }
});