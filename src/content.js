export const backgrounds = ['学生', '普通职员', '医疗相关', '安保', '自由职业'];
// These scenarios are original technical fixtures, not claims about the novel.
export const events = {
 // Registry identities only: acquisitionLocked excludes ordinary entry and grants.
 tablet:{acquisitionLocked:true,title:'006 灵位鬼（获取待开发）',source:'G1-B游戏候选，回返资格目前仅隔离验证',spirit:'灵位鬼（玩家实例）',grade:'B',load:0,initialRevival:0,naturalRevivalRate:0,usageRevivalRate:5,medium:'body',ruleWeight:3,intro:'获取待开发',clues:[],riskText:'未开放',restriction:'未开放',ability:'意识位置与身体占据独立；归位必须通过真实对抗。'},
 caller:{acquisitionLocked:true,title:'007 喊人鬼（获取待开发）',source:'G1-B游戏候选；与鬼回头独立',spirit:'喊人鬼（玩家实例）',grade:'B',load:0,initialRevival:0,naturalRevivalRate:0,usageRevivalRate:4,medium:'audio',ruleWeight:3,intro:'获取待开发',clues:[],riskText:'未开放',restriction:'未开放',ability:'真实身份、身后听闻、实际回头后才对抗；不保证击败。'},
 smoke:{acquisitionLocked:true,title:'008 鬼烟（获取待开发）',source:'G1-B游戏候选；李乐平相关鬼烟定位，非鬼雾/鬼风/鬼眼鬼域',spirit:'鬼烟（玩家实例）',grade:'B',load:0,initialRevival:0,naturalRevivalRate:0,usageRevivalRate:3,medium:'body',ruleWeight:3,intro:'获取待开发',clues:[],riskText:'未开放',restriction:'未开放',ability:'侵蚀合法范围内身体；友方不豁免，Y2方可扩张相邻区域。'},
 // Reserved candidate identity, deliberately excluded from every acquisition route.
 'g1a-rope-candidate':{acquisitionLocked:true,title:'鬼绳候选规则夹具（未开放）',source:'G1-A补完稿；仅隔离模拟，不是获取剧情',spirit:'鬼绳（候选独立实例）',grade:'B',load:0,initialRevival:0,naturalRevivalRate:0,usageRevivalRate:0,medium:'body',ruleWeight:0,intro:'未开放',clues:[],riskText:'未开放',restriction:'未开放',ability:'未开放'},
 knocker:{title:'七中 · 当前声音威胁',source:'正式GDD0.10七中正史适配：外部音频媒介，不是玩家战利品',spirit:'敲门鬼（正史源头）',grade:'S',playerOwnable:false,load:0,initialRevival:0,naturalRevivalRate:0,usageRevivalRate:0,medium:'audio',ruleWeight:2,intro:'外部敲门音频与接近侵蚀。',clues:[],riskyLabel:'接触音频',riskText:'本次外部声音侵蚀',hypothesis:'声音通路暂时可隔离',falseHypothesis:'源头已经封存',restriction:'不能借临时隔绝封存正史源头',ability:'不提供玩家驾驭'},
 door:{title:'C-017 · 无人应答',source:'0.9.0原创调查；非原著灵异，数值为测试预算',spirit:'应门鬼（原创玩家实例）',grade:'C',load:24,initialRevival:18,naturalRevivalRate:0.1,usageRevivalRate:5,medium:'door',ruleWeight:2,intro:'已封存的门媒介实例。',clues:[{id:'movement',label:'门网络',text:'跨门痕迹已探查。'},{id:'witness',label:'触发对照',text:'确认门内回应条件。'},{id:'power',label:'媒介验证',text:'失去内外边界后接近停止。'}],riskyLabel:'回应门外询问',riskText:'回应建立延迟追踪。',hypothesis:'经有效门媒介确认门内存在',falseHypothesis:'听见询问必死',restriction:'限制显现窗口后使用黄金容器。',ability:'应门：通过已建立媒介短暂感知门另一侧灵异反应；不复制源头杀人规律。'},
 watch:{title:'原创调查 · 废弃值班室',source:'V2.0 ORIGINAL样板；非原著灵异',spirit:'点名磁带（原创）',grade:'C',load:28,initialRevival:20,naturalRevivalRate:0,usageRevivalRate:12,medium:'audio',ruleWeight:2,intro:'异常磁带已与现场调查分离。',clues:[{id:'movement',label:'对照媒介',text:'接线盒内存在异常磁带。'},{id:'witness',label:'复核记录',text:'沉默者未出现新黑痕。'},{id:'power',label:'核对隔离',text:'隔离接线阻止黑痕加深。'}],riskyLabel:'回应点名',riskText:'回应产生延迟标记。',hypothesis:'被点名后回应建立标记',falseHypothesis:'只听广播就必死',restriction:'黄金容器隔离异常磁带。',ability:'点名媒介：游戏原创规则压制能力。'},
  officer:{title:'鬼差同源玩家方案',source:'V1.6玩家实例；数值与外围事件为游戏改编',spirit:'鬼差（玩家实例）',grade:'S',load:38,initialRevival:28,naturalRevivalRate:0,usageRevivalRate:12,medium:'body',ruleWeight:5,intro:'正史源头不成为战利品。',clues:[{id:'movement',label:'对照数量',text:'压制依赖目标区域实际灵异数。'},{id:'witness',label:'核对范围',text:'隔离物品不等于额外灵异。'},{id:'power',label:'验证规则',text:'先数量资格再权重对抗。'}],riskyLabel:'干扰规则边界',riskText:'规则压力侵蚀身体。',hypothesis:'数量资格先于权重',falseHypothesis:'品质越高越不计数',restriction:'独立玩家方案限制媒介。',ability:'初始配额1，完整规则压制先检查目标数量再对抗权重。'},
  eye: {
    title:'神灵异命运 · 鬼眼同源痕迹',source:'V1母文档玩家实例；鬼域、权柄与数值为GDD游戏模型',spirit:'鬼眼（玩家实例）',grade:'神灵异',load:45,initialRevival:25,naturalRevivalRate:0,usageRevivalRate:18,medium:'visual',ruleWeight:4,
    intro:'不夺取杨间正史鬼眼，独立命运只可能形成初醒玩家实例。',
    clues:[{id:'movement',label:'观察空间痕迹',text:'同源媒介存在异常边界。'},{id:'witness',label:'核对目击记录',text:'本实例与杨间正史归属分开。'},{id:'power',label:'验证限制边界',text:'能力开放与累计复苏是两种独立数据。'}],
    riskyLabel:'越过未知鬼域边界',riskText:'空间规则侵蚀身体。',hypothesis:'需要独立玩家命运和限制方案',falseHypothesis:'杨间会因为玩家获取鬼眼失去能力',restriction:'完成命运调查并使用独立隔离媒介。',ability:'独立苏醒度开放鬼域权限，重启只能改临时状态，代价不能回滚。'
  },
  hungry: {
    title:'命运池II · 初生同源媒介',source:'GDD饿死鬼玩家实例；高级获取与规则为游戏改编',spirit:'饿死鬼（初生玩家实例）',grade:'S潜力',load:50,initialRevival:30,naturalRevivalRate:0,usageRevivalRate:18,medium:'body',ruleWeight:4,
    intro:'城市源头已限制，残余事件中的同源媒介可能形成初生玩家实例，不转移正史源头。',
    clues:[{id:'movement',label:'观察同源痕迹',text:'同源痕迹来自后续残余事件。'},{id:'witness',label:'核对媒介档案',text:'本实例与城市源头归属分开。'},{id:'power',label:'检验隔离边界',text:'封存保留媒介而不植入身体。'}],
    riskyLabel:'直接触碰同源媒介',riskText:'不稳定的规则片段造成身体侵蚀。',hypothesis:'同源媒介仍需要独立限制与承载',falseHypothesis:'关押源头会自动赠送其完整能力',restriction:'以有限黄金隔离媒介封存。',ability:'残缺吞噬：消耗有限残余片段补全，承担独立复苏；鬼奴控制最多2。'
  },
  blood: {
    title:'商场余波 · 渗血媒介',source:'GDD同源玩家实例；获取路线与限制规律为游戏改编',spirit:'鬼血（玩家实例）',grade:'B',load:34,initialRevival:24,naturalRevivalRate:0,usageRevivalRate:14,medium:'body',ruleWeight:3,
    intro:'外围封锁点发现一段持续渗血的媒介。它不是严力体内的鬼血，正史实例保持独立。',
    clues:[{id:'movement',label:'观察渗血边界',text:'渗痕沿接触过的表面蔓延。'},{id:'witness',label:'核对接触记录',text:'遭到侵蚀的人曾直接触碰渗痕。'},{id:'power',label:'检验隔离边界',text:'完整的黄金隔离边界阻止渗痕扩散。'}],
    riskyLabel:'直接触碰渗痕',riskText:'渗痕侵入身体，造成灵异损伤。',hypothesis:'直接接触渗痕触发侵蚀',falseHypothesis:'只要看见渗痕就会受侵蚀',restriction:'保持非接触观察，并以黄金媒介封闭渗痕。',ability:'血隔：对身体媒介进行规则压制（游戏改编）。'
  },
  headless: {
    title:'黄岗村外围 · 脱离的影',source:'GDD同源玩家实例；外围路线与规则数值为游戏改编',spirit:'无头鬼影（玩家实例）',grade:'B',load:42,initialRevival:26,naturalRevivalRate:0,usageRevivalRate:18,medium:'visual',ruleWeight:3,
    intro:'外围阴影的移动与宿主不一致。该候选拥有独立玩家ID，不会夺走杨间的正史灵异。',
    clues:[{id:'movement',label:'核对阴影方向',text:'一段阴影没有对应的头部轮廓。'},{id:'witness',label:'核对身体侵蚀记录',text:'遭到侵蚀者让阴影与自身影子重合。'},{id:'power',label:'检验照明与隔离',text:'保持阴影分离并封闭媒介，可暂时停止侵蚀。'}],
    riskyLabel:'让两段阴影重合',riskText:'阴影沿身体侵入，原有自我受到威胁。',hypothesis:'阴影重合建立侵蚀媒介',falseHypothesis:'任何阴影都具有相同规律',restriction:'保持照明分离并用黄金隔离媒介限制。',ability:'影束：压制视觉媒介，不授予正史全部能力（游戏改编）。'
  },
  shadow: {
    title: '住宅区 · 熄灯后的影子', source: '游戏原创测试事件', spirit: '背影', grade: 'C', load: 24, initialRevival: 18, naturalRevivalRate: 0, usageRevivalRate: 16,
    intro: '楼道的灯熄灭了。墙上仍然留着一个站立的人影。你停下时，它也停下。',
    clues: [
      { id: 'movement', label: '观察墙上的影子', text: '灯亮时，墙上的人影不随你的动作移动。' },
      { id: 'witness', label: '查看失踪记录', text: '失踪者都在灯灭后转身查看身后。' },
      { id: 'power', label: '检查照明线路', text: '应急灯还能工作，保持照明时影子不再靠近。' }
    ],
    riskyLabel: '熄灯并转身', riskText: '你回头时，身后的影子贴上了肩膀。身体受到灵异侵蚀。',
    hypothesis: '灯灭后回头会触发追踪', falseHypothesis: '只要看到影子就会被追踪',
    restriction: '用应急灯保持照明，利用黄金隔离袋限制媒介。',
    ability: '影遮：暂时隔离追踪媒介；每次调用增加该鬼复苏。'
  },
  echo: {
    title: '住宅区 · 无人值守的接线室', source: '游戏原创测试事件', spirit: '回声', grade: 'C', load: 28, initialRevival: 22, naturalRevivalRate: 0, usageRevivalRate: 16,
    intro: '断电的接线室里传来你的名字。电话听筒没有连线，却重复着同一句话：“你在吗？”',
    clues: [
      { id: 'movement', label: '检查听筒', text: '电话没有供电。声音来自听筒，封闭听筒后声音减弱。' },
      { id: 'witness', label: '查看值班记录', text: '失踪人员都曾向听筒回答“在”。' },
      { id: 'power', label: '保持沉默观察', text: '你没有回应，声音重复了几次，没有发生接近现象。' }
    ],
    riskyLabel: '向听筒回答“在”', riskText: '听筒里响起了你的声音。你感到一部分意识正在被替代。',
    hypothesis: '回应听筒会触发意识侵蚀', falseHypothesis: '听到声音便会失踪',
    restriction: '保持沉默，使用黄金隔离袋封闭听筒。',
    ability: '静默：暂时阻断声音媒介；每次调用增加该鬼复苏。'
  }
};
