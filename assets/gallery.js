'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = {pipeline:'处理流程', architecture:'模型架构', framework:'系统框架', conceptual:'概念与机制', comparison:'方法对照'};
let DATA = {figures:[], history:[], guide:[], collections:[]};
let byId = new Map(), chosen = new Set(), filtered = [], viewer = [], zoomIndex = 0, shown = 36;
let favorites = new Set(), lastPayload = '', loading = false;
try { favorites = new Set(JSON.parse(localStorage.getItem('figures-favorites') || '[]')); } catch {}
const figureLabel = x => x.figure === '主图' ? '原文主图' : 'Fig. ' + x.figure;
const venueLabel = x => x.venue || 'ICML';
const imageURL = x => new URL(x.image, location.href).href;
function message(text='') { $('#status').textContent = text; }
function setOptions(id, items, first) {
  const old = $(id).value;
  $(id).innerHTML = first + items.map(([v,t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('');
  if ([...$(id).options].some(o => o.value === old)) $(id).value = old;
}
function updateNavigation() {
  $('#stats').innerHTML = `<div><b>${DATA.figures.length}</b><span>参考图例</span></div><div><b>${DATA.figures.filter(x=>x.featured).length}</b><span>精选参考</span></div><div><b>${DATA.collections.length}</b><span>共同选集</span></div>`;
  setOptions('#year', [...new Set(DATA.figures.map(x=>x.year))].sort((a,b)=>b-a).map(y=>[y,y]), '<option value="all">所有年份</option>');
  setOptions('#venue', [...new Set(DATA.figures.map(venueLabel))].sort().map(v=>[v,v]), '<option value="all">所有来源</option>');
  setOptions('#scope', DATA.collections.map(x=>['collection:'+x.id,'共同选集：'+x.title]), '<option value="featured">精选参考</option><option value="all">全部图集</option><option value="favorites">我的收藏</option><option value="selected">当前选择</option>');
  $('#years').innerHTML = DATA.history.slice().reverse().map(x => `<div class="yearcard"><strong>${x.year}</strong><p>${x.count?x.count.toLocaleString()+' 条正式论文目录':'ICML 历史档案'}</p><a href="${esc(x.url)}" target="_blank" rel="noopener">${x.count?'正式论文集':'历届入口'} ↗</a></div>`).join('');
  $('#coverage').textContent = DATA.coverage.replace(/<[^>]+>/g, '');
  $('#guide').innerHTML = DATA.guide.map(g => `<article><h2>${esc(g.title)}</h2><p>${esc(g.text)}</p><ol>${g.ids.map(id => {
    const x = byId.get(id);
    return x ? `<li><a href="${esc(x.paper || x.image)}" target="_blank" rel="noopener">${esc(x.short||x.title)} · ${x.year}</a><br><span>${esc(x.note||'')}</span><br><button data-zoom="${esc(x.id)}">查看原图</button></li>` : '';
  }).join('')}</ol></article>`).join('');
  $('#updated').textContent = ` 最近整理：${DATA.updated}。`;
}
function render(reset=true) {
  if (reset) shown = 36;
  const q = $('#search').value.trim().toLowerCase(), scope = $('#scope').value;
  const coll = DATA.collections.find(x => 'collection:'+x.id === scope);
  filtered = DATA.figures.filter(x => {
    const inScope = scope === 'all' || (scope === 'featured' && x.featured) || (scope === 'favorites' && favorites.has(x.id)) || (scope === 'selected' && chosen.has(x.id)) || (coll && coll.ids.includes(x.id));
    return inScope && ($('#year').value === 'all' || x.year === Number($('#year').value)) && ($('#venue').value === 'all' || venueLabel(x) === $('#venue').value) && ($('#pattern').value === 'all' || x.pattern === $('#pattern').value) && `${x.id} ${x.title} ${x.authors} ${x.note||''} ${x.year} ${(x.tags||[]).join(' ')}`.toLowerCase().includes(q);
  });
  filtered.sort((a,b) => $('#sort').value === 'newest' ? b.year-a.year : $('#sort').value === 'oldest' ? a.year-b.year : (a.rank??999)-(b.rank??999) || b.year-a.year || a.id.localeCompare(b.id));
  $('#resultCount').textContent = `${filtered.length} 张图例 · 点击原图放大 · 最多 4 张并排比较`;
  $('#cards').innerHTML = filtered.slice(0,shown).map(x => `<article class="card">
    <div class="visual" data-zoom="${esc(x.id)}" role="button" tabindex="0" aria-label="放大 ${esc(x.title)}"><img loading="lazy" src="${esc(x.image)}" alt="${esc(x.title)} — ${esc(figureLabel(x))}"></div>
    <div class="info"><div class="meta"><span>${esc(venueLabel(x))} ${x.year} · ${esc(figureLabel(x))} · ${labels[x.pattern]}</span><span class="badge">${x.featured?'精选 '+(x.rank<999?String(x.rank).padStart(2,'0'):''):''}</span></div>
    <h2>${esc(x.title)}</h2>${x.note?`<div class="note">${esc(x.note)}</div>`:''}
    <div class="links"><span class="filelinks">${x.paper?`<a href="${esc(x.paper)}" target="_blank" rel="noopener">来源</a>`:''}<a href="${esc(x.image)}" target="_blank" rel="noopener">原图</a><button data-share="${esc(x.id)}">分享</button></span>
    <div class="actions"><button data-fav="${esc(x.id)}" class="${favorites.has(x.id)?'on':''}">${favorites.has(x.id)?'已收藏':'收藏'}</button><button data-compare="${esc(x.id)}" class="${chosen.has(x.id)?'on':''}">${chosen.has(x.id)?'已选择':'比较'}</button></div></div></div></article>`).join('') || '<div class="empty">没有匹配图例，请调整筛选条件。</div>';
  $('#more').classList.toggle('hidden',shown >= filtered.length);
  $('#compareButton').textContent = `并排比较（${chosen.size}/4）`;
  ['compareButton','shareSelection','exportSelection','clearSelection'].forEach(id => $('#'+id).disabled = chosen.size === 0);
}
function openZoom(id) {
  if (!byId.has(id)) return;
  viewer = filtered.some(x=>x.id===id) ? filtered : DATA.figures;
  zoomIndex = viewer.findIndex(x=>x.id===id);
  paintZoom(); if (!$('#zoom').open) $('#zoom').showModal();
}
function paintZoom() {
  const x = viewer[zoomIndex];
  $('#zoomTitle').textContent = x.title;
  $('#zoomMeta').textContent = `${venueLabel(x)} ${x.year} · ${figureLabel(x)} · ${x.authors}`;
  $('#zoomLinks').innerHTML = `${x.paper?`<a href="${esc(x.paper)}" target="_blank" rel="noopener">论文 / 来源</a>`:''}<a href="${esc(x.image)}" target="_blank" rel="noopener">打开原图</a><a href="${esc(x.image)}" download>下载图片</a><button data-share="${esc(x.id)}">分享此图</button>`;
  $('#zoomImage').src = x.image; $('#zoomImage').alt = x.title;
  $('#zoomNote').textContent = x.note || ''; $('#zoomId').textContent = '图片编号：'+x.id;
}
function openCompare() {
  const list = [...chosen].map(id=>byId.get(id)).filter(Boolean);
  if (!list.length) return;
  $('#compareGrid').innerHTML = list.map(x => `<figure><img src="${esc(x.image)}" alt="${esc(x.title)}"><figcaption><strong>${esc(venueLabel(x))} ${x.year} · ${esc(x.short||x.title)}</strong><p>${esc(x.note||'')}</p><a href="${esc(x.image)}" target="_blank" rel="noopener">打开原图</a> · <button data-share="${esc(x.id)}">分享此图</button></figcaption></figure>`).join('');
  if (!$('#compare').open) $('#compare').showModal();
}
function shareURL(params) { const u = new URL(location.href); u.hash = new URLSearchParams(params).toString(); return u.href; }
function openShare(params) {
  $('#shareUrl').value = shareURL(params); $('#shareStatus').textContent = '';
  if (!$('#share').open) $('#share').showModal();
  $('#shareUrl').focus(); $('#shareUrl').select();
}
function applyRoute() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.has('figure')) openZoom(params.get('figure'));
  if (params.has('compare')) {
    chosen = new Set(params.get('compare').split(',').filter(id=>byId.has(id)).slice(0,4));
    $('#scope').value = 'selected'; render(); openCompare();
  }
  if (params.has('collection')) {
    const value = 'collection:'+params.get('collection');
    if ([...$('#scope').options].some(x=>x.value===value)) { $('#scope').value=value; render(); }
  }
}
async function load(refresh=false) {
  if (loading) return; loading = true;
  try {
    const [figures,config,collections] = await Promise.all(['figures','config','collections'].map(async name => {
      const response = await fetch('data/'+name+'.json', {cache:'no-store'});
      if (!response.ok) throw new Error(`读取 ${name} 失败 (${response.status})`);
      return response.json();
    }));
    const payload = JSON.stringify([figures,config,collections]);
    if (payload === lastPayload) return;
    lastPayload=payload; DATA={...config,figures,collections}; byId=new Map(figures.map(x=>[x.id,x]));
    chosen=new Set([...chosen].filter(id=>byId.has(id)));
    updateNavigation(); render(!refresh); $('#error').classList.add('hidden');
    if (refresh) {
      if ($('#zoom').open) { const id=viewer[zoomIndex]?.id; if (byId.has(id)) openZoom(id); else $('#zoom').close(); }
      if ($('#compare').open) { if (chosen.size) openCompare(); else $('#compare').close(); }
      message('图集已同步最新提交。');
    } else applyRoute();
  } catch (e) {
    if (!refresh) { $('#error').textContent='图集暂时未能加载。请刷新网页；本地预览请按 README 启动预览服务。'; $('#error').classList.remove('hidden'); }
  } finally { loading=false; }
}
document.addEventListener('click', e => {
  const z=e.target.closest('[data-zoom]'); if(z) openZoom(z.dataset.zoom);
  const share=e.target.closest('[data-share]'); if(share) openShare({figure:share.dataset.share});
  const f=e.target.closest('[data-fav]');
  if(f) { favorites.has(f.dataset.fav)?favorites.delete(f.dataset.fav):favorites.add(f.dataset.fav); try {localStorage.setItem('figures-favorites',JSON.stringify([...favorites]));}catch{} render(false); }
  const c=e.target.closest('[data-compare]');
  if(c) { if(chosen.has(c.dataset.compare)) chosen.delete(c.dataset.compare); else if(chosen.size<4) chosen.add(c.dataset.compare); else {message('已选择 4 张，请先取消一张。');return;} message();render(false); }
});
document.addEventListener('keydown', e => {
  if ((e.key==='Enter'||e.key===' ') && e.target.matches('.visual[data-zoom]')) {e.preventDefault();openZoom(e.target.dataset.zoom);}
  if ($('#zoom').open && !$('#share').open) {if(e.key==='ArrowLeft') $('#prev').click(); if(e.key==='ArrowRight') $('#next').click();}
});
['scope','year','venue','pattern','sort'].forEach(id=>$('#'+id).addEventListener('change',()=>render()));
$('#search').addEventListener('input',()=>render());
$('#more').onclick=()=>{shown+=36;render(false);};
$('#closeZoom').onclick=()=>$('#zoom').close();
$('#prev').onclick=()=>{zoomIndex=(zoomIndex-1+viewer.length)%viewer.length;paintZoom();};
$('#next').onclick=()=>{zoomIndex=(zoomIndex+1)%viewer.length;paintZoom();};
$('#compareButton').onclick=openCompare; $('#closeCompare').onclick=()=>$('#compare').close();
$('#shareSelection').onclick=()=>openShare({compare:[...chosen].join(',')});
$('#clearSelection').onclick=()=>{chosen.clear();render(false);};
$('#closeShare').onclick=()=>$('#share').close();
$('#copyShare').onclick=async()=>{try{await navigator.clipboard.writeText($('#shareUrl').value);$('#shareStatus').textContent='已复制。';}catch{$('#shareUrl').select();$('#shareStatus').textContent='请复制上方已选中的链接。';}};
$('#exportSelection').onclick=()=>{
  const selection=[...chosen].map(id=>({...byId.get(id),image_url:imageURL(byId.get(id)),preview_url:shareURL({figure:id})}));
  const blob=new Blob([JSON.stringify(selection,null,2)+'\n'],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='figures-selection.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));
  ['gallery','history','guide'].forEach(t=>$('#'+t+'Tab').classList.toggle('hidden',t!==b.dataset.tab));
});
window.addEventListener('hashchange',applyRoute);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load(true);});
load(); setInterval(()=>{if(!document.hidden)load(true);},60000);
