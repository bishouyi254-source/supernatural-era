// Canon anchors are sourced; the player's routes, rescues and supplies are game adaptations.
export const chapterTitle = '第一章 · 七中之夜';
export const stages = ['尚未进入','临时讲课','黑暗蔓延','撤离窗口','街头余波','章节结算'];
export const routes = { inside:'校内旁观者', perimeter:'校外接应者',elsewhere:'城内异地接触者' };
export const backgroundHints = {
  学生:'你熟悉校园布局，可以优先核对楼梯与出口。',
  普通职员:'你习惯核对记录，通联时间与内容可以分别记录。',
  医疗相关:'注意意识与身体反应；镇静不能替代避开灵异媒介。',
  安保:'出入口与人员清点是你的切入点，不能把门锁当成灵异屏障。',
  自由职业:'可在路线间观察差异，传闻必须与现场记录分开。'
};
export function newChapter() {
  return { route:null, stage:0, evidence:[], npcObservations:[], rescued:false, failed:false,
    claims:[], worldHistory:[], personalHistory:[], supplyCredits:2, supplyCount:0,
    canonInstances:[], completed:false };
}
export function chapterState(s) { return s.chapter || newChapter(); }
export function attachChapter(s) {
  if (s.chapter) return s;
  return { ...s, chapter: { ...newChapter(), personalHistory:['旧原型记录保留；七中章节从未参与状态开始，不把旧试验经历当作七中经历。'] } };
}
export function chapterAvailable(s) {
  const c=chapterState(s);
  if (s.crisis || s.scene !== 'hub') return [];
  if (c.completed) return s.bags < 2 && c.supplyCredits > 0 ? ['chapter:supply'] : [];
  if (c.stage===0) return ['chapter:inside','chapter:perimeter','chapter:elsewhere'];
  const choices=[];
  if(c.stage===1) { if(!c.evidence.includes('briefing')) choices.push('chapter:briefing'); choices.push('chapter:advance'); }
  if(c.stage===2) {
    if(!c.evidence.includes('exit')) choices.push('chapter:exit');
    if(!c.evidence.includes('audio')) choices.push('chapter:audio');
    choices.push('chapter:avoid','chapter:risk','chapter:withdraw');
  }
  if(c.stage===3) {
    if(!c.rescued && s.energy > 0) choices.push('chapter:rescue');
    choices.push('chapter:leave','chapter:withdraw');
  }
  if(c.stage===4) {
    if(!c.evidence.includes('street')) choices.push('chapter:street');
    choices.push('chapter:finish');
  }
  return choices;
}
export const chapterLabels = {
  inside:'进入校内旁观路线', perimeter:'进入校外接应路线',elsewhere:'留在城内其他区域（世界锚点仍继续）', briefing:'记录安全讲课 / 通联内容',
  advance:'推进至黑暗蔓延', exit:'核对出口与人员记录', audio:'检查音频来源（不播放）',
  avoid:'避开声音媒介，等待撤离窗口', risk:'播放未知音频（危险）',
  rescue:'接应一名外围被困者（行动能量－1）', leave:'沿撤离路线离开', withdraw:'停止介入，撤至外围安全点',
  street:'记录幸存者的街头说明', finish:'提交本章记录', supply:'领取隔离袋（补给额度－1）'
};
export function chapterDescription(s) {
  const c=chapterState(s),inside=c.route==='inside';
  return [
    '晚自习的安全讲课即将开始。选择在校园中旁观，或在校外接应；你并非杨间，不会自动获得他的灵异。',
    inside?'你在教学楼外围值守点旁观临时讲课。先记录能确认的内容，不把陌生人的异常外观当作完整能力档案。':'校外通联点收到一份安全讲课记录。你无法凭录音确认讲课者的身体状态。',
    inside?'黑暗改变了熟悉的走廊。手机中的未知音频仍可播放；你可以选择不播放，不必先取得角色认证。':'学校的出入口与通联记录对不上。异常音频可能成为媒介；正确避险不要求先获得正式结论。',
    inside?'撤离窗口出现。你可以接应旁侧的被困者，也可以独自撤离；这里的外围人物是游戏原创。':'临时接应点出现一名被困者。接应会消耗行动能量，不改变原著幸存者名单。',
    '街头有人留下了关于声音媒介的说明。个人转述与世界事实分开存档，未观察到的能力不会自动认证。',
    c.failed?'你已退出七中介入，受伤和调查记录保留。可恢复后进入街区的个人首鬼路线。':'七中之夜结束。你的参与记录已经提交，接下来可选择街区的个人首鬼路线。'
  ][c.stage];
}
function once(array,id) { if(!array.includes(id)) array.push(id); }
export function applyChapter(s, action) {
  const c=s.chapter, key=action.slice(8);
  const personal=text=>c.personalHistory.push(text), world=(id,text)=>{if(!c.worldHistory.some(x=>x.id===id)) c.worldHistory.push({id,text});};
  if(key==='inside'||key==='perimeter') { c.route=key;c.stage=1;personal('选择'+routes[key]+'路线。'); }
  if(key==='elsewhere'){c.route=key;c.stage=4;world('lecture','七中讲课与异常在世界层发生；玩家尚未在现场观察。');personal('选择城内异地路线，没有加入原著班级；可等待正式事件记录。');}
  if(key==='briefing') {
    once(c.evidence,'briefing'); once(c.npcObservations,'zhou');
    personal(c.route==='inside'?'观察周正主持临时讲课。':'记录校外转交的周正讲课信息（间接来源）。');
  }
  if(key==='advance') { c.stage=2; world('lecture','七中出现临时安全讲课与随后发生的异常。'); personal('黑暗蔓延，个人路线进入避险阶段。'); }
  if(key==='exit'||key==='audio') { once(c.evidence,key);personal(key==='exit'?'记录出口与人员位置。':'检查未知音频来源，没有播放。'); }
  if(key==='avoid') { c.stage=3;personal('没有播放声音媒介，选择等待撤离。'); }
  if(key==='rescue') { s.energy--;c.rescued=true;personal('接应一名游戏原创外围被困者，其获救结果保留。'); }
  if(key==='risk') {
    s.life=Math.max(0,s.life-45);personal('主动播放未知音频，遭到灵异侵蚀。');
    if(s.life===0) {s.systems.death='pending';c.failed=true;personal('致死进入反应窗口，不能无代价自动救回。证据保留。');}
  }
  if(key==='withdraw') { c.failed=true;c.stage=4;personal('主动撤离，不抹除已经获得的证据与救援结果。'); }
  if(key==='leave') {
    c.stage=4; world('yang-eye','杨间形成自己的鬼眼能力；该正史实例不属于玩家。');
    world('escape','原著人物从学校脱离，世界路线进入街头余波。');
    once(c.npcObservations,'yang');
    c.canonInstances=[{id:'canon-yang-eye',owner:'杨间',name:'鬼眼'}];
    personal('沿个人撤离路线抵达街头；没有夺取杨间的鬼眼。');
  }
  if(key==='street') {once(c.evidence,'street');once(c.npcObservations,'yang');personal('获得幸存者有关音频媒介的说明；来源为个人转述。');}
  if(key==='finish') {
    // Canon Convergence advances required anchors even if the player withdrew.
    world('yang-eye','杨间形成自己的鬼眼能力；该正史实例不属于玩家。');
    world('escape','原著人物从学校脱离，世界路线进入街头余波。');
    c.canonInstances=[{id:'canon-yang-eye',owner:'杨间',name:'鬼眼'}];
    c.stage=5;c.completed=true;personal(c.failed?'提交外围撤离记录。':'提交完整章节参与记录。');
  }
  if(key==='supply') {c.supplyCredits--;c.supplyCount++;s.bags++;personal('从安全屋领取隔离袋×1，消耗一份本章补给额度。');}
  c.personalHistory=c.personalHistory.slice(-60);
  s.journal.push(c.personalHistory.at(-1)||chapterLabels[key]);
}
export function validChapter(c) {
  if(c===undefined) return true; // Additive upgrade of v2, explicitly noted in UI/docs.
  if(!c||!Object.hasOwn(routes,c.route)&&c.route!==null||!Number.isInteger(c.stage)||c.stage<0||c.stage>5||
    typeof c.completed!=='boolean'||c.completed!==(c.stage===5)||typeof c.failed!=='boolean'||typeof c.rescued!=='boolean') return false;
  if((c.stage===0)!==(c.route===null)) return false;
  const array=(x,allowed)=>Array.isArray(x)&&new Set(x).size===x.length&&x.every(v=>allowed.includes(v));
  if(!array(c.evidence,['briefing','exit','audio','street'])||!array(c.npcObservations,['zhou','yang'])||!array(c.claims,[])) return false;
  if(!Number.isInteger(c.supplyCredits)||c.supplyCredits<0||c.supplyCredits>2||!Number.isInteger(c.supplyCount)||c.supplyCount<0||c.supplyCredits+c.supplyCount!==2) return false;
  if(!Array.isArray(c.personalHistory)||c.personalHistory.length>60||c.personalHistory.some(x=>typeof x!=='string'||x.length>2000)) return false;
  if(!Array.isArray(c.worldHistory)||c.worldHistory.length>3||c.worldHistory.some(x=>!x||!['lecture','yang-eye','escape'].includes(x.id)||typeof x.text!=='string'||x.text.length>300)||new Set(c.worldHistory.map(x=>x.id)).size!==c.worldHistory.length) return false;
  if(!Array.isArray(c.canonInstances)||c.canonInstances.length>1||c.canonInstances.some(x=>!x||x.id!=='canon-yang-eye'||x.owner!=='杨间'||x.name!=='鬼眼')) return false;
  return true;
}
