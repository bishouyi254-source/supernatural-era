# G1-C 第四轮：v0.24.7 工程接轨

执行日期：2026-10-30（America/New_York）。仅适用于 PR #3 / `feature/g1c-mechanics-candidate`。

工程结论：本地工程回归通过；远端CI另列。正式 G1-C 内容资格仍未通过，009 鬼火、010 鬼风、011 鬼压人的正式来源资格与普通获取均保持锁定。没有合并、部署或修改 main。

## 基线与恢复点

- 远端候选检查点：`444185954cb1b9b94daa95bc87d071238f47d89e`，与请求一致。
- 实际获取的 main：`f4c326f0df1bf1a38052ac865f28b722a8f88664`，与请求的 v0.24.7 一致。
- 采用 merge，保留候选全部历史，不 rebase、不强推。
- 本地备份 ref：`backup/g1c-round4-44418595`。完整 bundle：本轮交付目录 `outputs/g1c-round4-checkpoint.bundle`；通过 `git bundle verify`，含完整可恢复历史。校验与 SHA256 见 `docs/g1c-round4/checkpoint-*.log`。
- 旧工作目录停在 `0acfc80`，含未跟踪脚本，因此本轮在新副本执行；没有清理、删除或修改旧目录及玩家浏览器存档。
- PR metadata 的 base_sha 曾返回旧值 `dd659837`；另行 fetch/compare main 后以实际远端 `f4c326f0` 为准。

恢复检查点（在另外目录执行）：

```powershell
git clone <bundle绝对路径> restored-g1c
git -C restored-g1c checkout -b feature/g1c-mechanics-candidate 444185954cb1b9b94daa95bc87d071238f47d89e
```

## 冲突决议与手工交叉审查

实际文本冲突只有 `src/engine.js` 的 validate 入口一处。原始三方结果见 `docs/g1c-round4/merge-preview.txt`。决议是同时执行 `validG1C` 与 `validPotential`，并保留 G1-B/G1-A/鬼眼/存档收据及结算校验；未采用整文件 ours/theirs。

| 文件/交叉点 | 决议与依据 | 验证 |
|---|---|---|
| engine.js | 合并双方校验；保留 G1-C prepare/apply/advance、独立维护增长；保留潜质初始化/升级/开发限制/容量检查/死亡奖励；精神退款在实际代价与复苏处理之后 | 全量、专项、8项新交叉测试 |
| app.js | 保留 G1-C 标签及原技能/结算流程；保留正式五维创建、死亡分配、下一轮创建和旧档备份升级入口；普通 UI 仍拒绝隔离 G1-C 档 | 540项浏览器、角色四视口 |
| combat.js | 保留 g1cIntent/g1cEnemy 和 G1-A/B 意图链；普通调用保留 main 精神权重加成 | G1-C/G1-A/B/鬼眼回归 |
| progression.js | 保持 main 的 spiritSlotLimit 检查及原第二鬼剧情/植入步骤；容量不等于来源资格 | 容量与负向资格测试 |
| g1c-production.js | 接入同一精神权重函数，上限10；复苏预测仍独立阻断危险调用，能量加成不豁免维护、反噬或宿主损伤 | 最大精神仍反噬、复苏100及失控 |
| character-potential.js | 仅识别真实 G1-C 付费调用用于消耗有限精神次数；研究/非法动作不退款 | 逐鬼真实能量/复苏/负荷断言 |

修复的实际故障：`advanceG1C` 原先在生命为0时无条件将 death 改回 pending，导致 `death:commit` 无法保持 committed、潜质奖励流程失效。现只允许 alive → pending；新增死亡提交、重载、再次提交、潜质分配、下一轮不继承鬼的引擎回归。

