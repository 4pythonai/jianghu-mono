// 添加规则组件
const { ROUTES, GambleMetaConfig } = require('../../../../utils/GambleMetaConfig.js');
const app = getApp()

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

            // 调用真实API保存规则
            const apiMethod = isEdit ? app.api.gamble.updateGambleRule : app.api.gamble.addGambleRule;
            const apiData = {
                id: ruleForm.id,
                gambleUserName: ruleForm.title,
                description: ruleForm.description,
                gambleSysName: ruleForm.type,
                playersNumber: ruleForm.playersNumber // 直接使用后台字段
            };

            apiMethod(apiData).then(res => {
                console.log('📋 [AddRule] API返回数据:', res);

                if (res.code === 0) {
                    wx.showToast({
                        title: isEdit ? '更新成功' : '保存成功',
                        icon: 'success'
                    });

                    // 通知父组件规则已保存
                    this.triggerEvent('ruleSaved', {
                        rule: { ...ruleForm, id: res.data?.id || ruleForm.id },
                        isEdit
                    });

                    // 重置表单
                    this.resetRuleForm();
                } else {
                    wx.showToast({
                        title: res.message || '保存失败',
                        icon: 'none'
                    });
                }
            }).catch(err => {
                console.error('📋 [AddRule] API调用失败:', err);
                wx.showToast({
                    title: '保存失败，请稍后再试',
                    icon: 'none'
                });
            }).finally(() => {
                this.setData({ saving: false });
            });
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



        // 卡片点击跳转规则配置页
        onConfigRule(e) {
            const { title } = e.currentTarget.dataset;
            console.log('📋 [SysRule] 卡片点击跳转规则配置页:', title);

            // 跳转到新的SysEdit页面
            // wx.navigateTo({
            //     url: `/pages/rules/SysEdit/SysEdit?gameType=${title}`,
            //     success: () => {
            //         console.log('📋 [SysRule] 成功跳转到SysEdit页面, 游戏类型:', title);
            //     },
            //     fail: (err) => {
            //         console.error('📋 [SysRule] 跳转失败:', err);
            //         wx.showToast({
            //             title: '页面跳转失败',
            //             icon: 'none'
            //         });
            //     }
            // });

            // /pages/rules/
            wx.redirectTo({
                url: '/pages/UnifiedConfigPage/UnifiedConfigPage?mode=system-add&gameType=4p-lasi',
                success: () => {
                    console.log('📋 [SysRule] 成功跳转到UnifiedConfigPage页面, 游戏类型:', title);
                },
                fail: (err) => {
                    console.error('📋 [SysRule] 跳转失败:', err);
                    wx.showToast({
                        title: '页面跳转失败',
                        icon: 'none'
                    });
                }
            })
        }
    }
}); 