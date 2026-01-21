# ScoreBoard API 说明

面向比赛成绩页的统一数据接口，根据赛制返回两种构图之一：

- 竖向列表（从上到下按队员或分队 TAG 排列）
- 横向对阵（左 vs 右，仅两方）

控制器：`ScoreBoard`

## 1. 构图与赛制映射

| match_format | 构图 | 行类型 |
| --- | --- | --- |
| individual_stroke | 竖向 | player |
| fourball_best_stroke | 竖向 | tag |
| fourball_oneball_stroke | 竖向 | tag |
| foursome_stroke | 竖向 | tag |
| individual_match | 横向 | player vs player |
| fourball_best_match | 横向 | tag vs tag |
| fourball_oneball_match | 横向 | tag vs tag |
| foursome_match | 横向 | tag vs tag |

说明：
- 四人四球/四人两球/最佳球位（比杆）竖向列表：一行=组合（来自 TAG）。
- 组合成员来源为分组（group）。
- 比洞赛仅支持“左 vs 右”两方对阵，不支持多场同时列表。

## 2. 排名与完成字段

- `rank`：排名（数值）
- `rank_label`：展示用排名（平分时使用 `T` 前缀，如 `T1`）
- `score`：对标准杆差值（负数更好，0 为平标准杆）
- `thru`：已完成洞数（数字）
- `thru_label`：展示用完成状态，正常为数字字符串，完赛为 `F`

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

- `game_id`：必填
- `group_id`：可选（比洞赛且存在多个分组时必须传）

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
    "match_format": "fourball_best_stroke",
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
- `row_type`：`player` 或 `tag`
- `rows[].tag_*`：仅 `row_type=tag` 时返回
- `rows[].members`：组合成员（来自分组 group）
- `rows[].group_*`：该组合所属分组

### 3.2 横向对阵（layout = horizontal）

```json
{
  "code": 200,
  "data": {
    "layout": "horizontal",
    "match_format": "fourball_best_match",
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
- `left` / `right`：两方对阵信息（个人比洞时返回 player 字段）
- `result.text`：最终结果展示（示例：`1UP` / `2&1` / `A/S`）
- `winner_side`：`left` / `right` / `draw`

## 4. 错误返回

```json
{ "code": 400, "message": "缺少必要参数" }
```

常见错误：
- 400：缺少 `game_id` 或比洞赛多分组但未传 `group_id`
- 404：赛事不存在
- 409：比洞赛存在多于两方对阵（当前构图不支持）
