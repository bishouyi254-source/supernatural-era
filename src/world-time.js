// Fictional Gregorian calendar. 64 existing action-time units per day.
export const calendarId='GAME-CALENDAR-1';
const epoch=(()=>{const d=new Date(0);d.setUTCFullYear(1,0,1);d.setUTCHours(0,0,0,0);return d.getTime();})();
export const unitsPerDay=64;
export const newCalendar=(s={})=>({format:1,id:calendarId,anchorUnits:s.dachang?.timeUnits||0,anchorSeconds:0,adoptedAt:s.tick||0,origin:'FICTIONAL_ADOPTION_ANCHOR'});
export const attachCalendar=s=>s.calendar?s:{...s,calendar:newCalendar(s)};
export const worldSeconds=s=>s.calendar.anchorSeconds+((s.dachang?.timeUnits||0)-s.calendar.anchorUnits)*1350;
export function dateParts(seconds){const d=new Date(epoch+seconds*1000);return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds()};}
export function addCalendarYears(seconds,years=1){if(!Number.isSafeInteger(seconds)||seconds<0||!Number.isInteger(years)||years<1||years>100)throw Error('无效期限');const p=dateParts(seconds),year=p.year+years,leap=year%4===0&&(year%100!==0||year%400===0);const d=new Date(epoch);d.setUTCFullYear(year,p.month-1,p.month===2&&p.day===29&&!leap?28:p.day);d.setUTCHours(p.hour,p.minute,p.second,0);return (d.getTime()-epoch)/1000;}
export function formatWorldTime(seconds){const p=dateParts(seconds);return `游戏历${p.year}年${p.month}月${p.day}日 ${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}`;}
export function deadlineStatus(s,d){const remaining=d.dueAt-worldSeconds(s);return d.state==='FULFILLED'?'FULFILLED':remaining<=0?'EXPIRED':remaining<=7*86400?'CRITICAL':remaining<=30*86400?'ATTENTION':'NORMAL';}
export function validCalendar(s){if(s.calendar===undefined)return true;const c=s.calendar;return c.format===1&&c.id===calendarId&&c.origin==='FICTIONAL_ADOPTION_ANCHOR'&&Number.isInteger(c.anchorUnits)&&c.anchorUnits>=0&&c.anchorUnits<=(s.dachang?.timeUnits||0)&&c.anchorSeconds===0&&Number.isInteger(c.adoptedAt)&&c.adoptedAt>=0&&c.adoptedAt<=s.tick;}
