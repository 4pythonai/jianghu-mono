// 用户规则编辑页面
const app = getApp()
const { GameConfig } = require('../../../utils/gameConfig.js');

Page({
    data: {
        ruleId: '', // 规则ID
        ruleData: null, // 规则数据
        gameType: '', // 游戏类型
        gameName: '', // 游戏名称
        user_rulename: '', // 规则名称
        saving: false, // 保存状态
        configComponents: [] // 配置组件列表
    },

    onLoad(options) {
        console.log('📋 [UserRuleEdit] 页面加载，参数:', options);

        const { ruleId, ruleData } = options;
        console.log('📋 [UserRuleEdit] 接收到的ruleId:', ruleId);
        console.log('📋 [UserRuleEdit] 接收到的ruleData:', ruleData);

        if (!ruleId) {
            wx.showToast({
                title: '缺少规则ID参数',
                icon: 'none'
            });
            setTimeout(() => wx.navigateBack(), 1500);
            return;
        }

        this.setData({ ruleId });

        // 如果有传递的规则数据，直接使用；否则通过API获取
        if (ruleData) {
            try {
                const parsedRuleData = JSON.parse(decodeURIComponent(ruleData));
                this.initializeWithRuleData(parsedRuleData);
            } catch (error) {
                console.error('📋 [UserRuleEdit] 解析规则数据失败:', error);
                this.loadRuleData(ruleId);
            }
        } else {
            this.loadRuleData(ruleId);
        }
    },

    // 使用传递的规则数据初始化页面
    initializeWithRuleData(ruleData) {
        console.log('📋 [UserRuleEdit] 使用传递的规则数据初始化:');
        console.log('📋 [UserRuleEdit] 传递的完整ruleData:', JSON.stringify(ruleData, null, 2));
        console.log('📋 [UserRuleEdit] 传递数据的所有属性名:', Object.keys(ruleData));
        console.log('📋 [UserRuleEdit] 检查传递数据的config字段:');
        console.log('📋 [UserRuleEdit] ruleData.config:', ruleData.config);
        console.log('📋 [UserRuleEdit] ruleData.configuration:', ruleData.configuration);
        console.log('📋 [UserRuleEdit] ruleData.gameConfig:', ruleData.gameConfig);
        console.log('📋 [UserRuleEdit] ruleData.settings:', ruleData.settings);

        // 确定游戏类型
        let gameType = ruleData.gameType || ruleData.gambleSysName;

        console.log('📋 [UserRuleEdit] 映射后的游戏类型:', gameType);

        // 获取游戏配置
        const gameConfig = GameConfig.getGameType(gameType);
        console.log('📋 [UserRuleEdit] 获取到的游戏配置:', gameConfig);

        if (!gameConfig) {
            console.error('📋 [UserRuleEdit] 无效的游戏类型:', gameType);
            console.error('📋 [UserRuleEdit] 原始规则数据:', ruleData);
            wx.showToast({
                title: `无效的游戏类型: ${gameType}`,
                icon: 'none'
            });
            setTimeout(() => wx.navigateBack(), 1500);
            return;
        }

        // 设置页面数据
        this.setData({
            ruleData,
            gameType: gameType,
            gameName: gameConfig.name,
            user_rulename: ruleData.title || ruleData.gambleUserName || ruleData.user_rulename || `${gameConfig.name}规则`
        });

        // 根据游戏类型加载对应的配置组件
        this.loadConfigComponents(gameType);
    },

    // 加载规则数据
    async loadRuleData(ruleId) {
        try {
            wx.showLoading({ title: '加载中...' });

            console.log('📋 [UserRuleEdit] 开始加载规则数据, ruleId:', ruleId);

            // 调用API获取规则数据
            const apiResponse = await app.api.gamble.getUserGambleRule({ ruleId });
            console.log('📋 [UserRuleEdit] API完整响应数据:', JSON.stringify(apiResponse, null, 2));
            console.log('📋 [UserRuleEdit] API响应的data字段:', JSON.stringify(apiResponse?.data, null, 2));

            if (!apiResponse || apiResponse.code !== 200 || !apiResponse.data) {
                throw new Error('规则不存在或获取失败');
            }

            const ruleData = apiResponse.data;
            console.log('📋 [UserRuleEdit] 提取的ruleData:', JSON.stringify(ruleData, null, 2));
            console.log('📋 [UserRuleEdit] ruleData的所有属性名:', Object.keys(ruleData));

            // 确定游戏类型
            let gameType = ruleData.gameType || ruleData.gambleSysName;
            console.log('📋 [UserRuleEdit] ruleData.gameType:', ruleData.gameType);
            console.log('📋 [UserRuleEdit] ruleData.gambleSysName:', ruleData.gambleSysName);
            console.log('📋 [UserRuleEdit] 最终确定的gameType:', gameType);

            // 获取游戏配置
            const gameConfig = GameConfig.getGameType(gameType);
            console.log('📋 [UserRuleEdit] API返回数据获取到的游戏配置:', gameConfig);

            if (!gameConfig) {
                console.error('📋 [UserRuleEdit] API返回数据无效的游戏类型:', gameType);
                console.error('📋 [UserRuleEdit] API返回的原始数据:', ruleData);
                throw new Error(`无效的游戏类型: ${gameType}`);
            }

            // 检查config字段
            console.log('📋 [UserRuleEdit] 检查config字段存在性:');
            console.log('📋 [UserRuleEdit] ruleData.config:', ruleData.config);
            console.log('📋 [UserRuleEdit] ruleData.configuration:', ruleData.configuration);
            console.log('📋 [UserRuleEdit] ruleData.gameConfig:', ruleData.gameConfig);
            console.log('📋 [UserRuleEdit] ruleData.settings:', ruleData.settings);

            // 设置页面数据
            this.setData({
                ruleData,
                gameType: gameType,
                gameName: gameConfig.name,
                user_rulename: ruleData.title || ruleData.gambleUserName || ruleData.user_rulename || `${gameConfig.name}规则`
            });

            console.log('📋 [UserRuleEdit] 页面数据设置完成，最终的ruleData:', this.data.ruleData);

            // 根据游戏类型加载对应的配置组件
            this.loadConfigComponents(gameType);

        } catch (error) {
            console.error('📋 [UserRuleEdit] 加载规则数据失败:', error);
            wx.showToast({
                title: '加载规则失败',
                icon: 'none'
            });
            setTimeout(() => wx.navigateBack(), 1500);
        } finally {
            wx.hideLoading();
        }
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
        console.log('📋 [UserRuleEdit] 加载配置组件:', components);

        // 初始化配置组件数据
        this.initConfigComponents();
    },

    // 初始化配置组件数据 - 支持扁平化数据结构
    initConfigComponents() {
        const { ruleData, configComponents } = this.data;
        console.log('🚨🚨🚨 [UserRuleEdit] ========== 开始初始化组件 ==========');
        console.log('🚨🚨🚨 [UserRuleEdit] ruleData:', JSON.stringify(ruleData, null, 2));
        console.log('🚨🚨🚨 [UserRuleEdit] configComponents:', configComponents);

        if (!ruleData) {
            console.error('🚨🚨🚨 [UserRuleEdit] 规则数据为空');
            return;
        }

        // 延迟执行，确保组件已渲染
        setTimeout(() => {
            console.log('🚨🚨🚨 [UserRuleEdit] 开始遍历组件，延迟100ms后执行');
            configComponents.forEach(component => {
                console.log(`🚨🚨🚨 [UserRuleEdit] 正在处理组件: ${component.name}`);
                const componentInstance = this.selectComponent(`#${component.name}`);
                console.log(`🚨🚨🚨 [UserRuleEdit] 组件实例:`, componentInstance);

                if (componentInstance && componentInstance.initConfigData) {
                    console.log(`🚨🚨🚨 [UserRuleEdit] ✅ 找到组件实例和initConfigData方法，开始传递数据`);
                    console.log(`🚨🚨🚨 [UserRuleEdit] 传递给 ${component.name} 的数据:`, ruleData);
                    componentInstance.initConfigData(ruleData);
                    console.log(`🚨🚨🚨 [UserRuleEdit] ✅ ${component.name} 数据传递完成`);
                } else {
                    console.error(`🚨🚨🚨 [UserRuleEdit] ❌ 未找到组件实例或initConfigData方法: ${component.name}`, componentInstance);
                }
            });
            console.log('🚨🚨🚨 [UserRuleEdit] ========== 组件初始化完成 ==========');
        }, 100);
    },

    // 规则名称输入事件
    onRuleNameInput(e) {
        const value = e.detail.value;
        this.setData({ user_rulename: value });
        console.log('📋 [UserRuleEdit] 规则名称已更新:', value);
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

        // 构建更新数据 - 使用扁平化结构
        const updateData = {
            id: this.data.ruleId,
            gambleUserName: this.data.user_rulename,
            updateTime: new Date().toISOString(),
            // 合并配置数据到顶层
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
                    if (prevPage && prevPage.onShow) {
                        prevPage.onShow();
                    }
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
        this.data.configComponents.forEach(component => {
            console.log(`📋 [UserRuleEdit] 正在收集组件 ${component.name} 的数据`);
            const componentInstance = this.selectComponent(`#${component.name}`);

            if (componentInstance && componentInstance.getConfigData) {
                const data = componentInstance.getConfigData();
                console.log(`📋 [UserRuleEdit] 组件 ${component.name} 返回数据:`, data);

                // 将组件数据合并到扁平结构中
                Object.assign(flatData, data);
            } else {
                console.warn(`📋 [UserRuleEdit] 组件 ${component.name} 没有 getConfigData 方法`);
            }
        });

        console.log('📋 [UserRuleEdit] 收集到的扁平化配置数据:', flatData);
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
                    if (prevPage && prevPage.onShow) {
                        prevPage.onShow();
                    }
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