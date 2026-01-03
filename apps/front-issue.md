重构建议文档

  - 现存问题
      - api/config.js：currentEnv硬编码为development，生产包会继续指向开发域名，无法区分环境。
      - api/request-simple.js：statusCode != 401即当成功返回，4xx/5xx 与业务 code 非 200 的情况直接透传，界面误以为成
        功；错误提示分散在各页面，重试仅限 401。
      - utils/auth.js：收到后端的 profile_status/need_bind_phone 仍被本地重新推导，头像/手机号判断依赖客户端默认头像
        规则，易与服务端状态不一致。
      - pages/live/live.js：onLoad 与 onShow 均调用 loadGames，首次进入重复请求，Tab 往返也会双请求。
      - app.js 分享路径拼装未做 encodeURIComponent，参数含 &/?/空格 时分享链接会破。
      - 工具/模块风格混用（ESM 与 CJS 并存，如 utils/*），长函数缺拆分，公共导航约定（见 CLAUDE.md）未统一在全局强约
        束。
  - 建议的重构方向
      - 环境配置：从 wx.getAccountInfoSync().miniProgram.envVersion 或构建注入变量选择 ENV，默认 production；拆分
        baseURL/wsURL 配置文件，避免硬编码。
      - 请求层：在 request-simple 内统一判定 statusCode >= 400 或 data.code !== ErrorCode.SUCCESS 时走错误分支（弹
        Toast + reject），401 继续静默刷新，其他错误不再被页面当成功处理；抽出错误提示策略，减少页面重复 try/catch。
      - 认证链路：优先使用服务端返回的 profile_status/need_bind_phone，缺失时再回退本地推导；storage 里保持与服务端一
        致的字段，减少多端状态漂移。
      - 生命周期调用：pages/live/live.js 仅在 onLoad 或首个 onShow 加载一次，后续下拉/切 Tab 再刷新，避免重复请求与闪
        烁。
      - 分享参数：构造分享 path 时对 key/value 逐个 encodeURIComponent，确保特殊字符和空格可用。
      - 代码组织：
          - 统一模块规范（全部 ESM 或 CJS），为工具函数添加最小注释，拆分超长函数（如 app.js 导航栏计算）。
          - 补充 API 模块的输入/输出约定（可在 docs/ 增加接口说明），减少魔法字段。
          - 按约定集中使用 navigationHelper，并在工具内增加兜底日志/降级策略。
          - MobX store 与 API 调用解耦：store 只管理状态，API 调用放 service 层，便于测试和重用。
      - 可靠性与可维护性：
          - 在请求/认证链路加入轻量日志分级（info/ warn/ error），避免大量 console 噪声。
          - 对关键流程（登录、创建/加入比赛、分享）梳理 UX 兜底文案与失败态提示。