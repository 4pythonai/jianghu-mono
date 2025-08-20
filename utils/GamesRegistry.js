/**
 * GamesRegistry - 基于比赛/赌博命名约定的统一游戏注册中心
 * 比赛(game) vs 赌博(gamble)命名规范执行器
 */

const GamesRegistry = {
  // === 比赛类型注册表 ===
  tournaments: {
    '4p-lasi': {
      game: {
        id: '4p-lasi',
        name: '四人拉丝',
        type: 'team-vs',
        maxPlayers: 4,
        description: '四人分组拉丝赌博玩法'
      },
      gamble: {
        id: '4p-lasi-gamble',
        name: '四人拉丝赌博规则',
        // 固定组件配置（维持写死方式）
        componentSchema: [
          {
            type: 'lasi-koufen',
            name: 'LasiKoufen',
            title: '扣分规则',
            category: 'calculation',
            required: true,
            config: {
              defaultKpi: { best: 1, worst: 1, total: 1 },
              kpiOptions: [1, 2, 3, 4, 5]
            }
          },
          {
            type: 'lasi-kpi',
            name: 'LasiKPI',
            title: 'KPI规则',
            category: 'scoring',
            required: true,
            config: {
              indicators: [],
              totalCalculation: 'add_total'
            }
          },
          {
            type: 'lasi-reward',
            name: 'LasiRewardConfig',
            title: '奖励配置',
            category: 'reward',
            required: true
          },
          {
            type: 'lasi-eatmeat',
            name: 'LasiEatmeat',
            title: '吃肉规则',
            category: 'bonus',
            required: false,
            config: {
              eatingRange: {
                "BetterThanBirdie": 4,
                "Birdie": 2,
                "Par": 1,
                "WorseThanPar": 0
              },
              meatValueOptions: ['MEAT_AS_X', 'SINGLE_DOUBLE', 'CONTINUE_DOUBLE', 'DOUBLE_WITHOUT_REWARD'],
              defaultMeatValue: 'MEAT_AS_1'
            }
          },
          {
            type: 'lasi-dingdong',
            name: 'LasiDingDong',
            title: '顶洞规则',
            category: 'conflict',
            required: true,
            config: {
              options: ['NoDraw', 'DrawEqual', 'Diff_X'],
              default: 'DrawEqual'
            }
          }
        ]
      }
    },
    
    '4p-8421': {
      game: {
        id: '4p-8421',
        name: '四人8421',
        type: 'team-vs',
        maxPlayers: 4,
        description: '四人8421赌博玩法'
      },
      gamble: {
        id: '4p-8421-gamble',
        name: '四人8421赌博规则',
        componentSchema: [
          {
            type: 'e8421-koufen',
            name: 'E8421Koufen',
            title: '扣分规则',
            category: 'calculation',
            required: true
          },
          {
            type: 'draw-8421',
            name: 'Draw8421',
            title: '顶洞规则',
            category: 'conflict',
            required: true
          },
          {
            type: 'e8421-meat',
            name: 'E8421Meat',
            title: '吃肉规则',
            category: 'bonus',
            required: false
          }
        ]
      }
    }
  },

  // === 统一获取函数 ===
  getGameConfig(gameType) {
    return this.tournaments[gameType]?.game || null;
  },

  getGambleConfig(gameType) {
    return this.tournaments[gameType]?.gamble || null;
  },

  getGambleComponents(gameType, mode = 'edit') {
    const gamble = this.getGambleConfig(gameType);
    return gamble?.componentSchema || [];
  },

  getDefaultConfig(gameType) {
    const components = this.getGambleComponents(gameType);
    const config = {};
    
    components.forEach(comp => {
      if (comp.name === 'LasiEatmeat') {
        config.eatingRange = comp.config.eatingRange;
        config.meatValueConfig = comp.config.defaultMeatValue;
        config.meatMaxValue = 10000000;
      }
    });
    
    return config;
  }
};

module.exports = GamesRegistry;