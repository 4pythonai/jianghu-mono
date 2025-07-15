// 添加规则组件
Component({
    properties: {
        // 是否显示该组件
        show: {
            type: Boolean,
            value: false
        },
        // 编辑的规则数据(如果是编辑模式)
        editRule: {
            type: Object,
            value: null
        }
    },

    data: {
        // 表单数据
        ruleForm: {
            id: null,
            title: '',
            description: '',
            type: 'default' // default, custom
        },
        // 提交状态
        saving: false
    },

    lifetimes: {
        // 组件生命周期
        attached() {
            console.log('📋 [AddRule] 组件加载');
        },

        detached() {
            console.log('📋 [AddRule] 组件卸载');
        }
    },

    observers: {
        // 监听show属性变化
        'show': function (show) {
            console.log('📋 [AddRule] show状态变化:', show);
            if (show && !this.data.editRule) {
                this.resetRuleForm();
            }
        },

        // 监听编辑规则数据变化
        'editRule': function (editRule) {
            console.log('📋 [AddRule] editRule变化:', editRule);
            if (editRule) {
                this.setData({
                    ruleForm: {
                        id: editRule.id,
                        title: editRule.title,
                        description: editRule.description,
                        type: editRule.type || 'default'
                    }
                });
            }
        }
    },

    methods: {
        // 重置表单
        resetRuleForm() {
            console.log('📋 [AddRule] 重置表单');
            this.setData({
                ruleForm: {
                    id: null,
                    title: '',
                    description: '',
                    type: 'default'
                },
                saving: false
            });
        },

        // 表单输入处理
        onFormInput(e) {
            const { field } = e.currentTarget.dataset;
            const { value } = e.detail;

            console.log('📋 [AddRule] 表单输入:', field, value);

            this.setData({
                [`ruleForm.${field}`]: value
            });
        },

        // 规则类型选择
        onRuleTypeChange(e) {
            const { type } = e.currentTarget.dataset;
            console.log('📋 [AddRule] 选择规则类型:', type);

            this.setData({
                'ruleForm.type': type
            });
        },

        // 表单验证
        validateForm() {
            const { ruleForm } = this.data;

            if (!ruleForm.title.trim()) {
                wx.showToast({
                    title: '请输入规则标题',
                    icon: 'none'
                });
                return false;
            }

            if (ruleForm.title.trim().length < 2) {
                wx.showToast({
                    title: '规则标题至少2个字符',
                    icon: 'none'
                });
                return false;
            }

            if (!ruleForm.description.trim()) {
                wx.showToast({
                    title: '请输入规则描述',
                    icon: 'none'
                });
                return false;
            }

            if (ruleForm.description.trim().length < 10) {
                wx.showToast({
                    title: '规则描述至少10个字符',
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

            const { ruleForm } = this.data;
            const isEdit = !!ruleForm.id;

            console.log('📋 [AddRule] 保存规则:', ruleForm);

            this.setData({ saving: true });

            // 模拟API调用
            setTimeout(() => {
                // TODO: 调用实际API保存规则

                wx.showToast({
                    title: isEdit ? '更新成功' : '保存成功',
                    icon: 'success'
                });

                // 通知父组件规则已保存
                this.triggerEvent('ruleSaved', {
                    rule: { ...ruleForm },
                    isEdit
                });

                // 重置表单
                this.resetRuleForm();

                this.setData({ saving: false });
            }, 1500);
        },

        // 取消编辑
        onCancelEdit() {
            console.log('📋 [AddRule] 取消编辑');

            wx.showModal({
                title: '确认取消',
                content: '确定要取消编辑吗？未保存的内容将丢失。',
                success: (res) => {
                    if (res.confirm) {
                        this.resetRuleForm();
                        this.triggerEvent('cancelEdit');
                    }
                }
            });
        },

        // 清空表单
        onClearForm() {
            wx.showModal({
                title: '确认清空',
                content: '确定要清空表单内容吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.resetRuleForm();
                    }
                }
            });
        },

        // 卡片点击跳转运行时配置页
        onRunTimeConfig(e) {
            const { title } = e.currentTarget.dataset;

            // 导入gameStore来获取游戏数据
            const { gameStore } = require('../../../../stores/gameStore');

            // 准备传递给运行时配置页面的数据(简化版)
            const runtimeConfigData = {
                ruleType: title,
                gameId: gameStore.gameid || null,
                playerCount: gameStore.players?.length || 0,
                holeCount: gameStore.holes?.length || 18,
                fromUserRule: false // 标识这是从系统规则进入的
            };

            // 将完整数据暂存到全局(为了保持一致性)
            const app = getApp();
            app.globalData = app.globalData || {};
            app.globalData.currentGameData = {
                players: gameStore.players || [],
                holes: gameStore.holes || [],
                gameData: gameStore.gameData || null
            };

            // 编码传递的数据
            const encodedData = encodeURIComponent(JSON.stringify(runtimeConfigData));

            // 跳转到运行时配置页面
            wx.navigateTo({
                url: `/pages/gambleRuntimeConfig/gambleRuntimeConfig?data=${encodedData}`,
                success: () => {
                    console.log('🎮 成功跳转到运行时配置页面, 规则类型:', title);
                },
                fail: (err) => {
                    console.error('🎮 跳转失败:', err);
                    wx.showToast({
                        title: '页面跳转失败',
                        icon: 'none'
                    });
                }
            });
        },

        // 
        // 卡片点击跳转规则配置页
        onConfigRule(e) {
            const { title } = e.currentTarget.dataset;
            // 路由映射
            const map = {
                // 2人
                '2p-gross': '/pages/ruleConfig/2player/2p-gross/2p-gross',
                '2p-hole': '/pages/ruleConfig/2player/2p-hole/2p-hole',
                '2p-8421': '/pages/ruleConfig/2player/2p-8421/2p-8421',
                // 3人
                '3p-doudizhu': '/pages/ruleConfig/3player/3p-doudizhu/3p-doudizhu',
                '3p-dizhupo': '/pages/ruleConfig/3player/3p-dizhupo/3p-dizhupo',
                '3p-8421': '/pages/ruleConfig/3player/3p-8421/3p-8421',
                // 4人
                '4p-lasi': '/pages/ruleConfig/4player/4p-lasi/4p-lasi',
                '4p-8421': '/pages/ruleConfig/4player/4p-8421/4p-8421',
                '4p-dizhupo': '/pages/ruleConfig/4player/4p-dizhupo/4p-dizhupo',
                '4p-3da1': '/pages/ruleConfig/4player/4p-3da1/4p-3da1',
                '4p-bestak': '/pages/ruleConfig/4player/4p-bestak/4p-bestak',
                // 4人以上
                'mp-labahua': '/pages/ruleConfig/mplayer/mp-labahua/mp-labahua',
                'mp-dabudui': '/pages/ruleConfig/mplayer/mp-dabudui/mp-dabudui',
            };
            if (map[title]) {
                wx.navigateTo({ url: map[title] });
            } else {
                wx.showToast({
                    title: '暂未开放, 敬请期待',
                    icon: 'none'
                });
            }
        }
    }
}); 