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

            console.log('[GambleResultTable] ========== processData 开始 ==========')
            console.log('[GambleResultTable] groupInfo 原始数据:', JSON.stringify(groupInfo, null, 2))
            console.log('[GambleResultTable] usefulHoles 原始数据:', JSON.stringify(usefulHoles?.slice(0, 2), null, 2))

            // 处理球员信息 - 保持为数组格式
            const players = [];
            const playersMap = {}; // 用于快速查找的对象映射

            if (groupInfo && Array.isArray(groupInfo)) {
                for (const player of groupInfo) {
                    console.log('[GambleResultTable] player 原始字段:', Object.keys(player), 'userid:', player.userid, 'user_id:', player.user_id)
                    players.push(player);
                    // groupInfo 用 user_id（有下划线）
                    playersMap[player.user_id] = player;
                }
            }

            console.log('[GambleResultTable] playersMap keys:', Object.keys(playersMap))


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
                        console.log('[GambleResultTable] winner_detail 第一条:', hole.winner_detail[0])
                        for (const winner of hole.winner_detail) {
                            // winner_detail 用 userid（无下划线）
                            const oddsId = winner.userid;
                            const money = winner.final_points || 0;
                            const donated = winner.pointsDonated || 0;

                            // 确保该用户存在于我们的球员列表中
                            if (playersMap[oddsId]) {
                                holeMoney[oddsId] = money;
                                totalMoney[oddsId] += money;
                                totalDonated[oddsId] += donated;
                            } else {
                                console.log('[GambleResultTable] winner 未找到匹配球员, oddsId:', oddsId, 'playersMap keys:', Object.keys(playersMap))
                            }
                        }
                    }

                    // 处理失败者详情
                    if (hole.failer_detail && Array.isArray(hole.failer_detail)) {
                        for (const failer of hole.failer_detail) {
                            // failer_detail 用 userid（无下划线）
                            const oddsId = failer.userid;
                            const money = failer.final_points || 0;
                            const donated = failer.pointsDonated || 0;

                            // 确保该用户存在于我们的球员列表中
                            if (playersMap[oddsId]) {
                                holeMoney[oddsId] = money;
                                totalMoney[oddsId] += money;
                                totalDonated[oddsId] += donated;
                            } else {
                                console.log('[GambleResultTable] failer 未找到匹配球员, oddsId:', oddsId, 'playersMap keys:', Object.keys(playersMap))
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
