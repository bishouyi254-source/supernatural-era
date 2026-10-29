# G1-C PR #3 工程接手验收（2026-10-29）

结论：**已修复可复现的工程问题，隔离production机制完成实测；尚未达到正式验收标准，保留Draft。** 缺少三鬼完整权威GDD、正式域/身体/身高意图来源，普通获取仍锁定。以下夹具不代表普通玩家可达。

## 基线、工程与权威来源

- 最新Work验收评论：[6494888507](https://github.com/bishouyi254-source/supernatural-era/pull/3#issuecomment-6494888507)。检出feature/g1c-mechanics-candidate，原HEAD 9e4d1d98adddf21b12a99592ee8feb635514c5f8。
- 正式main仍为0.24.6，dd6598374ba278ea417cb2ed70a24ce9f6a24741。没有合并、更新main、部署、注册或修改账号权限；没有修改真实玩家存档。
- 完整既有工程位于同一工作区work/g1-b；本轮恢复57个既有*.test.mjs及其原始helpers、脚本和测试JSON。57个旧测试文件与原工程逐字节相同。PR原只有7项直接模块检查，不能冒充全量。
- 本地权威索引来自2026-09-19/new-chat/projects/supernatural-era/docs/RPG_GDD_COMPATIBILITY.md及GDD_V1_MOTHER.md、GDD_V1.4.1.md、GDD_V2_0.md和历史0.x文档。逐鬼复苏、承载、规则对抗、知识边界按既有主引擎实现核对。
- [Notion总文档](https://app.notion.com/p/3f1e1d3578fb8143be81dc7c0654fc9b)和[核心玩法](https://app.notion.com/p/3f1e1d3578fb81d59643ed49428cde52)仍为旧V1.4.1整理；没有找到三鬼完整权威细则。不能据此确认原著数值、鬼火宿主灼伤阈值、鬼风正式鬼域覆盖、鬼压人身高/身体适用与失控后处置。

## 修复与实测行为

- **鬼火**：在真实敌方主动条到达时，对明确spirit媒介的来源行动按实际权重阻断/部分阻断/抵抗；成功改变实际身体损伤结果，不只写burned日志、不扣厉鬼HP、不授战利品。非暴露/不同区域不造证据。集中焚烧只设定本场目标，后续真实敌方行动才产生对抗实证。
- **鬼风**：domainWeight本身不等于领域攻击；必须有明确的domain action、来源ID、命中区域和真实敌方主动条。普通body行动、safe位置、错误目标区域、取消或simulation意图均不能获得领域对抗胜利。明确测试domain输入走production resolve后实际改变行动结果；这不是正式关卡已有真实鬼域的证明。
- **鬼压人**：落压从范围内实际身体中选择唯一最高者，含玩家和友方。未知/同高拒绝且零成本；离开/最高关系改变结束旧锁定；不能借固定targetId无限压住。友方有独立类型化行动和moveTo，压制会实际阻止移动。被压玩家不能免费避开/撤离，复用普通力量试探进行真正挣脱对抗，也可正常付费解除；敌方更强行动可挣脱。部分对抗不当作玩家全行动封锁。加压加成在解除/下次落压清除。
- **成长/费用**：F/W/P各自阶段、证据、负荷、复苏；0→1→2都由真实引擎事件、已有研究操作完成，无先学高级能力才能采证的循环；F3/W3/P3锁定。真实施放、合法抵抗、持续+1pp、独立负荷进入growthFor/settleSpirits；Build、方向压制、容量与失控危机有回归。领域Build费用按既有结算，不宣称未定义的新鬼加成。
- **混合构筑**：G1-C独立g1cOwnership避免与G1-B ownership字段冲突；实测G1-A鬼血/鬼绳与G1-C并存，G1-B鬼烟/鬼火并存费用；第三携带者依然只能按原两活动槽换入，伪造三活动槽零成本拒绝。G1-B独立参与者阵列不能冒充与G1-C同一个来源，完整跨源协同覆盖仍受权威模型限制。
- **UI/结算/存档**：补齐现有战斗技能卡的G1-C操作、中文名、代价与逐鬼复苏预览；复用既有开发档案。修复隔离上下文进入结算观察器，真实撤离记录技能、能量和各鬼R；存档格式仍为2。修复坏档含null实例时抛异常；普通导入拒绝测试持有，newGame/旧档不授新鬼。

## 实际结果

- Node v24.22.1：最终全量 **1243/1243通过**；失败0、跳过0、取消0。原57个回归文件没有修改断言来放宽规则。
- 实际桌面Chrome/Chromium 155.0.8059.85，独立新context，1920×1080、1366×768、390×844（仅视口模拟，非真机）。G1-C 540项／147个真实点击行动；普通旧档/商场鬼血B0 58项；鬼眼/双鬼 355项；总计953项，pageerror为0。
- G1-C UI覆盖基础/集中/侵域/加压、友方误选、玩家受压挣脱、抵抗、研究、撤离结算、导入导出刷新、错误导入、三鬼普通持有拒绝和角色页。夹具只在scripts/qa-g1c.html独立键G1C-PRODUCTION:state，正式app不接收context。
- 普通app实际newGame、合法商场前捕获档导入→capture、鬼血B0释放/回收、只读旧玩家备份副本导入/导出/刷新；鬼眼/双鬼15个场景验证。旧真实备份内容不提交仓库。

## 5/10/20场隔离连续回放

共33次请求；每场保留life/energy/cash、各鬼R、独立load、总负荷/容量、活动槽、动作及停止原因。不重置资源/R，不注入额外持有或无穷物品；新遭遇只用既有shadow作为行动计时外壳，不宣称虚构正式敌人。simultaneous为同时展开，rotating为每场轮换单个来源，携带其它鬼照常结算；三鬼携带始终只有两个活动槽。

|持有|策略|请求|完整结束|停止原因|
|---|---|---:|---:|---|
|fire|single|5|5|requested count reached|
|fire|single|10|10|requested count reached|
|fire|single|20|14|unavailable g1cp:fire:ignite|
|wind|single|5|5|requested count reached|
|wind|single|10|10|requested count reached|
|wind|single|20|14|unavailable g1cp:wind:raise|
|press|single|5|5|requested count reached|
|press|single|10|10|requested count reached|
|press|single|20|12|unavailable g1cp:press:fall|
|fire+wind|simultaneous|5|0|unavailable g1cp:wind:calm|
|fire+wind|simultaneous|10|0|unavailable g1cp:wind:calm|
|fire+wind|simultaneous|20|0|unavailable g1cp:wind:calm|
|fire+wind|rotating|5|5|requested count reached|
|fire+wind|rotating|10|10|requested count reached|
|fire+wind|rotating|20|20|requested count reached|
|fire+press|simultaneous|5|0|unavailable g1cp:press:lift|
|fire+press|simultaneous|10|0|unavailable g1cp:press:lift|
|fire+press|simultaneous|20|0|unavailable g1cp:press:lift|
|fire+press|rotating|5|5|requested count reached|
|fire+press|rotating|10|10|requested count reached|
|fire+press|rotating|20|20|requested count reached|
|wind+press|simultaneous|5|0|unavailable g1cp:press:lift|
|wind+press|simultaneous|10|0|unavailable g1cp:press:lift|
|wind+press|simultaneous|20|0|unavailable g1cp:press:lift|
|wind+press|rotating|5|5|requested count reached|
|wind+press|rotating|10|10|requested count reached|
|wind+press|rotating|20|20|requested count reached|
|fire+wind+press|simultaneous|5|0|unavailable g1cp:wind:calm|
|fire+wind+press|simultaneous|10|0|unavailable g1cp:wind:calm|
|fire+wind+press|simultaneous|20|0|unavailable g1cp:wind:calm|
|fire+wind+press|rotating|5|5|requested count reached|
|fire+wind+press|rotating|10|10|requested count reached|
|fire+wind+press|rotating|20|20|requested count reached|

## 正式验收阻断与未覆盖

1. **GDD缺口**：没有完整G1-C权威细则；目前能力权重、费用、集中/加压+1、宿主反噬70/2与压制负担1均为候选工程参数，不是小说事实，不应冻结为正式平衡。
2. **正式可达性**：无普通获取剧情和真实域/身高/身体行动资格来源。只隔离类型化输入通过production链；不把shadow计时外壳宣称为正式鬼域战。
3. **失控与跨源覆盖**：已测真实复苏危机/停用失控及不退款；尚无权威场景级失控来源处置，也未声称穷尽所有G1-A/B/鬼眼组合或真实多人队伍规则。
4. **环境边界**：不是手机真机或真人理解度测试；不是从普通新档获取三鬼到通关的验收。

详细失败在[failures.md](docs/g1c-acceptance/failures.md)，逐项结果在[results.json](docs/g1c-acceptance/results.json)，全量原始日志在[node-full.log](docs/g1c-acceptance/node-full.log)。原始截图、逐动作状态、完整逐场回放及复现包由当前聊天outputs/g1-c交付。PR保持Draft，禁止自动合并/发布。
