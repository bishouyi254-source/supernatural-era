// Canon motifs sourced in docs/CANON_SOURCES.md; player interventions are game adaptations.
export const journeys={
 mall:{title:'第二章 · 歇业商场',stages:['未介入','巡查商铺','假模特与电梯','监控室','合作与关押','街头收束'],steps:[
  '商场处于歇业状态。你负责外围巡查，不替代杨间的经历。',
  '商铺的人员记录存在缺口。留下可核对的出入口记录。',
  '假模特旁出现异常。电梯不是安全区；可以保持朝向，不必先认证规律。',
  '监控片段与目击者说明可以交叉核对，录像不等于完整能力档案。',
  '杨间与严力的合作独立推进。你的工作是撤离外围人员并封闭入口。',
  '正史合作节点保留；你记录的鬼血线索解锁同源玩家候选，不赠送NPC的鬼。']},
 club:{title:'第三章 · 小强俱乐部',stages:['未到访','驭鬼者生态','复苏与交易','匹配资料'],steps:[
  '商场记录提交后，俱乐部提供通联入口。普通人只能在外围接收资料。',
  '有人避免动用能力。你能观察外在症状，不能读取对方后台复苏数值。',
  '交易信息可能带有动机。把来源可信度与事实可信度分别记录。',
  '二鬼方案已开放：候选→限制→匹配→植入/结合→失衡观察→建立平衡。']},
 village:{title:'第四章 · 黄岗村',stages:['未进入','入村异常','失联清点','鬼棺','平衡变化','高危情报','第二鬼窗口','离村记录'],steps:[
  '俱乐部资料指向黄岗村。可选择外围介入；不要求成功获得第二鬼。',
  '出入口记录与地图不一致。咳嗽和脚步只是现象，尚非完整杀人规律。',
  '通联清点出现失联。此时不能把失联直接写成确认死亡。',
  '鬼棺是特殊灵异载体，不是宝箱。观察与触碰有不同后果。',
  '局部限制可能打破相互制约。不要把“少了一只鬼”直接等同更安全。',
  '高危情报提示第二鬼方案。这里的玩家交易由游戏改编，不能照搬NPC能力。',
  '你可以先处理候选再返回，也可以不植入任何新鬼，选择离村。',
  '个人成败独立记录；原著人物的成长节点由世界层保留。']}
};
export function newJourney(){return {active:null,chapters:Object.fromEntries(Object.keys(journeys).map(id=>[id,{stage:0,evidence:[],completed:false,withdrawals:0}])),worldHistory:[],personalHistory:[],npcObservations:[],canonInstances:[]};}
export function attachJourney(s){return s.journey?s:{...s,journey:newJourney()};}
export function unlocked(s,id){return s.chapter?.completed&&(id==='mall'||id==='club'&&s.journey?.chapters.mall.completed||id==='village'&&s.journey?.chapters.club.completed);}
export function eventUnlocked(s,id){return !['hungry','eye','officer','watch','door','knocker'].includes(id)&&s.chapter?.completed&&(!eventsD.includes(id)||id==='blood'&&s.journey?.chapters.mall.completed||id==='headless'&&s.journey?.chapters.village.stage>=5);}
const eventsD=['blood','headless'];
export const journeyLabels={
 'journey:mall':'介入歇业商场','journey:club':'到访小强俱乐部','journey:village':'介入黄岗村',
 'journey:observe':'记录现场证据','journey:advance':'推进下一节点','journey:avoid':'保持朝向，避开背后媒介',
 'journey:risk':'触碰未知媒介（危险）','journey:withdraw':'退出本次介入（保留节点）',
 'journey:finish':'提交章节记录','journey:intel':'核对匹配资料与动机（解锁详细判断）',
 'journey:release':'贸然改变局部限制（危险）'
};
export function journeyAvailable(s){
 if(s.scene!=='hub'||s.crisis||s.combat||s.systems?.death!=='alive'||s.systems?.second?.stage==='unstable')return [];
 const j=s.journey;if(!j)return [];
 if(!j.active)return Object.keys(journeys).filter(id=>unlocked(s,id)&&!j.chapters[id].completed).map(id=>'journey:'+id);
 const c=j.chapters[j.active],last=journeys[j.active].stages.length-1,out=['journey:withdraw'];
 if(!c.evidence.includes('node:'+c.stage))out.push('journey:observe');
 if(j.active==='club'&&!c.evidence.includes('intel'))out.push('journey:intel');
 if(j.active==='mall'&&c.stage===2)out.push('journey:avoid','journey:risk');
 else if(j.active==='village'&&c.stage===3)out.push('journey:risk','journey:advance');
 else if(j.active==='village'&&c.stage===4)out.push('journey:release','journey:advance');
 else out.push(c.stage===last?'journey:finish':'journey:advance');
 return out;
}
export function applyJourney(s,action){
 const j=s.journey,key=action.slice(8),log=t=>{j.personalHistory.push(t);s.journal.push(t);};
 if(journeys[key]){j.active=key;const c=j.chapters[key];if(!c.stage)c.stage=1;log('进入'+journeys[key].title+'，现场进度从已保存节点继续。');return;}
 const id=j.active,c=j.chapters[id];
 if(key==='observe'){c.evidence.push('node:'+c.stage);log('记录'+journeys[id].stages[c.stage]+'的可见信息。');
  const who=id==='mall'&&c.stage===4?'yan':id==='club'?'club':id==='village'&&c.stage===5?'paper':null;if(who&&!j.npcObservations.includes(who))j.npcObservations.push(who);}
 if(key==='intel'){c.evidence.push('intel');log('匹配资料已核对：媒介关系与来源动机分别记档，可查看详细有向压制。');}
 if(key==='advance'||key==='avoid'){c.stage++;log(key==='avoid'?'保持朝向避险。行为安全不要求角色先获得认证。':'推进至'+journeys[id].stages[c.stage]+'。');}
 if(key==='risk'){s.life=Math.max(0,s.life-45);log('触碰未知媒介，身体遭到灵异侵蚀；这不产生任何厉鬼击杀奖励。');if(s.life===0)s.systems.death='pending';}
 if(key==='release'){for(const r of s.relations)r.bias=Math.min(100,(r.bias||0)+25);s.life=Math.max(0,s.life-20);if(s.life===0)s.systems.death='pending';log('贸然改变限制，受到侵蚀；已有双鬼关系向单侧偏移。累积复苏不清除。');c.stage++;}
 if(key==='withdraw'){c.withdrawals++;log('退出'+journeys[id].title+'，证据、获救记录、材料和阶段不重置。');j.active=null;}
 if(key==='finish'){
  c.completed=true;j.active=null;log('提交'+journeys[id].title+'记录。'+(id==='village'?(s.spirits.length>1?'以双鬼状态离村。':'没有获得第二鬼，仍可结束章节。'):''));
  const anchor={mall:'杨间与严力的商场合作节点保留。',club:'驭鬼者俱乐部存在，资料交易与复苏问题继续。',village:'黄岗村与原著人物成长节点独立于玩家成败收束（GDD锚点）。'};
  if(!j.worldHistory.some(v=>v.id===id))j.worldHistory.push({id,text:anchor[id]});
  if(id==='mall')j.canonInstances.push({id:'canon-yan-blood',owner:'严力',name:'鬼血'});
 }
 j.personalHistory=j.personalHistory.slice(-80);
}
export function validJourney(j){
 if(j===undefined)return true;if(!j||![null,...Object.keys(journeys)].includes(j.active)||!j.chapters)return false;
 for(const [id,d] of Object.entries(journeys)){const c=j.chapters[id];if(!c||!Number.isInteger(c.stage)||c.stage<0||c.stage>=d.stages.length||typeof c.completed!=='boolean'||c.completed&&c.stage!==d.stages.length-1||!Number.isInteger(c.withdrawals)||c.withdrawals<0||c.withdrawals>1e9||!Array.isArray(c.evidence)||new Set(c.evidence).size!==c.evidence.length||c.evidence.some(x=>!Array.from({length:d.stages.length},(_,i)=>'node:'+i).concat(id==='club'?['intel']:[]).includes(x)))return false;}
 if(j.active&&(!j.chapters[j.active].stage||j.chapters[j.active].completed)||j.chapters.club.stage&&!j.chapters.mall.completed||j.chapters.village.stage&&!j.chapters.club.completed)return false;
 if(!Array.isArray(j.personalHistory)||j.personalHistory.length>80||j.personalHistory.some(x=>typeof x!=='string'||x.length>2000)||!Array.isArray(j.worldHistory)||j.worldHistory.length>3||j.worldHistory.some(x=>!x||!journeys[x.id]||typeof x.text!=='string'||x.text.length>300)||new Set(j.worldHistory.map(x=>x.id)).size!==j.worldHistory.length)return false;
 if(!Array.isArray(j.npcObservations)||new Set(j.npcObservations).size!==j.npcObservations.length||j.npcObservations.some(x=>!['yan','club','paper'].includes(x)))return false;
 return Array.isArray(j.canonInstances)&&j.canonInstances.length<=1&&j.canonInstances.every(x=>x?.id==='canon-yan-blood'&&x.owner==='严力'&&x.name==='鬼血');
}
