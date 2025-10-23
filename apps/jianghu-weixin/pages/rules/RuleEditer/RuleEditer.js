
const app = getApp()
import { storeBindingsBehavior, createStoreBindings } from 'mobx-miniprogram-bindings'
const { GambleEditorConfig } = require('@/utils/GambleEditorConfig.js')

Page({
    behaviors: [storeBindingsBehavior],

    // 动态Store绑定 - 在onLoad后设置
    storeBindings: null,

    data: {
        // === 页面状态 ===
        pageMode: 'edit',           // 'create' | 'edit' | 'view' (页面模式)
        saving: false,              // 保存状态
        loading: false,             // 加载状态
        initializing: true,         // 初始化状态

        // === 游戏配置 ===
        gambleType: null,             // 游戏类型 
        gameConfig: null,           // 游戏编辑器配置
        dynamicStore: null,         // 动态Store实例

        // === 页面数据 ===
        ruleId: null,               // 编辑模式下的规则ID
        gambleHumanName: '',        // 游戏类型显示名
        configComponents: [],       // 动态组件配置列表
        actionMap: {},              // 事件到Action的映射

        isManualRuleName: false,    // 是否手动编辑过规则名
        ruleNameRef: null           // RuleName组件引用
    },

    async onLoad(options) {
        console.log(' 🟢🟡🟠🔴 [RuleEditer] 页面加载，参数:', options)
        await this.initializeEditor(options)
    },

    // === 初始化方法 ===

    // 初始化编辑器 - 动态配置游戏类型
    async initializeEditor(options) {
        try {
            const { gambleType, pageMode, ruleId, ruleData } = options

            // 验证游戏类型
            if (!gambleType || !GambleEditorConfig.isGameTypeSupported(gambleType)) {
                throw new Error(`不支持的游戏类型: ${gambleType}`)
            }

            // 获取游戏配置
            const gameConfig = GambleEditorConfig.getEditorConfig(gambleType)
            const gambleHumanName = GambleEditorConfig.getGameHumanName(gambleType)

            console.log('🎮 [RuleEditer] 初始化游戏编辑器:', {
                gambleType,
                gambleHumanName,
                componentCount: gameConfig.components.length
            })

            // 获取Store类（静态方式）
            const StoreClass = GambleEditorConfig.getStoreClass(gambleType)

            // 设置页面数据
            this.setData({
                gambleType,
                gameConfig,
                gambleHumanName,
                configComponents: gameConfig.components,
                actionMap: gameConfig.actionMap,
                dynamicStore: StoreClass,
                pageMode,
                ruleId: ruleId || null,
                initializing: false
            })

            // 动态设置Store绑定
            this.setStoreBindings(StoreClass, gameConfig.storeBindings)

            // 根据模式初始化Store
            if (pageMode === 'create') {
                this.initializeForCreate(gambleType)
            }

            if ((pageMode === 'edit' || pageMode === 'view') && ruleData) {
                this.initializeForEdit(ruleData)
            }

        } catch (error) {
            console.error('❌ [RuleEditer] 初始化失败:', error)
            wx.showModal({
                title: '初始化失败',
                content: error.message || '编辑器初始化失败，请重试',
                showCancel: false,
                success: () => {
                    wx.navigateBack()
                }
            })
        }
    },

    // 动态设置Store绑定
    setStoreBindings(store, bindings) {
        // 使用MobX的createStoreBindings方法
        if (this.storeBindings) {
            this.storeBindings.destroyStoreBindings();
        }

        this.storeBindings = createStoreBindings(this, {
            store: store,
            fields: bindings.fields,
            actions: bindings.actions
        });

        console.log('✅ [RuleEditer] Store绑定设置完成:', {
            storeType: typeof store,
            fieldsCount: Object.keys(bindings.fields).length,
            actionsCount: Object.keys(bindings.actions).length
        });
    },


    // Store初始化完成处理（MobX自动处理数据同步）
    _storeInitializedHandler() {
        if (this.data.isStoreInitialized) {
            console.log('✅ [RuleEditer] Store初始化完成，MobX将自动同步组件数据')
        }
    },


    // 规则名称变化（来自RuleName组件）
    onRuleNameChange(e) {
        const { value, isManualEdit } = e.detail
        this.setData({ isManualRuleName: isManualEdit })
        this.updateRuleName(value)
    },

    // 通用配置变更处理 - 使用动态Action映射
    onConfigChange(e) {
        const { componentType, config } = e.detail;

        // 使用动态actionMap进行路由
        const action = this.data.actionMap[componentType];
        if (action && this[action]) {
            console.log(`🔄 [RuleEditer] 处理配置变更: ${componentType} -> ${action}`);
            this[action](config);
        } else {
            console.warn(`🚨 [RuleEditer] 未知的组件类型或Action: ${componentType} -> ${action}`);
        }

        // 注意：规则名自动生成现在由RuleName组件内部处理
    },

    // === 表单验证和保存 ===
    validateForm() {
        if (!this.data.gambleUserName?.trim()) {
            wx.showToast({
                title: '请输入规则名称',
                icon: 'none'
            })
            return false
        }

        if (this.data.gambleUserName.trim().length < 2) {
            wx.showToast({
                title: '规则名称至少2个字符',
                icon: 'none'
            })
            return false
        }

        return true
    },

    // 保存规则
    async onSaveRule() {
        if (!this.validateForm()) {
            return
        }
        this.setData({ saving: true })


        // 从Store获取保存数据
        const saveData = this.getSaveData()

        // 根据模式调用不同的API
        const res = this.data.pageMode === 'create'
            ? await app.api.gamble.addGambleRule(saveData)
            : await app.api.gamble.updateGambleRule({
                id: this.data.ruleId,
                ...saveData
            })


        if (res.code === 200) {
            const message = this.data.pageMode === 'create' ? '规则创建成功' : '规则更新成功'
            wx.showToast({
                title: message,
                icon: 'success'
            })

            // 延迟跳转页面
            setTimeout(() => {
                if (this.data.pageMode === 'create') {
                    // 创建模式：跳转到rules页面的"我的规则"tab，显示新创建的规则
                    wx.navigateTo({
                        url: '/pages/rules/rules?activeTab=0'
                    })
                } else {
                    // 编辑模式：返回上一页并刷新
                    this.navigateBackWithRefresh()
                }
            }, 1500)
        } else {
            wx.showToast({
                title: '保存失败，请重试',
                icon: 'none'
            })
        }

    },

    // 删除规则 - 仅编辑模式可用
    onDeleteRule() {
        if (this.data.pageMode !== 'edit') {
            return
        }

        wx.showModal({
            title: '确认删除',
            content: '确定要删除这个规则吗？删除后无法恢复。',
            confirmText: '删除',
            confirmColor: '#ff4757',
            success: (res) => {
                if (res.confirm) {
                    this.executeDelete()
                }
            }
        })
    },

    // 执行删除
    async executeDelete() {
        this.setData({ saving: true })

        const res = await app.api.gamble.deleteGambleRule(this.data.ruleId)

        if (res.code === 200) {
            console.log('🗑️ [RuleEditer] 删除成功:', res)
            wx.showToast({
                title: '规则已删除',
                icon: 'success'
            })
            setTimeout(() => {
                this.navigateBackWithRefresh()
            }, 1500)
        } else {
            wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
            })
        }

        this.setData({ saving: false })
    },

    // 取消编辑
    onCancel() {
        // 查看模式直接返回
        if (this.data.pageMode === 'view') {
            wx.navigateBack()
            return
        }

        // 有未保存的修改时提示确认
        if (this.data.isDirty) {
            wx.showModal({
                title: '确认取消',
                content: '确定要取消吗？未保存的内容将丢失。',
                success: (res) => {
                    if (res.confirm) {
                        wx.navigateBack()
                    }
                }
            })
        } else {
            wx.navigateBack()
        }
    },


    // 获取Store实例
    _getStoreInstance() {
        return this.data.dynamicStore;
    },

    // 重置Store
    resetStore() {
        const store = this._getStoreInstance();
        if (store && store.resetStore) {
            store.resetStore();
        }
        console.log('🔄 [RuleEditer] Store已重置');
    },

    // 创建模式初始化
    initializeForCreate(gambleType) {
        const store = this._getStoreInstance();
        if (store && store.initializeStore) {
            store.initializeStore('create', gambleType);
        }
        console.log('🆕 [RuleEditer] 创建模式初始化完成');
    },

    // 编辑模式初始化
    initializeForEdit(ruleData) {
        const store = this._getStoreInstance();
        if (store && store.initializeStore) {
            store.initializeStore('edit', this.data.gambleType, ruleData);
        }
        console.log('✏️ [RuleEditer] 编辑模式初始化完成');
    },

    // 更新规则名称
    updateRuleName(name) {
        const store = this._getStoreInstance();
        if (store && store.updateRuleName) {
            store.updateRuleName(name);
        }
    },

    // 获取保存数据
    getSaveData() {
        const store = this._getStoreInstance();
        if (store && store.getSaveData) {
            return store.getSaveData();
        }
        return {};
    },

    // === 动态Action方法 ===
    // 这些方法通过actionMap动态调用Store的对应方法

    updateKpis(config) {
        const store = this._getStoreInstance();
        if (store && store.updateKpis) {
            store.updateKpis(config);
        }
    },

    updateRewardConfig(config) {
        const store = this._getStoreInstance();
        if (store && store.updateRewardConfig) {
            store.updateRewardConfig(config);
        }
    },

    updateBaoDongConfig(config) {
        const store = this._getStoreInstance();
        if (store && store.updateBaoDongConfig) {
            store.updateBaoDongConfig(config);
        }
    },

    updateEatmeatConfig(config) {
        const store = this._getStoreInstance();
        if (store && store.updateEatmeatConfig) {
            store.updateEatmeatConfig(config);
        }
    },

    updateDingDongConfig(config) {
        const store = this._getStoreInstance();
        if (store && store.updateDingDongConfig) {
            store.updateDingDongConfig(config);
        }
    },

    // 8421游戏类型的Action方法
    updateKoufenConfig(config) {
        const store = this._getStoreInstance();
        if (store && store.updateKoufenConfig) {
            store.updateKoufenConfig(config);
        }
    },

    updateMeatConfig(config) {
        const store = this._getStoreInstance();
        if (store && store.updateMeatConfig) {
            store.updateMeatConfig(config);
        }
    },

    updateDrawConfig(config) {
        const store = this._getStoreInstance();
        if (store && store.updateDrawConfig) {
            store.updateDrawConfig(config);
        }
    },


    // 返回上一页并刷新
    navigateBackWithRefresh() {
        const pages = getCurrentPages()
        const prevPage = pages[pages.length - 2]
        if (prevPage && prevPage.onShow) {
            prevPage.onShow()
        }
        wx.navigateBack()
    },

    onShow() {
        // 监听Store初始化状态
        if (this.data.isStoreInitialized) {
            this._storeInitializedHandler()
        }
    },

    onUnload() {
        console.log('🚪 [RuleEditer] 页面卸载，清理Store绑定')

        // 清理Store绑定
        if (this.storeBindings) {
            this.storeBindings.destroyStoreBindings();
            this.storeBindings = null;
        }

        // 重置Store
        this.resetStore()
    }
})