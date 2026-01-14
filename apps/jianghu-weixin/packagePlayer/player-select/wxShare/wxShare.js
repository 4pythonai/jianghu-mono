const app = getApp();
const RuntimeComponentsUtils = require('../../utils/runtime-common-utils.js');

const mergeSourceParams = (target, source) => {
    if (!source) {
        return;
    }
    const parsed = RuntimeComponentsUtils.url.parseQueryString(source);
    Object.keys(parsed).forEach(key => {
        const value = parsed[key];
        if (value !== undefined && value !== null && value !== '') {
            target[key] = value;
        }
    });
    if (parsed.path) {
        const nested = RuntimeComponentsUtils.url.parseQueryString(parsed.path);
        Object.keys(nested).forEach(key => {
            const value = nested[key];
            if (value !== undefined && value !== null && value !== '') {
                target[key] = value;
            }
        });
    }
};

Page({
    data: {
        uuid: '',
        gameid: '',
        sharePath: '',
        hasGameId: false,
        title: '',
        shareTitle: '邀请加入比赛',
        joining: false,
        joinSuccess: false,
        joinError: '',
        groups: [],
        source: 'wxshare' // 默认来源，会被参数覆盖
    },

    onLoad(options) {

        wx.setEnableDebug({
            enableDebug: true
        });

        console.log('=== joinGame 页面进入参数 ===');
        console.log('原始 options:', options);

        const params = this.normalizeOptions(options);
        console.log('标准化后的 params:', params);
        console.log('来源标识 source:', params.source || '未指定');
        console.log('===============================');

        const dataUpdate = {};

        // 接收并显示 UUID
        if (params.uuid) {
            console.log('接收到 UUID:', params.uuid);
            dataUpdate.uuid = params.uuid;
        } else {
            console.warn('未接收到 UUID');
        }

        if (params.gameid) {
            dataUpdate.gameid = params.gameid;
            dataUpdate.hasGameId = true;
        }

        if (params.title) {
            dataUpdate.title = decodeURIComponent(params.title);
        }

        if (params.source) {
            dataUpdate.source = params.source;
        }

        const uuid = dataUpdate.uuid || this.data.uuid;
        const gameid = dataUpdate.gameid || this.data.gameid;
        const titleForPath = dataUpdate.title || this.data.title;
        const sharePath = this.buildSharePath(uuid, gameid, titleForPath);
        dataUpdate.sharePath = sharePath;

        const pageTitle = dataUpdate.title
            ? `${dataUpdate.title} · 分享邀请`
            : '邀请加入比赛';
        dataUpdate.shareTitle = dataUpdate.title
            ? `${dataUpdate.title} 邀请你加入比赛`
            : this.data.shareTitle;

        this.setData(dataUpdate, () => {
            wx.setNavigationBarTitle({
                title: pageTitle
            });

            // 如果有gameid，获取比赛详情
            if (dataUpdate.gameid) {
                this.fetchGameDetail();
            }
        });
    },

    onReady() {
        console.log('页面准备就绪, 当前 UUID:', this.data.uuid);
    },

    onShow() {
        console.log('页面显示, 当前 UUID:', this.data.uuid);
    },

    onShareAppMessage() {
        const title = this.data.shareTitle || '邀请加入比赛';
        return {
            title,
            path: this.buildSharePath(this.data.uuid, this.data.gameid)
        };
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
        return `/packagePlayer/player-select/wxShare/wxShare?${query.join('&')}`;
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

    handleJoin() {
        this.joinGame();
    },

    handleWatch() {
        this.watchGame();
    },

    async watchGame() {
        if (!this.data.gameid) {
            wx.showToast({
                title: '比赛信息缺失',
                icon: 'none'
            });
            return;
        }

        try {
            const authResult = await this.ensureAuth();

            if (!authResult?.success) {
                const message = authResult?.message || '请先登录';
                wx.showToast({
                    title: message,
                    icon: 'none'
                });
                return;
            }

            // 调用 addWatcher API
            const result = await app.api.game.addWatcher({
                gameid: this.data.gameid
            }, {
                loadingTitle: '加入围观...'
            });

            if (result?.code !== 200) {
                throw new Error(result?.message || '加入围观失败');
            }

            wx.showToast({
                title: '已加入围观',
                icon: 'success',
                duration: 1000
            });

            // 跳转到比赛详情页
            setTimeout(() => {
                wx.navigateTo({
                    url: `/packageGame/gameDetail/score/score?gameid=${this.data.gameid}`
                });
            }, 1000);

        } catch (error) {
            console.error('[WXShare] watchGame failed', error);
            wx.showToast({
                title: error?.message || '加入围观失败',
                icon: 'none'
            });
        }
    },


    normalizeOptions(options = {}) {
        const params = { ...options };

        if (options.scene) {
            mergeSourceParams(params, options.scene);
        }

        if (options.q) {
            mergeSourceParams(params, options.q);
        }

        if (typeof options.path === 'string') {
            mergeSourceParams(params, options.path);
        }

        if (!params.uuid && typeof params.sharePath === 'string') {
            mergeSourceParams(params, params.sharePath);
        }

        return params;
    },

    async fetchGameDetail() {
        if (!this.data.gameid) {
            return;
        }

        try {
            const result = await app.api.game.getGameDetail({
                gameid: this.data.gameid
            });

            if (result?.code === 200 && result?.game_detail?.groups) {
                this.setData({
                    groups: result.game_detail.groups
                });
            }
        } catch (error) {
            console.error('[WXShare] fetchGameDetail failed', error);
        }
    },

    async ensureAuth() {
        const appInstance = app;

        if (!appInstance) {
            return {
                success: false,
                message: '应用未初始化'
            };
        }

        const state = typeof appInstance.getUserState === 'function'
            ? appInstance.getUserState()
            : {
                isLoggedIn: appInstance.globalData?.isLoggedIn,
                userInfo: appInstance.globalData?.userInfo
            };

        if (state?.isLoggedIn) {
            return {
                success: true,
                user: state.userInfo
            };
        }

        if (!appInstance.auth || typeof appInstance.auth.checkAuthState !== 'function') {
            return {
                success: false,
                message: '暂无法登录'
            };
        }

        try {
            const result = await appInstance.auth.checkAuthState();
            if (result?.success) {
                return result;
            }
            return {
                success: false,
                message: result?.message || '登录失败'
            };
        } catch (error) {
            return {
                success: false,
                message: error?.message || '登录失败'
            };
        }
    },

    async joinGame() {
        if (this.data.joining || this.data.joinSuccess) {
            return;
        }

        if (!this.data.uuid) {
            wx.showToast({
                title: '邀请码缺失',
                icon: 'none'
            });
            return;
        }

        this.setData({
            joining: true,
            joinError: ''
        });

        try {
            const authResult = await this.ensureAuth();

            if (!authResult?.success) {
                const message = authResult?.message || '请先登录';
                this.setData({
                    joining: false,
                    joinError: message
                });
                wx.showToast({
                    title: message,
                    icon: 'none'
                });
                return;
            }

            // 检查用户资料是否完整（昵称和头像）
            if (!app.profileChecker.ensureProfileCompleted({
                source: 'signup',
                modalTitle: '完善资料',
                modalContent: '加入比赛前请先设置昵称和头像，方便队友识别你。'
            })) {
                this.setData({
                    joining: false
                });
                return;
            }

            const payload = {
                uuid: this.data.uuid,
                source: this.data.source || 'wxshare'
            };

            if (this.data.gameid) {
                payload.gameid = this.data.gameid;
            }

            const result = await app.api.game.joinGame(payload, {
                loadingTitle: '加入中...'
            });

            if (result?.code !== 200) {
                throw new Error(result?.message || '加入失败');
            }

            this.setData({
                joinSuccess: true
            });

            // 刷新组别列表
            this.fetchGameDetail();

            wx.showToast({
                title: 'JoinSuccess',
                icon: 'success',
                duration: 1000
            });

            console.log("🔴🟢🔵")

            // 成功后跳转到计分页面
            if (this.data.gameid) {
                setTimeout(() => {
                    wx.navigateTo({
                        url: `/packageGame/gameDetail/score/score?gameid=${this.data.gameid}`
                    });
                }, 1500);
            }
        } catch (error) {
            console.error('[WXShare] joinGame failed', error);
            const message = error?.message || '加入失败，请稍后再试';
            this.setData({
                joinError: message
            });
            wx.showToast({
                title: message,
                icon: 'none'
            });
        } finally {
            this.setData({
                joining: false
            });
        }
    }
}); 
