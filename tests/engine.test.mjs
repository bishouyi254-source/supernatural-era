import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame as createGame, act, available, validate } from '../src/engine.js';
function newGame(...args) { let s=createGame(...args); for(const a of ['chapter:perimeter','chapter:advance','chapter:avoid','chapter:leave','chapter:finish']) s=act(s,a); return s; }
function prepared(id = 'shadow', s = newGame('调查员', '安保', 42)) {
  for (const action of ['enter:' + id, 'clue:witness', 'clue:power', 'theory:true', 'restrict']) s = act(s, action);
  return s;
}
test('普通人开局，背景不改变身体属性或授予厉鬼', () => {
  const a = newGame('甲', '安保'), b = newGame('乙', '学生');
  assert.equal(a.life, b.life); assert.equal(a.spirits[0], undefined); assert.ok(validate(a));
});
test('不能跳过调查限制直接驾驭；无效行动不推进时间', () => {
  const s = act(newGame(), 'enter:shadow'); assert.equal(act(s, 'capture'), s); assert.equal(act(s, 'restrict'), s);
});
test('调查不足的推测允许后续复核', () => {
  let s = act(act(newGame(), 'enter:shadow'), 'theory:true');
  assert.ok(available(s).includes('theory:true'));
  for (const a of ['clue:witness','clue:power','theory:true']) s = act(s,a);
  assert.ok(available(s).includes('restrict'));
});
test('撤离再进入保留限制阶段，不能重复扣除隔离袋', () => {
  let s = prepared(); assert.equal(s.bags, 1);
  s = act(act(s,'retreat'),'enter:shadow'); assert.equal(s.phase,'限制'); assert.equal(act(s,'restrict'),s); assert.ok(validate(s));
});
test('驾驭提交结果与命运状态；重复操作不重复获取', () => {
  const s = act(prepared(),'capture'); assert.equal(s.spirits[0].sourceId,'shadow'); assert.equal(s.spirits[0].revivalProgress,18);
  assert.equal(s.fate.shadow.result,'success'); assert.equal(act(s,'capture'),s); assert.ok(validate(s));
});
test('休整不降低累计复苏，能力不无限调用', () => {
  let s = act(prepared(),'capture'); for (let i=0;i<3;i++) s=act(s,'practice');
  assert.equal(act(s,'practice'),s); for (let i=0;i<10;i++) s=act(s,'rest'); assert.equal(s.spirits[0].revivalProgress,66);
});
test('单鬼100复苏进入危机，禁止普通休整；压制有身体代价', () => {
  let s=act(prepared(),'capture');
  s.spirits[0].revivalProgress=90; s=act(s,'practice'); assert.equal(s.crisis,true); assert.equal(act(s,'rest'),s);
  s=act(s,'suppress'); assert.equal(s.crisis,false); assert.equal(s.life,80); assert.equal(s.spirits[0].revivalProgress,100); assert.ok(validate(s));
});
test('致命规则触发保留个人档案，不删除存档', () => {
  let s=act(act(newGame(),'enter:echo'),'clue:witness');
  for(let i=0;i<3;i++) s=act(s,'risk'); assert.equal(s.systems.death,'pending'); assert.equal(s.life,0); assert.deepEqual(s.knowledge.echo.clues,['witness']);
});
test('灵异保护只抵挡一次触发，仍不能杀死事件源', () => {
  let s=act(prepared(),'capture'); s=act(s,'enter:echo'); s=act(s,'ability'); s=act(s,'risk');
  assert.equal(s.life,100); assert.equal(s.ward,0); assert.equal(s.outcomes.echo,undefined);
  s=act(s,'risk'); assert.equal(s.life,55);
});
test('两种首鬼可自由在事件内选择，已持有时不追加第二只', () => {
  let s=act(prepared('echo'),'capture'); assert.equal(s.spirits[0].sourceId,'echo');
  s=prepared('shadow',s); assert.ok(!available(s).includes('capture')); s=act(s,'seal'); assert.equal(s.outcomes.shadow,'已封存'); assert.ok(validate(s));
});
test('存档往返保持现场状态；拒绝未知版本与损坏数据', () => {
  const s=prepared(); assert.ok(validate(JSON.parse(JSON.stringify(s))));
  assert.equal(validate({...s,version:99}),false); assert.equal(validate({...s,spirits:[{sourceId:'missing'}]}),false);
  assert.equal(validate({...s,knowledge:{shadow:{clues:['fake'],hypotheses:{}}}}),false);
  assert.equal(validate({...s,crisis:true}),false);
});
