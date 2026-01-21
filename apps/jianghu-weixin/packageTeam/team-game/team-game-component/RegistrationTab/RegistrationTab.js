/**
 * 报名人员Tab组件
 * 展示按分队分组的报名人员列表
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'
import { buildTagMemberGroups } from '@/utils/teamGameUtils'
import teamgameApi from '@/api/modules/teamgame'

const app = getApp()

Component({
    properties: {
        mode: {
            type: String,
            value: 'display'
        }
    },

    data: {
        tagMemberGroups: [],
        editVisible: false,
        editForm: {
            userId: null,
            showName: '',
            gender: 'unknown',
            prevTagId: null,
            newTagId: null,
            prevTagName: '',
            newTagName: ''
        },
        editTagIndex: 0,
        feeVisible: false,
        feeForm: {
            userId: null,
            showName: '',
            payed: '',
            payMoney: ''
        }
    },

    observers: {
        'game_type, match_format': function (game_type, match_format) {
            console.log('[RegistrationTab] game_type/match_format:', {
                game_type,
                match_format
            })
        },
        'gameTags, tagMembers': function (gameTags, tagMembers) {
            this.refreshTagMemberGroups(gameTags, tagMembers)
        }
    },

    lifetimes: {
        attached() {
            // 绑定 gameStore
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: [
                    'game_type',
                    'match_format',
                    'gameTags',
                    'tagMembers',
                    'gameid'
                ],
                actions: [
                    'loadTagMembers'
                ]
            })
            // 初始化时计算一次
            this.refreshTagMemberGroups(gameStore.gameTags, gameStore.tagMembers)
        },
        detached() {
            if (this.storeBindings) {
                this.storeBindings.destroyStoreBindings()
            }
        }
    },

    methods: {
        refreshTagMemberGroups(gameTags = [], tagMembers = []) {
            const tags = Array.isArray(gameTags) ? gameTags : []
            const members = Array.isArray(tagMembers) ? tagMembers : []
            const result = buildTagMemberGroups(tags, members)
            console.log('[RegistrationTab] 刷新报名分组', {
                gameTagsCount: tags.length,
                tagMembersCount: members.length,
                groupCount: result.length
            })
            this.setData({ tagMemberGroups: result })
        },

        handleEditMember(event) {
            if (this.data.mode !== 'edit') return

            const member = event.detail?.member
            if (!member) return

            const tags = Array.isArray(this.data.gameTags) ? this.data.gameTags : []
            const targetTagId = member.tagId
            const tagIndex = tags.findIndex(tag => String(tag.id) === String(targetTagId))
            const safeIndex = tagIndex >= 0 ? tagIndex : 0
            const selectedTag = tags[safeIndex]
            const prevTagName = member.tagName || selectedTag?.tagName || ''
            const newTagName = selectedTag?.tagName || prevTagName
            const newTagId = selectedTag?.id ?? targetTagId

            this.setData({
                editVisible: true,
                editTagIndex: safeIndex,
                editForm: {
                    userId: member.userId,
                    showName: member.showName || '',
                    gender: member.gender || 'unknown',
                    prevTagId: targetTagId ?? null,
                    newTagId: newTagId ?? null,
                    prevTagName: prevTagName,
                    newTagName: newTagName
                }
            })
        },

        handleEditCancel() {
            this.setData({ editVisible: false })
        },

        handleNicknameInput(event) {
            const value = event.detail?.value || ''
            this.setData({ 'editForm.showName': value })
        },

        handleGenderSelect(event) {
            const value = event.currentTarget?.dataset?.value
            if (!value) return
            this.setData({ 'editForm.gender': value })
        },

        handleTagChange(event) {
            const index = Number(event.detail?.value || 0)
            const tags = Array.isArray(this.data.gameTags) ? this.data.gameTags : []
            const selectedTag = tags[index]
            if (!selectedTag) return

            this.setData({
                editTagIndex: index,
                'editForm.newTagId': selectedTag.id,
                'editForm.newTagName': selectedTag.tagName || ''
            })
        },

        handleEditConfirm() {
            const { gameid, editForm } = this.data
            console.log('[RegistrationTab] edit confirm', {
                gameid,
                user_id: editForm.userId,
                new_nickname: editForm.showName,
                new_gender: editForm.gender,
                prev_tag_id: editForm.prevTagId,
                new_tag_id: editForm.newTagId
            })

            this.submitEditForm()
        },

        async submitEditForm() {
            const { gameid, editForm } = this.data
            if (!gameid || !editForm.userId) {
                wx.showToast({ title: '缺少必要参数', icon: 'none' })
                return
            }

            wx.showLoading({ title: '保存中...' })

            try {
                const result = await app.api.game.changeUerApplyConfig({
                    gameid,
                    user_id: editForm.userId,
                    new_nickname: editForm.showName,
                    new_gender: editForm.gender,
                    new_tag_id: editForm.newTagId
                })

                wx.hideLoading()

                if (result?.code === 200) {
                    wx.showToast({ title: result.message || '保存成功', icon: 'success' })
                    await this.loadTagMembers(gameid)
                    this.storeBindings?.updateStoreBindings()
                    this.setData({ editVisible: false })
                    return
                }

                wx.showToast({ title: result?.message || '保存失败', icon: 'none' })
            } catch (error) {
                wx.hideLoading()
                console.error('[RegistrationTab] submit edit failed:', error)
                wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
            }
        },
        handleFeeMember(event) {
            if (this.data.mode !== 'fee') return

            const member = event.detail?.member
            if (!member) return

            this.setData({
                feeVisible: true,
                feeForm: {
                    userId: member.userId,
                    showName: member.showName || '',
                    payed: member.payed || '',
                    payMoney: member.pay_money ?? ''
                }
            })
        },

        handleFeeCancel() {
            this.setData({ feeVisible: false })
        },

        handlePayStatusSelect(event) {
            const value = event.currentTarget?.dataset?.value
            if (!value) return
            const nextPayMoney = value === 'y' ? this.data.feeForm.payMoney : null
            this.setData({
                'feeForm.payed': value,
                'feeForm.payMoney': nextPayMoney
            })
        },

        handlePayMoneyInput(event) {
            if (this.data.feeForm.payed !== 'y') return
            const value = event.detail?.value ?? ''
            this.setData({ 'feeForm.payMoney': value })
        },

        handleFeeConfirm() {
            this.submitFeeForm()
        },

        async submitFeeForm() {
            const { gameid, feeForm } = this.data
            if (!gameid || !feeForm.userId) {
                wx.showToast({ title: '缺少必要参数', icon: 'none' })
                return
            }

            wx.showLoading({ title: '保存中...' })

            try {
                const result = await teamgameApi.updateTagMemberPayment({
                    game_id: gameid,
                    user_id: feeForm.userId,
                    payed: feeForm.payed,
                    pay_money: feeForm.payMoney
                })

                wx.hideLoading()

                if (result?.code === 200) {
                    await this.loadTagMembers(gameid)
                    this.storeBindings?.updateStoreBindings()
                    this.setData({ feeVisible: false })
                    wx.showToast({ title: result.message || '保存成功', icon: 'success' })
                    return
                }

                wx.showToast({ title: result?.message || '保存失败', icon: 'none' })
            } catch (error) {
                wx.hideLoading()
                console.error('[RegistrationTab] submit fee failed:', error)
                wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
            }
        }
    }
})
