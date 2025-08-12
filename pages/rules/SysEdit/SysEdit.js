// 系统规则配置页面
const { GambleMetaConfig } = require('../../../utils/GambleMetaConfig.js');
const app = getApp()

Page({
    data: {
        _gambleSysName: '', // 游戏类型，如 '4p-8421'
        _gambleUserName: '', // 规则名称  gambleUserName
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

        // 获取游戏配置 Human-readable
        const _HumaName = GambleMetaConfig.getGambleHumanName(gameType);
        if (!_HumaName) {
            wx.showToast({
                title: '无效的游戏类型',
                icon: 'none'
            });
            setTimeout(() => wx.navigateBack(), 1500);
            return;
        }

        // 设置页面数据
        this.setData({
            _gambleSysName: gameType,
            _HumaName: _HumaName,
            _gambleUserName: `${_HumaName}规则`
        });

        // 根据游戏类型加载对应的配置组件
        this.loadConfigComponents(gameType);
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
        console.log('📋 [SysEdit] 加载配置组件:', components);
    },

    // 规则名称输入事件
    onRuleNameInput(e) {
        const value = e.detail.value;
        this.setData({ _gambleUserName: value });
        console.log('📋 [SysEdit] 规则名称已更新:', value);
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

        // 构建规则数据 - 使用扁平化结构
        const ruleData = {
            gambleUserName: this.data._gambleUserName,
            gambleSysName: this.data._gambleSysName,
            playersNumber: 4, // 默认4人，后台会根据游戏类型处理
            type: 'system',
            createTime: new Date().toISOString(),
            ...configData
        };


        // 调用API保存规则
        app.api.gamble.addGambleRule(ruleData)
            .then(res => {
                console.log('📋 [SysEdit] 保存成功:', res);
                wx.showToast({
                    title: '规则保存成功',
                    icon: 'success'
                });

                // 保存成功后跳转到"我的规则"页面
                setTimeout(() => {
                    // 跳转到规则页面，并设置activeTab为0（我的规则）
                    wx.redirectTo({
                        url: '/pages/rules/rules?activeTab=0',
                        success: () => {
                            console.log('📋 [SysEdit] 成功跳转到我的规则页面');
                        },
                        fail: (err) => {
                            console.error('📋 [SysEdit] 跳转失败:', err);
                            // 如果跳转失败，使用navigateBack
                            wx.navigateBack();
                        }
                    });
                }, 100); // 延迟1.5秒，让用户看到成功提示
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

    // 收集配置组件数据 - 改为扁平化结构
    collectConfigData() {
        const flatData = {};

        console.log('📋 [SysEdit] 开始收集配置数据（扁平化），组件列表:', this.data.configComponents);

        // 遍历所有配置组件，收集数据并合并到扁平结构中
        for (const component of this.data.configComponents) {
            console.log('📋 [SysEdit] 正在收集组件', component.name, '的数据');

            const componentInstance = this.selectComponent(`#${component.name}`);
            console.log('📋 [SysEdit] 组件实例:', componentInstance);

            if (componentInstance?.getConfigData) {
                const data = componentInstance.getConfigData();
                console.log('📋 [SysEdit] 组件', component.name, '返回数据:', data);

                // 将组件数据合并到扁平结构中
                Object.assign(flatData, data);
            } else {
                console.warn('📋 [SysEdit] 组件', component.name, '没有 getConfigData 方法');
            }
        }

        console.log('📋 [SysEdit] 收集到的扁平化配置数据:', flatData);
        return flatData;
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