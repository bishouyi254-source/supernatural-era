# G1-C 第五轮：正式来源审计与持久场景后果

执行日期：2026-10-30（America/New_York）。范围仅 PR #3 / feature/g1c-mechanics-candidate。

基线：9b2f68bb347fc1e6d7775144c2c1cfb5584ac656；远端 main 实查仍为 f4c326f0df1bf1a38052ac865f28b722a8f88664。复用第四轮干净 checkout；开始时 git status 无修改。没有改 main、合并、部署或解锁009/010/011普通获取。

## 第四轮远端核验

[run 41163026806](https://github.com/bishouyi254-source/supernatural-era/actions/runs/41163026806) 最终 completed / success。Node job 124424528894、browser job 124425237059 均 completed / success；不存在失败任务需要修复或重试。不是“仍在运行”。另一个 Character potential run 41163026756 亦 completed / success。

实际 checkout 是 GitHub 临时 PR merge ref f8b0908218850e0bea569eb094a23ab63b597ee4（将指定 head 与指定 main 合成），不能称为已经合入 main。原始日志见 docs/g1c-round5/round4-remote-*.log，run 元数据见 round4-remote-runs.json。远端浏览器版本156.0.8078.80，Node24.22.1。未发现失败日志；弃用警告不是测试失败。

## 正式来源资格：BLOCKED

本轮读取了 Notion 设计总文档、核心玩法、其原文入口，并执行三鬼名称检索。范围限连接器可访问页面及本仓库，不证明私有或不可访问文档不存在。返回页面仍为未验证状态，原文响应不包含鬼火/鬼风/鬼压人名称；核心循环与通用独立复苏/持久后果规则不能代替三鬼的正式触发、数据和获取授权。快照/读取范围见 notion-*.json。

章节引用复核（仅文本线索，不提升为正式来源）：

- [第481章镜像线索](https://www.hetushu.com/book/7491/5210368.html)正文90、141、147行可支持李军鬼火鬼域、过度使用焚毁宿主及复苏载体风险方向；不能证明70/2候选参数。非官方转载，不能当作正式来源绑定授权。
- [第597章镜像线索](https://www.xbiquge345.com/chapter/9643/95029971.html)正文113、129—141行可支持坐下改变相对高度、范围内最高者受袭及压制方向；没有具体人物身高、并列/未知规则、完整名单或游戏抗性数值。仍需作者/出版方来源确认及用户规则映射授权。
- 审计纠错：最初 find 返回无匹配，曾误判章节不支持；进一步 open 读取正文确认上述内容，已修正本报告及登记。不得把搜索片段未命中写成全文不存在。
- 鬼风具体能力的独立原著证据仍未建立。不从其他两鬼的文本推断。

六条可追溯证据登记分为 NOVEL_LEAD、CANDIDATE_PARAMETER、UNKNOWN_SOURCE。登记只返回 PENDING_REVIEW，并投影丢弃来路不明的 approved、授权标记和事件执行数据。G1C_APPROVED_SOURCES 是空的不可变登记表；无正式 source/action 绑定，任何提案均不能授予资格。当前参数可继续作获准隔离工程候选；不表示正式平衡批准或原著数值。

## 接入成果与边界

- 新增只读 auditG1CSourceAction：核对 encounterId、sourceInstanceId、actionId、触发tick、媒介和作用区、目标及动作抗性。鬼火须明确可焚烧spirit媒介；鬼风须明确domain动作及领域权重；鬼压人须完整身体注册、玩家/源头覆盖、唯一最高身体、同tick有效身高、姿态证据、区域和抗性。未知/并列/过期/取消/不匹配全部拒绝，无降级模拟路径。
- 这是拒绝型适配器和审计接口，不是新增生产战斗解析器。没有批准的正式source/action，未接入具体剧情。名称匹配、保存字段、shadow、鬼眼simulation、隔离持有者都不能升级为正式资格。完整身体名单的真实性最终仍依赖未来经批准的源头数据，不能靠 complete=true 自证。
- lost-control 写入原始遭遇ID、eventId、sourceInstanceId、区域、目标、触发动作与原因。g1cSceneConsequences 从现有封存事件账本投影 UNRESOLVED，不复制第二份可漂移的状态。
- 隔离界面显示未解决后果；对应场景 enter/combat:start 关闭。旧失控记录没有地点时为 LEGACY_UNKNOWN，并保守阻断重入，不凭当前场景猜旧来源。没有解决动作或自动结清规则。正常休息按v0.24.7原规则运作，但不结清账本或把失控改为受控。
- 零能量受压玩家继续没有免费解除或撤离，失败挣脱照常推进时间、敌方危险、独立复苏与宿主代价。没有新增能量/恢复补偿、免费收容或剧情收束。
- 普通存档不增加G1-C字段；格式仍为2。旧第四轮真实失控档直接 validate/upgrade/往返检查通过；不改写原账本。五维、死亡与下一轮规则未改。

正式验收仍缺：三鬼权威能力映射、候选参数正式批准、实际敌方动作声明、完整身体/姿态/触发数据、失控处置剧情、普通获取路线。三鬼正式验收 BLOCKED；工程负向门禁通过不能替代上述来源。

## 可复现命令

在候选仓库根目录，以Node24运行。浏览器使用独立上下文，不访问正式站点及玩家浏览器存档。

```powershell
node --test tests/*.test.mjs
node --test tests/g1c-*.test.mjs
$env:G1C_OUTPUT='docs/g1c-round5'
node scripts/g1c-audit.mjs
node scripts/g1c-closure-audit.mjs
node scripts/g1c-round4-evidence.mjs
node scripts/g1c-source-audit.mjs
$env:PORT='8765'; node server.mjs
# 在另一个终端设置实际安装路径后执行
$env:PLAYWRIGHT_MODULE='C:/Users/ziho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:G1C_URL='http://127.0.0.1:8765'
$env:G1C_BROWSER_OUTPUT='docs/g1c-round5/browser-g1c'
$env:G1C_EDGE_OUTPUT='docs/g1c-round5/browser-edges'
$env:BROWSER_OUTPUT='docs/g1c-round5/browser-character'
node scripts/qa-g1c-chrome.mjs
node scripts/g1c-round4-browser.mjs
node tests/character-potential.browser.mjs
```

本轮执行统计见下方最终验证表。各专项是全量子集，禁止相加重复计数。压力回放是隔离shadow计时外壳和静态身高参与者，不代表普通玩家正式事件或手机实机验收。

## 最终本地验证

| 检查 | 本轮结果 | 证据（docs/g1c-round5/） |
|---|---|---|
| 完整Node | PASS 1299/1299，失败/取消/跳过0，469秒 | node-full.log |
| G1-C专项与负向门禁 | PASS 76/76（含新增28项，属于全量子集） | g1c-focused.log |
| G1-A/B/鬼眼 | PASS 150/150（属于全量子集） | legacy-ghosts.log |
| 五维潜质、死亡和G1-C交叉 | PASS 19/19（属于全量子集） | potential-death.log |
| Chromium综合 | PASS 三视口540项断言、147次实际引擎行动、页面异常0 | browser-g1c.log、browser-g1c/results.json、102张截图 |
| 零能量/受压/实际复苏危机/新账本持久化 | PASS 桌面1440与手机390各3场，共6场，页面异常0；每步状态精确比对并重载 | browser-edges-final.log、browser-edges-final/ |
| 五维创建、死亡评价/分配、下一轮、旧档升级 | PASS 1440/768/390/320四视口 | browser-character.log、browser-character/ |
| 来源审计 | 17事件全部拒绝三鬼正式资格，6条待审证据，正式绑定0；第四轮真实旧失控档有效且往返兼容 | source-audit.json |
| 5/10/20压力 | 33组，18组达请求数；请求385、安全完成225、能量不足失败尝试12、预计复苏越限拒绝3、后续未执行145 | stress.json、stress.log |
| 零能量撤离与受压失败 | 4组实际撤离遗留失控、1组受压失败；不是安全完成；另列实际复苏危机场景 | closure-replay.json、edge-scenarios.json |

本机Node v24.22.1、Chrome156.0.8078.74、Git2.53.0.windows.3；移动仅视口模拟，未执行手机实机验收。视觉抽查390宽撤离后账本截图，未解决后果可见且无水平溢出；隔离QA头部窄屏拥挤仍存在，不宣称整体视觉设计验收。

实际失败保留：初版新增Node断言把hub的combat:start错误当作shadow重入，修正为指定场景断言；首次浏览器断言选择器同时命中研究区/工坊，修正为研究区限定并成功重跑六场。见round5-initial.log、browser-edges-initial-failure.log及browser-edges/results.json。未丢弃失败记录，也未把失败尝试计作成功场数。

summary.json是机器可读统计；sha256.json包含各证据文件大小及哈希（排除清单自身及仍在写入的summary.log）。全量测试会生成4份旧docs/fixtures夹具的潜质迁移结果，本轮提交前恢复这些纯生成变更，不混入正式内容。

## 提交边界

仅推送PR #3候选分支；保持Draft。远端第五轮CI以本轮候选Checks为准；本地通过不等于远端通过。没有合并、部署、修改main、普通获取解锁或修改玩家存档。
