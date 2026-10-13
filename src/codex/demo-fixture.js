// Synthetic UI states only. This module imports no engine or persistence modules.
import {RATINGS} from './model.js';
const art=['card-faceless','card-soul-lock','card-eye','card-blood','card-shadow','card-hand'];
export function createDemoRecords(){
  return Array.from({length:24},(_,i)=>{
    const discovered=i<12,rank=RATINGS[i%6];
    const evidence=discovered ? Object.fromEntries(['identity','rating','contact','risk','source','location','rules','encounters','clues','progress'].map(k=>[k,'DEMO：组件状态样本'])) : i<18 ? {rating:'DEMO：评级已获情报，身份未确认'} : {};
    return {id:'DEMO-'+String(i+1).padStart(2,'0'),demo:true,discovered,contacted:i%3===1,
      name:['朱衣档案','锁链档案','红瞳档案','血痕档案','暗影档案','手印档案'][i%6],rating:rank,
      risk:i%4===0?'高危':i%4===1?'中危':'低危',source:'组件演示 / 非剧情资料',location:'演示场景（无正式地图绑定）',
      art:i%6===0?'assets/codex/portrait-red-detail-demo.png':'assets/workshop-reference-extracted/'+art[i%6]+'-art-tight.png',
      rules:['DEMO：此行用于检验已知规律的多行排版。','DEMO：情报未确认的规律不公开，不从后台档案补齐。'],
      encounters:['DEMO：接触状态展示样本；不代表玩家真实遭遇。'],
      clues:['DEMO：证据条目示例；不计入正式调查进度。','DEMO：来源与地图关联仅预留接口。'],
      completeness:30+(i%6)*11,investigation:20+(i%5)*15,
      warning:'演示风险提示：风险标签与评级独立。正式行动条件将在第四步依据已有证据接入。',evidence};
  });
}