旧测试适配：首次合并运行实际失败24项（含模块初始化失败；并非所有内部测试都成功注册），记录在 `initial-full.log`/`initial-failures.txt`。原因包括旧第三鬼测试默认体质2、旧开发100测试默认精神50、旧 G1-A 测试要求升级后字节完全不变。现显式设置专项夹具资格，保留原断言；G1-A 只允许追加潜质与重绑结算 token，其余字段/历史及原输入不变，完整 validate 仍必须通过。鬼眼 V6.3 audit 另通过真实引擎前世封存、死亡发点、分配体质、下一轮创建取得第三容量，见 `tests/potential-prior-life.mjs`；不会从前世继承鬼。使用直接设置体质的旧回归夹具不计作正式玩家可达证据。

## 本轮执行结果

| 项目 | 本轮实际结果 | 原始记录 |
|---|---|---|
| 全部 Node | 1271/1271，失败0、取消0、跳过0，约365秒 | `docs/g1c-round4/node-full.log` |
| G1-C 全部专项/来源负向/能量闭合/新增交叉 | 48/48，失败0、跳过0 | `g1c-focused.log` |
| 新增潜质/死亡/容量交叉 | 8/8 | `crosspoint.log`，亦计入专项及全量，不能相加重复算 |
| 原失败的开发/高级/第三鬼测试 | 59/59 | `legacy-fixture-regression.log` |
| G1-A/B/鬼眼 | 150/150，失败0、跳过0 | `legacy-ghosts-final.log` |
| 鬼眼+旧版v1与G1-A迁移专项 | 78/78 | `ghost-regression-fixed.log` |
| 普通创建→档案→死亡评价→分配→下一轮→旧档原文备份升级 | 1440/768/390/320 四视口全部通过 | `browser-character.log`、`browser-character/*` |
| G1-C Chromium | 1920/1366/390 三视口：540项检查、147次真实引擎行动、页面异常0 | `browser-g1c.log`、`browser-g1c/results.json`，所有测试状态与引擎逐次精确比较 |
| 零能量撤离/受压失败/最大精神复苏危机 | 1440/390 各3场，共6场通过断言，页面异常0 | `browser-edges.log`、`browser-edges/results.json` |
| 正式来源负向审查 | 当前17个事件，三鬼资格全部false | `formal-gate-matrix.json` |

上述分项存在交集，不相加成一个总通过数字。浏览器为本机 Chrome/Chromium `156.0.8078.74`，Node `v24.22.1`。390/320 是移动视口模拟，没有实机手机测试。四视口角色测试使用明确的死亡夹具验证 UI，不冒充从正式剧情死亡的玩家全流程；G1-C死亡链使用隔离持有者执行引擎 death:commit。

视觉抽查：查看了390宽死亡分配页和零能量受压页原图。页面行动可执行且没有水平越界；隔离 QA 页顶部控制在窄屏较拥挤，死亡页已有固定导航会覆盖部分滚动视野。未宣称完整视觉设计验收或真实设备验收。

## 5/10/20 场统计：成功与合法失败分开

33组包含三只单鬼、三种双鬼及三鬼轮换；各请求5/10/20，保留原始资源、累计复苏、负荷；每次新遭遇仅重新创建明确的 shadow 行动条测试外壳，不补给、重置资源或伪装成正式敌人。rest/切换均经过引擎 act。

- 18组达到请求场数：单鬼5/10场各6组，双鬼轮换9组，三鬼轮换3组。
- 12组双鬼同时作用在第一场因收束能量不足合法停止；安全完成0场，不能算完成5/10/20场。
- 3组单鬼20场在下一次调用预计复苏越限时停止：鬼火14场、鬼风14场、鬼压人12场。停下时实际复苏为98/98/96，**不是已经发生复苏100**。
- 总请求385场；安全完成225场；能量不足失败尝试12场；预计复苏越限拒绝3场；后续未执行145场。33组中实际进入复苏危机的场数为0。
- 额外实际危机场景：起始复苏94的明确隔离夹具，以精神150调用后仍承受反噬，经后续维护达到100、进入危机并失控；此场不混入上述33组。
- `closure-replay.json` 另含4组零能量有代价撤离（遗留失控）及1组玩家受压、合法挣脱失败；全部安全完成数0。对应断言通过代表失败规则被正确执行。

