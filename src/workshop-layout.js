// Ephemeral presentation only: never writes game state or save format.
const panels=['.workshop-workbench','.workshop-sidebar','#plan-ribbon','.workshop-sidepanels','#spirit-detail','.mosaic-track'];
export function captureWorkshopUI(root){
 if(root?.dataset.page!=='技能工坊')return null;
 const scroll=panels.map(selector=>{const e=root.querySelector(selector);return {selector,top:e?.scrollTop||0,left:e?.scrollLeft||0};});
 const focused=document.activeElement;
 const attrs=['data-select-spirit','data-workshop-filter','data-action','data-scroll-target','data-workshop-next','data-play-current'];
 const attribute=focused&&attrs.find(a=>focused.hasAttribute(a));
 const focus=attribute?{attribute,value:focused.getAttribute(attribute),scope:focused.closest('.constellation')?'.constellation':focused.closest('.desktop-collection')?'.desktop-collection':focused.closest('.mosaic-track')?'.mosaic-track':''}:null;
 return {scroll,focus};
}
export function restoreWorkshopUI(root,snapshot){
 if(!snapshot||root.dataset.page!=='技能工坊')return;
 for(const {selector,top,left} of snapshot.scroll){const e=root.querySelector(selector);if(e){e.scrollTop=top;e.scrollLeft=left;}}
 if(snapshot.focus){const {attribute,value,scope}=snapshot.focus;const target=root.querySelector(`${scope} [${attribute}="${CSS.escape(value)}"]`)||root.querySelector('.constellation button[aria-pressed="true"]');target?.focus({preventScroll:true});}
}
