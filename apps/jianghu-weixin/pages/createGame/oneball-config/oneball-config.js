const app = getApp();

Page({
    data: {
        gameid: null,
        groups: []
    },

    onLoad(options) {
        if (options.gameid) {
            this.setData({ gameid: options.gameid });
        }
    },

    onShow() {
        const success = this.loadGroupsFromCommonCreate();
        if (!success) {
            wx.showModal({
                title: '数据加载失败',
                content: '无法获取分组信息, 请返回重试',
                showCancel: false,
                success: () => {
                    wx.navigateBack();
                }
            });
            return;
        }

        this.ensureGroupIds();
    },

    onConfigChange(e) {
        if (Array.isArray(e.detail?.groups)) {
            console.log('[oneball-config] onConfigChange', {
                groupCount: e.detail.groups.length,
                groups: e.detail.groups.map(group => ({
                    groupid: group?.groupid,
                    playerCount: Array.isArray(group?.players) ? group.players.length : 0,
                    config: group?.groupOneballConfig
                }))
            });
            this.setData({ groups: e.detail.groups });
        }
    },

    async onConfirm() {
        const groups = this.data.groups;
        console.log('[oneball-config] onConfirm', {
            groupCount: groups.length,
            groups: groups.map(group => ({
                groupid: group?.groupid,
                playerCount: Array.isArray(group?.players) ? group.players.length : 0,
                config: group?.groupOneballConfig
            }))
        });
        if (!this.isOneBallConfigComplete(groups)) {
            wx.showModal({
                title: '配置未完成',
                content: '请为每个组完成旺波分配',
                showCancel: false
            });
            return;
        }

        const hasGroupIds = await this.ensureGroupIds();
        if (!hasGroupIds) {
            console.log('[oneball-config] missing groupid', groups.map(group => group?.groupid));
            wx.showModal({
                title: '缺少分组ID',
                content: '请返回重试或稍后再保存',
                showCancel: false
            });
            return;
        }

        const payloadGroups = this.data.groups.map(group => ({
            groupid: group.groupid,
            groupOneballConfig: group?.groupOneballConfig && typeof group.groupOneballConfig === 'object'
                ? group.groupOneballConfig
                : {}
        }));
        console.log('[oneball-config] saveOneBallConfig payload', {
            gameid: this.data.gameid,
            groups: payloadGroups
        });

        const pages = getCurrentPages();
        let commonCreatePage = null;
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];
            if (page?.route?.includes('commonCreate')) {
                commonCreatePage = page;
                break;
            }
        }

        if (commonCreatePage && typeof commonCreatePage.onOneBallConfigComplete === 'function') {
            commonCreatePage.onOneBallConfigComplete(groups);
        }

        if (!this.data.gameid) {
            wx.showToast({ title: '缺少比赛信息', icon: 'none' });
            return;
        }

        try {
            await app.api.game.saveOneBallConfig({
                gameid: this.data.gameid,
                groups: payloadGroups
            });
        } catch (error) {
            wx.showToast({ title: '保存失败', icon: 'none' });
            return;
        }

        wx.showToast({
            title: '旺波配置完成',
            icon: 'success'
        });

        setTimeout(() => {
            wx.navigateBack();
        }, 1200);
    },

    onCancel() {
        wx.showModal({
            title: '确认取消',
            content: '取消后将不保存当前配置',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateBack();
                }
            }
        });
    },

    loadGroupsFromCommonCreate() {
        const pages = getCurrentPages();
        let commonCreatePage = null;
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];
            if (page?.route?.includes('commonCreate')) {
                commonCreatePage = page;
                break;
            }
        }

        if (commonCreatePage?.data?.formData?.gameGroups) {
            const gameGroups = commonCreatePage.data.formData.gameGroups;
            const groups = gameGroups.map(group => ({
                ...group,
                groupOneballConfig: group?.groupOneballConfig && typeof group.groupOneballConfig === 'object'
                    ? group.groupOneballConfig
                    : {}
            }));

            console.log('[oneball-config] loadGroupsFromCommonCreate', {
                groupCount: groups.length,
                groups: groups.map(group => ({
                    groupid: group?.groupid,
                    playerCount: Array.isArray(group?.players) ? group.players.length : 0,
                    config: group?.groupOneballConfig
                }))
            });
            this.setData({
                groups,
                gameid: this.data.gameid || commonCreatePage.data.gameid
            });

            return true;
        }

        return false;
    },

    isOneBallConfigComplete(gameGroups) {
        if (!Array.isArray(gameGroups) || gameGroups.length === 0) return false;
        return gameGroups.every(group => this.isGroupOneBallConfigured(group));
    },

    isGroupOneBallConfigured(group) {
        const players = Array.isArray(group?.players) ? group.players : [];
        if (players.length === 0) return false;

        const config = group?.groupOneballConfig && typeof group.groupOneballConfig === 'object'
            ? group.groupOneballConfig
            : {};
        const sideCount = { A: 0, B: 0 };

        for (const player of players) {
            const playerKey = String(player.user_id);
            const side = config[playerKey];
            if (side !== 'A' && side !== 'B') {
                console.log('[oneball-config] invalid side', {
                    groupid: group?.groupid,
                    playerKey,
                    side,
                    config
                });
                return false;
            }
            sideCount[side] += 1;
        }

        console.log('[oneball-config] group configured', {
            groupid: group?.groupid,
            sideCount
        });
        return sideCount.A > 0 && sideCount.B > 0;
    },

    groupNeedsGroupId(group) {
        const players = Array.isArray(group?.players) ? group.players : [];
        if (players.length === 0) return false;
        return group?.groupid === undefined || group?.groupid === null || group?.groupid === '';
    },

    getGroupKeyFromPlayers(players) {
        if (!Array.isArray(players) || players.length === 0) return '';
        const ids = players
            .map(player => player?.user_id)
            .filter(id => id !== undefined && id !== null && id !== '');
        if (ids.length === 0) return '';
        return ids.map(id => String(id)).sort().join('|');
    },

    getGroupKeyFromUsers(users) {
        if (!Array.isArray(users) || users.length === 0) return '';
        const ids = users
            .map(user => user?.user_id)
            .filter(id => id !== undefined && id !== null && id !== '');
        if (ids.length === 0) return '';
        return ids.map(id => String(id)).sort().join('|');
    },

    async ensureGroupIds() {
        const groups = Array.isArray(this.data.groups) ? this.data.groups : [];
        const hasMissing = groups.some(group => this.groupNeedsGroupId(group));
        if (!hasMissing) return true;

        if (!this.data.gameid) {
            console.log('[oneball-config] ensureGroupIds missing gameid');
            return false;
        }

        let result;
        try {
            result = await app.api.game.getGameDetail({ gameid: this.data.gameid });
        } catch (error) {
            console.log('[oneball-config] ensureGroupIds getGameDetail failed', error);
            return false;
        }

        const remoteGroups = result?.game_detail?.groups;
        if (!Array.isArray(remoteGroups)) {
            console.log('[oneball-config] ensureGroupIds invalid remote groups', result);
            return false;
        }

        const remoteMap = new Map();
        remoteGroups.forEach(group => {
            const key = this.getGroupKeyFromUsers(group?.users);
            if (!key) return;
            remoteMap.set(key, group?.groupid);
        });

        const updatedGroups = groups.map(group => {
            if (!this.groupNeedsGroupId(group)) return group;
            const key = this.getGroupKeyFromPlayers(group?.players);
            const groupid = key ? remoteMap.get(key) : undefined;
            if (groupid === undefined || groupid === null || groupid === '') {
                return group;
            }
            return { ...group, groupid };
        });

        console.log('[oneball-config] ensureGroupIds mapped', {
            remoteGroups: remoteGroups.map(group => ({
                groupid: group?.groupid,
                users: Array.isArray(group?.users) ? group.users.map(user => user?.user_id) : []
            })),
            updatedGroups: updatedGroups.map(group => ({
                groupid: group?.groupid,
                players: Array.isArray(group?.players) ? group.players.map(player => player?.user_id) : []
            }))
        });

        this.setData({ groups: updatedGroups });

        return !updatedGroups.some(group => this.groupNeedsGroupId(group));
    }
});
