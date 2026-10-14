const el=id=>document.getElementById(id);
const money=cents=>(cents/100).toFixed(2);
let current=[];
function render(){
  const p={people:Number(el('people').value),budget:Number(el('budget').value),mode:el('mode').value,protein:el('protein').value,noSpicy:el('noSpicy').checked,noCola:el('noCola').checked};
  el('selection').textContent='';
  try{
    const r=Maidada.recommend(p);current=r.plans;
    el('summary').textContent=`${p.people} 人 · 整单 ¥${p.budget.toFixed(2)}`;
    if(!current.length){el('cards').innerHTML=`<div class="empty"><h3>这次预算，还差一点点。</h3><p>符合当前口味和份数的演示组合最低为 ¥${money(r.minimum)}，比预算多 ¥${money(r.gap)}。可以提高预算或主动调整偏好，再试一次。</p></div>`;return;}
    el('cards').innerHTML=current.map((c,i)=>`<article class="card"><div><span class="badge">${String(i+1).padStart(2,'0')} / ${c.label}</span><h3>${c.items[0].name}搭配</h3><div class="items">${c.items.map(x=>`${x.name} × ${x.qty}`).join('　·　')}</div><p>${c.reason}</p><span class="badge">预算还剩 ¥${money(c.remaining)}</span></div><div class="price">¥${money(c.total)}<small>人均 ¥${money(Math.round(c.total/p.people))}</small><small>${c.fee?'含演示配送费 ¥6':'到店 · 无配送费'}</small><button class="choose" type="button" data-plan="${i}">就选这份 ↗</button></div></article>`).join('');
  }catch(e){current=[];el('cards').textContent=e.message;}
}
el('form').addEventListener('submit',e=>{e.preventDefault();render();});
document.querySelectorAll('[data-budget]').forEach(b=>b.addEventListener('click',()=>{el('budget').value=b.dataset.budget;render();}));
el('cards').addEventListener('click',e=>{const b=e.target.closest('[data-plan]');if(!b)return;const p=current[Number(b.dataset.plan)];el('selection').textContent=`已选好：${p.items.map(x=>x.name+' × '+x.qty).join('，')}。演示总价 ¥${money(p.total)}。这是搭配清单，尚未创建订单；真实价格请由 Skill 调用官方计价工具确认。`;});
el('form').addEventListener('change',()=>{if(el('form').checkValidity())render();});
render();
