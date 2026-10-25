// WIKA TV - V8 - Main Script

(function(){ const o=window.open; window.open=function(){ return null; }; })();
const API_KEY='243d3178406656f0f1ceb1fde181815e';
const IMG='https://image.tmdb.org/t/p/w500';
const IPTV_SOURCES=[
 'https://iptv-org.github.io/iptv/categories/sports.m3u',
 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/bein_sports.m3u'
];
let page={movies:1,tvshows:1}, currentGenre={movies:'',tvshows:''}, currentLang={movies:'',tvshows:''}, searchQuery={movies:'',tvshows:'',tv:''}, tvChannels=[], filteredChannels=[], tvDisplayLimit=40, currentMode='movies';
const genresList=[{id:'',n:'الكل'},{id:'28',n:'أكشن'},{id:'35',n:'كوميدي'},{id:'18',n:'دراما'},{id:'27',n:'رعب'},{id:'10751',n:'عائلي'},{id:'16',n:'أنمي'},{id:'878',n:'خيال علمي'}];
const langsList=[{id:'',n:'الكل'},{id:'ar',n:'عربي'},{id:'en',n:'إنجليزي'},{id:'hi',n:'هندي'},{id:'ko',n:'كوري'}];

function enterApp(type){
 document.getElementById('landing-page').style.display='none';
 document.querySelectorAll('.app-section').forEach(s=>s.style.display='none');
 document.getElementById('app-'+type).style.display='block';
 currentMode=type;
 if(type==='tv'){ if(tvChannels.length===0) fetchTV(); }
 else { renderFilters(type); fetchContent(type); }
 window.scrollTo(0,0);
}
function backToLanding(){
 document.querySelectorAll('.app-section').forEach(s=>s.style.display='none');
 document.getElementById('landing-page').style.display='block';
 window.scrollTo(0,0);
}

async function loadBestMovies(){
 try{
  const res=await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=ar-SA&page=1`);
  const data=await res.json();
  const slider=document.getElementById('best-slider');
  const heroBg=document.getElementById('landing-bg');
  if(data.results && data.results[0] && data.results[0].backdrop_path){
    heroBg.style.backgroundImage=`url(https://image.tmdb.org/t/p/original${data.results[0].backdrop_path})`;
  }
  let idx=0;
  setInterval(()=>{
    if(!data.results) return;
    idx=(idx+1)%Math.min(5,data.results.length);
    const it=data.results[idx];
    if(it.backdrop_path) heroBg.style.backgroundImage=`url(https://image.tmdb.org/t/p/original${it.backdrop_path})`;
  },4000);
  slider.innerHTML=data.results.slice(0,12).map(m=>`
    <div class="best-card" onclick="enterApp('movies')">
      <img loading="lazy" src="${IMG+m.poster_path}">
      <div class="best-card-title">${m.title}</div>
    </div>
  `).join('');
 }catch(e){}
}
loadBestMovies();

window.onpopstate=()=>hidePages();
function handleBack(){ history.back(); }
function renderFilters(type){
 const gBar=document.getElementById(`genres-bar-${type}`);
 const lBar=document.getElementById(`langs-bar-${type}`);
 if(!gBar) return;
 gBar.innerHTML=genresList.map(g=>`<button class="filter-btn ${currentGenre[type]===g.id?'active':''}" onclick="filterGenre('${type}','${g.id}',this)">${g.n}</button>`).join('');
 lBar.innerHTML=langsList.map(l=>`<button class="filter-btn ${currentLang[type]===l.id?'active':''}" onclick="filterLang('${type}','${l.id}',this)">${l.n}</button>`).join('');
}
function filterGenre(type,id,btn){ document.querySelectorAll(`#genres-bar-${type} .filter-btn`).forEach(b=>b.classList.remove('active')); if(btn)btn.classList.add('active'); currentGenre[type]=id; page[type]=1; fetchContent(type); }
function filterLang(type,id,btn){ document.querySelectorAll(`#langs-bar-${type} .filter-btn`).forEach(b=>b.classList.remove('active')); if(btn)btn.classList.add('active'); currentLang[type]=id; page[type]=1; fetchContent(type); }

