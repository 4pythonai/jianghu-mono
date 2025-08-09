import { gameStore } from '../../../../../stores/gameStore';
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
            const holeList = gameStore.gameData?.holeList || [];

            console.log('holejump: 从gameStore获取的洞数据:', holeList);

            if (holeList && holeList.length > 0) {
                // 使用真实的洞数据
                this.setData({
                    initialHoleList: holeList,
                    holePlayList: holeList
                });

                console.log('holejump: 初始化洞序数据成功:', holeList);
            } else {
                console.warn('holejump: gameStore中没有洞数据，使用默认数据');
                // 如果没有洞数据，生成默认的18洞数据
                const defaultHoleList = Array.from({ length: 18 }, (_, i) => ({
                    holeid: String(i + 1),
                    unique_key: String(i + 1),
                    par: 4,
                    hindex: i + 1,
                    holename: `${i + 1}号洞`
                }));

                this.setData({
                    initialHoleList: defaultHoleList,
                    holePlayList: defaultHoleList
                });

                console.log('holejump: 使用默认洞序数据:', defaultHoleList);
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
            // 重置到初始状态
            this.setData({
                holePlayList: this.data.initialHoleList
            });
            // 通知HolesDrag组件重置数据
            const holesDrag = this.selectComponent('#holesDrag');
            if (holesDrag) {
                holesDrag.updateHoleList(this.data.initialHoleList);
            }
            this.triggerEvent('reset');
        },

        // 确定按钮事件
        onJumpComplete() {
            console.log("跳洞设置完成");
            console.log("当前的洞序数据:", this.data.holePlayList);
            // 传递当前的洞序数据给父组件
            this.triggerEvent('complete', {
                holePlayList: this.data.holePlayList
            });
        },

        // 测试拖拽功能
        testDrag() {
            console.log("测试拖拽功能");
            const holesDrag = this.selectComponent('#holesDrag');
            if (holesDrag) {
                console.log("HolesDrag component found:", holesDrag);
                const listData = holesDrag.getListData();
                console.log("Current list data:", listData);
            } else {
                console.error("HolesDrag component not found!");
            }
        },

        // 关闭弹框
        close() {
            this.triggerEvent('close');
        }
    }
});