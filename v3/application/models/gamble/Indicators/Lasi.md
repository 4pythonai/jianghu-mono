# 示范数据:


```
hole 结构:

Array
(
    [court_key] => 1
    [holeid] => 1378
    [holename] => A1
    [par] => 4
    [hindex] => 1
    [computedScores] => Array
        (
            [14] => 5
            [59] => 1
            [122] => 4
            [837590] => 4
        )

    [raw_scores] => Array
        (
            [14] => 5
            [59] => 1
            [122] => 4
            [837590] => 4
        )

    [debug] => Array
        (
            [0] => 分组:4_固拉,第一洞分组,采用出发设置
        )

    [indicators] => Array
        (
        )

    [blue] => Array
        (
            [0] => 59
            [1] => 122
        )

    [red] => Array
        (
            [0] => 837590
            [1] => 14
        )

)

kpis: 

Array
(
    [kpiValues] => Array
        (
            [best] => 1
            [worst] => 1
            [total] => 1
        )

    [indicators] => Array
        (
            [0] => best
            [1] => worst
            [2] => total
        )

    [totalCalculationType] => plus_total
)

```


### 拉丝算法

"拉丝"是指从多个玩家中"拉"出特定的指标来进行比较。比如 A,B 与 C,D 比赛时：

- **比较"双方的最好成绩"**：A,B组取最好成绩 vs C,D组取最好成绩
- **比较"最差杆数"**：A,B组取最差成绩 vs C,D组取最差成绩  
- **比较"2人杆数相加"**：A+B的总和 vs C+D的总和
- **比较"2人杆数乘积"**：A×B的乘积 vs C×D的乘积

在每个指标上都分成输赢(包括打平), 
比如   best=>3 ,意味着比较最好成绩,赢方每人+3点,输方每人-3点.

最后得分是两组在指标集合上输赢的汇总