逐场代价/复苏见 `stress.json`；精简表见 `stress-summary.json`；双鬼/受压/精神危机完整前后状态见 `edge-scenarios.json`。

## 兼容矩阵

| 输入/流程 | 保留与拒绝边界 |
|---|---|
| v0.24.6 v2无潜质旧档 | 追加默认五维/谱系；保留名字、资源、鬼、独立复苏、剧情、历史；普通浏览器保存原文 `.before-character-v1` 备份 |
| v0.24.7新档及死亡档 | v2往返有效；结算只发一次；重载不重新发点；分配只消耗现有点 |
| 旧合法超默认容量持有者 | 保留既有鬼，不由升级扣除；新获得仍受体质容量限制；隔离G1-C档仍不能进入普通UI |
| 下一轮 | 只继承付费潜质及死亡历史；鬼、剧情、背包不继承，容量增加不等于授鬼 |
| 鬼眼/G1-A/B | 保留各自专属机制、独立复苏/负荷、控制关系、存档门禁；simulation/fixture不升级为正式来源 |
| 鬼压人静态身高 | 只在类型化隔离参与者中测试；未知、并列或缺失资格零成本拒绝；未增加实时站坐蹲追踪 |

## 未通过的正式内容门禁

1. 009/010/011 的完整权威原著/GDD映射、触发/对抗与获取剧情授权仍缺；没有从机制名称或旧报告推导授权。
2. 鬼火缺正式敌方真实行动、可焚烧灵异媒介、实际影响范围及源头权重的完整资格链。
3. 鬼风缺正式源头明确鬼域主动意图、域范围及域权重；普通媒介或鬼眼simulation不能替代。
4. 鬼压人缺正式身体注册、完整身高/触发时序和目标抗性来源；隔离静态身高不是已授权正式杀人规律。没有新增实时姿态系统。
5. 离场后失控保留为未解决后果，尚缺场景级正式处置剧情；不通过资源注入、免费恢复或新编剧情补齐。

因此本轮即使工程回归通过，也不代表三鬼正式内容验收通过或普通玩家能够获取。

## 可复现命令

从本 PR 候选仓库根目录执行。浏览器需要已安装的 Playwright 与 Chromium/Chrome；无需访问正式网站。

```powershell
node --test tests/*.test.mjs
node --test tests/g1c-*.test.mjs
node --test tests/g1a-*.test.mjs tests/g1b-*.test.mjs tests/ghost-eye-*.test.mjs
$env:G1C_OUTPUT='work/round4-reproduction'
node scripts/g1c-audit.mjs
node scripts/g1c-closure-audit.mjs
node scripts/g1c-round4-evidence.mjs
# 另一个终端启动测试服务器
$env:PORT='8765'; node server.mjs
# 回到测试终端，路径按本机已安装软件设置
$env:PLAYWRIGHT_MODULE='C:/Users/ziho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:G1C_URL='http://127.0.0.1:8765'
$env:G1C_BROWSER_OUTPUT='work/round4-reproduction/browser-g1c'
$env:G1C_EDGE_OUTPUT='work/round4-reproduction/browser-edges'
$env:BROWSER_OUTPUT='work/round4-reproduction/browser-character'
node scripts/qa-g1c-chrome.mjs
node scripts/g1c-round4-browser.mjs
node tests/character-potential.browser.mjs
```

一些旧测试会重新生成 `docs/fixtures` 中的夹具。请在独立副本运行；本轮这些测试产物在提交前恢复为候选原始版本，不混入正式数据。`scripts/g1c-states.json` 为现有忽略的临时夹具文件。

## 交付边界

原始日志、失败记录、状态JSON、截图及文件SHA256均保留于 `docs/g1c-round4/`。旧版1243/953成绩未作为本轮成绩。PR #3 保持 Draft；main 不变；没有部署、合并或解锁获取。远端CI状态另行报告，不把本地通过写作远端CI通过。
