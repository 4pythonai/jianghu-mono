
# ScoreBoard API 说明
面向比赛成绩页的统一数据接口，根据赛制返回两种构图之一：

+ 竖向列表（从上到下按队员或分队 TAG 排列）
+ 横向对阵（左 vs 右，仅两方）

控制器：`ScoreBoard`

## 1. 构图与赛制映射
| match_format | 构图 | 行类型 |
| --- | --- | --- |
| G1:individual_stroke/个人比杆赛 | 竖向 | player |
| G2:fourball_bestball_stroke/四人四球最好成绩比杆赛 | 竖向 | tag |
| G3:fourball_scramble_stroke/四人四球最佳球位比杆赛(旺波) | 竖向 | tag |
| G4:foursome_stroke/四人两球比杆赛 | 竖向 | tag |
| G5:individual_match/个人比洞赛 | 横向 | player vs player |
| G6:fourball_bestball_match/四人四球最好成绩比洞赛 | 横向 | tag vs tag |
| G7:fourball_scramble_match/四人四球最佳球位比洞赛(旺波) | 横向 | tag vs tag |
| G8:foursome_match/四人两球比洞赛 | 横向 | tag vs tag |


说明：

+ 四人四球/四人两球/最佳球位（比杆）竖向列表：一行=组合（来自 TAG）。
+ 组合成员来源为分组（group）。
+ 比洞赛仅支持“左 vs 右”两方对阵，不支持多场同时列表。

## 2. 排名与完成字段
+ `rank`：排名（数值）
+ `rank_label`：展示用排名（平分时使用 `T` 前缀，如 `T1`）
+ `score`：对标准杆差值（负数更好，0 为平标准杆）
+ `thru`：已完成洞数（数字）
+ `thru_label`：展示用完成状态，正常为数字字符串，完赛为 `F`

平分/并列名次：按国际通用规则处理（同分同名次，后续名次跳位）。

## 3. 接口定义
### POST /ScoreBoard/getScoreBoard
**请求参数**

```json
{
  "game_id": 123,
  "group_id": 456
}
```

+ `game_id`：必填
+ `group_id`：可选。
  + 传 `group_id`：返回单个分组的横向对阵数据。
  + 不传 `group_id`：
    + 若仅 1 个分组：返回该分组的横向对阵数据。
    + 若存在多个分组：返回 **summary 汇总结构**（总分 + matches 列表）。

**通用响应结构**

```json
{
  "code": 200,
  "data": {
    "layout": "vertical",
    "match_format": "individual_stroke",
    "game_type": "single_team"
  }
}
```

### 3.1 竖向列表（layout = vertical）
```json
{
  "code": 200,
  "data": {
    "layout": "vertical",
    "match_format": "fourball_bestball_stroke",
    "game_type": "single_team",
    "row_type": "tag",
    "rows": [
      {
        "rank": 1,
        "rank_label": "T1",
        "score": -1,
        "thru": 16,
        "thru_label": "16",
        "tag_id": 10,
        "tag_name": "湖畔队",
        "tag_color": "#00A3FF",
        "members": [
          { "user_id": 101, "show_name": "王启", "avatar": "..." },
          { "user_id": 102, "show_name": "宫非", "avatar": "..." }
        ],
        "group_id": 1001,
        "group_name": "第1组"
      }
    ]
  }
}
```

字段说明（竖向）：

+ `row_type`：`player` 或 `tag`
+ `rows[].tag_*`：仅 `row_type=tag` 时返回
+ `rows[].members`：组合成员（来自分组 group）
+ `rows[].group_*`：该组合所属分组

### 3.1.1 G1 分队>=2（mode = team_player）
当 `match_format=individual_stroke` 且存在 2 个及以上分队（TAG）时，返回分队榜 + 球员榜的组合结构：

```json
{
  "code": 200,
  "data": {
    "layout": "vertical",
    "match_format": "individual_stroke",
    "game_type": "single_team",
    "mode": "team_player",
    "team": {
      "row_type": "tag",
      "n": 3,
      "rows": [
        {
          "rank": 1,
          "rank_label": "T1",
          "tag_id": 137,
          "tag_name": "红队",
          "tag_color": "#D32F2F",
          "score": 5,
          "valid_n": 3,
          "forfeit": false
        }
      ]
    },
    "player": {
      "row_type": "player",
      "rows": [
        {
          "rank": 1,
          "rank_label": "T1",
          "user_id": 1,
          "show_name": "awen",
          "avatar": "...",
          "score": -2,
          "thru": 14,
          "thru_label": "14",
          "tag_id": 137,
          "tag_name": "红队",
          "tag_color": "#D32F2F"
        }
      ]
    }
  }
}
```

