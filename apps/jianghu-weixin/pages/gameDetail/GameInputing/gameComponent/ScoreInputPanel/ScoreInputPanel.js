import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '@/stores/game/gameStore';
import { holeRangeStore } from '@/stores/game/holeRangeStore';
import { scoreStore } from '@/stores/game/scoreStore';

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
        isSaving: false,
        currentHole: null, // 新增: 用于存储当前显示的洞信息
        currentPlayerTee: '', // 当前用户发球台
        currentPlayerDistance: null, // 当前用户发球台码数
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
                fields: ['gameid', 'groupid', 'gameData', 'players', 'isSaving'],
                actions: ['setSaving'],
            });
            this.holeRangeStoreBindings = createStoreBindings(this, {
                store: holeRangeStore,
                fields: ['holeList'],
                actions: [],
            });
            this.scoreStoreBindings = createStoreBindings(this, {
                store: scoreStore,
                fields: ['scores'],
                actions: ['batchUpdateScoresForHole', 'updateScore'],
            });
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
            this.holeRangeStoreBindings.destroyStoreBindings();
            this.scoreStoreBindings.destroyStoreBindings();
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        show(options) {
            const { holeIndex, playerIndex } = options;
            const hole = this.data.holeList?.[holeIndex] || {};
            const players = this.data.players || [];
            const scores = this.data.scores || [];


            const localScores = players.map((player) => {
                const scoreData = (scores || []).find(
                    s => String(s.userid) === String(player.userid) && String(s.hindex) === String(hole.hindex)
                ) || {};
                const defaultScore = (scoreData.score && scoreData.score > 0) ? scoreData.score : (hole.par ?? 0);


                return {
                    userid: player.userid,
                    score: defaultScore,
                    putts: scoreData.putts ?? 2,
                    penalty_strokes: scoreData.penalty_strokes ?? 0,
                    sand_save: scoreData.sand_save ?? 0,
                    tee_shot_direction: scoreData.tee_shot_direction || 'center',
                };
            });

            // 计算初始发球台信息
            const initialPlayer = players[playerIndex];
            const initialTee = initialPlayer?.tee?.toLowerCase() || '';
            const initialDistance = hole?.[initialTee];

            this.setData({
                isVisible: true,
                currentHole: hole,
                holeInfo: { ...hole, originalIndex: holeIndex, unique_key: hole.unique_key },
                players,
                gameData: this.data.gameData,
                localScores,
                activePlayerIndex: playerIndex,
                currentPlayerTee: initialTee,
                currentPlayerDistance: (initialDistance && initialDistance > 0) ? initialDistance : null,
            });
        },

        hide() {

            this.setData({
                isVisible: false,
                holeInfo: null,
                localScores: [],
                currentHole: null, // 隐藏时也清空currentHole
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

            // 成绩最少为1，不能变成0或负数
            if (newValue < 1) {
                // 如果当前已经是1，继续减就不更新（保持为1）
                if (currentScore <= 1) {
                    return;
                }
                // 如果当前大于1但减去后会小于1，设置为1
                this.setData({
                    [`localScores[${index}].${type}`]: 1
                });
                return;
            }

            this.setData({
                [`localScores[${index}].${type}`]: newValue
            });
        },

        _updateScopingAreaPosition(index) {
            // 获取发球台信息
            const activePlayer = this.data.players?.[index];
            const tee = activePlayer?.tee?.toLowerCase() || '';
            const distance = this.data.currentHole?.[tee];

            this.setData({
                activePlayerIndex: index,
                currentPlayerTee: tee,
                currentPlayerDistance: (distance && distance > 0) ? distance : null
            });
        },



        async _saveChanges() {
            if (this.data.isSaving) {
                return false; // 防止重复提交, 返回false表示未执行保存
            }
            const hindex = this.data.currentHole?.hindex;
            const holeUniqueKeyForAPI = this.data.currentHole?.unique_key;

            if (hindex === undefined) {
                return false;
            }

            // 1. 保存旧值, 用于回滚（可选，暂时不处理）

            this.setSaving(true);

            // 用一维updateScore方法乐观更新
            for (let i = 0; i < this.data.localScores.length; i++) {
                const playerScore = this.data.localScores[i];
                this.updateScore({
                    userid: playerScore.userid,
                    hindex,
                    score: playerScore.score,
                    putts: playerScore.putts,
                    penalty_strokes: playerScore.penalty_strokes,
                    sand_save: playerScore.sand_save,
                    tee_shot_direction: playerScore.tee_shot_direction
                });
            }

            try {
                // 4. 调用API
                const scores = this.data.localScores.map(score => ({
                    ...score,
                    hindex
                }));
                const apiData = {
                    gameid: this.data.gameid,
                    hindex,
                    groupid: this.data.groupid, // 添加分组ID
                    holeUniqueKey: holeUniqueKeyForAPI, // 使用 unique_key 作为洞的唯一标识
                    scores,
                };

                const result = await app.api.game.saveGameScore(apiData, {
                    showLoading: false // 禁用API自带的Loading
                });

                wx.showToast({ title: result.message, icon: 'success', duration: 1500 });

                const pages = getCurrentPages();
                const currentPage = pages[pages.length - 1];
                if (currentPage) {
                    const gameMagement = currentPage.selectComponent('#gameMagement');
                    if (gameMagement && typeof gameMagement.refresh === 'function') {
                        gameMagement.refresh();
                    }
                }

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

            // 判断是否到达最后一个用户
            if (this.isLastPlayer()) {
                // 最后一个用户，保存并关闭面板
                try {
                    const saveResult = await this._saveChanges();
                    if (saveResult === false) {
                        return; // 保存失败或被跳过, 不关闭面板
                    }
                } catch (error) {
                    return; // 如果保存失败, 不执行后续操作
                }

                // 🔧 保存成功后直接关闭面板
                this.hide();
            } else {
                // 不是最后一个用户，切换到下一个用户
                this.switchToNextPlayer();
            }
        },

        async handleClear() {
            // 🔧 防止重复点击:如果正在保存, 直接返回
            if (this.data.isSaving) {
                return;
            }

            // 先清除所有分数为null
            const clearedScores = this.data.localScores.map(score => ({
                ...score,
                score: null,
                putts: null,
                penalty_strokes: null,
                sand_save: null,
                tee_shot_direction: null
            }));

            this.setData({
                localScores: clearedScores
            });

            try {
                const saveResult = await this._saveChanges();
                if (saveResult === false) {
                    return; // 保存失败或被跳过, 不关闭面板
                }
            } catch (error) {
                return; // 如果保存失败, 不执行后续操作
            }

            // 🔧 保存成功后直接关闭面板
            this.hide();
        },

        async handleMaskClick() {
            this.hide();
        },

        // 阻止事件冒泡的空方法
        preventBubble() {
            // 空方法, 用于阻止事件冒泡
        },

        /**
         * 获取当前活跃用户的发球台信息
         * @returns {object} 发球台信息 {tee: string, distance: number}
         */
        getCurrentPlayerTeeInfo() {
            const activePlayer = this.data.players?.[this.data.activePlayerIndex];

            if (!activePlayer?.tee) {
                return { tee: '', distance: null };
            }

            const tee = activePlayer.tee.toLowerCase();
            const distance = this.data.currentHole?.[tee];

            return {
                tee,
                distance: (distance && distance > 0) ? distance : null
            };
        },

        /**
         * 判断是否到达最后一个用户
         * @returns {boolean} 是否到达最后一个用户
         */
        isLastPlayer() {
            return this.data.activePlayerIndex >= this.data.players.length - 1;
        },

        /**
         * 切换到下一个用户
         */
        switchToNextPlayer() {
            const nextIndex = this.data.activePlayerIndex + 1;
            if (nextIndex < this.data.players.length) {
                this._updateScopingAreaPosition(nextIndex);
            }
        },

        /**
         * 获取发球台颜色样式类名
         * @param {string} tee 发球台类型
         * @returns {string} CSS类名
         */
        getTeeColorClass(tee) {
            const validTees = ['black', 'blue', 'white', 'gold', 'red'];
            return validTees.includes(tee) ? `tee-${tee}` : 'tee-default';
        },

        /**
         * 处理开球方向选择
         * @param {Event} e 点击事件
         */
        handleTeeShotDirection(e) {
            const direction = e.currentTarget.dataset.direction;
            const index = this.data.activePlayerIndex;

            // 如果点击的是已选中的方向，则取消选择（设为null）
            const currentDirection = this.data.localScores[index].tee_shot_direction;
            const newDirection = currentDirection === direction ? null : direction;

            this.setData({
                [`localScores[${index}].tee_shot_direction`]: newDirection
            });
        },
    }
}) 