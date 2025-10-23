const app = getApp();

const safeDecode = (value) => {
    if (typeof value !== 'string') {
        return value;
    }
    try {
        return decodeURIComponent(value);
    } catch (error) {
        return value;
    }
};

const parseQueryString = (input) => {
    if (!input || typeof input !== 'string') {
        return {};
    }

    const decoded = safeDecode(input.trim());
    if (!decoded) {
        return {};
    }

    let query = decoded;
    const questionIndex = decoded.indexOf('?');
    if (questionIndex >= 0) {
        query = decoded.slice(questionIndex + 1);
    }

    const result = {};
    query.split('&').forEach(pair => {
        if (!pair) {
            return;
        }
        const [rawKey, ...rawRest] = pair.split('=');
        if (!rawKey) {
            return;
        }
        const key = safeDecode(rawKey.trim());
        const rawValue = rawRest.join('=');
        const value = safeDecode(rawValue.trim());
        if (key) {
            result[key] = value;
        }
    });

    return result;
};

const mergeSourceParams = (target, source) => {
    if (!source) {
        return;
    }
    const parsed = parseQueryString(source);
    Object.keys(parsed).forEach(key => {
        const value = parsed[key];
        if (value !== undefined && value !== null && value !== '') {
            target[key] = value;
        }
    });
    if (parsed.path) {
        const nested = parseQueryString(parsed.path);
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
        groupIndex: null,
        slotIndex: null,
        uuid: '',
        gameid: '',
        sharePath: '',
        hasGameId: false,
        title: '',
        shareTitle: '邀请加入比赛',
        joining: false,
        joinSuccess: false,
        joinError: '',
        joinedGroupIndex: -1,
        joinedSlotIndex: -1
    },

    onLoad(options) {
        const params = this.normalizeOptions(options);

        this.hasGroupIndexParam = false;
        this.hasSlotIndexParam = false;

        const dataUpdate = {};

        // 接收并显示 UUID
        if (params.uuid) {
            console.log('接收到 UUID:', params.uuid);
            dataUpdate.uuid = params.uuid;
        } else {
            console.warn('未接收到 UUID');
        }

        if (params.groupIndex !== undefined) {
            const groupIndex = Number.parseInt(params.groupIndex, 10);
            if (!Number.isNaN(groupIndex)) {
                dataUpdate.groupIndex = groupIndex;
                this.hasGroupIndexParam = true;
            }
        }

        if (params.slotIndex !== undefined) {
            const slotIndex = Number.parseInt(params.slotIndex, 10);
            if (!Number.isNaN(slotIndex)) {
                dataUpdate.slotIndex = slotIndex;
                this.hasSlotIndexParam = true;
            }
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
        });
    },

    onReady() {
        console.log('页面准备就绪, 当前 UUID:', this.data.uuid);
    },

    onShow() {
        console.log('页面显示, 当前 UUID:', this.data.uuid);
    },

    onHide() {

    },

    onUnload() {

    },

    onPullDownRefresh() {

    },

    onReachBottom() {

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
        return `/pages/player-select/wxshare/wxshare?${query.join('&')}`;
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

    handleOpenDetail() {
        if (!this.data.gameid) {
            wx.showToast({
                title: '暂无比赛详情',
                icon: 'none'
            });
            return;
        }

        wx.navigateTo({
            url: `/pages/gameDetail/gameDetail?gameid=${this.data.gameid}`
        });
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

            const payload = {
                uuid: this.data.uuid,
                source: 'wxshare'
            };

            if (this.data.gameid) {
                payload.gameid = this.data.gameid;
            }

            if (this.hasGroupIndexParam && Number.isInteger(this.data.groupIndex)) {
                payload.groupIndex = this.data.groupIndex;
            }

            if (this.hasSlotIndexParam && Number.isInteger(this.data.slotIndex)) {
                payload.slotIndex = this.data.slotIndex;
            }

            const result = await app.api.game.joinGame(payload, {
                loadingTitle: '加入中...'
            });

            if (result?.code !== 200) {
                throw new Error(result?.message || '加入失败');
            }

            const joinedGroupIndex = result?.groupIndex
                ?? result?.data?.groupIndex
                ?? this.data.groupIndex;
            const joinedSlotIndex = result?.slotIndex
                ?? result?.data?.slotIndex
                ?? this.data.slotIndex;

            const hasJoinedGroupIndex = typeof joinedGroupIndex === 'number' && !Number.isNaN(joinedGroupIndex);
            const hasJoinedSlotIndex = typeof joinedSlotIndex === 'number' && !Number.isNaN(joinedSlotIndex);

            const successUpdate = {
                joinSuccess: true,
                joinedGroupIndex: hasJoinedGroupIndex ? joinedGroupIndex : -1,
                joinedSlotIndex: hasJoinedSlotIndex ? joinedSlotIndex : -1
            };

            if (hasJoinedGroupIndex) {
                this.hasGroupIndexParam = true;
                successUpdate.groupIndex = joinedGroupIndex;
            }

            if (hasJoinedSlotIndex) {
                this.hasSlotIndexParam = true;
                successUpdate.slotIndex = joinedSlotIndex;
            }

            this.setData(successUpdate);

            wx.showToast({
                title: '加入成功',
                icon: 'success'
            });
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
