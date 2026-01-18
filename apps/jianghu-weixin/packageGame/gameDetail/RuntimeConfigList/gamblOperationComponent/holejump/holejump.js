import { gameStore } from '@/stores/game/gameStore';
const app = getApp();

Component({
    properties: {
        // 传入的 runtimeConfigs 列表
        runtimeConfigs: {
            type: Array,
            value: []
        }
    },

    data: {
        scrollTop: 0,
        holePlayList: [], // 存储当前的洞序数据
        initialHoleList: [] // 存储初始的洞序数据
    },

    lifetimes: {
        attached() {
            // 组件加载时初始化洞序数据
            this.initHoleList();
        },

        detached() {
        }
    },

    methods: {
        // 初始化洞序数据
        initHoleList() {
            // 从 gameStore 获取真实的洞数据
            const holeList = gameStore.getHoleList || [];

            console.log('holejump: 从gameStore获取的洞数据:', holeList);

            if (holeList && holeList.length > 0) {

                // 使用排序后的真实洞数据
                this.setData({
                    initialHoleList: holeList,
                    holePlayList: holeList
                });

                console.log('holejump: 初始化洞序数据成功（已排序）:', holeList);
            } else {


                this.setData({
                    initialHoleList: holeList,
                    holePlayList: holeList
                });

                console.log('holejump: 使用默认洞序数据（已排序）:', defaultHoleList);
            }
        },

        // 空事件处理
        noop() { },

        // 拖拽排序结束事件处理
        onSortEnd(e) {
            console.log("弹框收到排序结果:", e.detail.listData);
            // 保存排序结果到本地数据
            this.setData({
                holePlayList: e.detail.listData
            });
            // 这里可以处理排序结果，比如保存到本地或传递给父组件
            this.triggerEvent('holesortend', {
                listData: e.detail.listData
            });
        },

        // 滚动事件处理
        onScroll(e) {
            this.setData({
                scrollTop: e.detail.scrollTop
            });
        },

        // 重置按钮事件
        onReset() {
            console.log("重置拖拽排序");

            // 按照 hindex 大小重排洞序数据
            const sortedHoleList = [...this.data.initialHoleList].sort((a, b) => {
                return a.hindex - b.hindex;
            });

            this.setData({
                holePlayList: sortedHoleList
            });

            // 通知HolesDrag组件重置数据
            const holesDrag = this.selectComponent('#holesDrag');
            if (holesDrag) {
                holesDrag.updateHoleList(sortedHoleList);
            }
        },

        // 确定按钮事件 - 参考 starthole.js 的实现
        async onJumpComplete() {

            try {
                // 调用API保存跳洞设置
                console.log("gameid", gameStore.gameid);
                const res = await app.api.gamble.changeStartHole({
                    gameid: gameStore.gameid,
                    holeList: this.data.holePlayList
                });

                console.log("跳洞设置API响应:", res);

                if (res.code === 200) {
                    wx.showToast({
                        title: '跳洞设置成功',
                        icon: 'success'
                    });

                    // 刷新游戏数据
                    await gameStore.fetchGameDetail(gameStore.gameid, gameStore.groupid);

                    // 传递当前的洞序数据给父组件
                    this.triggerEvent('complete', {
                        holePlayList: this.data.holePlayList
                    });

                    // 关闭弹窗
                    this.triggerEvent('close');
                } else {
                    // API调用失败
                    wx.showToast({
                        title: res.msg || '跳洞设置失败',
                        icon: 'none'
                    });
                }
            } catch (error) {
                console.error('跳洞设置失败:', error);
                wx.showToast({
                    title: '跳洞设置失败',
                    icon: 'none'
                });
            }
        },



        // 关闭弹框
        close() {
            this.triggerEvent('close');
        }
    }
});
