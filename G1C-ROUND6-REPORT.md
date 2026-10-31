# G1-C 第六轮：厉鬼自身能力机制与数值 v1.0

日期：2026-10-31（America/New_York）。范围：PR #3 / `feature/g1c-mechanics-candidate`。

开始时通过 GitHub 连接器重新核实：PR open、Draft、未合并，HEAD `18d6064a1ce230e55c088f3c137d43e2975fca19`，main `f4c326f0df1bf1a38052ac865f28b722a8f88664`。旧本地副本 HEAD `b7d345d82153c4436fbcad7655fc3988db2373a7` 与远端分叉，快进被 Git 拒绝；未强推、重置或合并该副本。新工作副本从远端指定候选分支克隆，干净 HEAD 与预期一致。修改前建立本地 `checkpoint/g1c-round6-start`，并保存独立 bundle `../g1c-round6-remote-start.bundle`；旧副本也有自己的检查点和 bundle。回滚仅限明确选择副本/提交，不自动回滚远端。

## 已实施的具体决定

`src/g1c-production.js` 共用 `effectiveWeight`：以既有 `v1Ward + mentalRuleBonus` 为基础，加入所有适用阶段/定向加成后再次 `min(10, ...)`。没有用文案中的简化公式替换 Build 或现有开发度规则。`ruleContest` 的严格大于 blocked、相等 partial、小于 failed 语义不改；相等伤害为原动作伤害向上取整的一半。

| 场景（基准权重3） | 第五轮 | 本轮 |
|---|---:|---:|
| F0 基础合格焚烧 | 3 | 3 |
| F1 单个当前合法目标集中 | 4 | 4 |
| F2 合格 domain 且 spirit，无集中 | 3 | 4 |
| F2 同上，且集中当前目标 | 4 | 5 |
| F2 普通身体动作，无集中 | 3 | 3 |
| W0 合格 domain | 3 | 3 |
| W1 / W2 合格 domain，无定向侵域 | 3 | 4 |
| W2 同源合法定向侵域 | 4 | 5 |
| P0 当前唯一最高对象匹配行动 | 3 | 3 |
| P1 / P2 有效锁定匹配行动，无加压 | 3 | 4 |
| P2 有效锁定并加压 | 4 | 5 |
| 任一三鬼：基准已到10后再叠加 | 可能超过10 | 10，相等仍 partial |

F1 仅集中当前源头目标；F2 必须同时通过现有显式隔离 spirit 媒介和真实类型 domain 动作资格。W1 只对 domain 动作加成；W2 必须 stage2、当前同源目标/区域/有效 domain 才能侵域。普通风、身体动作或音频不会因名字/非零 domainWeight 变成 domain。P1 只用于已经有效锁定且仍是当前唯一最高者的匹配行动；P2 加压预检使用 P1+本次P2权重，不能用旧的未加压权重错误拒绝合法加压。初次落压仍使用原基础规则，未提前授予有效持续锁定加成。玩家受压、友方动作及敌方动作使用同一个封顶权重路径。并列、出区或身体资格失效时不能加压，锁定按原规则关闭。F3/W3/P3保持锁定。

九项费用原样保留，三元组为能量/基础复苏pp/持续负荷：ignite `[1,3,2]`、concentrate `[1,4,2]`、quench `[1,2,1]`；raise `[1,3,2]`、invade `[1,5,3]`、calm `[1,2,1]`；fall `[1,4,2]`、intensify `[1,5,3]`、lift `[1,2,1]`。每只 CONTROLLED 有效行动维护基础复苏+1pp，实际增量仍由自然复苏、Build、冲突、抑制和宿主承载统一结算。收束不返还累计负荷；精神返还不撤销复苏/负荷/损伤。鬼火 R>=70 每有效行动宿主-2HP，鬼压人有效持续每行动-1HP；零能量不能免费收束，UNCONTROLLED持久后果、存档格式2、五维和死亡奖励幂等规则保留。

## 同一动作、多鬼与成长账本

采用固定优先序 fire→wind→press；仅适用且受控的鬼参与。每个参与者对同一个原始敌方动作做独立判定。真实 failed 和 partial 写入该鬼事实账本并保留费用；partial 不逐鬼连续折半，而是 `ceil(originalDamage/2)`。首次 blocked 后停止后续拦截，后续鬼不获得没有实际发生的成功或领域研究证据；已展开鬼仍承担各自维护代价。最终源头动作只记一次 attempts/blocked/completed，实际伤害交给原战斗引擎结算一次。后续鬼不会读取“已经被前鬼阻断”的状态再制造成功。

对抗事实携带 battle/clock/source 组成的 actionId；同一个 state 的同一敌方时刻重复回调只返回缓存结果，不重复移动/事实/动作计数。正常动作、存档重载及请求幂等性继续通过既有 engine `available/validate/act`，没有增加第二个存档执行入口。

新研究记录写入 `evidenceSeq`。成长按原阶段门槛选择真实先行事实；相同 actionId 的 burned/domain-contest 等两个投影不能同时支付两个阶段。旧无 evidenceSeq 的记录按旧引擎先行事实规则回读，包括历史允许同一动作的两个投影分别研究的情况；不改写、不重奖、不拒绝旧账本。对新研究仍排除已使用动作。用未修改的第五轮本地引擎生成 legacy-shared-evidence.json，新增格式2实际旧档回归。研究阶段顺序、阶段上限和原始证据在 validate 中复核；新增长阶段不能倒置授予条件。

