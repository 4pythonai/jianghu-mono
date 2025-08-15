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
                    playersMap[player.userid] = player;
                }
            }

            // 使用 useful_holes 来获取实际的赌球结果
            const holesDataToUse = usefulHoles || [];

            // 初始化每个球员的总金额和总锅
            const totalMoney = {};
            const totalDonated = {};
            for (const player of players) {
                const userid = player.userid;
                totalMoney[userid] = 0;
                totalDonated[userid] = 0;
            }

            // 处理洞数据
            const processedHoles = [];
            if (holesDataToUse && Array.isArray(holesDataToUse)) {
                for (const hole of holesDataToUse) {
                    const holeMoney = {};

                    // 初始化所有球员的金额为0
                    for (const player of players) {
                        const userid = player.userid;
                        holeMoney[userid] = 0;
                    }

                    // 处理 players_detail - 所有用户的输赢情况
                    if (hole.players_detail && Array.isArray(hole.players_detail)) {
                        for (const detail of hole.players_detail) {
                            const userid = detail.userid;
                            const money = detail.final_points || 0;
                            const donated = detail.pointsDonated || 0;

                            // 确保该用户存在于我们的球员列表中
                            if (playersMap[userid]) {
                                holeMoney[userid] = money;
                                totalMoney[userid] += money;
                                totalDonated[userid] += donated;
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
                players, // 现在是数组格式
                totalMoney,
                totalDonated,
                processedHoles
            });
        }
    }
});
