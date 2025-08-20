// 用户规则编辑页面
const app = getApp()
const { GambleMetaConfig } = require('../../../utils/GambleMetaConfig.js');

Page({
    data: {
        ruleId: '', // 规则ID
        ruleData: null, // 规则数据
        _gambleSysName: '',
        _gambleUserName: '',
        _gambleHumanName: '',
        saving: false, // 保存状态
        configComponents: [], // 配置组件列表
        isInitialized: false, // 是否已完成初始化
        isManualEdit: false // 是否手动编辑过规则名称
    },

    onLoad(options) {
        console.log('🅾️🅾️ [UserRuleEdit] 页面加载，参数:', options);
        const { ruleId, ruleData } = options;

        if (!ruleId) {
            wx.showToast({
                title: '缺少规则ID参数',
                icon: 'none'
            });
            setTimeout(() => wx.navigateBack(), 1500);
            return;
        }

        this.setData({ ruleId });

        // 解析并初始化规则数据
        if (ruleData) {
            try {
                const parsedRuleData = JSON.parse(decodeURIComponent(ruleData));
                this.initializeWithRuleData(parsedRuleData);
            } catch (error) {
                console.error('📋 [UserRuleEdit] 解析规则数据失败:', error);
                wx.showToast({
                    title: '数据解析失败',
                    icon: 'none'
                });
                setTimeout(() => wx.navigateBack(), 1500);
            }
        } else {
            wx.showToast({
                title: '缺少规则数据',
                icon: 'none'
            });
            setTimeout(() => wx.navigateBack(), 1500);
        }
    },

    // 使用传递的规则数据初始化页面
    initializeWithRuleData(ruleData) {

        // 确定游戏类型
        const _gambleSysName = ruleData.gambleSysName;


        // 获取游戏配置
        const _name = GambleMetaConfig.getGambleHumanName(_gambleSysName);

        if (!_name) {
            wx.showToast({
                title: `无效的游戏类型: ${_gambleSysName}`,
                icon: 'none'
            });
            setTimeout(() => wx.navigateBack(), 1500);
            return;
        }

        // 设置页面数据 gambleUserName
        this.setData({
            ruleData,
            _gambleSysName: _gambleSysName,
            _gambleHumanName: _name,
            _gambleUserName: ruleData.gambleUserName
        });

        // 根据游戏类型加载对应的配置组件
        this.loadConfigComponents(_gambleSysName);
    },



    // 根据游戏类型加载配置组件
    loadConfigComponents(_gambleSysName) {
        let components = [];

        // 根据游戏类型确定需要的配置组件
        switch (_gambleSysName) {
            case '4p-8421':
                components = [
                    { name: 'E8421Koufen', title: '扣分规则' },
                    { name: 'Draw8421', title: '顶洞规则' },
                    { name: 'E8421Meat', title: '吃肉规则' }
                ];
                break;
            case '4p-lasi':
                components = [
                    { name: 'LasiKoufen', title: '扣分规则' },
                    { name: 'LasiKPI', title: 'KPI规则' },
                    { name: 'LasiRewardConfig', title: '奖励配置' },
                    { name: 'LasiEatmeat', title: '吃肉规则' },
                    { name: 'LasiDingDong', title: '顶洞规则' }
                ];
                break;
            // 可以继续添加其他游戏类型的配置组件
            default:
                components = [
                    { name: 'DefaultConfig', title: '默认配置' }
                ];
        }

        this.setData({ configComponents: components });
        console.log('📋 [UserRuleEdit] 加载配置组件:', components);

        // 初始化配置组件数据
        this.initConfigComponents();

        // 标记初始化完成
        setTimeout(() => {
            this.setData({ isInitialized: true });
        }, 200);
    },

    // 初始化配置组件数据 - 支持扁平化数据结构
    initConfigComponents() {
        const { ruleData, configComponents } = this.data;

        if (!ruleData) {
            return;
        }

        // 延迟执行，确保组件已渲染
        setTimeout(() => {
            for (const component of configComponents) {
                const componentInstance = this.selectComponent(`#${component.name}`);

                if (componentInstance?.initConfigData) {
                    componentInstance.initConfigData(ruleData);
                }
            }
        }, 100);
    },

    // 规则名称输入事件
    onRuleNameInput(e) {
        const value = e.detail.value;
        this.setData({
            _gambleUserName: value,
            isManualEdit: true // 标记为手动编辑
        });
        console.log('📋 [UserRuleEdit] 规则名称已手动更新:', value);
    },

    // 处理拉丝KPI配置变化
    onLasiKpiConfigChange(e) {
        const { generatedRuleName } = e.detail;
        console.log('📋 [UserRuleEdit] 收到LasiKPI配置变化:', e.detail);

        // 只有在初始化完成后，才处理KPI配置变化
        if (!this.data.isInitialized) {
            console.log('📋 [UserRuleEdit] 初始化阶段，忽略KPI配置变化');
            return;
        }

        if (generatedRuleName && !this.data.isManualEdit) {
            // 只有在用户没有手动编辑时才自动更新规则名称
            this.setData({
                _gambleUserName: generatedRuleName
            });
            console.log('📋 [UserRuleEdit] 规则名称已自动更新为:', generatedRuleName);
        } else if (generatedRuleName && this.data.isManualEdit) {
            console.log('📋 [UserRuleEdit] 用户已手动编辑规则名称，跳过自动更新');
        }
    },

    // 验证表单
    validateForm() {
        const { _gambleUserName } = this.data;

        if (!_gambleUserName || _gambleUserName.trim() === '') {
            wx.showToast({
                title: '请输入规则名称',
                icon: 'none'
            });
            return false;
        }

        if (_gambleUserName.trim().length < 2) {
            wx.showToast({
                title: '规则名称至少2个字符',
                icon: 'none'
            });
            return false;
        }

        return true;
    },

    // 保存规则
    onSaveRule() {
        if (!this.validateForm()) {
            return;
        }

        this.setData({ saving: true });

        // 收集所有配置组件的数据
        const configData = this.collectConfigData();

        // 构建更新数据 - 使用扁平化结构
        const updateData = {
            id: this.data.ruleId,
            gambleUserName: this.data._gambleUserName,
            gambleSysName: this.data._gambleSysName,
            playersNumber: this.data.ruleData?.playersNumber, // 直接使用后台字段
            updateTime: new Date().toISOString(),
            ...configData
        };

        console.log('📋 [UserRuleEdit] 更新规则数据:', updateData);

        // 调用API更新规则
        app.api.gamble.updateGambleRule(updateData)
            .then(res => {
                console.log('📋 [UserRuleEdit] 更新成功:', res);
                wx.showToast({
                    title: '规则更新成功',
                    icon: 'success'
                });

                // 返回上一页并刷新
                setTimeout(() => {
                    const pages = getCurrentPages();
                    const prevPage = pages[pages.length - 2];
                    prevPage?.onShow?.();
                    wx.navigateBack();
                }, 1500);
            })
            .catch(err => {
                console.error('📋 [UserRuleEdit] 更新失败:', err);
                wx.showToast({
                    title: '更新失败，请重试',
                    icon: 'none'
                });
            })
            .finally(() => {
                this.setData({ saving: false });
            });
    },

    // 收集配置组件数据 - 改为扁平化结构
    collectConfigData() {
        const flatData = {};

        console.log('📋 [UserRuleEdit] 开始收集配置数据（扁平化），组件列表:', this.data.configComponents);

        // 遍历所有配置组件，收集数据并合并到扁平结构中
        for (const component of this.data.configComponents) {
            console.log('📋 [UserRuleEdit] 正在收集组件', component.name, '的数据');
            const componentInstance = this.selectComponent(`#${component.name}`);

            if (componentInstance?.getConfigData) {
                const data = componentInstance.getConfigData();
                console.log('📋 [UserRuleEdit] 组件', component.name, '返回数据:', data);

                // 检查eatingRange字段的特殊处理
                if (data.eatingRange) {
                    console.log('📋 [UserRuleEdit] 检测到eatingRange字段:', {
                        type: typeof data.eatingRange,
                        isArray: Array.isArray(data.eatingRange),
                        value: data.eatingRange,
                        keys: Object.keys(data.eatingRange)
                    });
                }

                // 将组件数据合并到扁平结构中
                Object.assign(flatData, data);
            } else {
                console.warn('📋 [UserRuleEdit] 组件', component.name, '没有 getConfigData 方法');
            }
        }

        console.log('📋 [UserRuleEdit] 收集到的扁平化配置数据:', flatData);

        // 最终检查eatingRange字段
        if (flatData.eatingRange) {
            console.log('📋 [UserRuleEdit] 最终eatingRange字段检查:', {
                type: typeof flatData.eatingRange,
                isArray: Array.isArray(flatData.eatingRange),
                value: flatData.eatingRange,
                keys: Object.keys(flatData.eatingRange)
            });
        }

        return flatData;
    },

    // 删除规则
    onDeleteRule() {
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这个规则吗？删除后无法恢复。',
            confirmText: '删除',
            confirmColor: '#ff4757',
            success: (res) => {
                if (res.confirm) {
                    this.deleteRule();
                }
            }
        });
    },

    // 执行删除
    deleteRule() {
        this.setData({ saving: true });

        app.api.gamble.deleteGambleRule(this.data.ruleId)
            .then(res => {
                console.log('📋 [UserRuleEdit] 删除成功:', res);
                wx.showToast({
                    title: '规则已删除',
                    icon: 'success'
                });

                // 返回上一页并刷新
                setTimeout(() => {
                    const pages = getCurrentPages();
                    const prevPage = pages[pages.length - 2];
                    prevPage?.onShow?.();
                    wx.navigateBack();
                }, 1500);
            })
            .catch(err => {
                console.error('📋 [UserRuleEdit] 删除失败:', err);
                wx.showToast({
                    title: '删除失败，请重试',
                    icon: 'none'
                });
            })
            .finally(() => {
                this.setData({ saving: false });
            });
    },

    // 取消编辑
    onCancel() {
        wx.showModal({
            title: '确认取消',
            content: '确定要取消编辑吗？未保存的内容将丢失。',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateBack();
                }
            }
        });
    },



    // 页面卸载
    onUnload() {
        console.log('📋 [UserRuleEdit] 页面卸载');
    }
}); 