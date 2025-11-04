const app = getApp();

Page({
    data: {
        uuid: '',
        gameid: '',
        title: '', // 比赛名称
        courseName: '', // 球场名称
        courseAddress: '', // 球场地址
        openTime: '', // 开球时间
        sharePath: '',
        shareTitle: '邀请加入比赛',
        userAvatar: '', // 用户头像
        userName: '' // 用户昵称
    },

    onLoad(options) {
        console.log('=== wxForward 页面进入参数 ===');
        console.log('原始 options:', options);

        const dataUpdate = {};

        // 接收参数
        if (options.uuid) {
            dataUpdate.uuid = options.uuid;
        }

        if (options.gameid) {
            dataUpdate.gameid = options.gameid;
        }

        if (options.title) {
            dataUpdate.title = decodeURIComponent(options.title);
        }

        if (options.courseName) {
            dataUpdate.courseName = decodeURIComponent(options.courseName);
        }

        if (options.courseAddress) {
            dataUpdate.courseAddress = decodeURIComponent(options.courseAddress);
        }

        if (options.openTime) {
            dataUpdate.openTime = decodeURIComponent(options.openTime);
        }

        // 构建分享路径（跳转到 wxShare 页面）
        const sharePath = this.buildSharePath(
            dataUpdate.uuid || this.data.uuid,
            dataUpdate.gameid || this.data.gameid,
            dataUpdate.title || this.data.title
        );
        dataUpdate.sharePath = sharePath;

        // 设置分享标题
        dataUpdate.shareTitle = dataUpdate.title
            ? `${dataUpdate.title} 邀请你加入比赛`
            : '邀请加入比赛';

        // 设置页面标题
        const pageTitle = dataUpdate.title
            ? `${dataUpdate.title} · 分享预览`
            : '分享预览';

        // 获取用户信息（头像和昵称）
        this.loadUserInfo();

        this.setData(dataUpdate, () => {
            wx.setNavigationBarTitle({
                title: pageTitle
            });

            // 如果有 gameid 但没有球场信息或开球时间，从 API 获取比赛详情
            if (dataUpdate.gameid && (!dataUpdate.courseName || !dataUpdate.openTime)) {
                this.fetchGameDetail();
            }
        });

        // 启用分享菜单
        try {
            wx.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage']
            });
        } catch (error) {
            wx.showShareMenu();
        }
    },

    /**
     * 从 API 获取比赛详情（补充球场信息和开球时间）
     */
    async fetchGameDetail() {
        if (!this.data.gameid) {
            return;
        }

        try {
            const result = await app.api.game.getGameDetail({
                gameid: this.data.gameid
            });

            if (result?.code === 200 && result?.game_detail) {
                const gameDetail = result.game_detail;
                const updateData = {};

                // 如果缺少比赛名称，从 API 获取
                if (!this.data.title && gameDetail.game_name) {
                    updateData.title = gameDetail.game_name;
                }

                // 如果缺少球场名称，从 API 获取
                if (!this.data.courseName && gameDetail.course) {
                    updateData.courseName = gameDetail.course;
                }

                // 如果缺少开球时间，从 API 获取
                if (!this.data.openTime && gameDetail.game_start) {
                    // 格式化开球时间（如果需要）
                    updateData.openTime = gameDetail.game_start;
                }

                if (Object.keys(updateData).length > 0) {
                    // 更新分享标题
                    if (updateData.title) {
                        updateData.shareTitle = `${updateData.title} 邀请你加入比赛`;

                        // 更新页面标题
                        wx.setNavigationBarTitle({
                            title: `${updateData.title} · 分享预览`
                        });
                    }

                    // 更新分享路径
                    const sharePath = this.buildSharePath(
                        this.data.uuid,
                        this.data.gameid,
                        updateData.title || this.data.title
                    );
                    updateData.sharePath = sharePath;

                    this.setData(updateData);
                }
            }
        } catch (error) {
            console.error('[wxForward] fetchGameDetail failed', error);
        }
    },

    /**
     * 构建分享路径，跳转到 wxShare 页面（接收者看到的内容）
     */
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
        // 添加 source=wxshare 标识，确保接收者点击后进入接收者模式
        query.push(`source=wxshare`);
        return `/pages/player-select/wxShare/wxShare?${query.join('&')}`;
    },

    /**
     * 加载用户信息（头像和昵称）
     */
    loadUserInfo() {
        const appInstance = app;
        if (!appInstance) {
            return;
        }

        const userInfo = appInstance.globalData?.userInfo;
        if (userInfo) {
            const normalizedUser = appInstance.normalizeUserInfo
                ? appInstance.normalizeUserInfo(userInfo)
                : userInfo;

            this.setData({
                userAvatar: normalizedUser.avatarUrl || normalizedUser.avatar || '/images/default-avatar.png',
                userName: normalizedUser.nickName || normalizedUser.nickname || normalizedUser.wx_nickname || '我'
            });
        } else {
            // 尝试从存储中获取
            wx.getUserInfo({
                success: (res) => {
                    const user = res.userInfo;
                    this.setData({
                        userAvatar: user.avatarUrl || '/images/default-avatar.png',
                        userName: user.nickName || '我'
                    });
                },
                fail: () => {
                    this.setData({
                        userAvatar: '/images/default-avatar.png',
                        userName: '我'
                    });
                }
            });
        }
    },

    /**
     * 分享给好友
     */
    onShareAppMessage() {
        const title = this.data.shareTitle || '邀请加入比赛';
        return {
            title,
            path: this.buildSharePath(this.data.uuid, this.data.gameid, this.data.title)
        };
    }
});

