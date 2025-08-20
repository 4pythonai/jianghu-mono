/**
 * 用户规则编辑/新建页面 - 重构版
 * 使用统一的Gamble4PLasiStore管理状态
 * 支持mode驱动的新建/编辑/查看行为
 */

const app = getApp()
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { Gamble4PLasiStore } from '../../../stores/gamble/4p/4p-lasi/Gamble4PLasiStore.js'
// const { GambleMetaConfig } = require('../../../utils/GambleMetaConfig.js') // 暂时移除，重构后不再需要

Page({
    behaviors: [storeBindingsBehavior],

    storeBindings: {
        store: Gamble4PLasiStore,
        fields: {
            // 从Store获取状态
            storeMode: 'mode',
            storeMetadata: 'metadata',
            storeConfig: 'config',
            isStoreInitialized: 'isInitialized',
            isDirty: 'isDirty',
            // 计算属性
            kpiDisplayValue: 'kpiDisplayValue',
            eatmeatDisplayValue: 'eatmeatDisplayValue',
            isEatmeatDisabled: 'isEatmeatDisabled',
            dingdongDisplayValue: 'dingdongDisplayValue',
            baodongDisplayValue: 'baodongDisplayValue'
        },
        actions: {
            // 从Store获取方法
            initializeStore: 'initialize',
            updateKpiConfig: 'updateKpiConfig',
            updateEatmeatConfig: 'updateEatmeatConfig',
            updateRewardConfig: 'updateRewardConfig',
            updateDingdongConfig: 'updateDingdongConfig',
            updateBaodongConfig: 'updateBaodongConfig',
            updateRuleName: 'updateRuleName',
            getSaveData: 'getSaveData',
            getComponentData: 'getComponentData',
            resetStore: 'reset'
        }
    },

    data: {
        // === 页面状态 ===
        pageMode: 'edit',           // 'create' | 'edit' | 'view' (页面模式)
        saving: false,              // 保存状态
        loading: false,             // 加载状态

        // === 页面数据 ===
        ruleId: null,               // 编辑模式下的规则ID
        gambleHumanName: '',        // 游戏类型显示名

        // === 组件配置 ===
        configComponents: [         // 4人拉丝固定的组件列表
            { name: 'LasiKPI', title: 'KPI规则' },
            { name: 'LasiRewardConfig', title: '奖励配置' },
            { name: 'LasiDingDong', title: '顶洞规则' },
            { name: 'LasiEatmeat', title: '吃肉规则' },
            { name: 'LasiKoufen', title: '包洞规则' }
        ],

        // === UI状态 ===
        isManualRuleName: false     // 是否手动编辑过规则名
    },

    onLoad(options) {
        console.log('🔄 [UserRuleEdit] 页面加载，参数:', options)

        // 解析参数确定页面模式
        this.parseOptions(options)
    },

    // === 初始化方法 ===

    // 解析URL参数，确定页面模式
    parseOptions(options) {
        const { mode, ruleId, ruleData } = options

        // 确定页面模式
        let pageMode = 'edit' // 默认编辑模式
        if (mode === 'create') {
            pageMode = 'create'
        } else if (mode === 'view') {
            pageMode = 'view'
        }

        this.setData({
            pageMode,
            ruleId: ruleId || null,
            gambleHumanName: '四人拉丝' // 固定为4人拉丝
        })

        // 根据模式初始化Store
        if (pageMode === 'create') {
            this.initializeForCreate()
        } else if ((pageMode === 'edit' || pageMode === 'view') && ruleData) {
            this.initializeForEdit(ruleData)
        } else {
            this.showErrorAndReturn('参数错误：缺少必要参数')
        }
    },

    // 新建模式初始化
    initializeForCreate() {
        console.log('🆕 [UserRuleEdit] 初始化新建模式')

        this.setData({ loading: true })

        try {
            // 使用Store的create模式初始化
            this.initializeStore('create')

            // 设置页面标题
            wx.setNavigationBarTitle({
                title: '新建拉丝规则'
            })

            this.setData({ loading: false })

        } catch (error) {
            console.error('❌ [UserRuleEdit] 新建模式初始化失败:', error)
            this.showErrorAndReturn('初始化失败')
        }
    },

    // 编辑模式初始化
    initializeForEdit(encodedRuleData) {
        console.log('✏️ [UserRuleEdit] 初始化编辑模式')

        this.setData({ loading: true })

        try {
            // 解析规则数据
            const ruleData = JSON.parse(decodeURIComponent(encodedRuleData))
            console.log('📊 [UserRuleEdit] 解析的规则数据:', ruleData)

            // 验证数据
            if (!ruleData.gambleSysName || ruleData.gambleSysName !== '4p-lasi') {
                throw new Error('不支持的游戏类型')
            }

            // 使用Store的edit模式初始化
            this.initializeStore(this.data.pageMode, ruleData)

            // 设置页面标题
            const title = this.data.pageMode === 'view' ? '查看拉丝规则' : '编辑拉丝规则'
            wx.setNavigationBarTitle({ title })

            this.setData({ loading: false })

        } catch (error) {
            console.error('❌ [UserRuleEdit] 编辑模式初始化失败:', error)
            this.showErrorAndReturn('数据解析失败')
        }
    },

    // === Store数据变化监听 ===

    // 监听Store初始化完成
    _storeInitializedHandler() {
        if (this.data.isStoreInitialized) {
            console.log('✅ [UserRuleEdit] Store初始化完成，同步组件数据')
            this.syncComponentsWithStore()
        }
    },

    // 同步组件数据
    syncComponentsWithStore() {
        const componentData = this.getComponentData()
        console.log('🔄 [UserRuleEdit] 向子组件同步数据:', componentData)

        // 延迟执行确保组件已渲染
        setTimeout(() => {
            this.data.configComponents.forEach(component => {
                const componentInstance = this.selectComponent(`#${component.name}`)
                if (componentInstance && componentInstance.syncWithStore) {
                    componentInstance.syncWithStore(componentData)
                }
            })
        }, 100)
    },

    // === 事件处理 ===

    // 规则名称手动输入
    onRuleNameInput(e) {
        const value = e.detail.value.trim()
        console.log('✏️ [UserRuleEdit] 手动更新规则名:', value)

        this.setData({ isManualRuleName: true })
        this.updateRuleName(value)
    },

    // LasiKPI配置变化 - 可能触发规则名自动更新
    onLasiKpiConfigChange(e) {
        const { config, generatedRuleName } = e.detail
        console.log('📊 [UserRuleEdit] KPI配置变化:', { config, generatedRuleName })

        // 更新Store中的KPI配置
        this.updateKpiConfig(config)

        // 如果有生成的规则名且用户未手动编辑，则自动更新
        if (generatedRuleName && !this.data.isManualRuleName && this.data.pageMode === 'create') {
            this.updateRuleName(generatedRuleName)
        }
    },

    // 吃肉配置变化
    onLasiEatmeatConfigChange(e) {
        const { config } = e.detail
        console.log('🥩 [UserRuleEdit] 吃肉配置变化:', config)
        this.updateEatmeatConfig(config)
    },

    // 奖励配置变化
    onLasiRewardConfigChange(e) {
        const { config } = e.detail
        console.log('🏆 [UserRuleEdit] 奖励配置变化:', config)
        this.updateRewardConfig(config)
    },

    // 顶洞配置变化
    onLasiDingdongConfigChange(e) {
        const { config } = e.detail
        console.log('🕳️ [UserRuleEdit] 顶洞配置变化:', config)
        this.updateDingdongConfig(config)
    },

    // 包洞配置变化
    onLasiKoufenConfigChange(e) {
        const { config } = e.detail
        console.log('🏳️ [UserRuleEdit] 包洞配置变化:', config)
        this.updateBaodongConfig(config)
    },

    // === 保存和验证 ===

    // 表单验证
    validateForm() {
        if (!this.data.storeMetadata?.gambleUserName?.trim()) {
            wx.showToast({
                title: '请输入规则名称',
                icon: 'none'
            })
            return false
        }

        if (this.data.storeMetadata.gambleUserName.trim().length < 2) {
            wx.showToast({
                title: '规则名称至少2个字符',
                icon: 'none'
            })
            return false
        }

        return true
    },

    // 保存规则
    onSaveRule() {
        if (!this.validateForm()) {
            return
        }

        // 查看模式不允许保存
        if (this.data.pageMode === 'view') {
            wx.showToast({
                title: '查看模式不能保存',
                icon: 'none'
            })
            return
        }

        this.setData({ saving: true })

        try {
            // 从Store获取保存数据
            const saveData = this.getSaveData()
            console.log('💾 [UserRuleEdit] 准备保存数据:', saveData)

            // 根据模式调用不同的API
            const apiPromise = this.data.pageMode === 'create'
                ? app.api.gamble.createGambleRule(saveData)
                : app.api.gamble.updateGambleRule({
                    id: this.data.ruleId,
                    ...saveData
                })

            apiPromise
                .then(res => {
                    console.log('✅ [UserRuleEdit] 保存成功:', res)

                    const message = this.data.pageMode === 'create' ? '规则创建成功' : '规则更新成功'
                    wx.showToast({
                        title: message,
                        icon: 'success'
                    })

                    // 延迟返回上一页并刷新
                    setTimeout(() => {
                        this.navigateBackWithRefresh()
                    }, 1500)
                })
                .catch(err => {
                    console.error('❌ [UserRuleEdit] 保存失败:', err)
                    wx.showToast({
                        title: '保存失败，请重试',
                        icon: 'none'
                    })
                })
                .finally(() => {
                    this.setData({ saving: false })
                })

        } catch (error) {
            console.error('❌ [UserRuleEdit] 保存数据准备失败:', error)
            wx.showToast({
                title: '数据准备失败',
                icon: 'none'
            })
            this.setData({ saving: false })
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
    executeDelete() {
        this.setData({ saving: true })

        app.api.gamble.deleteGambleRule(this.data.ruleId)
            .then(res => {
                console.log('🗑️ [UserRuleEdit] 删除成功:', res)
                wx.showToast({
                    title: '规则已删除',
                    icon: 'success'
                })
                setTimeout(() => {
                    this.navigateBackWithRefresh()
                }, 1500)
            })
            .catch(err => {
                console.error('❌ [UserRuleEdit] 删除失败:', err)
                wx.showToast({
                    title: '删除失败，请重试',
                    icon: 'none'
                })
            })
            .finally(() => {
                this.setData({ saving: false })
            })
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

    // === 辅助方法 ===

    // 显示错误并返回
    showErrorAndReturn(message) {
        wx.showToast({
            title: message,
            icon: 'none'
        })
        setTimeout(() => wx.navigateBack(), 1500)
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

    // === 生命周期 ===

    onShow() {
        // 监听Store初始化状态
        if (this.data.isStoreInitialized) {
            this._storeInitializedHandler()
        }
    },

    onUnload() {
        console.log('🚪 [UserRuleEdit] 页面卸载，重置Store')
        // 页面卸载时重置Store
        this.resetStore()
    }
})