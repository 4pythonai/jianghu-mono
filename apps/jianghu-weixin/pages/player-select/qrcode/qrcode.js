const { createJoinNotification } = require('./joinNotification');

const app = getApp();

Page({
    data: {
        groupIndex: 0,
        slotIndex: 0,
        uuid: '',
        gameid: '',
        title: '',
        shareTitle: '扫码加入比赛',
        sharePath: '',
        qrcodeUrl: '',
        loading: false,
        error: '',
        hasGameId: false,
        showTestButton: false,
        notifications: []
    },

    onLoad(options) {
        this.joinNotification = createJoinNotification({ page: this });
        const params = this.normalizeOptions(options);
        const dataUpdate = {};
        const envVersion = wx.getAccountInfoSync
            ? wx.getAccountInfoSync()?.miniProgram?.envVersion
            : 'release';
        const isDevelopEnv = envVersion === 'develop';

        if (params.groupIndex !== undefined) {
            const groupIndex = Number.parseInt(params.groupIndex, 10);
            dataUpdate.groupIndex = Number.isNaN(groupIndex) ? 0 : groupIndex;
        }

        if (params.slotIndex !== undefined) {
            const slotIndex = Number.parseInt(params.slotIndex, 10);
            dataUpdate.slotIndex = Number.isNaN(slotIndex) ? 0 : slotIndex;
        }

        if (params.uuid) {
            dataUpdate.uuid = params.uuid;
        }

        if (params.gameid) {
            dataUpdate.gameid = params.gameid;
            dataUpdate.hasGameId = true;
        }

        if (params.title) {
            dataUpdate.title = decodeURIComponent(params.title);
        }

        const uuid = dataUpdate.uuid || this.data.uuid;
        const gameid = dataUpdate.gameid || this.data.gameid;
        const titleForPath = dataUpdate.title || this.data.title;
        const sharePath = this.buildSharePath(uuid, gameid, titleForPath);
        dataUpdate.sharePath = sharePath;

        const title = dataUpdate.title || this.data.title;
        const shareTitle = title ? `${title} 邀请你加入比赛` : '扫码加入比赛';
        dataUpdate.shareTitle = shareTitle;
        dataUpdate.showTestButton = isDevelopEnv;

        this.setData(dataUpdate, () => {
            const navTitle = this.data.title
                ? `${this.data.title} · 二维码邀请`
                : '二维码邀请';
            wx.setNavigationBarTitle({ title: navTitle });

            if (this.data.uuid) {
                this.fetchInviteQrcode();
            }
        });
    },

    normalizeOptions(options = {}) {
        const params = { ...options };
        if (options.scene) {
            const decoded = decodeURIComponent(options.scene);
            decoded.split('&').forEach(pair => {
                if (!pair) {
                    return;
                }
                const [key, value = ''] = pair.split('=');
                if (key) {
                    params[key] = value;
                }
            });
        }
        return params;
    },

    buildSharePath(uuid, gameid, title = this.data.title) {
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
        // 添加来源标识
        query.push('source=qrcode');
        return `/pages/player-select/joinGame/joinGame?${query.join('&')}`;
    },

    async fetchInviteQrcode() {
        const { uuid, gameid } = this.data;
        if (!uuid) {
            this.setData({
                error: '缺少比赛标识，无法生成二维码'
            });
            return;
        }

        this.setData({
            loading: true,
            error: '',
            qrcodeUrl: ''
        });

        const payload = {
            uuid,
            path: this.data.sharePath
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
            console.error('[QRCode] 生成失败', error);
            this.setData({
                error: error?.message || '二维码生成失败'
            });
        } finally {
            this.setData({
                loading: false
            });
        }
    },

    handleRetry() {
        this.fetchInviteQrcode();
    },

    handlePreview() {
        if (!this.data.qrcodeUrl) {
            wx.showToast({
                title: '二维码尚未生成',
                icon: 'none'
            });
            return;
        }

        wx.previewImage({
            urls: [this.data.qrcodeUrl]
        });
    },

    async ensureLocalFile() {
        const { qrcodeUrl } = this.data;
        if (!qrcodeUrl) {
            throw new Error('二维码缺失');
        }

        // base64 数据写入临时文件
        if (qrcodeUrl.startsWith('data:image')) {
            const base64 = qrcodeUrl.split(',')[1];
            if (!base64) {
                throw new Error('二维码数据异常');
            }
            const filePath = `${wx.env.USER_DATA_PATH}/invite-${Date.now()}.png`;
            return await new Promise((resolve, reject) => {
                wx.getFileSystemManager().writeFile({
                    filePath,
                    data: base64,
                    encoding: 'base64',
                    success: () => resolve(filePath),
                    fail: reject
                });
            });
        }

        // 普通网络图片，获取临时路径
        return await new Promise((resolve, reject) => {
            wx.getImageInfo({
                src: qrcodeUrl,
                success: res => resolve(res.path),
                fail: reject
            });
        });
    },

    async handleSave() {
        if (!this.data.qrcodeUrl) {
            wx.showToast({
                title: '二维码尚未生成',
                icon: 'none'
            });
            return;
        }

        wx.showLoading({
            title: '保存中...',
            mask: true
        });

        try {
            const filePath = await this.ensureLocalFile();
            await new Promise((resolve, reject) => {
                wx.saveImageToPhotosAlbum({
                    filePath,
                    success: resolve,
                    fail: reject
                });
            });
            wx.showToast({
                title: '已保存到相册',
                icon: 'success'
            });
        } catch (error) {
            console.error('[QRCode] 保存失败', error);
            wx.showToast({
                title: '保存失败，请重试',
                icon: 'none'
            });
        } finally {
            wx.hideLoading();
        }
    },

    handleCopyInvite() {
        if (!this.data.uuid) {
            wx.showToast({
                title: '邀请码缺失',
                icon: 'none'
            });
            return;
        }

        wx.setClipboardData({
            data: this.data.uuid,
            success: () => {
                wx.showToast({
                    title: '邀请码已复制',
                    icon: 'success'
                });
            }
        });
    },

    handleCopyPath() {
        if (!this.data.sharePath) {
            wx.showToast({
                title: '路径缺失',
                icon: 'none'
            });
            return;
        }
        wx.setClipboardData({
            data: this.data.sharePath,
            success: () => {
                wx.showToast({
                    title: '路径已复制',
                    icon: 'success'
                });
            }
        });
    },

    handleTestNavigate() {
        if (!this.data.showTestButton) {
            return;
        }

        const { sharePath } = this.data;
        if (!sharePath) {
            wx.showToast({
                title: '邀请路径缺失',
                icon: 'none'
            });
            return;
        }

        wx.navigateTo({
            url: sharePath
        });
    },

    handleTestNotification() {
        if (!this.joinNotification) {
            return;
        }
        this.joinNotification.push({
            avatar: 'https://qiaoyincapital.com/avatar/2025/10/31/avatar_837616_1761890982.jpeg',
            nickname: 'Demo1'
        });
    },

    onUnload() {
        this.teardownJoinNotification(true);
    },

    onHide() {
        this.teardownJoinNotification();
    },

    teardownJoinNotification(destroy = false) {
        if (!this.joinNotification) {
            return;
        }
        if (destroy) {
            if (typeof this.joinNotification.destroy === 'function') {
                this.joinNotification.destroy();
            }
            this.joinNotification = null;
            return;
        }
        if (typeof this.joinNotification.clearAll === 'function') {
            this.joinNotification.clearAll();
        }
    },

    onShareAppMessage() {
        return {
            title: this.data.shareTitle || '扫码加入比赛',
            path: this.buildSharePath(this.data.uuid, this.data.gameid)
        };
    }
});
