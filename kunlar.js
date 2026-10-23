/* Ish kunlari + kunlik haq + uy egasidan avans (qo'shimcha modul).
   index.html da </body> dan oldin qo'shing:  <script src="kunlar.js"></script>
   Ma'lumot mavjud Supabase funksiyalari orqali saqlanadi (yangi jadval kerak emas). */
(()=>{
const SK=['Kun','Cfg','Avans'];
const sum=a=>a.reduce((s,t)=>s+t.amount,0);
const days=n=>tx.filter(t=>t.type==='Kun'&&t.name===n);
const avans=()=>tx.filter(t=>t.type==='Avans');
const num=s=>parseFloat(String(s).replace(/\s/g,'').replace(',','.'));
const cfg=()=>tx.find(t=>t.id===1)||{id:1,type:'Cfg',date:today(),name:names[0],currency:'UZS',amount:1,desc:'Sozlama',rate:0,rates:{}};
const rateOf=n=>{const c=cfg();return +((c.rates&&c.rates[n])||c.rate)||0};
const putCfg=c=>{c.name=names[0];const i=tx.findIndex(t=>t.id===1);if(i>-1)tx[i]=c;else tx.push(c)};
const avTxt=()=>{const p=Object.keys(CUR).map(c=>[c,sum(avans().filter(t=>t.currency===c))]).filter(x=>x[1]>0).map(x=>fmt(x[1],x[0]));return p.length?p.join(' + '):'0'};
const dayId=(d,n)=>Number(d.replace(/-/g,''))*1000+Math.max(0,names.indexOf(n));

/* Sozlama/ish kuni/avans yozuvlari kirim-xarajat hisobiga va ro'yxatga qo'shilmasin */
totals=function(list){const r={};Object.keys(CUR).forEach(c=>r[c]={i:0,o:0});
list.forEach(t=>{if(SK.includes(t.type)||!r[t.currency])return;t.type==='Kirim'?r[t.currency].i+=t.amount:r[t.currency].o+=t.amount});return r};
const oRL=renderList;
renderList=function(){oRL();
const hid=new Set(tx.filter(t=>SK.includes(t.type)).map(t=>String(t.id)));
$('list').querySelectorAll('.tr').forEach(e=>{const b=e.querySelector('[data-e]');if(b&&hid.has(b.dataset.e))e.remove()});
if(!$('list').children.length)$('list').innerHTML='<div class="empty">Hozircha yozuv yo\'q</div>'};

function panel(){
let el=$('kunP');
if(!el){el=document.createElement('div');el.id='kunP';el.className='card';$('listTitle').before(el);el.onclick=click}
const a=document.activeElement;if(a&&(a.tagName==='INPUT'||a.tagName==='SELECT')&&el.contains(a))return;
const pv=$('kAv')?{a:$('kAv').value,c:$('kCur').value}:null;
const d=today(),av=avans();
el.innerHTML=`<div class="cur-h">Ish kunlari — bugun ${d}</div>`+
names.map(n=>{const m=days(n),on=m.some(t=>t.date===d);
return `<div class="row" style="align-items:center;margin-bottom:8px"><button class="sm" data-k="${esc(n)}" style="min-width:46px;padding:10px;${on?'background:var(--in);color:#fff;border-color:var(--in)':''}">${on?'✔':'○'}</button><div style="flex:1"><b>${esc(n)}</b><div class="tr-d">${m.length} kun · ${fmt(sum(m),'UZS')} (kuniga ${fmt(rateOf(n),'UZS')})</div></div></div>`}).join('')+
`<div class="grid" style="margin-top:12px">
<div><label>Kunlik haq (so'm)</label><input id="kRate" inputmode="numeric" value="${cfg().rate||''}"></div>
<div><label>&nbsp;</label><button class="btn" id="kRateB">Saqlash</button></div>
<div><label>Uy egasidan avans</label><input id="kAv" inputmode="decimal" placeholder="0"></div>
<div><label>Valyuta</label><select id="kCur"><option value="UZS">UZS — so'm</option><option value="KGS">KGS — som</option><option value="USD">USD — dollar</option></select></div>
<div class="full"><button class="btn" id="kAvB">Avans +</button></div></div>
<div class="tr-d" style="margin-top:10px">Jami olingan avans: <b>${avTxt()}</b> (${av.length} marta)</div>
<button class="btn" id="kFin" style="margin-top:10px">Yakuniy hisob</button>`;if(pv){$('kAv').value=pv.a;$('kCur').value=pv.c}}

function click(e){
const b=e.target.closest('button');if(!b)return;
if(b.dataset.k){
const n=b.dataset.k,d=today(),id=dayId(d,n),i=tx.findIndex(t=>t.id===id);
if(i>-1){tx.splice(i,1);save('hisob_delete',{p_id:id})}
else{if(!rateOf(n)){alert("Avval kunlik haqni kiriting va 'Saqlash' bosing");return}
const r={id,date:d,name:n,type:'Kun',currency:'UZS',amount:rateOf(n),desc:'Ish kuni'};tx.push(r);save('hisob_upsert',{p_row:r})}
}else if(b.id==='kRateB'){
const v=num($('kRate').value);if(!(v>0)){alert("Summani kiriting");return}
const c=cfg();c.rate=v;putCfg(c);save('hisob_upsert',{p_row:c});
}else if(b.id==='kAvB'){
const v=num($('kAv').value);if(!(v>0)){alert("Avans summasini kiriting");return}
const r={id:Date.now(),date:today(),name:names[0],type:'Avans',currency:$('kCur').value,amount:Math.round(v*100)/100,desc:'Uy egasidan avans'};
tx.push(r);save('hisob_upsert',{p_row:r});
}else if(b.id==='kFin'){
const pay=sum(tx.filter(t=>t.type==='Kun'));
alert("YAKUNIY HISOB\n\n"+names.map(n=>n+": "+days(n).length+" kun = "+fmt(sum(days(n)),'UZS')).join("\n")+
"\n\nXodimlar haqi jami: "+fmt(pay,'UZS')+"\nUy egasidan olingan avans: "+avTxt()+"\nFarq (so'mdagi avans − xodimlar haqi): "+fmt(sum(avans().filter(t=>t.currency==='UZS'))-pay,'UZS'))}
}

/* Yangi xodim: ism + kunlik haq */
const oT=$('tabs').onclick;
$('tabs').onclick=e=>{const t=e.target.closest('.tab');
if(t&&t.dataset.add){
const n=(prompt("Yangi xodim ismi:")||'').trim();if(!n||names.includes(n))return;
const r=num(prompt("Kunlik haqi (so'm):",cfg().rate||'')||'');
names.push(n);const c=cfg();c.rates={...(c.rates||{}),[n]:r>0?r:c.rate};putCfg(c);
save('hisob_set_names',{p_names:names});queue('hisob_upsert',{p_row:c});return}
oT(e)};

const oR=render;render=function(){oR();panel()};
render();
})();
