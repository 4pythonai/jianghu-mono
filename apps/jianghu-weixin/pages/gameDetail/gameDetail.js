import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/gameStore'
import { scoreStore } from '@/stores/scoreStore'
import { holeRangeStore } from '@/stores/holeRangeStore'

Page({
    data: {
        gameid: '',
        groupid: '',
        currentTab: 0,
    },

    onLoad(options) {
        this.storeBindings = createStoreBindings(this, {
            store: gameStore,
            fields: ['gameData', 'loading', 'error', 'players', 'red_blue'], // 移除不存在的 scores 和 holes 字段
            actions: ['fetchGameDetail'], // 添加fetchGameDetail action
        });
        const gameid = options?.gameid;
        const groupid = options?.groupid;
        const activeTab = options?.activeTab;

        // 设置初始tab，如果传入了activeTab参数则使用，否则默认为0
        const currentTab = activeTab !== undefined ? Number.parseInt(activeTab) : 0;
        this.setData({ gameid, groupid, currentTab });

        console.log('[gameDetail] 页面加载，参数:', { gameid, groupid, activeTab, currentTab });

        // 主动加载游戏数据
        if (gameid) {
            this.fetchGameDetail(gameid, groupid).then(() => {
                // 数据加载完成后，延迟打印调试信息，确保所有store都已更新
                setTimeout(() => {
                    this.printDebugInfo();
                }, 200);
            }).catch(err => {
                console.error('[gameDetail] 加载数据失败:', err);
            });
        }

        // 延迟刷新当前tab数据，确保组件已经挂载
        setTimeout(() => {
            this.refreshCurrentTab();
        }, 100);
    },

    onUnload() {
        this.storeBindings.destroyStoreBindings();
    },

    switchTab: function (e) {
        const tabValue = e.currentTarget.dataset.tab;
        const newTab = Number.parseInt(tabValue, 10);
        if (Number.isNaN(newTab) || newTab < 0) {
            console.warn('⚠️ 无效的tab值:', tabValue);
            return;
        }
        this.setData({ currentTab: newTab });
        this.refreshCurrentTab();
    },

    onShow() {
        console.log('[gameDetail] 页面显示，当前数据:', {
            gameData: this.data.gameData,
            gameid: this.data.gameid,
            groupid: this.data.groupid
        });
        // 打印调试信息
        this.printDebugInfo();
        this.refreshCurrentTab();
    },

    /**
     * 打印调试信息：players, holeList, scores 和计算结果
     */
    printDebugInfo() {
        const players = this.data.players || gameStore.players || [];
        const holeList = holeRangeStore.holeList || [];
        const scores = scoreStore.scores || [];
        const red_blue = this.data.red_blue || gameStore.red_blue || [];

        console.log('==================== 调试信息开始 ====================');
        console.log('📊 [Debug] players:', JSON.parse(JSON.stringify(players)));
        console.log('🕳️ [Debug] holeList:', JSON.parse(JSON.stringify(holeList)));
        console.log('🎯 [Debug] holeList.length:', holeList.length);
        console.log('📝 [Debug] scores:', JSON.parse(JSON.stringify(scores)));
        console.log('🔴🔵 [Debug] red_blue:', JSON.parse(JSON.stringify(red_blue)));

        // 计算显示分数矩阵
        const displayScores = scoreStore.calculateDisplayScores(players, holeList, red_blue);
        console.log('📈 [Debug] displayScores:', JSON.parse(JSON.stringify(displayScores)));

        // 计算总分数组
        const displayTotals = scoreStore.calculateDisplayTotals(displayScores);
        console.log('🔢 [Debug] displayTotals:', displayTotals);

        // 计算OUT和IN汇总
        const { displayOutTotals, displayInTotals } = scoreStore.calculateOutInTotals(displayScores, holeList);
        console.log('📊 [Debug] displayOutTotals:', displayOutTotals);
        console.log('📊 [Debug] displayInTotals:', displayInTotals);
        console.log('📊 [Debug] holeList.length === 18?', holeList.length === 18);

        // 检查每个玩家的OUT数据详情
        if (displayScores.length > 0 && holeList.length === 18) {
            console.log('🔍 [Debug] 检查OUT列计算详情:');
            displayScores.forEach((playerArr, playerIndex) => {
                const player = players[playerIndex];
                const outScores = playerArr.slice(0, 9);
                const inScores = playerArr.slice(9, 18);
                const outTotal = outScores.reduce((sum, s) => sum + (typeof s.score === 'number' ? s.score : 0), 0);
                const inTotal = inScores.reduce((sum, s) => sum + (typeof s.score === 'number' ? s.score : 0), 0);
                console.log(`  玩家 ${playerIndex} (${player?.name || player?.userid}): OUT=${outTotal}, IN=${inTotal}`);
            });
        } else if (holeList.length !== 18) {
            console.warn('⚠️ [Debug] holeList长度不是18，OUT和IN列不会被计算');
        }
        console.log('==================== 调试信息结束 ====================');
    },

    refreshCurrentTab() {
        const { currentTab, gameid, groupid } = this.data;
        console.log('[gameDetail] 刷新当前tab:', { currentTab, gameid, groupid });

        if (currentTab === 0) {
            const component = this.selectComponent('#gameMagement');
            if (component && component.refresh) {
                console.log('[gameDetail] 刷新记分tab');
                component.refresh();
            } else {
                console.warn('[gameDetail] 记分组件未找到或没有refresh方法');
            }
        } else if (currentTab === 1) {
            const component = this.selectComponent('#bbsComponent');
            if (component && component.refresh) {
                console.log('[gameDetail] 刷新互动tab');
                component.refresh();
            } else {
                console.warn('[gameDetail] 互动组件未找到或没有refresh方法');
            }
        } else if (currentTab === 2) {
            const component = this.selectComponent('#GambleSummary');
            if (component && component.refresh) {
                console.log('[gameDetail] 刷新游戏tab');
                component.refresh();
            } else {
                console.warn('[gameDetail] 游戏组件未找到或没有refresh方法');
            }
        }
    }
});