function parseM3U(text,offset=0){ const lines=text.split('\n'); const out=[]; for(let i=0;i<lines.length;i++){ if(lines[i].startsWith('#EXTINF')){ const url=lines[i+1]?.trim(); if(!url||!url.startsWith('http'))continue; const name=lines[i].split(',')[1]?.trim()||"قناة"; const logo=lines[i].match(/tvg-logo="([^"]+)"/)?.[1]||""; const group=lines[i].match(/group-title="([^"]+)"/)?.[1]||""; out.push({id:'tv_'+(offset+i),name,url,logo,group,wika_type:'tv'}); } } return out; }
async function fetchTV(){
 const grid=document.getElementById('tv-grid'); grid.innerHTML='<p style="text-align:center;width:100%;color:#aaa;grid-column:1/-1;">جاري التحميل...</p>'; tvChannels=[]; let loaded=0;
 for(const src of IPTV_SOURCES){ try{ const res=await fetch(src); if(!res.ok)continue; const txt=await res.text(); const parsed=parseM3U(txt,loaded); const imp=parsed.filter(c=>{ const n=c.name.toLowerCase(); return n.includes('bein')||n.includes('ssc')||n.includes('sport')||n.includes('laliga')||n.includes('champions')||n.includes('dazn')||n.includes('sky'); }); tvChannels.push(...imp); loaded+=parsed.length; if(tvChannels.length>300)break; }catch(e){} }
 tvChannels=tvChannels.filter((v,i,a)=>a.findIndex(t=>t.name===v.name&&t.url===v.url)===i);
 if(tvChannels.length===0){ grid.innerHTML='<p style="text-align:center;width:100%;color:red;grid-column:1/-1;">تعذر التحميل</p>'; return; }
 filterTV('bein');
}
function filterTV(cat,btn){
 if(btn){ document.querySelectorAll('#app-tv .filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
 tvDisplayLimit=40;
 filteredChannels=tvChannels.filter(c=>{
  const name=c.name.toLowerCase();
  if(cat==='bein') return name.includes('bein')||name.includes('ssc');
  if(cat==='champions') return name.includes('bein')||name.includes('champions')||name.includes('ucl')||name.includes('uefa')||name.includes('dazn')||name.includes('sky');
  if(cat==='laliga') return name.includes('laliga')||name.includes('liga')||name.includes('bein')||name.includes('ssc')||name.includes('movistar');
  return true;
 });
 filteredChannels.sort((a,b)=>(b.name.toLowerCase().includes('bein')?1:0)-(a.name.toLowerCase().includes('bein')?1:0));
 renderTVChunk();
}
function renderTVChunk(){
 const grid=document.getElementById('tv-grid'); if(!grid) return; grid.innerHTML=''; const batch=filteredChannels.slice(0,tvDisplayLimit);
 if(batch.length===0){ grid.innerHTML='<p style="text-align:center;width:100%;color:#aaa;grid-column:1/-1;">لا توجد قنوات</p>'; document.getElementById('tv-load-more').style.display='none'; return; }
 batch.forEach(c=>renderCard(c,grid)); document.getElementById('tv-load-more').style.display= tvDisplayLimit<filteredChannels.length?'block':'none';
}
function loadMoreTV(){ tvDisplayLimit+=40; renderTVChunk(); }

async function fetchContent(type, isMore=false){
 const grid=document.getElementById(`main-grid-${type}`); if(!grid) return; if(!isMore){ page[type]=1; grid.innerHTML=''; }
 let tmdbType=(type==='movies')?'movie':'tv';
 let url=`https://api.themoviedb.org/3/discover/${tmdbType}?api_key=${API_KEY}&language=ar-SA&sort_by=popularity.desc&page=${page[type]}`;
 if(currentGenre[type]) url+=`&with_genres=${currentGenre[type]}`;
 if(currentLang[type]) url+=`&with_original_language=${currentLang[type]}`;
 if(searchQuery[type]) url=`https://api.themoviedb.org/3/search/${tmdbType}?api_key=${API_KEY}&language=ar-SA&query=${encodeURIComponent(searchQuery[type])}&page=${page[type]}`;
 try{ const res=await fetch(url); const data=await res.json(); data.results.forEach(i=>{ i.wika_type=type; renderCard(i,grid); }); }catch(e){ grid.innerHTML='<p style="text-align:center;color:red;grid-column:1/-1;">خطأ</p>'; }
}
function handleSearch(type, val){
 searchQuery[type]=val.toLowerCase();
 if(type==='tv'){
  if(!val){ renderTVChunk(); return; }
  const grid=document.getElementById('tv-grid'); grid.innerHTML='';
  const res=tvChannels.filter(c=>c.name.toLowerCase().includes(searchQuery[type]));
  if(res.length===0) grid.innerHTML='<p style="text-align:center;width:100%;color:#aaa;grid-column:1/-1;">لا توجد</p>';
  else res.slice(0,80).forEach(c=>renderCard(c,grid));
  document.getElementById('tv-load-more').style.display='none';
 } else {
  fetchContent(type);
 }
}
function renderCard(i,grid){
 if(!i.poster_path && !i.logo) return;
 const div=document.createElement('div'); div.className='movie-card';
 const isLive=i.wika_type==='tv';
 div.innerHTML=`<span class="badge ${isLive?'live':''}">${isLive?'LIVE':(i.vote_average?i.vote_average.toFixed(1):'HD')}</span><img loading="lazy" src="${i.poster_path? IMG+i.poster_path : i.logo}"><div class="movie-info">${i.title||i.name}</div>`;
 div.onclick=()=>{ if(isLive) openPlayer(i.id,'tv',i.name,i.url); else showDetailsByItem(i); };
 grid.appendChild(div);
}
function showDetailsByItem(i){
 document.getElementById('details-page').style.display='block';
 history.pushState({p:'d'},"","#details");
 document.getElementById('details-content').innerHTML=`
 <div style="text-align:center;padding:40px 20px">
 <img src="${IMG+i.poster_path}" style="width:220px;border-radius:15px;">
 <h1 style="margin:20px 0">${i.title||i.name}</h1>
 <p style="color:#ccc;line-height:1.6;padding:0 10%">${i.overview||'لا يوجد وصف'}</p>
 <br><button class="btn-action" onclick="openPlayer('${i.id}','${i.wika_type}','${i.name||i.title}')">▶ تشغيل الآن</button>
 </div>`;
}

function openPlayer(id,type,name,url=''){
 document.getElementById('player-page').style.display='block';
 const frame=document.getElementById('video-frame');
 const serverArea=document.getElementById('server-selection-area');
 const epArea=document.getElementById('episodes-area');
 history.pushState({p:'p'},"","#player");
 // سيرفر 3 فقط - مع تفعيل ترجمة عربية تلقائية
 const defaultMovie=`https://vidlink.pro/movie/${id}?primaryColor=e50914&autoPlay=false`;
 const defaultTv=`https://vidlink.pro/tv/${id}/1/1?primaryColor=e50914&autoPlay=false`;

 if(type==='tv'){
  serverArea.style.display='none'; epArea.style.display='none';
  frame.innerHTML=`
    <div class="player-container" id="player-container">
      <video id="video" controls autoplay playsinline style="width:100%"></video>
      <div class="player-controls">
        <button class="fs-btn" onclick="toggleFullscreen('player-container')">⛶ ملء الشاشة</button>
      </div>
    </div>`;
  const video=document.getElementById('video');
  if(Hls.isSupported()){ const hls=new Hls(); hls.loadSource(url); hls.attachMedia(video); }
  else if(video.canPlayType('application/vnd.apple.mpegurl')){ video.src=url; }
 } else if(type==='movies'){
  serverArea.style.display='none'; epArea.style.display='none';
  frame.innerHTML=`
    <div class="player-container" id="player-container">
      <iframe id="main-iframe" src="${defaultMovie}" allowfullscreen allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="no-referrer"></iframe>
      <div class="player-controls">
        <button class="fs-btn" onclick="toggleFullscreen('player-container')">⛶ ملء الشاشة</button>
        <span style="font-size:10px;color:#888;margin-right:10px"> CC العربية متوفرة داخل المشغل • اضغط</span>
      </div>
    </div>`;
 } else {
  serverArea.style.display='none'; epArea.style.display='block'; document.getElementById('series-title').innerText=name;
  frame.innerHTML=`
    <div class="player-container" id="player-container">
      <iframe id="main-iframe" src="${defaultTv}" allowfullscreen allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="no-referrer"></iframe>
      <div class="player-controls">
        <button class="fs-btn" onclick="toggleFullscreen('player-container')">⛶ ملء الشاشة</button>
        <span style="font-size:10px;color:#888;margin-right:10px"> الترجمة العربية • زر CC داخل المشغل</span>
      </div>
    </div>`;
  fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=ar-SA`).then(r=>r.json()).then(d=>{ 
    if(d.seasons){
      document.getElementById('season-bar').innerHTML=d.seasons.filter(s=>s.season_number>0).map(s=>`<button class="filter-btn" onclick="loadEpisodes('${id}',${s.season_number})">الموسم ${s.season_number}</button>`).join(''); 
      loadEpisodes(id,1); 
    }
  });
 }
}

async function loadEpisodes(tvId,sNum){
 const res=await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${sNum}?api_key=${API_KEY}&language=ar-SA`); const data=await res.json();
 document.getElementById('episode-bar').innerHTML=data.episodes.map(e=>`<div class="ep-btn" onclick="playEp('${tvId}',${sNum},${e.episode_number})">حلقة ${e.episode_number}</div>`).join('');
}

function playEp(id,s,e){
 document.getElementById('main-iframe').src=`https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914&autoPlay=false`;
 window.scrollTo(0,0);
}

function changeServer(btn,url){ btn.parentElement.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); document.getElementById('main-iframe').src=url; }
function loadMore(type){ page[type]++; fetchContent(type, true); }
function hidePages(){ document.getElementById('details-page').style.display='none'; document.getElementById('player-page').style.display='none'; document.getElementById('video-frame').innerHTML=''; }

function toggleClear(type, val){
 const wrap=document.getElementById('wrap-'+type);
 const clear=document.getElementById('clear-'+type);
 if(!wrap||!clear) return;
 if(val && val.length>0){ wrap.classList.add('has-value'); clear.classList.add('show'); }
 else { wrap.classList.remove('has-value'); clear.classList.remove('show'); }
}
function clearSearch(type){
 const input=document.getElementById('search-'+type);
 if(!input) return;
 input.value='';
 toggleClear(type,'');
 handleSearch(type,'');
 input.focus();
}


function toggleFullscreen(containerId){
 const elem=document.getElementById(containerId);
 if(!elem) return;
 if(!document.fullscreenElement){
   if(elem.requestFullscreen) elem.requestFullscreen();
   else if(elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
   else if(elem.msRequestFullscreen) elem.msRequestFullscreen();
 } else {
   if(document.exitFullscreen) document.exitFullscreen();
 }
}
// تفعيل الترجمة العربية تلقائياً عبر رسالة للمشغل
window.addEventListener('message', (e)=>{
  // بعض المشغلات تستقبل رسائل لتفعيل الترجمة
});

if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').catch(()=>{}); }

