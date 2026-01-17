Component({
    properties: {
        groups: {
            type: Array,
            value: []
        }
    },

    data: {
        viewGroups: []
    },

    observers: {
        'groups': function (newGroups) {
            this.initGroups(newGroups);
        }
    },

    methods: {
        initGroups(groups) {
            if (!Array.isArray(groups)) {
                this.setData({ viewGroups: [] });
                return;
            }

            const viewGroups = groups.map(group => {
                const players = Array.isArray(group?.players)
                    ? group.players.map(player => ({ ...player }))
                    : [];
                const config = group?.groupOneballConfig && typeof group.groupOneballConfig === 'object'
                    ? { ...group.groupOneballConfig }
                    : {};

                players.forEach(player => {
                    const playerKey = String(player.user_id);
                    const side = config[playerKey];
                    if (side === 'A' || side === 'B') {
                        player._oneballSide = side;
                    }
                });

                return {
                    ...group,
                    players,
                    groupOneballConfig: config
                };
            });

            console.log('[OneBallConfig] initGroups', {
                groupCount: viewGroups.length,
                groups: viewGroups.map(group => ({
                    groupid: group?.groupid,
                    playerCount: Array.isArray(group?.players) ? group.players.length : 0,
                    config: group?.groupOneballConfig
                }))
            });
            this.setData({ viewGroups });
        },

        onAssignSide(e) {
            const { groupIndex, userId, side } = e.currentTarget.dataset;
            const viewGroups = [...this.data.viewGroups];
            const group = viewGroups[groupIndex];
            if (!group) return;

            const nextSide = String(side);
            const players = Array.isArray(group.players) ? group.players : [];
            const config = group?.groupOneballConfig && typeof group.groupOneballConfig === 'object'
                ? { ...group.groupOneballConfig }
                : {};
            config[String(userId)] = nextSide;

            const updatedPlayers = players.map(player => {
                if (String(player.user_id) === String(userId)) {
                    return { ...player, _oneballSide: nextSide };
                }
                return player;
            });

            viewGroups[groupIndex] = {
                ...group,
                players: updatedPlayers,
                groupOneballConfig: config
            };

            console.log('[OneBallConfig] onAssignSide', {
                groupIndex,
                userId,
                side: nextSide,
                groupid: group?.groupid,
                config
            });
            this.setData({ viewGroups });
            this.emitChange(viewGroups);
        },

        emitChange(viewGroups) {
            const cleanedGroups = this.getCleanGroups(viewGroups);
            console.log('[OneBallConfig] emitChange', {
                groupCount: cleanedGroups.length,
                groups: cleanedGroups.map(group => ({
                    groupid: group?.groupid,
                    playerCount: Array.isArray(group?.players) ? group.players.length : 0,
                    config: group?.groupOneballConfig
                }))
            });
            this.triggerEvent('configChange', { groups: cleanedGroups });
        },

        getCleanGroups(viewGroups) {
            return viewGroups.map(group => ({
                ...group,
                players: (group.players || []).map(player => {
                    const cleanPlayer = { ...player };
                    delete cleanPlayer._oneballSide;
                    return cleanPlayer;
                })
            }));
        },

        getGroupsConfig() {
            return this.getCleanGroups(this.data.viewGroups);
        }
    }
});
