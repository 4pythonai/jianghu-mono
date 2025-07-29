Component({
    properties: {
        // 球员信息数组
        groupInfo: {
            type: Array,
            value: []
        },
        // 洞数据数组
        holesData: {
            type: Array,
            value: []
        },
        // 实际赌球结果数据
        usefulHoles: {
            type: Array,
            value: []
        },
        // 红蓝分组数据
        redBlueData: {
            type: Array,
            value: []
        }
    },

    data: {
        players: [], // 改为数组格式
        playerCount: 0,
        totalMoney: {},
        totalDonated: {},
        processedHoles: []
    },

    observers: {
        'groupInfo, holesData, usefulHoles, redBlueData': function (groupInfo, holesData, usefulHoles, redBlueData) {
            console.log('[GambleResultTable] 数据变化:', {
                groupInfoLength: groupInfo?.length,
                holesDataLength: holesData?.length,
                usefulHolesLength: usefulHoles?.length,
                redBlueDataLength: redBlueData?.length
            });
            this.processData();
        }
    },

    methods: {
        // 处理数据
        processData() {
            const { groupInfo, holesData, usefulHoles, redBlueData } = this.properties;

            console.log('[GambleResultTable] 开始处理数据:', {
                groupInfo,
                holesData,
                usefulHoles,
                redBlueData
            });

            // 处理球员信息 - 保持为数组格式
            const players = [];
            const playersMap = {}; // 用于快速查找的对象映射

            if (groupInfo && Array.isArray(groupInfo)) {
                groupInfo.forEach(player => {
                    players.push(player);
                    playersMap[player.userid] = player;
                });
            }

            console.log('[GambleResultTable] 处理后的球员信息:', {
                playersCount: players.length,
                playersMapKeys: Object.keys(playersMap)
            });

            // 不需要构建红蓝分组映射，因为useful_holes中已经包含了红蓝分组信息
            console.log('[GambleResultTable] 使用useful_holes中的红蓝分组信息');

            // 使用 useful_holes 而不是 holes 来获取实际的赌球结果
            const holesDataToUse = usefulHoles || holesData || [];

            console.log('[GambleResultTable] 使用的洞数据:', holesDataToUse);

            // 初始化每个球员的总金额和总锅
            const totalMoney = {};
            const totalDonated = {};
            players.forEach(player => {
                const userid = player.userid;
                totalMoney[userid] = 0;
                totalDonated[userid] = 0;
            });

            // 处理洞数据
            const processedHoles = [];
            if (holesDataToUse && Array.isArray(holesDataToUse)) {
                holesDataToUse.forEach((hole, index) => {
                    console.log(`[GambleResultTable] 处理第${index + 1}个洞:`, hole);

                    const holeMoney = {};
                    const holeDonated = {};

                    // 初始化所有球员的金额和锅为0
                    players.forEach(player => {
                        const userid = player.userid;
                        holeMoney[userid] = 0;
                        holeDonated[userid] = 0;
                    });

                    // 处理获胜者详情
                    if (hole.winner_detail && Array.isArray(hole.winner_detail)) {
                        hole.winner_detail.forEach(winner => {
                            const userid = winner.userid;
                            const money = winner.final_points || 0;
                            const donated = winner.pointsDonated || 0;

                            // 确保该用户存在于我们的球员列表中
                            if (playersMap[userid]) {
                                holeMoney[userid] = money;
                                holeDonated[userid] = donated;
                                totalMoney[userid] += money;
                                totalDonated[userid] += donated;
                            }
                        });
                    }

                    // 处理失败者详情
                    if (hole.failer_detail && Array.isArray(hole.failer_detail)) {
                        hole.failer_detail.forEach(failer => {
                            const userid = failer.userid;
                            const money = failer.final_points || 0;
                            const donated = failer.pointsDonated || 0;

                            // 确保该用户存在于我们的球员列表中
                            if (playersMap[userid]) {
                                holeMoney[userid] = money;
                                holeDonated[userid] = donated;
                                totalMoney[userid] += money;
                                totalDonated[userid] += donated;
                            }
                        });
                    }

                    // 确保红蓝分组数据的类型一致性
                    const redTeam = (hole.red || []).map(id => String(id));
                    const blueTeam = (hole.blue || []).map(id => String(id));

                    console.log(`[GambleResultTable] 洞${hole.hindex}的红蓝分组:`, {
                        holeIndex: hole.hindex,
                        red: redTeam,
                        blue: blueTeam,
                        originalRed: hole.red,
                        originalBlue: hole.blue
                    });

                    // 为每个球员计算class
                    const playerClasses = {};
                    players.forEach(player => {
                        const userid = String(player.userid);
                        let classes = ['cell'];

                        if (redTeam.includes(userid)) {
                            classes.push('team-red');
                        }
                        if (blueTeam.includes(userid)) {
                            classes.push('team-blue');
                        }

                        playerClasses[userid] = classes.join(' ');
                    });

                    processedHoles.push({
                        ...hole,
                        holeMoney,
                        holeDonated,
                        red: redTeam,
                        blue: blueTeam,
                        playerClasses
                    });
                });
            }

            console.log('[GambleResultTable] 处理完成:', {
                playersCount: players.length,
                processedHolesCount: processedHoles.length,
                totalMoney,
                totalDonated,
                sampleHole: processedHoles[0]
            });

            this.setData({
                players, // 现在是数组格式
                playerCount: players.length,
                totalMoney,
                totalDonated,
                processedHoles
            });
        },

        // 获取球员的队伍类名
        getTeamClass(hole, userid) {
            if (hole.red && Array.isArray(hole.red) && hole.red.includes(userid)) {
                return 'team-red';
            } else if (hole.blue && Array.isArray(hole.blue) && hole.blue.includes(userid)) {
                return 'team-blue';
            }
            return '';
        },

        // 获取金额显示类名
        getMoneyClass(money) {
            if (money > 0) {
                return 'money-positive';
            } else if (money < 0) {
                return 'money-negative';
            }
            return 'money-zero';
        },

        // 格式化金额显示
        formatMoney(money) {
            return money > 0 ? `+${money}` : `${money}`;
        },

        // 获取洞名称显示
        getHoleDisplayName(hole) {
            const holeName = hole.holename || hole.id || '';
            if (hole.draw === 'y') {
                return `${holeName}❓`;
            }
            return holeName;
        },

        // 获取单元格的class
        getCellClass(hole, player) {
            let classes = ['cell'];

            // 检查红队
            if (hole.red && Array.isArray(hole.red)) {
                const isRed = hole.red.some(id => String(id) === String(player.userid));
                if (isRed) {
                    classes.push('team-red');
                }
            }

            // 检查蓝队
            if (hole.blue && Array.isArray(hole.blue)) {
                const isBlue = hole.blue.some(id => String(id) === String(player.userid));
                if (isBlue) {
                    classes.push('team-blue');
                }
            }

            return classes.join(' ');
        }
    }
});
