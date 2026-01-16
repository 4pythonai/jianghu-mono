import api from '@/api/index'

Page({
    data: {
        // 各类数量
        teamsCount: 0,
        followingsCount: 0,
        followersCount: 0,
        ghostsCount: 0,

        // 好友列表
        friends: [],
        groupedFriends: [],
        indexList: [],

        // UI状态
        loading: false,
        searchKeyword: '',
        currentLetter: '',
        showLetterToast: false
    },

    onLoad() {
        this.loadContactsData()
    },

    onShow() {
        // 每次显示时刷新数据
        this.loadContactsData()
    },

    /**
     * 加载通讯录数据
     */
    async loadContactsData() {
        if (this.data.loading) return
        this.setData({ loading: true })

        try {
            const result = await api.user.getContactsOverview({}, {
                loadingTitle: '加载中...'
            })

            if (result?.code === 200) {
                const friends = result.friends || []
                const { groups, indexList } = this.groupFriendsByLetter(friends)

                this.setData({
                    teamsCount: result.teams_count || 0,
                    followingsCount: result.followings_count || 0,
                    followersCount: result.followers_count || 0,
                    ghostsCount: result.ghosts_count || 0,
                    friends: friends,
                    groupedFriends: groups,
                    indexList: indexList
                })
            } else {
                wx.showToast({ title: '加载失败', icon: 'none' })
            }
        } catch (error) {
            console.error('加载通讯录失败:', error)
            wx.showToast({ title: '网络错误', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    /**
     * 获取名字的首字母
     */
    getFirstLetter(name) {
        if (!name) return '#'
        const first = name.charAt(0).toUpperCase()
        if (/[A-Z]/.test(first)) return first
        const code = name.charCodeAt(0)
        if (code >= 0x4e00 && code <= 0x9fff) {
            return this.getChinesePinyinInitial(name.charAt(0))
        }
        return '#'
    },

    /**
     * 获取中文字符的拼音首字母
     */
    getChinesePinyinInitial(char) {
        const pinyinRanges = [
            { letter: 'A', chars: '阿啊哎唉埃挨癌矮艾爱碍暧安按案暗昂凹敖傲奥澳' },
            { letter: 'B', chars: '八巴扒吧拔把靶坝爸罢霸白百柏摆败拜班般颁斑搬板版办半伴扮瓣邦帮绑榜膀蚌傍谤包胞苞褒薄雹保堡饱宝抱报暴爆杯悲碑北辈背贝备惫奔本笨崩绷蹦逼鼻比彼笔币必毕闭碧蔽壁避臂边编蝙鞭扁便变遍辨辩标彪膘表别憋瘪宾彬滨濒冰兵丙饼柄并病拨波玻剥伯驳泊博搏脖膊薄卜补捕不布步部怖' },
            { letter: 'C', chars: '擦才材财裁采彩踩菜蔡参餐残蚕惨惭灿仓苍舱藏操曹槽草册厕侧测策层曾插叉茶查察差拆柴豺掺搀缠产阐颤昌猖场尝常偿肠厂敞畅倡唱抄超钞朝潮嘲吵炒车扯彻撤掣尘臣沉辰陈晨闯趁衬称撑成呈诚承城乘程惩澄逞橙吃池驰迟持匙尺齿耻侈炽冲充虫崇宠抽仇绸愁筹酬丑臭初出除厨础储楚处触畜川穿传船喘串窗床闯创吹炊垂锤春纯唇醇蠢戳疮辞慈磁雌此刺次从匆葱聪丛凑粗促醋簇蹿窜催摧脆翠村存寸搓措错' },
            { letter: 'D', chars: '达答打大呆代带待袋逮戴丹单担胆但旦弹淡蛋氮当挡党荡档刀叨导岛祷倒蹈到盗悼道稻德的灯登等邓凳瞪低堤滴敌笛狄涤翟底抵地弟帝递第颠典点电店垫淀殿碉雕刁掉吊钓调跌爹叠蝶丁叮盯钉顶订定丢东冬懂动冻洞都斗抖陡督毒独读堵赌杜肚度渡端短段断锻堆队对兑敦蹲盾顿钝遁多夺朵躲剁惰堕' },
            { letter: 'E', chars: '俄鹅额恶厄扼遏噩恩儿而耳尔饵二' },
            { letter: 'F', chars: '发乏伐罚阀法帆番翻凡烦繁反返犯泛贩范饭方坊芳房防妨仿访纺放飞非啡菲肥匪诽肺废沸费分纷芬坟焚奋粪愤丰封风枫疯峰锋蜂冯奉凤佛否夫肤孵伏扶服俘浮符幅福辐蝠抚府辅腐父付妇负附赴复副傅富腹覆' },
            { letter: 'G', chars: '该改盖概钙干甘杆肝赶敢感冈刚岗纲缸钢港杠高膏糕搞稿告戈哥胳鸽割搁歌阁革格葛隔个各给根跟耕更庚羹埂耿梗工攻功公供宫恭龚拱共贡勾沟钩狗构购够估咕孤姑辜菇古谷股骨鼓固故雇瓜刮挂褂乖怪关官冠观管馆贯惯灌罐光广归龟规圭硅轨鬼柜贵桂跪滚棍锅郭国果裹过' },
            { letter: 'H', chars: '哈孩海害含函寒韩罕喊汉汗旱捍悍焊憾撼翰杭航毫豪好号耗浩呵喝荷核盒贺褐赫鹤黑嘿痕很狠恨哼横衡轰哄烘虹鸿洪宏红喉侯猴吼后厚候乎呼忽狐胡壶湖糊蝴虎唬互户护花华哗滑猾化划画话怀淮坏欢还环缓幻唤换患荒慌皇黄煌晃谎灰挥辉恢回毁悔汇会惠慧昏婚浑魂混豁活火伙或货获祸惑霍' },
            { letter: 'J', chars: '机鸡饥迹积基绩激及吉级极即急疾集辑籍几己挤脊计记纪忌技际季既济继寄加夹佳家嘉甲贾钾假价驾架嫁尖坚间肩艰兼监煎拣俭捡减剪检简碱见件建剑健渐践鉴键箭江姜将浆疆僵缰讲奖蒋桨匠降酱交郊娇浇骄焦胶椒蕉礁角狡绞饺脚搅叫轿较教阶皆接揭街节杰捷劫截竭洁结解介戒届界借巾今斤金津筋仅紧锦谨进晋近尽劲荆京惊精睛晶经井警景颈静境镜敬竟竞净炯窘揪究纠九久酒旧救就舅咎居拘狙驹鞠局菊橘举矩句巨拒具炬俱剧惧锯聚捐娟卷倦眷绢撅决绝觉掘嚼军君均菌俊峻' },
            { letter: 'K', chars: '卡咖开凯慨刊勘堪坎砍看康慷糠扛抗炕考烤靠科颗棵磕壳咳可渴克刻客课肯啃坑空孔恐控口扣枯哭窟苦库酷裤夸垮跨块快筷款狂况矿框旷况亏盔窥葵魁傀愧溃昆捆困扩括阔' },
            { letter: 'L', chars: '拉垃啦喇腊蜡辣来莱赖兰拦栏蓝篮览懒缆烂滥郎狼廊朗浪捞劳牢老姥烙涝乐勒雷蕾磊垒泪类累冷愣梨离漓璃黎篱狸理礼李里鲤力历厉立丽利励例隶栗莉荔俩连联莲廉帘怜链恋练脸敛炼粮良凉梁量辆亮谅疗僚辽聊了料列劣烈猎裂邻林临淋灵玲凌铃陵岭领另令溜刘流留硫瘤柳六龙笼聋隆垄拢楼搂漏陋炉卢庐芦颅鹿碌录陆路露卤鲁赂卵乱掠略抡伦沦轮论罗萝逻锣箩骡裸落络洛骆' },
            { letter: 'M', chars: '妈麻马码蚂骂吗嘛埋买迈麦卖脉蛮满馒瞒蔓漫慢忙芒盲茫猫毛矛茅锚卯贸冒帽貌么没眉梅媒煤霉每美妹门闷们萌盟猛蒙孟梦眯迷谜米泌密蜜眠绵棉免勉面苗描瞄秒妙庙灭蔑民敏名明鸣命摸模膜摩磨蘑魔末抹沫墨默谋某母亩木目牧墓幕慕暮' },
            { letter: 'N', chars: '拿哪内那纳钠乃奶耐奈南难囊恼脑闹呢嫩能尼泥你逆溺拈年念娘酿鸟尿捏聂您宁凝牛扭纽农浓弄奴怒女暖挪诺' },
            { letter: 'O', chars: '哦欧偶呕沤' },
            { letter: 'P', chars: '趴爬帕怕拍排牌派攀盘判叛盼畔庞旁胖抛炮跑泡胚陪培赔佩配喷盆朋棚蓬篷膨捧碰批披劈皮疲脾匹屁僻片偏篇骗漂飘票拼贫频品聘平凭评屏瓶萍坡泼颇婆迫破剖扑铺葡蒲朴普谱' },
            { letter: 'Q', chars: '七妻柒凄漆齐其奇祈骑棋旗乞企启起气弃汽契砌器恰洽千迁牵铅谦签前潜钱钳浅遣欠歉枪腔强墙抢悄敲乔侨桥瞧巧切茄且窃亲侵芹秦琴禽勤青轻氢倾清情晴请庆穷丘秋蚯求球区曲驱屈躯趋取娶去圈全权泉拳犬券劝缺却雀确鹊裙群' },
            { letter: 'R', chars: '然燃染嚷让饶扰绕惹热人仁忍刃认任扔仍日绒荣容溶熔融柔肉如儒乳辱入软锐瑞润若弱' },
            { letter: 'S', chars: '撒洒萨塞赛三伞散桑丧嗓扫嫂色涩森杀沙纱砂傻厦啥晒山杉删衫珊闪陕扇善伤商赏上尚裳捎梢烧稍少绍哨舌蛇舍设社射涉摄申伸身深神沈审婶肾甚渗慎升生声牲绳省圣盛剩尸失师诗施狮湿十什石时识实食史矢使始驶士氏世市示式势事侍释饰视试是适室逝誓寿收手首守瘦兽书叔殊疏舒输蔬熟薯暑鼠属术述束树竖数刷耍衰摔甩帅双霜爽谁水税睡顺瞬说丝司私思死四似寺饲巳松耸宋送颂搜艘苏俗诉肃素速宿塑酸蒜算虽随岁碎穗遂隧孙损笋缩所索锁' },
            { letter: 'T', chars: '他她它塌踏台抬太态泰贪摊滩坛谈潭坦叹炭探碳汤唐堂塘膛糖躺倘淌趟烫涛掏逃桃陶淘萄讨套特疼腾藤梯踢啼提题蹄体替天添田甜填挑条跳贴铁帖厅听烃庭停亭廷挺艇通同铜童统桶筒痛偷头投透凸突图徒途涂土吐兔团推腿退吞托拖脱驼鸵妥拓唾' },
            { letter: 'W', chars: '挖哇蛙瓦歪外弯湾丸完玩顽挽晚碗万汪亡王网往忘旺望危威微为违围唯惟维伟伪尾委卫未位味胃谓慰魏温文纹闻蚊稳问翁窝我沃卧握乌污屋无吴吾五午伍武舞务物误悟雾' },
            { letter: 'X', chars: '夕西吸希悉析息牺袭习席洗喜戏系细虾瞎峡狭辖霞下吓夏厦仙先纤掀鲜闲弦贤咸嫌显险现献县线限宪陷馅羡相香厢湘箱详祥翔享响想向巷项象像橡削消宵销小晓孝校笑效些歇鞋协挟携谐写泄泻卸屑械谢蟹心辛欣新薪信星腥猩刑型形邢行醒杏姓幸性兄凶胸雄熊休修羞朽秀绣袖嗅须虚需徐许叙序畜续絮蓄宣悬旋玄选癣眩绚削薛穴学雪血勋寻巡询循训讯逊迅' },
            { letter: 'Y', chars: '压呀押鸦鸭牙芽崖涯衙哑雅亚咽烟延严言岩沿炎研盐颜阎蜒演掩眼衍艳宴验焰雁燕央秧杨扬羊阳洋仰养氧痒样腰邀摇遥咬药要耀爷也冶野业叶页夜液一伊衣医依仪宜姨移遗疑椅乙已以蚁倚矣义亿忆艺议亦异役译易疫益谊意溢因阴音殷银引隐饮印应英婴樱鹰迎盈营蝇赢影映硬哟拥涌永泳勇用优忧幽悠尤由油邮游友有又右幼诱于予余盂鱼娱渔愉榆虞愚与宇羽雨语玉吁育郁域浴寓豫预欲喻遇御裕愈誉冤元园原员圆缘源远怨院愿曰约月岳钥悦阅跃越云匀允陨孕运蕴酝晕韵' },
            { letter: 'Z', chars: '杂灾栽宰载再在暂赞脏葬遭糟早枣澡灶皂造噪躁则择泽责贼怎增赠扎眨炸渣轧札闸铡榨窄债寨沾粘瞻詹展崭斩盏占战站湛绽张章彰掌涨仗帐账胀障招找召赵照罩肇折哲者蔗这浙针侦珍真诊枕振震镇阵争征睁挣蒸整正证政症郑芝枝知织肢脂蜘执直值职植殖止只旨址纸指至志制治质致挚秩智滞中忠终钟衷肿种众重州舟周洲轴粥宙皱骤朱株珠诸猪蛛竹烛逐主煮嘱拄瞩著助住注驻柱祝筑铸抓爪专砖转赚装壮状撞追椎锥坠缀赘准捉桌卓着浊灼酌啄琢茁资姿咨滋仔籽紫子自字宗踪综棕总纵邹走奏揍租足族阻组祖钻嘴最罪醉尊遵昨左作坐座做' }
        ]

        for (const range of pinyinRanges) {
            if (range.chars.includes(char)) {
                return range.letter
            }
        }
        return '#'
    },

    /**
     * 按首字母分组好友
     */
    groupFriendsByLetter(friends) {
        const groups = {}
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')

        alphabet.forEach(letter => { groups[letter] = [] })

        friends.forEach((friend, index) => {
            // 添加日志：检查分组时的 user_id 字段
            if (friend.user_id !== undefined && friend.user_id !== null) {
                console.log(`分组处理[${index}]: user_id = ${friend.user_id}, 类型 = ${typeof friend.user_id}`)
            }

            const name = friend.display_name || ''
            const letter = this.getFirstLetter(name)
            if (groups[letter]) {
                groups[letter].push(friend)
            } else {
                groups['#'].push(friend)
            }
        })

        const result = []
        const indexList = []
        alphabet.forEach(letter => {
            if (groups[letter] && groups[letter].length > 0) {
                result.push({ letter, friends: groups[letter] })
                indexList.push(letter)
            }
        })

        return { groups: result, indexList }
    },

    /**
     * 搜索好友
     */
    onSearchInput(e) {
        const keyword = e.detail.value.trim().toLowerCase()
        this.setData({ searchKeyword: keyword })

        if (!keyword) {
            const { groups, indexList } = this.groupFriendsByLetter(this.data.friends)
            this.setData({ groupedFriends: groups, indexList })
            return
        }

        const filteredFriends = this.data.friends.filter(friend =>
            friend.display_name?.toLowerCase().includes(keyword) ||
            friend.user_id?.toString().includes(keyword)
        )

        const { groups, indexList } = this.groupFriendsByLetter(filteredFriends)
        this.setData({ groupedFriends: groups, indexList })
    },

    /**
     * 清空搜索
     */
    clearSearch() {
        this.setData({ searchKeyword: '' })
        const { groups, indexList } = this.groupFriendsByLetter(this.data.friends)
        this.setData({ groupedFriends: groups, indexList })
    },

    /**
     * 点击字母索引
     */
    onIndexTap(e) {
        const letter = e.currentTarget.dataset.letter
        this.scrollToLetter(letter)
    },

    /**
     * 触摸字母索引
     */
    onIndexTouchMove(e) {
        const touch = e.touches[0]
        const query = wx.createSelectorQuery().in(this)
        query.select('.index-bar').boundingClientRect()
        query.exec((res) => {
            if (res[0]) {
                const rect = res[0]
                const itemHeight = rect.height / this.data.indexList.length
                const index = Math.floor((touch.clientY - rect.top) / itemHeight)

                if (index >= 0 && index < this.data.indexList.length) {
                    const letter = this.data.indexList[index]
                    if (letter !== this.data.currentLetter) {
                        this.scrollToLetter(letter)
                    }
                }
            }
        })
    },

    /**
     * 滚动到指定字母
     */
    scrollToLetter(letter) {
        this.setData({
            currentLetter: letter,
            showLetterToast: true
        })

        const selector = letter === '#' ? '#group-hash' : `#group-${letter}`
        const query = wx.createSelectorQuery().in(this)
        query.select(selector).boundingClientRect()
        query.selectViewport().scrollOffset()
        query.exec((res) => {
            if (res[0] && res[1]) {
                const elementTop = res[0].top
                const scrollTop = res[1].scrollTop
                wx.pageScrollTo({
                    scrollTop: scrollTop + elementTop - 100,
                    duration: 200
                })
            }
        })

        setTimeout(() => {
            this.setData({ showLetterToast: false })
        }, 500)
    },

    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        this.loadContactsData().finally(() => {
            wx.stopPullDownRefresh()
        })
    },

    // ========== 导航方法 ==========

    /**
     * 跳转到我的球队
     */
    goToTeams() {
        wx.navigateTo({ url: '/packageTeam/my-team/my-team' })
    },

    /**
     * 跳转到关注列表
     */
    goToFollowings() {
        wx.navigateTo({ url: '/packagePlayer/contacts/followings/followings' })
    },

    /**
     * 跳转到粉丝列表
     */
    goToFollowers() {
        wx.navigateTo({ url: '/packagePlayer/contacts/followers/followers' })
    },

    /**
     * 跳转到非注册好友列表
     */
    goToGhosts() {
        wx.navigateTo({ url: '/packagePlayer/contacts/ghosts/ghosts' })
    },

    /**
     * 跳转到添加好友
     */
    goToAddFriend() {
        wx.navigateTo({ url: '/packagePlayer/player-select/addPlayerHub/addPlayerHub' })
    },

    /**
     * 跳转到用户资料页
     */
    goToUserProfile(e) {
        const friend = e.currentTarget.dataset.friend
        if (friend?.user_id) {
            wx.navigateTo({ url: `/packagePlayer/user-profile/user-profile?user_id=${friend.user_id}` })
        }
    }
})
