import {relationRecordNote,eyeUsageScope} from './relation-preview.js';
import {events} from './content.js';
import {journeys,eventUnlocked,journeyLabels,unlocked} from './journey.js';
import {hostState,growthFor} from './spirits.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function cdLabel(a,s){
 if(journeyLabels[a])return journeyLabels[a];
 const map={'combat:start':'进入正式规则遭遇','combat:observe':'调查与复核证据','combat:avoid':'避开触发媒介','combat:force':'普通力量试探（不能杀死厉鬼）','combat:risk':'主动接触媒介（危险）','combat:retreat':'退出规则遭遇','combat:item':'隔离符膜（消耗1）','combat:restrict':'执行限制（隔离袋－1）','combat:combo':'调用嵌套媒介（能量－2）','second:begin':'第二鬼：开始匹配方案','second:match:mutual':'匹配：相互压制','second:match:partition':'匹配：宿主分区','second:match:medium':'匹配：外部媒介（植入时消耗符膜1）','second:implant':'植入：保留独立能力','second:combine':'结合：转为组合规则','second:stabilize':'完成失衡观察（能量－1）','second:remove':'放弃第二鬼并封存（隔离袋－1）','second:exit':'取消第二鬼方案','balance:medium':'修正平衡偏移（符膜－1）','reaction:item':'消耗符膜，拦截致死并撤离','death:commit':'提交死亡（该角色不能普通复活）'};
 if(map[a])return map[a];
 const name=id=>s.spirits.find(g=>g.id===id)?.name||id;
 if(a.startsWith('combat:focus:'))return '集中压制：'+name(a.slice(13));
 if(a.startsWith('combat:cover:'))return '收束掩护：'+name(a.slice(13));
 if(a.startsWith('combat:ability:'))return '灵异：'+name(a.slice(15));
 if(a.startsWith('practice:'))return '调用练习：'+name(a.slice(9));
 if(a.startsWith('study:'))return '档案开发：'+name(a.slice(6))+'（一次＋5）';
 if(a.startsWith('release:'))return '取回：'+events[a.slice(8)].spirit;
 if(a.startsWith('abandon:'))return '舍弃并封存：'+name(a.slice(8));
 if(a.startsWith('combat:aid:'))return '援助：'+events[a.slice(11)].spirit+'（剩'+s.systems.aids[a.slice(11)].remaining+'次）';
 if(a.startsWith('reaction:aid:'))return '消耗援助次数，拦截致死：'+events[a.slice(13)].spirit;
 return null;
}
export function journeyView(s,buttons){const j=s.journey,id=j.active;
 if(!id)return '<article><h2>后续章节</h2><p>沿商场、俱乐部、黄岗村推进；撤离保存原节点，不要求获得第二鬼。</p>'+Object.entries(journeys).map(([key,d])=>'<div class="map-node"><h3>'+d.title+'</h3><p>'+(!unlocked(s,key)?'前一章节提交后开放':j.chapters[key].completed?'已提交':d.stages[j.chapters[key].stage])+'</p></div>').join('')+buttons('journey:')+'</article>';
 const c=j.chapters[id],d=journeys[id];return '<article><span class="stamp">原著节点 / 玩家线路为游戏改编</span><h2>'+d.title+'</h2><ol class="stages">'+d.stages.map((v,i)=>'<li class="'+(i===c.stage?'active':'')+'">'+v+'</li>').join('')+'</ol><p>'+d.steps[c.stage]+'</p><p class="muted">记录 '+c.evidence.length+' 项 / 撤离 '+c.withdrawals+' 次；未经观察不认证NPC能力。</p>'+buttons('journey:')+(id==='village'&&c.stage>=5?'<button data-tab="第二鬼">查看第二鬼进度</button><button data-tab="地图">选择已开放候选</button>':'')+'</article>';
}
export function combatView(s,buttons){const c=s.combat;if(!c)return '';
 return '<article class="rule-combat"><span class="stamp">规则遭遇 · 源头没有气血</span><h2>'+events[c.eventId].title+'</h2><div class="initiative"><div><span>玩家行动条</span><progress value="'+c.playerGauge+'" max="100"></progress><strong>'+Math.min(100,c.playerGauge)+' / 100</strong></div><div><span>源头行动条</span><progress value="'+c.sourceGauge+'" max="100"></progress><strong>'+Math.min(100,c.sourceGauge)+' / 100</strong></div></div><p>位置：'+(c.position==='safe'?'避开媒介':'处于触发范围')+' / 已行动 '+c.turn+' 次 / 时间刻 '+c.clock+'</p><p class="muted">每次玩家行动后，按行动条推进源头、环境与持续状态。相同输入可复现。调查认证开放限制方案；你也可以直接避险。</p>'+buttons('combat:')+'<details><summary>规则结算日志</summary><ol class="journal">'+c.logs.map(l=>'<li><small>刻'+l.clock+' · '+l.phase+'</small> '+esc(l.text)+'<br><small>'+esc(l.source)+' / '+esc(l.rule)+'</small></li>').join('')+'</ol></details></article>';
}
export function growthView(s,buttons){return '<article><h2>单鬼规则开发</h2><p>开发度与复苏独立。调用＋3开发度并支付复苏；档案复核每实例一次＋5。25/50/75/100开发度各增加1点对抗权重；不授予鬼域或重启。</p>'+s.spirits.map(g=>'<div class="spirit-card"><h3>'+esc(g.name)+'</h3><progress value="'+g.development+'" max="100"></progress><p>开发度 '+g.development+'% / '+(g.sourceId==='eye'?eyeUsageScope:'调用复苏＋'+growthFor(s,g,true).toFixed(2))+' / 下一权重节点 '+(g.development>=100?'已完成':(Math.floor(g.development/25)+1)*25+'%')+'</p></div>').join('')+buttons('study:')+buttons('practice:')+'<button data-tab="第二鬼">第二鬼与动态平衡</button></article>';}
export function secondView(s,buttons){const h=hostState(s),a=s.systems.second,advanced=s.journey.chapters.club.evidence.includes('intel');
 return '<article><h2>第二鬼 · 匹配与平衡</h2><ol class="stages">'+['候选','限制','匹配','植入/结合','失衡期','平衡'].map((v,i)=>'<li class="'+(a&&({candidate:0,restricted:1,matched:2,unstable:4,balanced:5}[a.stage])===i?'active':'')+'">'+v+'</li>').join('')+'</ol><p>'+(!s.journey.chapters.club.completed?'提交俱乐部章节后开放。':!s.spirits.length?'需要先驾驭第一只鬼。':!a?'从地图选择尚未处理的候选，先限制，再匹配。':'候选：'+esc(events[a.sourceId].spirit)+' / '+({candidate:'调查与限制',restricted:'选择匹配方案',matched:'等待植入或结合',unstable:'失衡观察',balanced:'动态关系已建立'}[a.stage]))+'</p><div class="stat-grid"><div><span>有效负荷</span><strong>'+h.effectiveBurden+' / '+h.hostCapacity+'</strong></div><div><span>总体平衡</span><strong>'+h.balanceState+'</strong></div></div>'+s.relations.map(r=>'<p>'+esc(s.spirits.find(g=>g.id===r.spiritA).name)+' ⇄ '+esc(s.spirits.find(g=>g.id===r.spiritB).name)+': '+(advanced?'相容参考 '+Math.round(r.compatibility*200-100)+'；A→B '+Math.round(r.suppressionAtoB*100)+'%，B→A '+Math.round(r.suppressionBtoA*100)+'%；偏移 '+(r.bias||0):'详细数值需核对俱乐部匹配资料；当前状态 '+h.balanceState)+'</p>').join('')+(advanced&&s.relations.length?'<p class="muted relation-record-note">'+relationRecordNote+'</p>':'')+'<p class="muted">大量使用同一只鬼会偏移；可调用另一只鬼或消耗媒介修正。伪平衡不等于双向压制。植入不会清除既有复苏，评级不决定相容。</p>'+buttons('second:')+buttons('balance:')+'<button data-tab="地图">查看候选地图</button></article>';
}
export function inventoryView(s,buttons){return '<article><h2>四种处理方式与物品</h2><p>驾驭：纳入身体并承担负荷与复苏。结合：两实例都保留代价，次鬼独立按钮改为组合规则。援助：不植入，最多2个联系，各2次调用。封存：可取回重新处理，但不返还消耗。</p><p>隔离袋 '+s.bags+' / 隔离符膜 '+s.systems.items.barrier+'（游戏原创防护物品，本批没有无限补给）</p><h3>封存实例</h3><p>'+s.systems.sealed.map(id=>esc(events[id].spirit)).join('、')+'</p>'+buttons('release:')+'<h3>援助联系</h3>'+Object.entries(s.systems.aids).map(([id,a])=>'<p>'+esc(events[id].spirit)+'：剩余'+a.remaining+'次 / 已用'+a.used+'次</p>').join('')+'</article>';}
export function cdMap(s){return '<article><h2>章节与候选</h2><button data-tab="后续章节">商场 / 俱乐部 / 黄岗村</button><button data-tab="第二鬼">第二鬼六阶段</button><p class="muted">鬼血同源候选：'+(eventUnlocked(s,'blood')?'已开放':'商场提交后开放')+'；无头鬼影同源候选：'+(eventUnlocked(s,'headless')?'已开放':'黄岗村高危情报节点后开放')+'。获得玩家实例不删除NPC实例。</p></article>';}
export function deathView(s,buttons){return '<article><h2>'+(s.systems.death==='pending'?'死亡待定 · 反应窗口':'死亡已提交')+'</h2><p>'+(s.systems.death==='pending'?'只可使用已经持有的符膜、有限援助或已解锁的七/八层重启拦截，无法在反应窗口凭空领取资源。':'该角色不能继续行动或普通复活。存档与历史保留，可导出副本或导入此前备份；纯本地模式不宣称防读档。')+'</p>'+buttons()+'</article>';}
