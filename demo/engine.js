(function(root){
  // All names, prices, tags and fees below are fictional demo data.
  const mains=[{id:'chicken',name:'香酥鸡肉堡',price:1300,protein:'chicken',spicy:false},{id:'spicy',name:'热辣鸡肉堡',price:1500,protein:'chicken',spicy:true},{id:'beef',name:'芝士牛肉堡',price:1800,protein:'beef',spicy:false}];
  const drinks=[{id:'cola',name:'可乐',price:500,cola:true},{id:'tea',name:'无糖茶',price:600,cola:false}];
  function recommend(p){
    if(!Number.isInteger(p.people)||p.people<1||p.people>6||!Number.isFinite(p.budget)||p.budget<=0||p.budget>1000||!['any','chicken','beef'].includes(p.protein)||!['pickup','delivery'].includes(p.mode)) throw new Error('请填写 1—6 人、0—1000 元以内的有效预算，并选择就餐方式。');
    const budget=Math.round(p.budget*100),fee=p.mode==='delivery'?600:0;
    const plans=[];
    for(const m of mains) for(const d of drinks) for(const side of [false,true]){
      if(p.noSpicy&&m.spicy||p.noCola&&d.cola||p.protein!=='any'&&p.protein!==m.protein) continue;
      const total=(m.price+d.price)*p.people+(side?800*Math.ceil(p.people/2):0)+fee;
      plans.push({key:[m.id,d.id,side].join('-'),total,fee,side,remaining:budget-total,items:[{name:m.name,qty:p.people},{name:d.name,qty:p.people},...(side?[{name:'小份薯条',qty:Math.ceil(p.people/2)}]:[])],reason:side?'主食、饮品和共享配餐都有，适合想多一点变化的这一餐。':'每人一份主食和饮品，把预算留给真正想吃的。'});
    }
    plans.sort((a,b)=>a.total-b.total||a.key.localeCompare(b.key));
    const feasible=plans.filter(x=>x.total<=budget);
    if(!feasible.length)return {plans:[],minimum:plans[0]?.total??null,gap:plans[0]?plans[0].total-budget:null};
    const selected=[];
    const add=(p,label)=>{if(p&&!selected.some(s=>s.key===p.key))selected.push({...p,label});};
    add(feasible[0],'预算优先');
    add(feasible.find(p=>p.side),'多点搭配');
    for(const p of [...feasible].reverse()){if(selected.length===3)break;add(p,'换个口味');}
    return {plans:selected,minimum:plans[0].total,gap:0};
  }
  root.Maidada={recommend};
})(typeof window==='undefined'?globalThis:window);
