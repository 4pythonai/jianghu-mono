# 后台 API 编写指南（分享与二维码邀请）

## 场景概述
- 小程序在创建比赛后立即向 `/Game/createBlankGame` 注册空比赛，并持续调用更新类接口完成球场、参赛组、隐私等信息同步。
- 前端新增了“微信分享邀请”和“生成二维码”能力，依赖后台根据 `uuid`/`gameid` 生成可被微信识别的邀请路径以及二维码图片。
- 所有接口均在 `https://qiaoyincapital.com/v3/index.php` 下，以 POST 方式提交 JSON，公共响应格式为：
  ```json
  { "code": 200, "message": "ok", "data": { ... } }
  ```

## 通用约定
- `code`：成功返回 200，失败使用 4xx/5xx，自定义错误需附带 `message`。
- 认证：前端默认附带 `Authorization: Bearer <token>`，401 时后台需返回 `code=401`，前端将触发静默登录重试。
- 所有输入字段请容忍空字符串并校验必填项，异常时返回明确的业务错误信息。

## 核心接口说明

### 1. 创建空比赛 `/Game/createBlankGame`
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| 请求 `uuid` | string | 前端生成的唯一标识，后续所有更新接口都会携带 |
| 响应 `gameid` | number/string | 后台生成的比赛主键，返回后前端解锁分享、二维码功能 |
| 响应 `code` | number | 200 表示成功，非 200 须包含 `message` |

### 2. 更新接口回顾
- `/Game/updateGameName`：`{ uuid, gameName }`
- `/Game/updateGameOpenTime`：`{ uuid, openTime }`
- `/Game/updateGameScoringType`：`{ uuid, scoringType }`
- `/Game/updateGameCourseCourt`：`{ uuid, courseid, frontNineCourtId, backNineCourtId, gameType, totalHoles }`
- `/Game/updateGameGroupAndPlayers`：`{ uuid, groups: [{ groupIndex, players: [...] }] }`
- `/Game/updateGamePrivate` / `/Game/updateGamePrivacyPassword`：用于私密比赛控制
- 要求：所有接口支持幂等更新；返回体保持 `{ code, message, data }`，便于前端统一处理。

### 3. 获取比赛邀请二维码 `/Game/getGameInviteQrcode`
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| 请求 `uuid` | string | 是 | 比赛唯一标识 |
| 请求 `gameid` | string/number | 否 | 供后台校验，可选 |
| 请求 `path` | string | 是 | 需写入到二维码中的小程序路径，例如 `/pages/player-select/wxshare/wxshare?uuid=xxx&gameid=yyy&title=...` |
| 响应 `qrcode_url` | string | 否 | 推荐返回可直接展示的 CDN 图片地址 |
| 响应 `qrcode_base64` | string | 否 | 当无法提供 URL 时，可返回 base64 编码，前端会写入临时文件 |
| 响应 `expire_at` | string | 否 | 可选，表示二维码过期时间，便于前端做刷新提示 |

**实现建议**
- 若复用微信官方 “获取小程序码” 接口，请按照 `path` 字段透传，小程序会在扫码后落地到 `/pages/player-select/wxshare/wxshare`，前端负责解析 `scene`。
- 若生成自有二维码，需要把完整小程序码或转跳链接嵌入图片。
- 返回 4xx 错误时请附带可读 `message`，前端会在二维码页直接展示。

## 业务约束与校验
- 同一个 `uuid` 可多次请求二维码：后台可缓存生成结果，减少重复计算。
- 当前端传入 `title` 时，长度可能达到 50 字符，请做截断或编码处理，避免 URL 超长。
- 若比赛已被取消或不存在，建议返回 `code=404`、`message="比赛不存在"`。

## 日志与监控建议
- 记录 `uuid`、`gameid`、调用方 `openid`（如有）以便追踪分享异常。
- 对二维码生成接口设置 1~5 分钟超时报警，防止第三方依赖异常导致前端长时间 loading。

## 后续扩展
- 预留字段支持限制二维码有效期或次数（可在响应中返回 `limit`）。
- 可在响应 `data.shareUrl` 中补充 H5 落地页链接，供非微信环境使用。
