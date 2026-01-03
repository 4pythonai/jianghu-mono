const app = getApp();
const navigationHelper = require('@/utils/navigationHelper.js');

Page({
    data: {
        uuid: '',
        gameid: '',
        title: '',
        groupIndex: 0,
        slotIndex: 0,
        qrcodeUrl: '',
        loading: false,
        error: '',
        sharePath: ''
    },

    onLoad(options) {
        console.log('📋 [AddPlayerHub] onLoad', options);
        const { uuid, gameid, title, groupIndex, slotIndex } = options;

        this.setData({
            uuid: uuid || '',
            gameid: gameid || '',
            title: title ? decodeURIComponent(title) : '',
            groupIndex: parseInt(groupIndex) || 0,
            slotIndex: parseInt(slotIndex) || 0
        }, () => {
            if (this.data.uuid) {
                this.fetchInviteQrcode();
            }
        });
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
            console.warn('[AddPlayerHub] 缺少 uuid，无法生成二维码');
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

            this.setData({ qrcodeUrl });
        } catch (error) {
            console.error('[AddPlayerHub] 二维码生成失败', error);
            this.setData({
                error: error?.message || '二维码生成失败'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    // 重试生成二维码
    handleRetry() {
        this.fetchInviteQrcode();
    },

    // 手工添加按钮点击
    handleManualAdd() {
        console.log('📋 [AddPlayerHub] 点击手工添加');
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

        navigationHelper.navigateTo(url).catch(err => {
            console.error('[AddPlayerHub] 跳转失败:', err);
            wx.showToast({
                title: '跳转失败，请重试',
                icon: 'none'
            });
        });
    },

    // 好友选择按钮点击
    handleFriendSelect() {
        console.log('📋 [AddPlayerHub] 点击好友选择');
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

        navigationHelper.navigateTo(url).catch(err => {
            console.error('[AddPlayerHub] 跳转失败:', err);
            wx.showToast({
                title: '跳转失败，请重试',
                icon: 'none'
            });
        });
    }
});
