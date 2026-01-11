import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'
const navigationHelper = require('@/utils/navigationHelper.js');

Component({
    data: {
        gameAbstract: '',
        gameid: null,
        gameData: null,
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    gameAbstract: 'gameAbstract',
                    gameid: 'gameid',
                    gameData: 'gameData',
                },
                actions: [],
            });
        },

        detached() {
            if (this.storeBindings) {
                this.storeBindings.destroyStoreBindings();
            }
        }
    },

    methods: {
        // 解析游戏元信息
        // 后端 MDetailGame.getGameDetail 返回: uuid, game_name
        resolveGameMeta() {
            const { gameid, gameData } = this.data;
            return {
                gameid: gameid || gameData?.id,
                uuid: gameData?.uuid || '',
                title: gameData?.game_name || '',
            };
        },

        // 显示操作面板
        showOperationPanel() {
            const operationPanel = this.selectComponent('#gameOperationPanel');
            if (operationPanel) {
                const { gameid } = this.resolveGameMeta();
                if (gameid) {
                    operationPanel.show({
                        gameid: gameid
                    });
                } else {
                    console.warn('GameActionBar: 无法获取有效的 gameid');
                    wx.showToast({
                        title: '无法获取比赛信息',
                        icon: 'none'
                    });
                }
            }
        },

        // 处理操作面板选项点击
        onOptionClick(e) {
            console.log('GameActionBar 收到操作面板选项点击:', e.detail);
            this.triggerEvent('optionclick', e.detail);
        },

        // 处理取消比赛
        onCancelGame(e) {
            console.log('GameActionBar 收到取消比赛事件:', e.detail);
            this.triggerEvent('cancelgame', e.detail);
        },

        // 处理结束比赛
        onFinishGame(e) {
            console.log('GameActionBar 收到结束比赛事件:', e.detail);
            this.triggerEvent('finishgame', e.detail);
        },

        // 跳转到添加球员页面
        goToAddPlayer() {
            const { gameid, uuid, title } = this.resolveGameMeta();

            console.log('📋 [GameActionBar] 跳转到添加球员页面:', { gameid, uuid, title });

            if (!gameid) {
                console.warn('GameActionBar: 无法获取有效的 gameid');
                wx.showToast({
                    title: '无法获取比赛信息',
                    icon: 'none'
                });
                return;
            }

            let url = `/pages/player-select/addPlayerHub/addPlayerHub?gameid=${gameid}&groupIndex=0&slotIndex=0`;

            if (uuid) {
                url += `&uuid=${uuid}`;
            }
            if (title) {
                url += `&title=${encodeURIComponent(title)}`;
            }

            navigationHelper.navigateTo(url).catch(err => {
                console.error('[GameActionBar] 跳转失败:', err);
                wx.showToast({
                    title: '跳转失败，请重试',
                    icon: 'none'
                });
            });
        }
    }
})
