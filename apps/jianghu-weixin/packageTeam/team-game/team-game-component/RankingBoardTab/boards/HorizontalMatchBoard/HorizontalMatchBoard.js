import { imageUrl } from '@/utils/image'

Component({
    properties: {
        boardData: {
            type: Object,
            value: null
        },
        players: {
            type: Array,
            value: []
        },
        holeList: {
            type: Array,
            value: []
        },
        displayScores: {
            type: Array,
            value: []
        }
    },
    data: {
        vm: null,
        expandedMatchGroupId: null, // which match group is expanded
        expandedUserId: null, // which player in that group is expanded
        expandedPlayerIndex: null, // store index instead of scores object
        playerIndexMap: new Map(),
    },
    observers: {
        'boardData': function (boardData) {
            this.setData({
                vm: this.buildViewModel(boardData),
            })
        },
        'players': function (players) {
            const playerIndexMap = new Map()
            if (players) {
                players.forEach((p, idx) => {
                    playerIndexMap.set(String(p.user_id), idx)
                })
            }
            this.setData({ 
                playerIndexMap,
                expandedMatchGroupId: null,
                expandedUserId: null,
                expandedPlayerIndex: null,
            })
        }
    },
    methods: {
        onPlayerTap(e) {
            const { groupId, userId } = e.currentTarget.dataset;
            const userIdStr = String(userId);
            if (!groupId || !userIdStr) return;

            // if tapping the same player again, close it
            if (this.data.expandedMatchGroupId === groupId && this.data.expandedUserId === userIdStr) {
                this.onCloseExpand();
                return;
            }

            const playerIndex = this.data.playerIndexMap.get(userIdStr);
            if (playerIndex == null) {
                console.warn('[HorizontalMatchBoard] Player index not found for user_id:', userIdStr);
                this.onCloseExpand();
                return;
            }

            this.setData({
                expandedMatchGroupId: groupId,
                expandedUserId: userIdStr,
                expandedPlayerIndex: playerIndex,
            });
        },

        onCloseExpand() {
            this.setData({
                expandedMatchGroupId: null,
                expandedUserId: null,
                expandedPlayerIndex: null
            });
        },

        findMatchByGroupId(groupId) {
            if (!this.properties.boardData) return null;
            if (this.properties.boardData.mode === 'summary') {
                return (this.properties.boardData.matches || []).find(m => m.group_id === groupId);
            }
            // single match mode
            if (this.properties.boardData.group_id === groupId) {
                return this.properties.boardData;
            }
            return null;
        },

        getSideFromMatch(match, userId) {
            if (!match || !userId) return null;
            const userIdStr = String(userId);
            if (String(match.left?.user_id) === userIdStr) return match.left;
            if (String(match.right?.user_id) === userIdStr) return match.right;
            
            if (Array.isArray(match.left?.members)) {
                const member = match.left.members.find(m => String(m.user_id) === userIdStr);
                if (member) return member;
            }
            if (Array.isArray(match.right?.members)) {
                const member = match.right.members.find(m => String(m.user_id) === userIdStr);
                if (member) return member;
            }
            return null;
        },

        buildViewModel(boardData) {
            if (!boardData) {
                return null
            }

            const isSummary = boardData.mode === 'summary'
            if (isSummary) {
                const left = boardData.left || {}
                const right = boardData.right || {}
                const points = boardData.points || {}
                const matches = Array.isArray(boardData.matches) ? boardData.matches : []

                return {
                    isSummary: true,
                    header: {
                        left: {
                            tag_id: left.tag_id,
                            tag_name: left.tag_name,
                            tag_color: left.tag_color
                        },
                        right: {
                            tag_id: right.tag_id,
                            tag_name: right.tag_name,
                            tag_color: right.tag_color
                        },
                        pointsLeftText: this.formatPoints(points.left),
                        pointsRightText: this.formatPoints(points.right)
                    },
                    rows: matches.map(m => this.normalizeMatchRow(m))
                }
            }

            // Single match payload (same as old horizontal response)
            const singleRow = {
                group_id: boardData.group_id,
                group_name: boardData.group_name,
                left: boardData.left,
                right: boardData.right,
                result: boardData.result,
                status: boardData.status,
                holes_played: boardData.holes_played
            }

            return {
                isSummary: false,
                header: {
                    left: this.getSideHeader(boardData.left),
                    right: this.getSideHeader(boardData.right),
                    pointsLeftText: '',
                    pointsRightText: ''
                },
                rows: [this.normalizeMatchRow(singleRow)]
            }
        },

        getSideHeader(side = {}) {
            if (side.tag_id) {
                return {
                    tag_id: side.tag_id,
                    tag_name: side.tag_name,
                    tag_color: side.tag_color
                }
            }
            // individual_match single mode only has player info
            return {
                tag_id: null,
                tag_name: side.show_name || '',
                tag_color: null
            }
        },

        normalizeMatchRow(match = {}) {
            const left = this.normalizeSide(match.left)
            const right = this.normalizeSide(match.right)

            const winnerSide = match?.result?.winner_side || null
            const resultText = match?.result?.text || ''
            const status = match?.status || null

            const statusText = resultText
                ? resultText
                : (status === 'playing' ? '进行中' : '未开始')

            const thruLabel = this.formatThruLabel(match?.holes_played)

            return {
                group_id: match.group_id,
                group_name: match.group_name || '',
                left,
                right,
                winnerSide,
                thruLabel,
                // show on winning side; draw shows in middle; otherwise show status in middle
                leftResultText: winnerSide === 'left' ? statusText : '',
                rightResultText: winnerSide === 'right' ? statusText : '',
                centerResultText: winnerSide === 'draw' ? statusText : (winnerSide ? '' : statusText)
            }
        },

        normalizeSide(side) {
            if (!side) {
                return {
                    type: 'unknown',
                    show_name: '',
                    avatar: '',
                    tag_id: null,
                    tag_name: '',
                    tag_color: null,
                    members: [],
                    membersText: ''
                }
            }

            // If a side represents a tag but only has one member, treat it as a player view.
            if (side.tag_id && Array.isArray(side.members) && side.members.length === 1) {
                const player = side.members[0];
                return {
                    type: 'player',
                    user_id: player.user_id,
                    show_name: player.show_name || '',
                    avatar: player.avatar, // Use the member's avatar
                    tag_id: side.tag_id ?? null,
                    tag_name: side.tag_name || '',
                    tag_color: side.tag_color ?? null,
                    members: [],
                    membersText: ''
                };
            }

            // A side that is already a player (e.g., individual match)
            if (side.user_id) {
                return {
                    type: 'player',
                    user_id: side.user_id,
                    show_name: side.show_name || '',
                    avatar: side.avatar,
                    tag_id: side.tag_id ?? null,
                    tag_name: side.tag_name || '',
                    tag_color: side.tag_color ?? null,
                    members: [],
                    membersText: ''
                }
            }

            // A side representing a tag with 0, 2, or more members.
            const members = Array.isArray(side.members) ? side.members : []
            const membersText = members
                .map(m => m?.show_name)
                .filter(Boolean)
                .join(' / ')

            return {
                type: 'tag',
                show_name: side.tag_name || '',
                avatar: '',
                tag_id: side.tag_id ?? null,
                tag_name: side.tag_name || '',
                tag_color: side.tag_color ?? null,
                members: members.map(m => ({
                    user_id: m.user_id,
                    show_name: m.show_name,
                    avatar: m.avatar,
                })),
                membersText
            }
        },

        formatPoints(value) {
            const num = Number(value)
            if (Number.isNaN(num)) {
                return '0'
            }
            // keep .5 if needed
            if (Math.abs(num % 1) > 0.000001) {
                return num.toFixed(1)
            }
            return String(num)
        },

        formatThruLabel(holesPlayed) {
            const n = Number(holesPlayed)
            if (!Number.isFinite(n) || n <= 0) {
                return ''
            }
            // default 18 holes for match play
            if (n >= 18) {
                return 'F'
            }
            return String(n)
        }
    }
});
