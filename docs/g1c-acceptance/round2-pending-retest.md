# G1-C 下一轮增量：零能量收束分支及权威来源合同

日期：2026-10-29；开发分支 `feature/g1c-mechanics-candidate`；**状态：待全量复测，不是正式验收**。

## 已提交改动
- `src/g1c-production.js`：新增只读 `g1cEnergyWarning`。仅在隔离G1-C战斗中，确实存在已展开灵异且能量为0时生效；不增/减能量、不调整任何技能费、不新增行动。
- `src/combat-stage4-adapter.js`：沿用现有战斗界面的 `stageRisk`，显示能量耗尽的不同合法分支。未受鬼压人压制时明确允许合法撤离，但 `CONTROLLED` 灵异会变为 `UNCONTROLLED` 并保留累计损失；被鬼压人的玩家不获得免费撤离，仍按真实 `combat:force`、敌方行动及危机判定处理。
- `tests/g1c-energy-closure.test.mjs`：新增三类真实引擎预期：双鬼施法→耗尽能量→平息非法零成本→撤离失控保持负荷/R；玩家受压且能量0时不能平白解除或撤离，但普通力量试探推进真实行动；普通新档及无已展开灵异不出现误导提示。
- `docs/g1c-acceptance/rules-boundary-candidate.md`：标注原著特征/共用正式GDD/游戏候选参数的区别，写明正式领域、身高、身体行动的来源合同以及权威缺口；普通获取继续锁定。

## 本轮实际验证
- ✅ 对新增/修改的3个JS文件（`src/g1c-production.js`、`src/combat-stage4-adapter.js`、`tests/g1c-energy-closure.test.mjs`）进行JS语法解析：通过。
- ⏳ **真实Node/Chrome未运行**。当前会话能通过GitHub连接器读写PR，但无法取得完整开发工程运行1243项既有测试与Chrome。上一轮 `1243/1243` Node、`953/953` Chrome 仍仅指**上一轮代码快照**；不得移植为本轮结果。
- ⏳ 5/10/20场压力回放中的「同时展开→0能量→拒绝平息→合法撤离或被压受困」需重新按真实动作记录停止原因；若撤离导致失控，不得计作“全鬼安全收束完成”。

## 必须在完整Work工程中执行
```bash
node --check src/g1c-production.js
node --check src/combat-stage4-adapter.js
node --check tests/g1c-energy-closure.test.mjs
node --test tests/g1c-energy-closure.test.mjs
node --test tests/*.test.mjs
```
然后在Chrome三个视口（1920×1080、1366×768、390×844）复测战斗风险提示/撤离/被压试探，旧档格式2回返及G1-A/B/鬼眼回归，最后运行连续5/10/20场并记录每场资源/复苏/负荷/动作与停止原因。

## 未解决的正式验收阻断
1. G1-C三鬼逐鬼权威GDD/原著出处及候选数值未定稿；既有参数不得包装成原著数字。
2. 正式剧情仍无可证实的领域/身体行动/身高数据来源，普通玩家三鬼获取锁定；不可使用 `shadow`计时外壳声称正式场景可达。
3. 被压玩家在0能量下的有限终局（脱困/失控/死亡）需要实际回放；目前只描述了真实合法分支，未认证一定能逃出。
4. 无法以本轮语法检查宣布综合集成测试通过。

**主分支和GitHub Pages维持0.24.6，不自动合并/发布。**
