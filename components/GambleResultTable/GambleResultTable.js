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

                    // 处理获胜者详情
                    if (hole.winner_detail && Array.isArray(hole.winner_detail)) {
                        for (const winner of hole.winner_detail) {
                            const userid = winner.userid;
                            const money = winner.final_points || 0;
                            const donated = winner.pointsDonated || 0;

                            // 确保该用户存在于我们的球员列表中
                            if (playersMap[userid]) {
                                holeMoney[userid] = money;
                                totalMoney[userid] += money;
                                totalDonated[userid] += donated;
                            }
                        }
                    }

                    // 处理失败者详情
                    if (hole.failer_detail && Array.isArray(hole.failer_detail)) {
                        for (const failer of hole.failer_detail) {
                            const userid = failer.userid;
                            const money = failer.final_points || 0;
                            const donated = failer.pointsDonated || 0;

                            // 确保该用户存在于我们的球员列表中
                            if (playersMap[userid]) {
                                holeMoney[userid] = money;
                                totalMoney[userid] += money;
                                totalDonated[userid] += donated;
                            }
                        }
                    }

                    // 确保红蓝分组数据的类型一致性
                    const redTeam = (hole.red || []).map(id => String(id));
                    const blueTeam = (hole.blue || []).map(id => String(id));


                    // 为每个球员计算class
                    const playerClasses = {};
                    for (const player of players) {
                        const userid = String(player.userid);
                        const classes = ['cell'];

                        if (redTeam.includes(userid)) {
                            classes.push('team-red');
                        }
                        if (blueTeam.includes(userid)) {
                            classes.push('team-blue');
                        }

                        playerClasses[userid] = classes.join(' ');
                    }

                    processedHoles.push({
                        ...hole,
                        holeMoney,
                        red: redTeam,
                        blue: blueTeam,
                        playerClasses
                    });
                }
            }


            console.log('🎮 [GambleResultTable] 处理后的数据:', {
                players: players.map(p => ({ userid: p.userid, nickname: p.nickname, teamClass: p.teamClass })),
                processedHoles: processedHoles.map(h => ({
                    id: h.id,
                    playerClasses: h.playerClasses
                }))
            });

            this.setData({
                players, // 现在是数组格式
                totalMoney,
                totalDonated,
                processedHoles
            });
        }
    }
});
