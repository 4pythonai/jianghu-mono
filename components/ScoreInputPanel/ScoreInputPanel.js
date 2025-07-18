import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../stores/gameStore';
import { scoreStore } from '../../stores/scoreStore';

const app = getApp()
Component({
    /**
     * 组件的初始数据
     */
    data: {
        isVisible: false,
        activePlayerIndex: 0,
        holeInfo: null,
        localScores: [],
        players: [],
        playerItemHeight: 120,
        isSaving: false
    },

    observers: {
        'isSaving': (newIsSaving) => {
            console.log('🧪 [ScoreInputPanel] isSaving变化检测:', newIsSaving);
        }
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameid', 'groupId', 'gameData', 'players', 'holeList', 'isSaving'],
                actions: ['setSaving'],
            });
            this.scoreStoreBindings = createStoreBindings(this, {
                store: scoreStore,
                fields: ['scores'],
                actions: ['updateCellScore', 'batchUpdateScoresForHole'],
            });
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
            this.scoreStoreBindings.destroyStoreBindings();
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        show({ holeIndex, playerIndex, unique_key }) {

            // 类型检查和保护
            if (typeof unique_key !== 'string') {
                unique_key = String(unique_key || ''); // 强制转换为字符串
            }

            const holeInfo = this.data.holeList[holeIndex];
            if (!holeInfo) {
                return;
            }

            // 确保 holeInfo.unique_key 也是字符串
            if (typeof holeInfo.unique_key !== 'string') {
                holeInfo.unique_key = String(holeInfo.unique_key || '');
            }

            const players = this.data.players;
            const gameData = this.data.gameData;

            const localScores = players.map((player, pIndex) => {
                const scoreData = this.data.scores[pIndex][holeIndex];
                return {
                    userid: player.userid,
                    score: scoreData.score,
                    putts: scoreData.putts,
                    penalty_strokes: scoreData.penalty_strokes || 0,
                    sand_save: scoreData.sand_save || 0,
                };
            });

            for (const score of localScores) {
                if (!score.score || score.score === 0) {
                    score.score = holeInfo.par || 0;
                    score.putts = 2;
                }
            }

            this.setData({
                isVisible: true,
                holeInfo: { ...holeInfo, originalIndex: holeIndex, unique_key: unique_key },
                players: players,
                gameData: gameData,
                localScores: localScores,
                activePlayerIndex: playerIndex,
            });
        },

        hide() {

            this.setData({
                isVisible: false,
                holeInfo: null,
                localScores: [],
            });

        },

        switchPlayer(e) {
            const index = e.currentTarget.dataset.index;
            this._updateScopingAreaPosition(index);
        },

        changeScore(e) {
            const { type, amount } = e.currentTarget.dataset;
            const index = this.data.activePlayerIndex;
            const currentScore = this.data.localScores[index][type] || 0;
            const newValue = currentScore + Number(amount);

            if (newValue < 0) return;

            this.setData({
                [`localScores[${index}].${type}`]: newValue
            });
        },

        _updateScopingAreaPosition(index) {
            this.setData({
                activePlayerIndex: index,
            });
        },



        async _saveChanges() {
            if (this.data.isSaving) {
                return false; // 防止重复提交, 返回false表示未执行保存
            }
            const holeIndexForStore = this.data.holeInfo.originalIndex; // 用于更新store的数组索引
            const holeUniqueKeyForAPI = this.data.holeInfo.unique_key; // 用于发送给API的唯一键

            if (holeIndexForStore === undefined) {
                return false;
            }


            // 1. 保存旧值, 用于回滚
            const oldScores = this.data.players.map((_, pIndex) => {
                return { ...this.data.scores[pIndex][holeIndexForStore] };
            });

            this.setSaving(true);


            for (let i = 0; i < this.data.localScores.length; i++) {
                const playerScore = this.data.localScores[i];

                // 调用scoreStore的乐观更新
                this.updateCellScore({
                    playerIndex: i,
                    holeIndex: holeIndexForStore,
                    ...playerScore
                });
            }

            try {
                // 4. 调用API
                const apiData = {
                    gameId: this.data.gameid,
                    groupId: this.data.groupId, // 添加分组ID
                    holeUniqueKey: holeUniqueKeyForAPI, // 使用 unique_key 作为洞的唯一标识
                    scores: this.data.localScores,
                };


                // 🔧 禁用API自带的Loading, 使用组件自己的isSaving状态管理
                const result = await app.api.game.saveGameScore(apiData, {
                    showLoading: false // 禁用API自带的Loading
                });

                wx.showToast({ title: result.message, icon: 'success', duration: 1500 });
                return true; // 返回true表示保存成功

            } catch (err) {

                // 强制隐藏可能卡住的Loading
                try {
                    wx.hideLoading();
                    console.log('🔧 [ScoreInputPanel] 异常处理中强制隐藏Loading');
                } catch (e) {
                    console.log('🔧 [ScoreInputPanel] 强制隐藏Loading失败:', e.message);
                }

                wx.showToast({ title: '保存失败,已撤销', icon: 'error' });
                this.batchUpdateScoresForHole({
                    holeIndex: holeIndexForStore,
                    scoresToUpdate: oldScores,
                });
                console.log('🔄 [ScoreInputPanel] 回滚完成');
                return false; // 返回false表示保存失败

            } finally {
                // 6. 无论成功失败, 都结束保存状态
                this.setSaving(false);

                // 7. 多重保险:强制隐藏可能残留的Loading
                try {
                    wx.hideLoading();
                    console.log('🔧 [ScoreInputPanel] finally块中强制隐藏Loading完成');
                } catch (e) {
                    console.log('🔧 [ScoreInputPanel] finally块中强制隐藏Loading失败(可能本来就没有Loading):', e.message);
                }

                // 8. 额外保险:延迟再次检查并隐藏Loading
                setTimeout(() => {
                    try {
                        wx.hideLoading();
                    } catch (e) {
                        console.log('🔧 [ScoreInputPanel] 延迟强制隐藏Loading失败:', e.message);
                    }
                }, 500);

                // 9. 等待一个微任务周期, 确保状态更新完成
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        },

        async handleConfirm() {

            // 🔧 防止重复点击:如果正在保存, 直接返回
            if (this.data.isSaving) {
                return;
            }

            try {
                const saveResult = await this._saveChanges();
                if (saveResult === false) {
                    return; // 保存失败或被跳过, 不关闭面板
                }
                console.log('✅ [ScoreInputPanel] _saveChanges 执行成功');
            } catch (error) {
                return; // 如果保存失败, 不执行后续操作
            }

            // 🔧 保存成功后直接关闭面板
            this.hide();
        },

        handleClear() {
            // 🔧 防止在保存过程中执行清除操作
            if (this.data.isSaving) {
                wx.showToast({ title: '请稍后再试', icon: 'none' });
                return;
            }

            wx.showModal({
                title: '确认清除',
                content: '确定要清除本洞所有人的成绩吗？',
                success: async (res) => {
                    if (res.confirm) {
                        // 🔧 再次检查保存状态, 防止用户在弹窗期间触发了其他保存操作
                        if (this.data.isSaving) {
                            wx.showToast({ title: '请稍后再试', icon: 'none' });
                            return;
                        }

                        const clearedScores = this.data.localScores.map(item => ({
                            ...item,
                            score: 0,
                            putts: 0,
                            penalty_strokes: 0,
                            sand_save: 0,
                        }));
                        this.setData({ localScores: clearedScores });

                        try {
                            const saveResult = await this._saveChanges();
                            if (saveResult !== false) {
                                this.hide(); // 只有保存成功才关闭面板
                            }
                        } catch (error) {
                            console.error('❌ [ScoreInputPanel] 清除后保存失败:', error);
                        }
                    }
                }
            });
        },

        async handleMaskClick() {
            this.hide();
        },

        // 阻止事件冒泡的空方法
        preventBubble() {
            // 空方法, 用于阻止事件冒泡
        },
    }
}) 