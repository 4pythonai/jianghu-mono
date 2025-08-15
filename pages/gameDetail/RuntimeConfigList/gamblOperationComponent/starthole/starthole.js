import { gameStore } from '../../../../../stores/gameStore';
const app = getApp();

Component({
    properties: {
        // 传入的 runtimeConfigs 列表
        selectType: {
            type: String,
            value: 'start'
        },
        // 控制弹窗显示状态
        isStartholeVisible: {
            type: Boolean,
            value: false
        }
    },

    data: {
        holeList: [],
        ifShowModal: false,
        startHoleindex: 1, // 起始洞索引
        roadLength: 9,     // 道路长度
    },


    lifetimes: {
        attached() {
            // 直接从 gameStore 获取洞数据
            const holeList = gameStore.gameData?.holeList || [];

            // 设置起始洞索引和道路长度
            const startHoleindex = holeList.length > 0 ? holeList[0].hindex : 1;
            const roadLength = holeList.length || 9;

            this.setData({
                holeList,
                startHoleindex,
                roadLength
            });

        },
        detached() {
            this.disposer?.();
        }
    },


    methods: {

        // 确定按钮点击
        onConfirm() {

        },

        // 关闭弹窗
        close() {
            this.triggerEvent('close');
        },

        noTap() { },

        onModalCancel() {
            this.triggerEvent('close');
        },

        // RealHolePlayListSetter 确认事件
        async onHoleOrderConfirm(e) {
            const res = await app.api.gamble.changeStartHole({
                gameid: gameStore.gameid,
                holeList: e.detail.holePlayList
            })
            if (res.code === 200) {
                wx.showToast({
                    title: '出发洞设置成功',
                    icon: 'success'
                })
                await gameStore.fetchGameDetail(gameStore.gameid, gameStore.groupid);
                this.triggerEvent('close');
            }
        }
    }
});