说明：
- `team.rows[].score`：该分队按“前 N 名球员总杆差（score diff）求和”的团队成绩（越小越好）。
- `team.rows[].valid_n`：前端“有效人数”列显示用，等于全场统一的 N。
- `team.rows[].forfeit`：当分队人数不足 N 时为 true，视为弃赛并排到最后。
- `player.rows[]`：在该模式下会附带 `tag_*` 方便前端展示队色/队徽点。\n+  玩家排名与团队 topN 选取都允许进行中数据实时滚动。

### 3.2 横向对阵（layout = horizontal）
```json
{
  "code": 200,
  "data": {
    "layout": "horizontal",
    "match_format": "fourball_bestball_match",
    "game_type": "cross_teams",
    "left": {
      "tag_id": 1,
      "tag_name": "美国队",
      "tag_color": "#FF4D4F",
      "members": [
        { "user_id": 101, "show_name": "Antony Kang", "avatar": "..." },
        { "user_id": 102, "show_name": "Eagle Zhang", "avatar": "..." }
      ]
    },
    "right": {
      "tag_id": 2,
      "tag_name": "欧洲队",
      "tag_color": "#1677FF",
      "members": [
        { "user_id": 201, "show_name": "Serena Wang", "avatar": "..." },
        { "user_id": 202, "show_name": "Tiger Woods", "avatar": "..." }
      ]
    },
    "result": {
      "text": "2&1",
      "winner_side": "left"
    },
    "group_id": 1001,
    "group_name": "第1组"
  }
}
```

字段说明（横向）：

+ `left` / `right`：两方对阵信息（个人比洞时返回 player 字段）
+ `result.text`：最终结果展示（示例：`1UP` / `2&1` / `A/S`）
+ `winner_side`：`left` / `right` / `draw`
+ `status`：`playing` / `finished`（当未能计算或尚未开始时可能为空）
+ `holes_played`：已完成洞数（两方都记录了该洞成绩才计入）
+ `holes_remaining`：剩余洞数
+
+说明：当 `t_game_match_result` 缺失时，接口会基于 `t_game_score`（纯杆数）实时计算以上字段与 `result`。

### 3.3 横向对阵汇总（layout = horizontal, mode = summary）
当比洞赛存在多个分组且请求未传 `group_id` 时，返回汇总结构：

```json
{
  "code": 200,
  "data": {
    "layout": "horizontal",
    "mode": "summary",
    "match_format": "individual_match",
    "game_type": "single_team",
    "left": { "tag_id": 137, "tag_name": "红队", "tag_color": "#D32F2F" },
    "right": { "tag_id": 138, "tag_name": "蓝队", "tag_color": "#1976D2" },
    "points": { "left": 1.5, "right": 0.5 },
    "matches": [
      {
        "group_id": 1205,
        "group_name": "第1组",
        "left": {
          "user_id": 1,
          "show_name": "awen",
          "avatar": "...",
          "tag_id": 137,
          "tag_name": "红队",
          "tag_color": "#D32F2F"
        },
        "right": {
          "user_id": 15,
          "show_name": "USER15",
          "avatar": "...",
          "tag_id": 138,
          "tag_name": "蓝队",
          "tag_color": "#1976D2"
        },
        "result": { "text": "2UP", "winner_side": "left" },
        "status": "finished",
        "holes_played": 18,
        "holes_remaining": 0
      }
    ]
  }
}
```

说明：
+ `points` 计分规则：胜=1，平(A/S)=0.5，负=0；仅统计 `status=finished` 的分组对阵。
+ `matches[].left/right`：
  + G5(`individual_match`) 返回 player，并附带其 `tag_*`（便于按红/蓝稳定渲染）。
  + G6/G7/G8 返回 tag vs tag（沿用横向对阵结构）。

## 4. 错误返回
```json
{ "code": 400, "message": "缺少必要参数" }
```

常见错误：

+ 400：缺少 `game_id`
+ 404：赛事不存在
+ 409：比洞赛存在多于两方对阵（当前构图不支持）

