Component({
    properties: {
        // 球员信息数组
        groupInfo: {
            type: Array,
            value: []
        },
        // 实际赌球结果数据
        usefulHoles: {
            type: Array,
            value: []
        }
    },

    data: {
        players: [], // 改为数组格式
        totalMoney: {},
        totalDonated: {},
        processedHoles: []
    },

    observers: {
        'groupInfo, usefulHoles': function (groupInfo, usefulHoles) {

            this.processData();
        }
    },

    methods: {
        // 处理数据
        processData() {
            const { groupInfo, usefulHoles } = this.properties;

            // 处理球员信息 - 保持为数组格式
            const players = [];
            const playersMap = {}; // 用于快速查找的对象映射

            if (groupInfo && Array.isArray(groupInfo)) {
                for (const player of groupInfo) {
                    players.push(player);
                    playersMap[player.user_id] = player;
                }
            }


            // 使用 useful_holes 来获取实际的赌球结果
            const holesDataToUse = usefulHoles || [];

            // 初始化每个球员的总金额和总锅
            const totalMoney = {};
            const totalDonated = {};
            for (const player of players) {
                const oddsId = player.user_id;
                totalMoney[oddsId] = 0;
                totalDonated[oddsId] = 0;
            }

            // 处理洞数据
            const processedHoles = [];
            if (holesDataToUse && Array.isArray(holesDataToUse)) {
                for (const hole of holesDataToUse) {

                    const holeMoney = {};

                    // 初始化所有球员的金额为0
                    for (const player of players) {
                        const oddsId = player.user_id;
                        holeMoney[oddsId] = 0;
                    }

                    // 处理获胜者详情
                    if (hole.winner_detail && Array.isArray(hole.winner_detail)) {
                        for (const winner of hole.winner_detail) {
                            const oddsId = winner.user_id;
                            const money = winner.final_points || 0;
                            const donated = winner.pointsDonated || 0;

                            if (playersMap[oddsId]) {
                                holeMoney[oddsId] = money;
                                totalMoney[oddsId] += money;
                                totalDonated[oddsId] += donated;
                            }
                        }
                    }

                    // 处理失败者详情
                    if (hole.failer_detail && Array.isArray(hole.failer_detail)) {
                        for (const failer of hole.failer_detail) {
                            const oddsId = failer.user_id;
                            const money = failer.final_points || 0;
                            const donated = failer.pointsDonated || 0;

                            if (playersMap[oddsId]) {
                                holeMoney[oddsId] = money;
                                totalMoney[oddsId] += money;
                                totalDonated[oddsId] += donated;
                            }
                        }
                    }

                    processedHoles.push({
                        ...hole,
                        holeMoney
                    });
                }
            }


            this.setData({
                players,
                totalMoney,
                totalDonated,
                processedHoles
            });
        }
    }
});
