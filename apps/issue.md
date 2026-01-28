# ScoreBoard 计分逻辑问题调查

## 问题描述

API `ScoreBoard/getScoreBoard` 返回的分数存在疑问：

```json
{
    "tag_id": 143,
    "tag_name": "T1",
    "score": -7,
    "combos": [
        {
            "group_id": 1212,
            "score": -5
        },
        {
            "group_id": 1211,
            "score": -3
        }
    ]
}
```

**疑问**: 为什么顶级分数是 -7，而不是 -5 + (-3) = -8？

**比赛类型**:
- `game_type`: "cross_teams"
- `match_format`: "fourball_bestball_stroke"

## 调查过程

### 1. 数据验证

查询数据库获取原始分数：

```sql
SELECT
    hole_id,
    MIN(score) as best_score,
    par,
    MIN(score) - par as differential
FROM t_game_score
WHERE group_id IN (1211, 1212)
GROUP BY hole_id, par
ORDER BY hole_id;
```

结果显示18个洞的 differential 总和为 **-8**，与API返回的 -7 不符。

### 2. 添加调试日志

在 `ScoreBoard.php` 的关键方法中添加了 `debug()` 调用：
- `updateComboScore()`: 记录每个处理的分数
- `finalizeComboScore()`: 记录最终计算结果

### 3. 关键发现

调试日志显示，T1队的成员分配如下：

```sql
SELECT g.groupid, g.group_name, gu.user_id, u.display_name, gu.tag_id, t.tag_name
FROM t_game_group g
LEFT JOIN t_game_group_user gu ON g.groupid = gu.groupid
LEFT JOIN t_user u ON gu.user_id = u.id
LEFT JOIN t_team_game_tags t ON gu.tag_id = t.id
WHERE g.groupid IN (1211, 1212);
```

结果：

| groupid | group_name | user_id | display_name | tag_id | tag_name |
|---------|------------|---------|--------------|--------|----------|
| 1211    | 第1组      | 1       | awen         | 143    | T1       |
| 1211    | 第1组      | 4       | ecoeco       | 143    | T1       |
| 1211    | 第1组      | 11      | USER11       | 144    | T2       |
| 1211    | 第1组      | 13      | USER13       | 144    | T2       |
| 1212    | 第2组      | 5       | JoYa         | 143    | T1       |
| 1212    | 第2组      | 6       | 阿咪阿咪红   | 143    | T1       |
| 1212    | 第2组      | 15      | USER15       | 144    | T2       |
| 1212    | 第2组      | 17      | USER17       | 144    | T2       |

**关键点**:
- T1队只包含4个球员（user 1, 4, 5, 6）
- User 11 和 User 13 属于 T2队，他们的成绩不计入T1

### 4. 分数验证

T1队在以下洞打出低于标准杆的成绩：
- hole 2783: 3杆 (par 4) = -1
- hole 2785: 2杆 (par 4) = -2 (来自user 5, group 1212)
- hole 2789: 3杆 (par 4) = -1
- hole 2790: 1杆 (par 3) = -2 (来自user 5, group 1212)
- hole 2796: 3杆 (par 4) = -1

**总计: -7** ✓

## 问题根源

**原始疑问**: 为什么顶级分数是 -7，而不是两个组的分数相加 (-5 + -3 = -8)？

**答案**: 在 `fourball_bestball_stroke` 模式下，顶级分数**不是**简单地把各组分数相加，而是：
- 对于每个洞，取该tag下**所有组**中的最佳成绩
- 然后汇总所有洞的成绩

**具体说明**:
- 8个球员分为2个TAG（T1有4人，T2有4人）
- T1的4个球员分布在2个组中（group 1211有2人，group 1212有2人）
- T1的顶级分数 = 每个洞取这4个球员中的最佳成绩（跨组）
- Group 1211的分数 = 每个洞取该组内T1球员的最佳成绩
- Group 1212的分数 = 每个洞取该组内T1球员的最佳成绩

因此，顶级分数 ≠ 各组分数之和。

## 初步结论

基于当前算法，计算结果是**正确的**。系统按照 `t_game_group_user.tag_id` 来分组计算成绩。

## 新发现的问题 ⚠️

