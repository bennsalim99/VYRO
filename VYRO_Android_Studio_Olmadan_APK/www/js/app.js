const $ = (id) => document.getElementById(id);
const DB_NAME = "vyro-local-v1";
const STORE = "videos";
const state = { name: localStorage.getItem("vyro_name") || "vyro_kullanıcısı", videos: [], series: [], camera: null, facing: "user", activeCommentId: null, filter: "all", feedMode: "for-you" };
const sampleVideos = [
  { id:"demo-1", caption:"VYRO'ya hoş geldin! İlk videonu paylaşarak akışı başlat. ✨", owner:"vyro", tag:"#VYRO", demo:true, hue:265, likes:12, comments:[] },
  { id:"demo-2", caption:"Keşfet'te yeni içerikleri bul, beğen ve yorum bırak.", owner:"vyro_trend", tag:"#keşfet", demo:true, hue:190, likes:8, comments:[] },
  { id:"demo-3", caption:"Kendi serini oluştur ve videolarını bölümlere ayır.", owner:"vyro_studio", tag:"#seriler", demo:true, hue:320, likes:5, comments:[] }
];
function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:"id"});};
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function dbAll(){
  try{const db=await openDB();return await new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});}
  catch(e){console.warn("IndexedDB unavailable",e);return [];}
}
async function dbPut(item){
  const db=await openDB();
  return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put(item);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});
}
async function dbClear(){
  const db=await openDB();
  return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).clear();tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});
}
const likes = new Set(JSON.parse(localStorage.getItem("vyro_likes")||"[]"));
const comments = JSON.parse(localStorage.getItem("vyro_comments")||"{}");
const follows = new Set(JSON.parse(localStorage.getItem("vyro_follows")||"[]"));
function persist(){localStorage.setItem("vyro_likes",JSON.stringify([...likes]));localStorage.setItem("vyro_comments",JSON.stringify(comments));localStorage.setItem("vyro_follows",JSON.stringify([...follows]));}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600);}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function allVideos(){return [...state.videos,...sampleVideos];}
function go(name){
  const target=$(name); if(!target)return;
  document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.id===name));
  document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.go===name));
  if(name==="feed")renderFeed(); if(name==="explore")renderExplore(); if(name==="profile")renderProfile(); if(name==="series")renderSeries();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
