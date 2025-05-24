// live.js
const liveGames = [
    {
        "game_id": "1",
        "game_name": "生日快乐万寿无疆",
        "course": "清河湾高尔夫俱乐部",
        "players": [
            {
                "user": 22,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_376beaa4c05158ba841306e8751adf80.png"
            },
            {
                "user": 23,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3806ac7a15bf9cf4a47ef77fd36fbb10.png"
            },
            {
                "user": 24,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_380c99c653dca01dffe1d010a7ab280c.png"
            },
            {
                "user": 25,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_381962bf1b23a4596d2a6f77fde64f1b.png"
            }

        ],
        "watchers_number": 30,
        "game_start": "2025-05-20 10:00:00",
        "completed_holes": 0,
        "holes": 18,
        "have_gamble": true,
        "star_type": "green"
    },
    {
        "game_id": "2",
        "game_name": "夏日高尔夫挑战赛",
        "course": "观澜湖高尔夫俱乐部",
        "players": [
            {
                "user": 27,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3854f6e69c87c34398832a18369e6b2c.png"
            },
            {
                "user": 28,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_385834a2e196f3958b07eb396aed8899.png"
            },
            {
                "user": 29,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3879475b8b57b101ba2ea40af5aae7a5.png"
            }
        ],
        "watchers_number": 25,
        "game_start": "2025-05-21",
        "completed_holes": 9,
        "holes": 18,
        "have_gamble": false,
        "star_type": "yellow"
    },
    {
        "game_id": "3",
        "game_name": "精英高尔夫联赛",
        "course": "佘山高尔夫俱乐部",
        "players": [
            {
                "user": 30,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_38ab5c8ef31fa61c88b18e14f65f31e4.png"
            },
            {
                "user": 31,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_39431800a956199296983db6f83f1d2f.png"
            },
            {
                "user": 32,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3994213a65ab838f36be9fa196d9d1f7.png"
            },
            {
                "user": 33,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3a02e72479b954bd4b516562298b95f3.png"
            }
        ],
        "watchers_number": 45,
        "game_start": "2025-05-22",
        "completed_holes": 18,
        "holes": 18,
        "have_gamble": true,
        "star_type": "green"
    },
    {
        "game_id": "4",
        "game_name": "周末休闲高尔夫",
        "course": "三亚亚龙湾高尔夫俱乐部",
        "players": [
            {
                "user": 34,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3a592a66ca7e109e03233b4aa36f97a9.png"
            },
            {
                "user": 35,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3a722d3513a38fa8336484dcd404de41.png"
            }
        ],
        "watchers_number": 15,
        "game_start": "2025-05-23",
        "completed_holes": 6,
        "holes": 18,
        "have_gamble": false,
        "star_type": "yellow"
    },
    {
        "game_id": "5",
        "game_name": "企业高尔夫联谊赛",
        "course": "深圳高尔夫俱乐部",
        "players": [
            {
                "user": 36,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3bae41f5671dbb593da63af69693b24e.png"
            },
            {
                "user": 37,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3bb3cd7d98606fb062f67c1aa6d5a2dc.png"
            },
            {
                "user": 38,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3bb7a0d679ea9151548f490b19c38b26.png"
            },
            {
                "user": 39,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3bbf7955aae76e87888254effd5ad8c3.png"
            }
        ],
        "watchers_number": 35,
        "game_start": "2025-05-24",
        "completed_holes": 15,
        "holes": 18,
        "have_gamble": true,
        "star_type": "green"
    },
    {
        "game_id": "6",
        "game_name": "高尔夫新手训练营",
        "course": "北京高尔夫俱乐部",
        "players": [
            {
                "user": 40,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3c976bc1a2f732af7798b93e8eceb539.png"
            },
            {
                "user": 41,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3d08d5a55d1234258c9776a6cc228b47.png"
            },
            {
                "user": 42,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3e973c1601c0a97f5e2d9db6c28dc223.png"
            }
        ],
        "watchers_number": 20,
        "game_start": "2025-05-25",
        "completed_holes": 9,
        "holes": 18,
        "have_gamble": false,
        "star_type": "yellow"
    },
    {
        "game_id": "7",
        "game_name": "高尔夫大师赛",
        "course": "上海高尔夫俱乐部",
        "players": [
            {
                "user": 43,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3eb53e2ac0effb69ddcc7e306f7d042b.png"
            },
            {
                "user": 44,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3f0cd121c251620447b2a451c969d8ec.png"
            },
            {
                "user": 45,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3f1c363d1ed4bb151d22bf30b874345b.png"
            },
            {
                "user": 46,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3f4378f6277a927f5d4aeec5b14ee012.png"
            }
        ],
        "watchers_number": 50,
        "game_start": "2025-05-26",
        "completed_holes": 18,
        "holes": 18,
        "have_gamble": true,
        "star_type": "green"
    },
    {
        "game_id": "8",
        "game_name": "高尔夫友谊赛",
        "course": "广州高尔夫俱乐部",
        "players": [
            {
                "user": 47,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3f52db79279aeddde1bd7925b568f65c.png"
            },
            {
                "user": 48,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_3f7cde7c12ba04a9dc73aca3c8c10987.png"
            }
        ],
        "watchers_number": 18,
        "game_start": "2025-05-27",
        "completed_holes": 12,
        "holes": 18,
        "have_gamble": false,
        "star_type": "yellow"
    },
    {
        "game_id": "9",
        "game_name": "高尔夫锦标赛",
        "course": "杭州高尔夫俱乐部",
        "players": [
            {
                "user": 49,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_40d52110ed71b00e93f8f066babd1d9b.png"
            },
            {
                "user": 50,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_414626515b1349a5983fb66c078c0922.png"
            },
            {
                "user": 51,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_41742327e5426a8a465884773e160760.png"
            },
            {
                "user": 52,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_41e048c89396f5b9a85b24c09d730efc.png"
            }
        ],
        "watchers_number": 40,
        "game_start": "2025-05-28",
        "completed_holes": 18,
        "holes": 18,
        "have_gamble": true,
        "star_type": "green"
    },
    {
        "game_id": "10",
        "game_name": "高尔夫体验赛",
        "course": "成都高尔夫俱乐部",
        "players": [
            {
                "user": 53,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_42baab82dde15ff959918d477ef1a352.png"
            },
            {
                "user": 54,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_43166d4f7230db65a826aec546cee043.png"
            },
            {
                "user": 55,
                "avatar": "http://s1.golf-brother.com/data/attach/userVipPic/2025/05/20/p240_73ac8fb9cc8299edfc0115791ab436c3.png"
            }
        ],
        "watchers_number": 22,
        "game_start": "2025-05-29",
        "completed_holes": 9,
        "holes": 18,
        "have_gamble": false,
        "star_type": "yellow"
    }
]


Page({
    data: {
        currentTab: 0,  // 当前选中的Tab索引
        games: liveGames
    },

    // Tab切换处理函数
    switchTab(e) {
        const index = Number.parseInt(e.currentTarget.dataset.index)
        if (this.data.currentTab === index) {
            return
        }

        this.setData({
            currentTab: index
        })
    },

    onLoad() {
        // 页面加载时执行
    },

    onShow() {
        // 页面显示时执行
    },

    onPullDownRefresh() {
        // 下拉刷新
        setTimeout(() => {
            wx.stopPullDownRefresh()
        }, 1000)
    }
})