## 正式来源与范围

正式 GDD source/action 绑定仍为空；009/010/011正式来源资格、普通获取全部锁定。本轮没有调查、获取、驾驭剧情、地图副本或普通获取入口，没有修改 main、合并、部署。能力方向的章节线索不等于正式授权；具体70/2阈值、阶段buff、费用和权重都是游戏平衡数值。

静态身高、显式 spirit/domain 类型、shadow计时外壳仅用于隔离工程回放，不是带真实同tick/姿态/全量身体注册的正式源头。第五轮拒绝型适配器继续拒绝无绑定、伪造来源、过期姿态、缺失身体、并列最高等提案；不把该隔离执行模型写成正式场景资格。正式玩家可达验收仍 BLOCKED。

## 可复现命令

在本候选副本根目录运行 Node24。浏览器仅访问本地服务器，使用独立上下文。

```powershell
node --test tests/*.test.mjs
node --test tests/g1c-*.test.mjs
node --test tests/g1a-*.test.mjs tests/g1b-*.test.mjs tests/ghost-eye-*.test.mjs
node --test tests/character-potential*.test.mjs tests/g1c-round4.test.mjs
$env:G1C_OUTPUT='docs/g1c-round6'
node scripts/g1c-audit.mjs
node scripts/g1c-closure-audit.mjs
node scripts/g1c-round4-evidence.mjs
node scripts/g1c-source-audit.mjs
node scripts/g1c-round6-boundary.mjs
$env:PORT='8765'; node server.mjs
# 另一个终端：
$env:PLAYWRIGHT_MODULE='C:/Users/ziho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:G1C_URL='http://127.0.0.1:8765'
$env:G1C_OUTPUT='docs/g1c-round6'
$env:G1C_BROWSER_OUTPUT='docs/g1c-round6/browser-g1c'
$env:G1C_EDGE_OUTPUT='docs/g1c-round6/browser-edges'
$env:BROWSER_OUTPUT='docs/g1c-round6/browser-character'
node scripts/qa-g1c-chrome.mjs
node scripts/g1c-round4-browser.mjs
node scripts/g1c-round6-browser.mjs
node tests/character-potential.browser.mjs
```

上述 Playwright 路径为本机 `C:/Users/ziho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`，Chrome为 `C:/Program Files/Google/Chrome/Application/chrome.exe`；其他环境用 PLAYWRIGHT_MODULE / CHROME_PATH 覆盖。

## 验证结果

| 检查 | 最终结果 |
|---|---|
| 完整Node | PASS 1324/1324，失败/取消/跳过0，392.9秒；首轮1323另存，不叠加 |
| G1-C专项 | PASS 101/101，含新增25项，属于全量子集 |
| G1-A/B/鬼眼 | PASS 150/150，属于全量子集 |
| 五维、死亡、旧档交叉 | PASS 19/19，属于全量子集；另新增真实旧引擎格式2阶段2档回归 |
| 权重非法输入与重复请求边界 | PASS 11/11（单独审计脚本） |
| Chromium G1-C | PASS 三视口540项检查/147次实际行动，页面异常0，兼容修正后重跑完成 |
| Chromium v1.0阶段场景 | PASS 1440/390两视口，30场景/60次实际行动，页面异常0，兼容修正后重跑完成 |
| 零能量、受压、实际复苏危机、持久失控 | PASS 两视口6场，页面异常0，兼容修正后重跑完成 |
| 五维浏览器 | 1440/768/390/320四视口 PASS，包含创建、死亡分配、下一轮、旧档升级 |
| 5/10/20压力 | 33组、请求385场、安全完成225场；18组达到请求数，12次能量不足合法失败，3次预计复苏越限拒绝，后续145场未执行 |
| 正式来源 | 17事件三鬼资格全false，正式绑定0；第四轮旧失控档有效且可往返 |
| 第六轮远端CI | 未上传，未执行；等待用户确认发布到PR候选分支 |

原始证据位于 `docs/g1c-round6/`。专项为完整 Node 的子集，不能累计相加。压力、浏览器和隔离数据不代表普通玩家通关或手机实机验收。

首轮新增断言有7项失败，第二次有2项失败：错误把训练时期的旧证据计入当前场景、把三次玩家行动中实际发生的两次敌方行动当作一次、缺少下一场前休息、移除仍被历史参与者账本引用的目标。已按本次动作/序号增量及合法上下文修正；保留 round6-initial.log / round6-second-attempt.log。另两项旧浏览器脚本首次未配置 Playwright 模块和 Chrome 路径导致启动失败；保留 initial-failure / runtime-failure 日志，配置实际安装路径后重跑。

远端起点 `18d6064…` 的 Character potential run `41165032033`、G1-C run `41165032041` 均实查 completed/success；这是第五轮起点CI，不能作为第六轮CI结果。第六轮是否上传和CI状态另列，禁止以本地通过代称远端通过。

手机只做视口模拟，没有执行手机实机验收。视觉抽查390宽研究/工坊截图，隔离QA页头仍拥挤；不宣称整体视觉设计通过。没有改动产品视觉或普通入口。

最终提交包含代码、25项新增Node测试、浏览器/边界/汇总脚本、CI接线、原始日志/状态/截图与SHA256清单。提交SHA见交付元数据（避免报告自引用提交SHA）。本轮没有向GitHub发送评论、修改PR说明或推送，PR继续Draft；推送按用户AGENTS.md的发布前再次确认要求待确认。