document.querySelectorAll("[data-feed]").forEach(b=>b.addEventListener("click",()=>{state.feedMode=b.dataset.feed;document.querySelectorAll("[data-feed]").forEach(x=>x.classList.toggle("selected",x===b));renderFeed();}));
function videoCard(v,compact=false){
  const liked=likes.has(v.id), c=(comments[v.id]||[]).length;
  const card=document.createElement("article");card.className=compact?"video-card compact":"video-post";
  let media;
  if(v.blob){media=document.createElement("video");media.src=URL.createObjectURL(v.blob);media.controls=true;media.playsInline=true;media.preload="metadata";}
  else {media=document.createElement("div");media.className="poster";media.style.setProperty("--hue",v.hue||260);media.innerHTML=`<span class="poster-mark">VYRO</span><span class="poster-caption">${escapeHTML(v.tag||"#VYRO")}</span>`;}
  const meta=document.createElement("div");meta.className="post-meta";
  const title=document.createElement("div");title.className="post-title";title.innerHTML=`<b>@${escapeHTML(v.owner||state.name)}</b><span>${escapeHTML(v.caption||"VYRO videosu")}</span>`;
  const actions=document.createElement("div");actions.className="post-actions";
  const like=document.createElement("button");like.className="action-btn"+(liked?" liked":"");like.innerHTML=`${liked?"♥":"♡"} <span>${Number(v.likes||0)+(liked?1:0)}</span>`;like.onclick=()=>toggleLike(v.id);
  const comment=document.createElement("button");comment.className="action-btn";comment.innerHTML=`▢ <span>${c} yorum</span>`;comment.onclick=()=>openComments(v.id);
  const follow=document.createElement("button");follow.className="action-btn";follow.textContent=follows.has(v.owner)?"Takiptesin":"+ Takip";follow.onclick=()=>toggleFollow(v.owner);
  const share=document.createElement("button");share.className="action-btn";share.textContent="Paylaş";share.onclick=()=>shareVideo(v);
  actions.append(like,comment,follow,share);meta.append(title,actions);card.append(media,meta);
  return card;
}
function renderFeed(){
  const root=$("feedList");root.replaceChildren();
  let items=allVideos();
  if(state.feedMode==="following")items=items.filter(v=>follows.has(v.owner));
  if(!items.length){root.innerHTML='<div class="empty"><div class="orb">V</div><h2>Henüz takip ettiğin içerik yok</h2><p>Keşfet bölümünden üreticileri takip edebilirsin.</p><button class="primary" id="goExplore">Keşfet</button></div>';$("goExplore").onclick=()=>go("explore");return;}
  items.forEach(v=>root.append(videoCard(v)));
}
function renderExplore(){
  const term=$("searchInput").value.trim().toLocaleLowerCase("tr");
  let items=allVideos().filter(v=>(v.caption+" "+v.owner+" "+(v.tag||"")).toLocaleLowerCase("tr").includes(term));
  if(state.filter==="popular")items.sort((a,b)=>(b.likes||0)-(a.likes||0));
  if(state.filter==="new")items=items.reverse();
  const root=$("exploreList");root.replaceChildren();
  if(!items.length){root.innerHTML='<p class="muted">Aramana uygun içerik bulunamadı.</p>';return;}
  items.forEach(v=>root.append(videoCard(v,true)));
}
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{state.filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));renderExplore();}));
$("searchInput").addEventListener("input",renderExplore);
function toggleLike(id){if(likes.has(id))likes.delete(id);else likes.add(id);persist();renderFeed();if($("explore").classList.contains("active"))renderExplore();renderProfile();}
function toggleFollow(owner){if(owner===state.name){toast("Kendini takip edemezsin.");return;}if(follows.has(owner)){follows.delete(owner);toast("@"+owner+" takipten çıkarıldı.");}else{follows.add(owner);toast("@"+owner+" takip edildi.");}persist();renderFeed();renderExplore();renderProfile();}
async function shareVideo(v){
 const text=`VYRO'da @${v.owner} tarafından paylaşıldı: ${v.caption||"Video"}`;
 try{if(navigator.share)await navigator.share({title:"VYRO",text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast("Paylaşım metni kopyalandı.");}else toast(text);}catch(e){if(e.name!=="AbortError")toast("Paylaşım açılamadı.");}
}
function openComments(id){state.activeCommentId=id;$("commentsModal").classList.add("show");renderComments();}
function renderComments(){
 const list=$("commentsList");list.replaceChildren();const arr=comments[state.activeCommentId]||[];
 if(!arr.length){list.innerHTML='<p class="muted">Henüz yorum yok. İlk yorumu sen yaz.</p>';return;}
 arr.forEach(c=>{const p=document.createElement("p");p.className="comment-item";p.innerHTML=`<b>@${escapeHTML(c.user)}</b> ${escapeHTML(c.text)}`;list.append(p);});
}
$("commentsClose").onclick=()=>$("commentsModal").classList.remove("show");
$("sendComment").onclick=()=>{const text=$("commentInput").value.trim();if(!text)return toast("Önce yorum yaz.");const id=state.activeCommentId;(comments[id]??=[]).push({user:state.name,text,at:Date.now()});persist();$("commentInput").value="";renderComments();renderFeed();if($("explore").classList.contains("active"))renderExplore();};
$("authOpen").onclick=()=>{$("username").value=state.name;$("authModal").classList.add("show");};
function closeAuth(){$("authModal").classList.remove("show");}
$("authClose").onclick=closeAuth;$("cancelAuth").onclick=closeAuth;
$("saveName").onclick=()=>{const name=$("username").value.trim().replace(/^@/,"");if(!/^[\p{L}\p{N}_.]{3,24}$/u.test(name)){ $("authStatus").textContent="3-24 karakter kullan: harf, sayı, _ veya .";return;}state.name=name;localStorage.setItem("vyro_name",name);closeAuth();renderProfile();renderFeed();toast("Profil adı bu cihaza kaydedildi.");};
$("editName").onclick=()=>$("authOpen").click();
function renderProfile(){
 $("profileName").textContent="@"+state.name;$("profileEmail").textContent="Yerel profil · yalnızca bu cihaz";
 $("avatarLetter").textContent=(state.name[0]||"V").toUpperCase();
 $("videoCount").textContent=state.videos.length;$("likeCount").textContent=likes.size;$("seriesCount").textContent=state.series.length;
 const root=$("myVideos");root.replaceChildren();const mine=state.videos;
 if(!mine.length){root.innerHTML='<p class="muted">Henüz video paylaşmadın.</p>';return;}
 mine.forEach(v=>root.append(videoCard(v,true)));
}
function renderSeries(){
 const root=$("seriesList");root.replaceChildren();
 if(!state.series.length){root.innerHTML='<div class="empty small">Henüz seri oluşturmadın. Yukarıdan ilk serini oluştur.</div>';return;}
 state.series.forEach((s,i)=>{const card=document.createElement("div");card.className="panel series-card";card.innerHTML=`<div><b>${escapeHTML(s.title)}</b><p class="muted">${escapeHTML(s.desc||"")}</p><small>${s.created}</small></div><button class="secondary" data-delete-series="${i}">Sil</button>`;root.append(card);});
 root.querySelectorAll("[data-delete-series]").forEach(b=>b.onclick=()=>{state.series.splice(Number(b.dataset.deleteSeries),1);localStorage.setItem("vyro_series",JSON.stringify(state.series));renderSeries();renderProfile();});
}
$("createSeries").onclick=()=>{const title=$("seriesTitle").value.trim();if(!title)return toast("Seri adı yaz.");state.series.unshift({title,desc:$("seriesDesc").value.trim(),created:new Date().toLocaleDateString("tr-TR")});localStorage.setItem("vyro_series",JSON.stringify(state.series));$("seriesTitle").value="";$("seriesDesc").value="";renderSeries();renderProfile();toast("Seri oluşturuldu.");};
let previewUrl=null;
$("videoFile").addEventListener("change",()=>{const file=$("videoFile").files?.[0];if(!file)return;if(!file.type.startsWith("video/")){toast("Lütfen video dosyası seç.");return;}if(file.size>150*1024*1024){toast("Video 150 MB sınırını aşıyor.");$("videoFile").value="";return;}if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);$("preview").src=previewUrl;$("preview").hidden=false;$("uploadStatus").textContent=`${file.name} seçildi · ${(file.size/1024/1024).toFixed(1)} MB`;});
$("publish").onclick=async()=>{
 const file=$("videoFile").files?.[0];if(!file)return toast("Önce galeriden video seç.");
 const id="local-"+crypto.randomUUID();const item={id,blob:file,caption:$("caption").value.trim(),tag:$("tags").value.trim()||"#VYRO",owner:state.name,created:Date.now(),likes:0};
 $("publish").disabled=true;$("uploadStatus").textContent="Video bu cihaza kaydediliyor…";
 try{await dbPut(item);state.videos.unshift(item);$("uploadStatus").textContent="Video bu cihazda paylaşıldı."; $("videoFile").value="";$("caption").value="";$("tags").value="";$("preview").hidden=true;go("feed");toast("Video yerel akışına eklendi.");}
 catch(e){console.error(e);$("uploadStatus").textContent="Cihaza kaydedilemedi. Depolama alanını kontrol et.";}
 finally{$("publish").disabled=false;}
};
async function startCamera(){
 if(!navigator.mediaDevices?.getUserMedia){$("liveStatus").textContent="Bu ortam kamera erişimini desteklemiyor. APK içinde tekrar dene veya HTTPS kullan.";return;}
 try{
  if(state.camera)state.camera.getTracks().forEach(t=>t.stop());
  state.camera=await navigator.mediaDevices.getUserMedia({video:{facingMode:state.facing},audio:true});
  $("livePreview").srcObject=state.camera;$("livePreview").play().catch(()=>{});
  $("liveStatus").textContent="Kamera ve mikrofon bu cihazda açık. Henüz internete yayın yapılmıyor.";
  $("startCamera").disabled=true;$("stopCamera").disabled=false;
 }catch(e){$("liveStatus").textContent=e.name==="NotAllowedError"?"Kamera/mikrofon izni verilmedi. Android uygulama izinlerinden aç.":`Kamera açılamadı: ${e.message}`;}
}
function stopCamera(){if(state.camera){state.camera.getTracks().forEach(t=>t.stop());state.camera=null;}$("livePreview").srcObject=null;$("liveStatus").textContent="Kamera kapatıldı.";$("startCamera").disabled=false;$("stopCamera").disabled=true;}
$("startCamera").onclick=startCamera;$("stopCamera").onclick=stopCamera;
$("switchCamera").onclick=async()=>{state.facing=state.facing==="user"?"environment":"user";if(state.camera)await startCamera();else toast(state.facing==="user"?"Ön kamera seçildi.":"Arka kamera seçildi.");};
$("clearLocal").onclick=async()=>{if(!confirm("Bu cihazdaki VYRO videoları, beğeniler, yorumlar ve seriler silinsin mi?"))return;await dbClear();state.videos=[];state.series=[];likes.clear();Object.keys(comments).forEach(k=>delete comments[k]);follows.clear();persist();localStorage.removeItem("vyro_series");renderFeed();renderProfile();renderSeries();toast("Yerel veriler temizlendi.");};
$("authModal").addEventListener("click",e=>{if(e.target===$("authModal"))closeAuth();});
$("commentsModal").addEventListener("click",e=>{if(e.target===$("commentsModal"))$("commentsModal").classList.remove("show");});
async function init(){
 state.videos=await dbAll();state.series=JSON.parse(localStorage.getItem("vyro_series")||"[]");
 // Replace stale object URLs by using IndexedDB blobs directly during rendering.
 $("sessionLabel").textContent="Yerel mod";
 renderFeed();renderExplore();renderProfile();renderSeries();
}
init();
window.addEventListener("beforeunload",stopCamera);
