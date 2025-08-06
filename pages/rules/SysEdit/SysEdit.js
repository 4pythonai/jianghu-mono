// 系统规则配置页面
const { GameConfig } = require('../../../utils/gameConfig.js');
const app = getApp()

Page({
    data: {
        gameType: '', // 游戏类型，如 '4p-8421'
        gameName: '', // 游戏名称
        user_rulename: '', // 规则名称
        saving: false, // 保存状态
        configComponents: [] // 配置组件列表
    },

    onLoad(options) {
        console.log('📋 [SysEdit] 页面加载，参数:', options);

        const { gameType } = options;
        if (!gameType) {
            wx.showToast({
                title: '缺少游戏类型参数',
                icon: 'none'
            });
            setTimeout(() => wx.navigateBack(), 1500);
            return;
        }

        // 获取游戏配置
        const gameConfig = GameConfig.getGameType(gameType);
        if (!gameConfig) {
            wx.showToast({
                title: '无效的游戏类型',
                icon: 'none'
            });
            setTimeout(() => wx.navigateBack(), 1500);
            return;
        }

        // 设置页面数据
        this.setData({
            gameType,
            gameName: gameConfig.name,
            user_rulename: `${gameConfig.name}规则`
        });

        // 根据游戏类型加载对应的配置组件
        this.loadConfigComponents(gameType);
    },

    // 根据游戏类型加载配置组件
    loadConfigComponents(gameType) {
        let components = [];

        // 根据游戏类型确定需要的配置组件
        switch (gameType) {
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
        console.log('📋 [SysEdit] 加载配置组件:', components);
    },

    // 规则名称输入事件
    onRuleNameInput(e) {
        const value = e.detail.value;
        this.setData({ user_rulename: value });
        console.log('📋 [SysEdit] 规则名称已更新:', value);
    },

    // 验证表单
    validateForm() {
        const { user_rulename } = this.data;

        if (!user_rulename || user_rulename.trim() === '') {
            wx.showToast({
                title: '请输入规则名称',
                icon: 'none'
            });
            return false;
        }

        if (user_rulename.trim().length < 2) {
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

        // 构建规则数据
        const ruleData = {
            title: this.data.user_rulename,
            gameType: this.data.gameType,
            config: configData,
            type: 'system',
            createTime: new Date().toISOString()
        };

        console.log('📋 [SysEdit] 保存规则数据:', ruleData);

        // 调用API保存规则
        app.api.gamble.addGambleRule(ruleData)
            .then(res => {
                console.log('📋 [SysEdit] 保存成功:', res);
                wx.showToast({
                    title: '规则保存成功',
                    icon: 'success'
                });

                // 返回上一页并刷新
                setTimeout(() => {
                    const pages = getCurrentPages();
                    const prevPage = pages[pages.length - 2];
                    if (prevPage?.onShow) {
                        prevPage.onShow();
                    }
                    wx.navigateBack();
                }, 1500);
            })
            .catch(err => {
                console.error('📋 [SysEdit] 保存失败:', err);
                wx.showToast({
                    title: '保存失败，请重试',
                    icon: 'none'
                });
            })
            .finally(() => {
                this.setData({ saving: false });
            });
    },

    // 收集配置组件数据
    collectConfigData() {
        const configData = {};

        console.log('📋 [SysEdit] 开始收集配置数据，组件列表:', this.data.configComponents);

        // 遍历所有配置组件，收集数据
        for (const component of this.data.configComponents) {
            console.log(`📋 [SysEdit] 正在收集组件 ${component.name} 的数据`);

            const componentInstance = this.selectComponent(`#${component.name}`);
            console.log(`📋 [SysEdit] 组件实例:`, componentInstance);

            if (componentInstance?.getConfigData) {
                const data = componentInstance.getConfigData();
                configData[component.name] = data;
                console.log(`📋 [SysEdit] 组件 ${component.name} 数据:`, data);
            } else {
                console.warn(`📋 [SysEdit] 组件 ${component.name} 没有 getConfigData 方法`);
            }
        }

        console.log('📋 [SysEdit] 收集到的所有配置数据:', configData);
        return configData;
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
        console.log('📋 [SysEdit] 页面卸载');
    }
}); 