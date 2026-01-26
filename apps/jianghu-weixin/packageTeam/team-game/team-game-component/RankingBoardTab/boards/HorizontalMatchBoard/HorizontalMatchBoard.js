Component({
    properties: {
        boardData: {
            type: Object,
            value: null
        }
    },
    data: {
        vm: null,
        expandedMatchGroupId: null, // which match group is expanded
        expandedPlayerUserId: null, // which player in that group is expanded
        expandedPlayerScores: null, // scores for the expanded player
        holeList: [],
    },
    observers: {
        boardData: function (boardData) {
            // also reset expansion when data changes
            this.setData({
                vm: this.buildViewModel(boardData),
                expandedMatchGroupId: null,
                expandedPlayerUserId: null,
                expandedPlayerScores: null,
                holeList: boardData?.hole_list || [],
            })
        }
    },
    methods: {
        onPlayerTap(e) {
            const { groupId, userId } = e.currentTarget.dataset;
            if (!groupId || !userId) return;

            // if tapping the same player again, close it
            if (this.data.expandedMatchGroupId === groupId && this.data.expandedPlayerUserId === userId) {
                this.onCloseExpand();
                return;
            }

            const match = this.findMatchByGroupId(groupId);
            if (!match) return;
            
            const side = this.getSideFromMatch(match, userId);
            if (!side || !side.scores) {
                console.warn('Player scores not found for user_id:', userId);
                this.onCloseExpand(); // close any open ones
                return;
            }

            const playerScoresForComponent = this.preparePlayerScoresForComponent(side.scores, this.data.holeList);

            this.setData({
                expandedMatchGroupId: groupId,
                expandedPlayerUserId: userId,
                expandedPlayerScores: playerScoresForComponent,
            });
        },

        onCloseExpand() {
            this.setData({
                expandedMatchGroupId: null,
                expandedPlayerUserId: null,
                expandedPlayerScores: null
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
            if (match.left?.user_id === userId) return match.left;
            if (match.right?.user_id === userId) return match.right;
            
            // It could be a team match, where the user is a member
            if (Array.isArray(match.left?.members)) {
                const member = match.left.members.find(m => m.user_id === userId);
                if (member) return member;
            }
            if (Array.isArray(match.right?.members)) {
                const member = match.right.members.find(m => m.user_id === userId);
                if (member) return member;
            }
            return null;
        },
        
        preparePlayerScoresForComponent(playerScores, holeList) {
            if (!playerScores || !Array.isArray(playerScores.holes) || !Array.isArray(holeList)) {
                return { holes: [], outDiff: 0, outDiffText: '', inDiff: 0, inDiffText: '' };
            }
        
            let outDiff = 0;
            let inDiff = 0;
            
            const processedHoles = holeList.map((hole, i) => {
                const score = playerScores.holes[i];
                if (!score) return null;

                const diff = score.strokes - hole.par;
                let scoreClass = '';
                // You can expand this mapping based on your app's CSS
                if (diff < 0) scoreClass = 'under-par';
                if (diff === -1) scoreClass = 'birdie';
                if (diff === -2) scoreClass = 'eagle';
                if (diff > 0) scoreClass = 'over-par';
                if (diff === 1) scoreClass = 'bogey';
                if (diff > 1) scoreClass = 'double-bogey';
        
                if (i < 9) {
                    outDiff += diff;
                } else {
                    inDiff += diff;
                }
        
                return {
                    ...score,
                    diff: diff,
                    scoreClass: scoreClass,
                };
            });
        
            return {
                holes: processedHoles,
                outDiff: outDiff,
                inDiff: inDiff,
                outDiffText: outDiff > 0 ? `+${outDiff}` : String(outDiff),
                inDiffText: inDiff > 0 ? `+${inDiff}` : String(inDiff),
            };
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
                    avatarUrl: '',
                    tag_id: null,
                    tag_name: '',
                    tag_color: null,
                    members: [],
                    membersText: ''
                }
            }

            // player side
            if (side.user_id) {
                return {
                    type: 'player',
                    user_id: side.user_id, // pass user_id for tap event
                    scores: side.scores, // pass scores for tap event
                    show_name: side.show_name ,
                    avatarUrl: side.avatar,
                    tag_id: side.tag_id ?? null,
                    tag_name: side.tag_name || '',
                    tag_color: side.tag_color ?? null,
                    members: [],
                    membersText: ''
                }
            }

            // tag side
            const members = Array.isArray(side.members) ? side.members : []
            const membersText = members
                .map(m => m?.show_name)
                .filter(Boolean)
                .join(' / ')

            return {
                type: 'tag',
                show_name: side.tag_name || '',
                avatarUrl: '',
                tag_id: side.tag_id ?? null,
                tag_name: side.tag_name || '',
                tag_color: side.tag_color ?? null,
                members: members.map(m => ({
                    user_id: m.user_id,
                    show_name: m.show_name,
                    scores: m.scores,
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
