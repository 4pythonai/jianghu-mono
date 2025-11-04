const app = getApp();
const navigationHelper = require('@/utils/navigationHelper.js');

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        uuid: {
            type: String,
            value: ''
        },
        gameid: {
            type: String,
            value: ''
        },
        title: {
            type: String,
            value: ''
        },
        groupIndex: {
            type: Number,
            value: 0
        },
        slotIndex: {
            type: Number,
            value: 0
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        isVisible: false, // 控制面板显示/隐藏
        qrcodeUrl: '', // 二维码URL
        loading: false, // 加载状态
        error: '', // 错误信息
        sharePath: '' // 分享路径
    },

    /**
     * 组件的方法列表
     */
    methods: {
        // 显示面板
        show(options = {}) {
            console.log('📋 [AddPlayerHubPanel] 显示面板', options);
            this.setData({
                isVisible: true,
                ...options
            }, () => {
                // 面板显示后生成二维码
                if (this.data.uuid) {
                    this.fetchInviteQrcode();
                }
            });
        },

        // 隐藏面板
        hide() {
            console.log('📋 [AddPlayerHubPanel] 隐藏面板');
            this.setData({
                isVisible: false,
                // 清空二维码状态
                qrcodeUrl: '',
                error: '',
                loading: false
            });
        },

        // 阻止冒泡
        stopPropagation() {
            // 空函数, 用于阻止点击面板内容时关闭弹窗
        },

        // 构建分享路径
        buildSharePath() {
            const { uuid, gameid, title } = this.data;
            if (!uuid) {
                return '/pages/createGame/createGame';
            }
            const query = [`uuid=${uuid}`];
            if (gameid) {
                query.push(`gameid=${gameid}`);
            }
            if (title) {
                query.push(`title=${encodeURIComponent(title)}`);
            }
            query.push('source=qrcode');
            return `/pages/player-select/wxShare/wxShare?${query.join('&')}`;
        },

        // 获取邀请二维码
        async fetchInviteQrcode() {
            const { uuid, gameid } = this.data;
            if (!uuid) {
                console.warn('[AddPlayerHubPanel] 缺少 uuid，无法生成二维码');
                // 不设置 error，保持 placeholder 状态，让用户可以使用其他添加方式
                return;
            }

            this.setData({
                loading: true,
                error: '',
                qrcodeUrl: ''
            });

            const sharePath = this.buildSharePath();
            this.setData({ sharePath });

            const payload = {
                uuid,
                path: sharePath
            };

            if (gameid) {
                payload.gameid = gameid;
            }

            try {
                const result = await app.api.game.getGameInviteQrcode(payload, {
                    showLoading: false
                });

                if (result?.code !== 200) {
                    throw new Error(result?.message || '二维码生成失败');
                }

                const qrcodeUrl = result?.qrcode_url;

                if (!qrcodeUrl) {
                    throw new Error('服务端未返回二维码地址');
                }

                this.setData({
                    qrcodeUrl
                });
            } catch (error) {
                console.error('[AddPlayerHubPanel] 二维码生成失败', error);
                this.setData({
                    error: error?.message || '二维码生成失败'
                });
            } finally {
                this.setData({
                    loading: false
                });
            }
        },

        // 重试生成二维码
        handleRetry() {
            this.fetchInviteQrcode();
        },

        // 手工添加按钮点击
        handleManualAdd() {
            console.log('📋 [AddPlayerHubPanel] 点击手工添加');
            const { groupIndex, slotIndex, uuid, gameid, title } = this.data;

            let url = `/pages/player-select/manualAdd/manualAdd?groupIndex=${groupIndex}&slotIndex=${slotIndex}&scene=gameDetail`;

            if (uuid) {
                url += `&uuid=${uuid}`;
            }
            if (gameid) {
                url += `&gameid=${gameid}`;
            }
            if (title) {
                url += `&title=${encodeURIComponent(title)}`;
            }

            // 关闭面板
            this.hide();

            // 跳转到手工添加页面
            navigationHelper.navigateTo(url).catch(err => {
                console.error('[AddPlayerHubPanel] 跳转失败:', err);
                wx.showToast({
                    title: '跳转失败，请重试',
                    icon: 'none'
                });
            });
        },

        // 好友选择按钮点击
        handleFriendSelect() {
            console.log('📋 [AddPlayerHubPanel] 点击好友选择');
            const { groupIndex, slotIndex, uuid, gameid, title } = this.data;

            let url = `/pages/player-select/friendSelect/friendSelect?groupIndex=${groupIndex}&slotIndex=${slotIndex}`;

            if (uuid) {
                url += `&uuid=${uuid}`;
            }
            if (gameid) {
                url += `&gameid=${gameid}`;
            }
            if (title) {
                url += `&title=${encodeURIComponent(title)}`;
            }

            // 关闭面板
            this.hide();

            // 跳转到好友选择页面
            navigationHelper.navigateTo(url).catch(err => {
                console.error('[AddPlayerHubPanel] 跳转失败:', err);
                wx.showToast({
                    title: '跳转失败，请重试',
                    icon: 'none'
                });
            });
        }
    }
}) 