在验证过程中，发现了更深层的问题：

### 问题1: TAG与球队的关系

- **当前假设**: TAG (tag_id) 代表球队，同一个tag_id的球员成绩一起计算
- **实际情况**:
  1. 一个用户可以属于多个球队
  2. TAG 可以理解为球队的简称，但不跟球队一一对应
  3. 计算成绩时，不应该使用 `t_team`, `t_team_member` 表格

### 问题2: 当前算法使用的表

当前 `ScoreBoard.php` 使用的表：
- `t_game_group_user` - 获取 tag_id
- `t_team_game_tags` - 获取 tag 显示信息（名称、颜色）

**没有使用** `t_team` 或 `t_team_member` 表。

### 问题3: 算法正确性存疑

当前算法逻辑：
```
1. 从 t_game_group_user 获取每个用户的 tag_id
2. 按 tag_id 分组
3. 对于每个 tag，计算该 tag 下所有用户的最佳成绩
```

**需要确认**:
- 在 `cross_teams` + `fourball_bestball_stroke` 模式下，应该如何确定哪些球员的成绩要一起计算？
- 是否应该按实际球队（t_team）分组，而不是按 tag_id？
- 还是应该按组内的 combo 分组？

## 待解决的问题

1. **业务逻辑确认**: 在 cross_teams + fourball_bestball_stroke 模式下，正确的计分逻辑是什么？
2. **数据模型**: TAG、Team、Combo 之间的关系是什么？
3. **算法修正**: 如果当前算法不正确，应该如何修改？

## 相关代码

- 文件: `jianghu-api/v3/application/controllers/ScoreBoard.php`
- 关键方法:
  - `buildTagRows()` (790行): 构建tag行数据
  - `buildTagCombinations()` (813行): 按tag分组
  - `updateComboScore()` (912行): 更新分数
  - `finalizeComboScore()` (938行): 计算最终分数
  - `getGroupsWithMembers()` (1222行): 获取组成员和tag信息

## 下一步

~~需要明确业务需求后，才能确定算法是否需要修改。~~

## 问题已解决 ✅

### 业务需求确认

经过与用户确认，正确的计分逻辑应该是：

1. **没有跨组一说**：不应该跨组取最佳成绩
2. **组内计算**：在每个 group 里，同一个 TAG 的球员，取这些球员的最佳成绩作为该组的成绩
3. **总分相加**：TAG 的总成绩 = 各组成绩之和

### 修复内容

**修改文件**: `jianghu-api/v3/application/models/MScoreboard.php`

**修改方法**: `finalizeComboScore()` (第732行)

**修改前**:
```php
// 使用跨组的最佳成绩（错误）
$sum_score = 0;
$sum_par = 0;
foreach ($combo['hole_scores'] as $hole) {
    $sum_score += $hole['score'];
    $sum_par += $hole['par'];
}
return [
    'score' => $sum_score - $sum_par,  // -7 (错误)
    'thru' => $completed_groups,
    'thru_label' => $completed_groups . '组',
    'combos' => $combos
];
```

**修改后**:
```php
// 使用各组分数之和（正确）
$total_score_sum = 0;
$total_holes_played = 0;
foreach ($combo['group_hole_scores'] as $group_id => $group_holes) {
    // ... 计算每个组的成绩
    $group_score_diff = $group_score - $group_par;
    $total_score_sum += $group_score_diff;  // 累加各组分数
    $total_holes_played += $holes_played;
}
return [
    'score' => $total_score_sum,  // -8 (正确)
    'thru' => $total_holes_played,
    'thru_label' => (string) $total_holes_played,
    'combos' => $combos
];
```

### 修复结果

以 T1 队为例：
- **修改前**: -7 (跨组取最佳)
- **修改后**: -8 (各组相加: -3 + -5 = -8) ✅

### API 文档更新

**修改文件**: `队内赛_队际赛记分与结果API.md`

**更新内容**:
1. 补充了 `combos` 字段的完整说明
2. 明确了 `score` 字段的计算逻辑：**分队总成绩 = 各分组成绩之和**
3. 明确了 `thru` 字段的计算逻辑：**总已打洞数 = 各分组已打洞数之和**
4. 添加了 `combos` 数组的详细字段说明
