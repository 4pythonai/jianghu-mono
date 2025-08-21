
const app = getApp()
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { Gamble4PLasiStore } from '../../../stores/gamble/4p/4p-lasi/Gamble4PLasiStore.js'

Page({
    behaviors: [storeBindingsBehavior],

    storeBindings: {
        store: Gamble4PLasiStore,
        fields: {
            // 从Store获取状态
            storeMode: 'mode',
            isStoreInitialized: 'isInitialized',
            isDirty: 'isDirty',

            // 直接绑定数据库字段
            gambleUserName: 'gambleUserName',
            kpis: 'kpis',
            eatingRange: 'eatingRange',
            RewardConfig: 'RewardConfig',
            meatValueConfig: 'meatValueConfig',
            meatMaxValue: 'meatMaxValue',
            drawConfig: 'drawConfig',
            dutyConfig: 'dutyConfig',
            PartnerDutyCondition: 'PartnerDutyCondition',
            badScoreBaseLine: 'badScoreBaseLine',
            badScoreMaxLost: 'badScoreMaxLost',

            // 计算属性
            isEatmeatDisabled: 'isEatmeatDisabled',
            showPreCondition: 'showPreCondition',
            kpiDisplayValue: 'kpiDisplayValue'
        },
        actions: {
            // 基础方法
            initializeStore: 'initializeStore',
            initializeForCreate: 'initializeForCreate',
            initializeForEdit: 'initializeForEdit',
            getSaveData: 'getSaveData',
            resetStore: 'reset',

            // 简化的配置更新方法
            updateKpis: 'updateKpis',
            updateRewardConfig: 'updateRewardConfig',
            updateBaoDongConfig: 'updateBaoDongConfig',
            updateEatmeatConfig: 'updateEatmeatConfig',
            updateDingDongConfig: 'updateDingDongConfig',
            updateRuleName: 'updateRuleName'
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
            { name: 'LasiBaoDong', title: '包洞规则' }
        ],

        isManualRuleName: false     // 是否手动编辑过规则名
    },

    onLoad(options) {
        console.log('🔄 [UserRuleEdit] 页面加载，参数:', options)
        this.parseOptions(options)
    },

    // === 初始化方法 ===

    // 解析URL参数，确定页面模式
    parseOptions(options) {
        const { pageMode, ruleId, ruleData } = options
        console.log("🟡🟠🔴🟡🟠🔴", options)
        this.setData({
            pageMode,
            ruleId: ruleId || null,
            gambleHumanName: '四人拉丝' // 固定为4人拉丝
        })

        // 根据模式初始化Store
        if (pageMode === 'create') {
            this.initializeForCreate('4p-lasi')
        }

        if ((pageMode === 'edit' || pageMode === 'view') && ruleData) {
            this.initializeForEdit(ruleData)
        }
    },


    // Store初始化完成处理（MobX自动处理数据同步）
    _storeInitializedHandler() {
        if (this.data.isStoreInitialized) {
            console.log('✅ [UserRuleEdit] Store初始化完成，MobX将自动同步组件数据')
        }
    },


    // 规则名称手动输入
    onRuleNameInput(e) {
        const value = e.detail.value.trim()
        this.setData({ isManualRuleName: true })
        this.updateRuleName(value)
    },

    // 薄薄的协调层 - 简化的配置变更处理
    onConfigChange(e) {
        const { componentType, config, generatedRuleName } = e.detail;

        // 薄薄的路由：直接映射到Store复合方法
        const actionMap = {
            'kpi': 'updateKpis',
            'dingdong': 'updateDingDongConfig',
            'baodong': 'updateBaoDongConfig',
            'eatmeat': 'updateEatmeatConfig',
            'reward': 'updateRewardConfig'
        };

        const action = actionMap[componentType];
        if (action && this[action]) {
            this[action](config);
        } else {
            console.warn(`🚨 [UserRuleEdit] 未知的组件类型: ${componentType}`);
        }

        // 只处理跨组件协调逻辑：规则名自动更新
        if (generatedRuleName && !this.data.isManualRuleName && this.data.pageMode === 'create') {
            this.updateRuleName(generatedRuleName);
        }
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

            // 延迟返回上一页并刷新
            setTimeout(() => {
                this.navigateBackWithRefresh()
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
            console.log('🗑️ [UserRuleEdit] 删除成功:', res)
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
        return Gamble4PLasiStore;
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
        console.log('🚪 [UserRuleEdit] 页面卸载，重置Store')
        this.resetStore()
    }
})