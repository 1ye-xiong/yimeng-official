// ========== 遗梦 - 1:1中国地图 MMO开放世界 ==========
const cv=document.getElementById('c'),cx=cv.getContext('2d');
const mc=document.getElementById('mc'),mx=mc.getContext('2d');
let W,H,D;
function resize(){D=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*D;cv.height=H*D;cv.style.width=W+'px';cv.style.height=H+'px';cx.setTransform(D,0,0,D,0,0)}
addEventListener('resize',resize);resize();

// ========== API 后端连接配置 (§12) ==========
// 部署到真实域名时，API 自动指向同源（location.origin），无需手动配置；
// 本地 file:// 或 localhost 默认回退到 http://localhost:8080。
const API_BASE = (()=>{try{if(location.protocol.indexOf('http')===0)return location.origin;return localStorage.getItem('hx_api')||'http://localhost:8080'}catch(e){return'http://localhost:8080'}})();
// 注意：手机以 file:// 打开本地 HTML 时（尤其 iOS Safari）localStorage 会抛 SecurityError，
// 必须全部包 try/catch，否则整个脚本在加载阶段崩溃 → 表现就是"手机打不开"。
let apiToken='',apiAccountId='';
try{apiToken=localStorage.getItem('hx_token')||'';apiAccountId=localStorage.getItem('hx_aid')||''}catch(e){console.warn('localStorage 不可用，使用内存模式',e)}
function apiCall(method,path,body){
 return new Promise(async(resolve)=>{
  const headers={'Content-Type':'application/json'};
  if(apiToken)headers['Authorization']='Bearer '+apiToken;
  const opts={method,headers};if(body)opts.body=JSON.stringify(body);
  try{
   const res=await fetch(API_BASE+path,opts);
   const data=await res.json();
   if(!res.ok)throw new Error(data.error||data.message||'请求失败');
   resolve(data);
  }catch(e){console.warn('API:',method,path,e.message);resolve(null)}
 });
}
function apiGet(path){return apiCall('GET',path)}
function apiPost(path,body){return apiCall('POST',path,body)}
function apiSaveAuth(token,accountId){apiToken=token;apiAccountId=accountId;try{localStorage.setItem('hx_token',token);localStorage.setItem('hx_aid',accountId);const exp=jwtExp(token);if(exp)localStorage.setItem('hx_exp',String(exp*1000))}catch(e){}}
function apiClearAuth(){apiToken='';apiAccountId='';try{localStorage.removeItem('hx_token');localStorage.removeItem('hx_aid');localStorage.removeItem('hx_exp');localStorage.removeItem('hx_reg')}catch(e){}}
function apiOnline(){return !!apiToken}
// 解析 JWT payload（仅读取 exp，不校验签名；服务端仍会校验）
function parseJwt(token){try{const p=token.split('.')[1];const j=JSON.parse(decodeURIComponent(escape(atob(p.replace(/-/g,'+').replace(/_/g,'/')))));return j}catch(e){return null}}
// 返回 token 过期时间戳（秒）；无法解析时返回 null
function jwtExp(token){const p=parseJwt(token);return p&&p.exp?p.exp:null}
// 是否登录过期（15天期限，由服务端签发时决定 exp）
function jwtExpired(token){if(!token)return true;const exp=jwtExp(token);if(!exp)return true;return Date.now()>exp*1000}
// 记录注册标记（localStorage 持久化）
function markRegistered(){try{localStorage.setItem('hx_reg','1')}catch(e){}}

// ===== 输入 =====
const inp={jx:0,jy:0,sprint:false,jump:false};
let jid=null;const jA=document.getElementById('jA'),jB=document.getElementById('jB'),jTh=document.getElementById('jT');
jA.addEventListener('touchstart',e=>{e.preventDefault();jid=e.changedTouches[0].identifier;uj(e.changedTouches[0])},{passive:false});
jA.addEventListener('touchmove',e=>{e.preventDefault();for(let t of e.changedTouches)if(t.identifier===jid)uj(t)},{passive:false});
jA.addEventListener('touchend',e=>{for(let t of e.changedTouches)if(t.identifier===jid){jid=null;inp.jx=0;inp.jy=0;jTh.style.transform='translate(-50%,-50%)'}});
jA.addEventListener('touchcancel',()=>{jid=null;inp.jx=0;inp.jy=0;jTh.style.transform='translate(-50%,-50%)'});
function uj(t){const r=jB.getBoundingClientRect(),c2=r.left+r.width/2,cy2=r.top+r.height/2;let dx=t.clientX-c2,dy=t.clientY-cy2;const m=r.width/2-8,d=Math.hypot(dx,dy);if(d>m){dx=dx/d*m;dy=dy/d*m}inp.jx=dx/m;inp.jy=dy/m;jTh.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`}
const ks={};document.addEventListener('keydown',e=>ks[e.key]=true);document.addEventListener('keyup',e=>ks[e.key]=false);
document.addEventListener('keydown',e=>{if(e.key==='f'||e.key==='F')attack()});
function rk(){let kx=0,ky=0;if(ks.a||ks.ArrowLeft)kx--;if(ks.d||ks.ArrowRight)kx++;if(ks.w||ks.ArrowUp)ky--;if(ks.s||ks.ArrowDown)ky++;if(kx||ky){const l=Math.hypot(kx,ky);inp.jx=kx/l;inp.jy=ky/l}else if(jid===null){inp.jx=0;inp.jy=0}if(ks.Shift)inp.sprint=true;if(ks[' '])inp.jump=true}
document.getElementById('bS').addEventListener('touchstart',e=>{e.preventDefault();inp.sprint=true});
document.getElementById('bS').addEventListener('touchend',e=>{e.preventDefault();inp.sprint=false});
document.getElementById('bJ').addEventListener('touchstart',e=>{e.preventDefault();inp.jump=true;setTimeout(()=>inp.jump=false,100)});
document.getElementById('bI').addEventListener('touchstart',e=>{e.preventDefault();tryInteract()});
document.getElementById('bB').addEventListener('touchstart',e=>{e.preventDefault();togBag()});
document.getElementById('bF').addEventListener('touchstart',e=>{e.preventDefault();togFace()});
document.getElementById('bC').addEventListener('touchstart',e=>{e.preventDefault();togBag()});
document.getElementById('fC').addEventListener('touchstart',e=>{e.preventDefault();togFace()});
document.getElementById('bV').addEventListener('touchstart',e=>{e.preventDefault();tryVehicle()});
document.getElementById('bM').addEventListener('touchstart',e=>{e.preventDefault();openNearShop()});
document.getElementById('bC2').addEventListener('touchstart',e=>{e.preventDefault();openClass()});
document.getElementById('bCh').addEventListener('touchstart',e=>{e.preventDefault();togChat()});

// ===== 1:1 中国地图 =====
const T=25; // 每格25km
const MW=240,MH=200; // 240*25=6000km, 200*25=5000km
// 地图tile类型
const TT={OCEAN:0,DESERT:1,GRASS:2,FOREST:3,MOUNTAIN:4,PLATEAU:5,PLAIN:6,HILLS:7,LOESS:8,BASIN:9,SNOW:10,CITY:11};
const TC={
[TT.OCEAN]:['#1a5588','#1a5a8a','#185080'],
[TT.DESERT]:['#c4a44a','#c8a84e','#c0a046','#bca048'],
[TT.GRASS]:['#4a8a3a','#5a9a4a','#4d8d3d','#528f42'],
[TT.FOREST]:['#2a6a2a','#3a7a3a','#2d6d2d','#357535'],
[TT.MOUNTAIN]:['#6a6a5a','#7a7a6a','#6e6e5e','#747464'],
[TT.PLATEAU]:['#8a8a6a','#908e6e','#868666','#8c8c6c'],
[TT.PLAIN]:['#5a9a3a','#60a040','#55953a','#5d9d3d'],
[TT.HILLS]:['#4a8a3a','#508e40','#468636','#4c8c3c'],
[TT.LOESS]:['#9a8a4a','#a08e4e','#968646','#9c8c4c'],
[TT.BASIN]:['#5a8a4a','#608e50','#568646','#5c8c4c'],
[TT.SNOW]:['#dde8ee','#e0eaf0','#dae6ec','#dce8ee'],
[TT.CITY]:['#7a7a78','#808080','#767676','#7c7c7c']};

// 地图数据
const md=[],hm=[],provMap=[],deco=[];

// 判断点是否在多边形内 (ray casting)
function pointInPoly(px,py,poly){
let inside=false;
for(let i=0,j=poly.length-1;i<poly.length;j=i++){
const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))inside=!inside;
}return inside;}

// 生成1:1中国地图
function genMap(){
// 初始化全部为海洋
for(let y=0;y<MH;y++){md[y]=[];hm[y]=[];provMap[y]=[];
for(let x=0;x<MW;x++){md[y][x]=TT.OCEAN;hm[y][x]=0;provMap[y][x]=-1}}

// 预计算经纬度
const lons=new Float64Array(MW),lats=new Float64Array(MH);
for(let x=0;x<MW;x++)lons[x]=73.5+(x+0.5)/MW*(135-73.5);
for(let y=0;y<MH;y++)lats[y]=54-(y+0.5)/MH*(54-18);

// 1. 用省份数据填充陆地
for(let pi=0;pi<provinces.length;pi++){
const prov=provinces[pi],border=prov.border;
for(let y=0;y<MH;y++){const lat=lats[y];
for(let x=0;x<MW;x++){
if(!pointInPoly(lons[x],lat,border))continue;
provMap[y][x]=pi;
const lon=lons[x];
let tt=TT.GRASS;
for(const tr of terrains){
if(lon>=tr.lonRange[0]&&lon<=tr.lonRange[1]&&lat>=tr.latRange[0]&&lat<=tr.latRange[1]){
switch(tr.type){
case'desert':tt=TT.DESERT;break;case'plateau':tt=TT.PLATEAU;break;
case'plain':tt=TT.PLAIN;break;case'mountain':tt=TT.MOUNTAIN;break;
case'grassland':tt=TT.GRASS;break;case'loess':tt=TT.LOESS;break;
case'basin':tt=TT.BASIN;break;case'hills':tt=TT.HILLS;break;
default:tt=TT.GRASS;}break;}}
if(lat>35&&lon>95&&lon<103&&lat<38)tt=TT.PLATEAU;
if(lon>85&&lon<100&&lat>30&&lat<40){
const elev=Math.max(0,1-Math.abs(lon-95)/10)*Math.max(0,1-Math.abs(lat-35)/8);
if(elev>0.5)tt=TT.SNOW;else if(elev>0.3)tt=TT.MOUNTAIN;}
md[y][x]=tt;
hm[y][x]=tt===TT.MOUNTAIN?3+Math.floor(Math.random()*5):tt===TT.PLATEAU?2+Math.floor(Math.random()*3):tt===TT.SNOW?5+Math.floor(Math.random()*3):tt===TT.HILLS?1+Math.floor(Math.random()*2):0;
}}}

// 2. 国境线校验
for(let y=0;y<MH;y++){const lat=lats[y];
for(let x=0;x<MW;x++){
if(!pointInPoly(lons[x],lat,chinaBorder)){md[y][x]=TT.OCEAN;hm[y][x]=0;provMap[y][x]=-1}}}

// 3. 放置城市
for(const c of majorCities){
const[tx,ty]=geo2tile(c[0],c[1]);
const r=c[3]; // 城市半径
for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
const nx=tx+dx,ny=ty+dy;
if(nx>=0&&nx<MW&&ny>=0&&ny<MH&&md[ny][nx]!==TT.OCEAN){
if(dx*dx+dy*dy<=r*r)md[ny][nx]=TT.CITY;
}}}

// 4. 生成装饰物
deco.length=0;
for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
const t=md[y][x];
if(t===TT.FOREST&&Math.random()<0.15)deco.push({t:'tree',x:x*T+T/2,y:y*T+T/2,sz:.5+Math.random()*.5});
if(t===TT.GRASS&&Math.random()<0.03)deco.push({t:'tree',x:x*T+T/2,y:y*T+T/2,sz:.4+Math.random()*.4});
if(t===TT.MOUNTAIN&&Math.random()<0.05)deco.push({t:'rock',x:x*T+T/2,y:y*T+T/2,sz:.5+Math.random()*.5});
if(t===TT.DESERT&&Math.random()<0.01)deco.push({t:'cactus',x:x*T+T/2,y:y*T+T/2,sz:.4+Math.random()*.3});
if(t===TT.CITY&&Math.random()<0.08)deco.push({t:'building',x:x*T+T/2,y:y*T+T/2,sz:1+Math.random()*3,h:2+Math.floor(Math.random()*8)});
}}

// ===== 高德地图瓦片渲染系统 =====
const tileCache={};
const TILE_SZ=256;
const BZ=5; // 基础瓦片缩放级别
let useAmap=true; // 是否使用高德卫星图
let tileLoadCount=0;

// 切换地图模式
function toggleMap(){
useAmap=!useAmap;
const btn=document.getElementById('mtB');
btn.textContent=useAmap?'🛰️ 卫星':'🗺️ 地形';
toast(useAmap?'已切换至高德卫星图':'已切换至程序化地形');
}

// 经纬度 → Web墨卡托像素坐标 (在指定缩放级别下)
function lonLatToMercPx(lon,lat,z){
const s=Math.pow(2,z)*TILE_SZ;
return[(lon+180)/360*s,(1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*s];}

// 世界坐标 → 屏幕坐标 (通过高德瓦片)
function w2sMerc(wx,wy,tz){
const g=w2geo(wx,wy);
const[px,py]=lonLatToMercPx(g.lon,g.lat,tz);
const[cpx,cpy]=lonLatToMercPx(116.4,39.9,tz);
return{x:(px-cpx)*cam.z+W/2,y:(py-cpy)*cam.z+H/2};}

// 获取瓦片URL
function getTileUrl(x,y,z){
const s=(x+y)%4+1;
return`https://webst0${s}.is.autonavi.com/appmaptile?style=6&x=${x}&y=${y}&z=${z}`;}

// 加载瓦片
function loadTile(key,x,y,z){
if(tileCache[key])return tileCache[key];
const img=new Image();
img.onload=()=>{img._ok=true;tileLoadCount++};
img.onerror=()=>{img._ok=false};
img.src=getTileUrl(x,y,z);
tileCache[key]=img;return img;}

// 绘制高德地图瓦片底图
function drawAmapTiles(){
if(!useAmap)return;
const tz=Math.max(3,Math.min(18,Math.round(BZ+Math.log2(Math.max(.01,cam.z)))));
const hw=W/(2*cam.z),hh=H/(2*cam.z);
// 计算可见范围的世界坐标边界
const corners=[w2sMerc(P.x-hw,P.y-hh,tz),w2sMerc(P.x+hw,P.y-hh,tz),w2sMerc(P.x-hw,P.y+hh,tz),w2sMerc(P.x+hw,P.y+hh,tz)];
let mnx=Infinity,mny=Infinity,mxx=-Infinity,mxy=-Infinity;
for(const c of corners){mnx=Math.min(mnx,c.x);mny=Math.min(mny,c.y);mxx=Math.max(mxx,c.x);mxy=Math.max(mxy,c.y)}
const pad=TILE_SZ*2;
mnx-=pad;mny-=pad;mxx+=pad;mxy+=pad;
const t0x=Math.floor(mnx/TILE_SZ),t0y=Math.floor(mny/TILE_SZ);
const t1x=Math.ceil(mxx/TILE_SZ),t1y=Math.ceil(mxy/TILE_SZ);
const maxT=Math.pow(2,tz);
const cntX=t1x-t0x+1,cntY=t1y-t0y+1;
const maxDraw=400;
if(cntX*cntY>maxDraw)return; // 太多瓦片跳过
const[cpx,cpy]=lonLatToMercPx(116.4,39.9,tz);
const ox=W/2-cpx*cam.z,oy=H/2-cpy*cam.z;
for(let ty=t0y;ty<=t1y;ty++){
if(ty<0||ty>=maxT)continue;
for(let tx=t0x;tx<=t1x;tx++){
const wtx=((tx%maxT)+maxT)%maxT; // 处理经度环绕
if(tx<0||tx>=maxT)continue;
const key=tz+'/'+wtx+'/'+ty;
const img=loadTile(key,wtx,ty,tz);
const sx=ox+tx*TILE_SZ*cam.z,sy=oy+ty*TILE_SZ*cam.z;
const ssz=TILE_SZ*cam.z;
if(sx+ssz<0||sx>W||sy+ssz<0||sy>H)continue;
if(img._ok)cx.drawImage(img,sx,sy,ssz,ssz);
else{cx.fillStyle='#1a3a5a';cx.fillRect(sx,sy,ssz,ssz)}
}}}

// ===== 玩家 (出生在北京) =====
const[spawnX,spawnY]=geo2tile(116.4,39.9);
const P={x:spawnX*T+T/2,y:spawnY*T+T/2,z:0,vx:0,vy:0,vz:0,ang:0,spd:0,st:'idle',
hp:100,mhp:100,sp:100,msp:100,ws:2000,rs:4000,ss:7000, // km/h scaled
at:0,gnd:true,sprint:false,
skin:'#e8b88a',hair:'#2a1a0a',shirt:'#3366aa',pants:'#2a2a3a',
fp:{fw:.5,fl:.5,ja:.5,cb:.5,bh:.5,bd:.5,bt:.5,ed:.5,es:.5,ea:.5,eo:.5,ei:.5,nb:.6,nt:.5,nw:.5,nl:.5,mw:.5,lu:.5,ll:.5,ma:.5,mc:.5,esz:.5,eaa:.5},
name:'',gender:'m',hairStyle:'hair_002',body:{h:1.72,build:.5},
inv:[{n:'煎饼',i:'🥞',c:1},{n:'矿泉水',i:'💧',c:3}],cls:null,money:1000,gold:100,myVehicles:[],
wanted:0,stars:0,injury:0,jail:0,downed:0,dead:false,atkCd:0,lastCrime:0,lastHit:0};

// ===== NPC (分布在中国各大城市) =====
const npcDefs=[
{id:'wang',n:'王大爷',j:'煎饼摊主',em:'👴',ag:62,col:'#cc8844',per:'热情,健谈',gr:'哎呦，来套煎饼不？加两个鸡蛋再来点葱花！',fw:'慢走啊您嘞！下回再来！',pat:'idle',lon:116.4,lat:39.9,shop:'food'},
{id:'guard',n:'李保安',j:'小区保安',em:'💂',ag:35,col:'#3344aa',per:'严肃,负责',gr:'你好，请问找谁？有预约吗？',fw:'注意安全。',pat:'walk',lon:117.2,lat:39.1},
{id:'rider',n:'张骑手',j:'外卖骑手',em:'🏍️',ag:28,col:'#ffaa00',per:'匆忙,乐观',gr:'您好，您的外卖到了！给个五星好评呗！',fw:'我先走了，赶时间！',pat:'wander',lon:121.5,lat:31.2},
{id:'coder',n:'赵工',j:'程序员',em:'💻',ag:30,col:'#444466',per:'疲惫,聪明',gr:'又加班到这么晚...你也是程序员？',fw:'我先回去改Bug了。',pat:'idle',lon:113.3,lat:23.1},
{id:'clean',n:'刘阿姨',j:'清洁工',em:'🧹',ag:50,col:'#66aa66',per:'勤劳,慈祥',gr:'这地儿我天天扫，可干净了！',fw:'走了走了，还得扫下一条街。',pat:'wander',lon:104.1,lat:30.7},
{id:'monk',n:'扎西',j:'喇嘛',em:'🧘',ag:45,col:'#aa4444',per:'平和,智慧',gr:'扎西德勒！远道而来的朋友，要喝酥油茶吗？',fw:'愿佛祖保佑你。',pat:'idle',lon:91.1,lat:29.6},
{id:'herder',n:'巴特尔',j:'牧民',em:'🐎',ag:40,col:'#886644',per:'豪爽,热情',gr:'欢迎来到大草原！来一碗马奶酒？',fw:'一路顺风，草原永远欢迎你！',pat:'wander',lon:111.7,lat:40.8},
{id:'fisher',n:'老陈',j:'渔民',em:'🎣',ag:55,col:'#446688',per:'沉默,善良',gr:'今天鱼获不错，要来一条吗？',fw:'海上风大了，我得回去了。',pat:'idle',lon:121.5,lat:25},
];
const npcs=npcDefs.map(d=>{
const[tx,ty]=geo2tile(d.lon,d.lat);
return{...d,wx:tx*T+T/2,wy:ty*T+T/2,ang:Math.random()*6.28,at:Math.random()*10,st:'idle',pt:0,tx:tx*T+T/2,ty:ty*T+T/2,sx:tx*T+T/2,sy:ty*T+T/2};
});

// ===== 任务 =====
const quests=[
{id:'q1',n:'初到遗梦',d:'与王大爷交谈',tg:'wang',tp:'talk',done:false,pr:0,gl:1},
{id:'q2',n:'社区安全',d:'与李保安交谈',tg:'guard',tp:'talk',done:false,pr:0,gl:1},
{id:'q3',n:'走遍中国',d:'拜访4个城市的NPC',tg:null,tp:'visit',done:false,pr:0,gl:4},
];
let visNPCs=new Set();

// ========== 职业系统 ==========
const CLASSES=[
 {id:'free',n:'自由人',em:'🧑',d:'无固定职业，自由探索遗梦大地',money:0},
 {id:'driver',n:'司机',em:'🚕',d:'驾驶载具速度+30%，更省油',money:500},
 {id:'cop',n:'警察',em:'👮',d:'威严十足，可盘查可疑人员',money:800},
 {id:'merchant',n:'商人',em:'💼',d:'买卖更优惠，启动资金丰厚',money:3000},
 {id:'chef',n:'厨师',em:'👨‍🍳',d:'料理精通，自制美食回血快',money:600},
 {id:'farmer',n:'农民',em:'🌾',d:'亲近自然，采集资源加成',money:400},
];
let chosenClass=false,pendClass=null;
function openClass(){const p=document.getElementById('classP');p.classList.toggle('show');if(p.classList.contains('show'))buildClassUI()}
function buildClassUI(){let h='';for(const c of CLASSES){const sel=(pendClass||P.cls)===c.id?' sel':'';h+=`<div class="cls${sel}" onclick="selClass('${c.id}')"><div class="ce">${c.em}</div><div class="ci"><div class="cn">${c.n}</div><div class="cd">${c.d}</div><div class="cb">启动资金 +¥${c.money}</div></div></div>`}document.getElementById('classB').innerHTML=h}
function selClass(id){pendClass=id;buildClassUI()}
function confirmClass(){const cid=pendClass||P.cls;if(!cid){toast('请先选择一个职业');return}if(!chosenClass){const c=CLASSES.find(x=>x.id===cid);P.money+=c.money;chosenClass=true;toast(`已成为【${c.n}】，获得启动资金 ¥${c.money}`)}P.cls=cid;document.getElementById('classP').classList.remove('show');updateHud()}

// ========== 载具系统 ==========
const VEHICLES=[
 {id:'ebike',n:'电动车',em:'🛵',type:'land',spd:55},
 {id:'car',n:'轿车',em:'🚗',type:'land',spd:120},
 {id:'suv',n:'越野车',em:'🚙',type:'land',spd:110},
 {id:'truck',n:'卡车',em:'🚚',type:'land',spd:90},
 {id:'train',n:'高铁',em:'🚄',type:'land',spd:260},
 {id:'ship',n:'渔船',em:'⛵',type:'sea',spd:40},
 {id:'plane',n:'飞机',em:'✈️',type:'air',spd:320},
];
const vehicles=[];let inVeh=null;
function mkV(x,y,type,vid){const v=VEHICLES.find(z=>z.id===vid);return{...v,x,y,kind:type,vid,ang:Math.random()*6.28,at:Math.random()*10,st:'idle',occ:false,pt:0,tx:x,ty:y}}
function nearSea(x,y){const tx=Math.floor(x/T),ty=Math.floor(y/T);for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const nx=tx+dx,ny=ty+dy;if(nx>=0&&nx<MW&&ny>=0&&ny<MH&&md[ny][nx]===TT.OCEAN)return true}return false}
function genVehicles(){
 vehicles.length=0;
 for(const c of majorCities){
  const[tx,ty]=geo2tile(c[0],c[1]);const bx=tx*T+T/2,by=ty*T+T/2;const big=c[3]>=4;
  const pool=['car','ebike','suv'];if(big)pool.push('truck');const n=big?3:1;
  for(let i=0;i<n;i++)vehicles.push(mkV(bx+(Math.random()-.5)*c[3]*T*2,by+(Math.random()-.5)*c[3]*T*2,'land',pool[Math.floor(Math.random()*pool.length)]));
  if(big){vehicles.push(mkV(bx,by+c[3]*T,'air','plane'));vehicles.push(mkV(bx-c[3]*T,by,'land','train'))}
  if(nearSea(bx,by))vehicles.push(mkV(bx,by+T,'sea','ship'));
 }
}
function canDrive(v,nx,ny){const tx=Math.floor(nx/T),ty=Math.floor(ny/T);if(tx<0||tx>=MW||ty<0||ty>=MH)return false;const t=md[ty][tx];if(v.type==='air')return true;if(v.type==='sea')return t===TT.OCEAN;return t!==TT.OCEAN}
function tryVehicle(){
 if(inVeh){inVeh.occ=false;P.x=inVeh.x;P.y=inVeh.y;inVeh=null;toast('已下车');return}
 let best=null,bd=130;for(const v of vehicles){const d=Math.hypot(v.x-P.x,v.y-P.y);if(d<bd){bd=d;best=v}}
 if(!best){toast('附近没有载具，去城市里找车');return}
 inVeh=best;best.occ=true;toast('进入 '+best.n+(best.type==='sea'?'（海上模式）':best.type==='air'?'（飞行模式）':''));
}
function drawVehicle(v,isP){const s=w2s(v.x,v.y);if(s.x<-60||s.x>W+60||s.y<-80||s.y>H+80)return;const z=cam.z;cx.save();cx.translate(s.x,s.y);cx.fillStyle='rgba(0,0,0,.18)';cx.beginPath();cx.ellipse(0,2*z,12*z,5*z,0,0,6.28);cx.fill();const sz=(isP?26:20)*z;cx.font=sz+'px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(v.em,0,-6*z);if(isP){cx.font=(8*z)+'px sans-serif';cx.fillText('🧍',0,-22*z)}cx.restore()}

// ========== 现实商品商店 + 经济 ==========
const SHOPS=[
 {id:'food',n:'便民超市',lon:116.4,lat:39.9,r:6,items:[{n:'煎饼',i:'🥞',price:8},{n:'矿泉水',i:'💧',price:3},{n:'方便面',i:'🍜',price:6},{n:'包子',i:'🥟',price:5},{n:'烤鸭',i:'🦆',price:68},{n:'茶叶',i:'🍵',price:120}]},
 {id:'cloth',n:'服装店',lon:121.47,lat:31.23,r:6,items:[{n:'运动鞋',i:'👟',price:199},{n:'T恤',i:'👕',price:89},{n:'羽绒服',i:'🧥',price:499},{n:'帽子',i:'🧢',price:59}]},
 {id:'elec',n:'数码城',lon:114.06,lat:22.55,r:4,items:[{n:'手机',i:'📱',price:2999},{n:'笔记本',i:'💻',price:5999},{n:'相机',i:'📷',price:3999},{n:'耳机',i:'🎧',price:399}]},
 {id:'auto',n:'车行',lon:113.26,lat:23.13,r:4,items:[{n:'电动车',i:'🛵',price:2500},{n:'轿车',i:'🚗',price:88000},{n:'越野车',i:'🚙',price:220000}]},
];
let curShop=null,workCd=0;
const BASE_PRICE={};for(const s of SHOPS)for(const it of s.items)BASE_PRICE[it.n]=it.price;BASE_PRICE['煎饼']=8;BASE_PRICE['矿泉水']=3;
function priceMul(buy){return(P.cls==='merchant')?(buy?0.9:1.1):1}
function itemSellPrice(n){return Math.round((BASE_PRICE[n]||1)*0.6)}
function addInv(name,icon){const e=P.inv.find(x=>x.n===name);if(e)e.c++;else P.inv.push({n:name,i:icon,c:1})}
function openNearShop(){let best=null,bd=Infinity;for(const s of SHOPS){const[tx,ty]=geo2tile(s.lon,s.lat);const wx=tx*T+T/2,wy=ty*T+T/2;const d=Math.hypot(wx-P.x,wy-P.y);if(d<bd){bd=d;best=s}}if(best&&bd<best.r*T+250)openShop(best);else toast('附近没有商店，去城市里找（北京/上海/深圳/广州）')}
function openShopById(id,e){if(e)e.preventDefault();const s=SHOPS.find(x=>x.id===id);closeDlg(e);if(s)openShop(s)}
function openShop(s){curShop=s;document.getElementById('shopTitle').textContent='🛒 '+s.n;document.getElementById('shopP').classList.add('show');buildShopUI()}
function togShop(){document.getElementById('shopP').classList.toggle('show')}
function buildShopUI(){document.getElementById('shopMoney').textContent='¥'+P.money;document.getElementById('shopGold').textContent='🪙'+(P.gold||0);let h='';for(const it of curShop.items){const bp=Math.round(it.price*priceMul(true));h+=`<div class="srow"><div class="si">${it.i}</div><div class="sinfo"><div class="sn">${it.n}</div><div class="sp">¥${bp} 🪙${it.price||bp}</div></div><div class="sact"><button class="sbtn buy" onclick="buyItem('${it.n}')">金币买</button><button class="sbtn sell" onclick="sellItem('${it.n}')">¥卖</button></div></div>`}h+=`<div class="srow"><div class="si">💼</div><div class="sinfo"><div class="sn">打零工</div><div class="sp">赚零花钱（${P.cls==='merchant'?'¥120':'¥80'}）</div></div><div class="sact"><button class="sbtn work" onclick="doWork()">打工</button></div></div>`;document.getElementById('shopB').innerHTML=h}
async function buyItem(name){const it=curShop.items.find(x=>x.n===name);if(!it)return;const bp=it.price;
  // 尝试通过API购买（金币购买，1元=10金币）
  if(apiOnline()&&curShop.id){
   const res=await apiPost('/api/shop/buy',{shop_id:curShop.id,item_name:name,quantity:1});
   if(res&&res.result==='ok'){P.gold=res.gold||P.gold;addInv(name,it.i);toast(`✅ 购买 ${name} 花费 🪙${bp} (服务器)`);buildShopUI();rebuildBag();updateHud();return}
   if(res&&res.error==='INSUFFICIENT_GOLD'){const gp=Math.round(it.price*priceMul(true));if(P.money<gp){toast('金币不足，请充值！钱不够！');return}P.money-=gp;addInv(name,it.i);toast(`购买 ${name} -¥${gp}`);buildShopUI();rebuildBag();updateHud();return}
  }
  // 离线fallback：用¥
  const gp=Math.round(it.price*priceMul(true));if(P.money<gp){toast('钱不够！');return}P.money-=gp;addInv(name,it.i);toast(`购买 ${name} -¥${gp}`);buildShopUI();rebuildBag();updateHud()}
function buyItem(name){const it=curShop.items.find(x=>x.n===name);if(!it)return;const bp=Math.round(it.price*priceMul(true));if(P.money<bp){toast('钱不够！');return}P.money-=bp;addInv(name,it.i);toast(`购买 ${name} -¥${bp}`);buildShopUI();rebuildBag();updateHud()}
function sellItem(name){const idx=P.inv.findIndex(x=>x.n===name);if(idx<0){toast('背包没有 '+name);return}const sp=Math.round(itemSellPrice(name)*priceMul(false));P.money+=sp;P.inv.splice(idx,1);toast(`卖出 ${name} +¥${sp}`);buildShopUI();rebuildBag();updateHud()}
function doWork(){if(workCd>Date.now()){toast('刚打过工，歇会儿');return}const amt=P.cls==='merchant'?120:80;P.money+=amt;workCd=Date.now()+10000;toast(`打工赚得 ¥${amt}`);buildShopUI();updateHud()}

// ========== 聊天频道 ==========
const chats={near:[],world:[]};let curChat='near',chatTimer=4;
const CHAT_NAMES=['北京老王','魔都Lily','川渝小张','岭南阿强','塞北大汉','江南细雨','东北老铁','西域胡杨'];
const AMBIENT_NEAR=['今天天气真不错啊','听说前面堵车了','这家店挺实惠的','你也是来旅游的?','这地铁真方便','晚上去吃火锅不?','这风景绝了'];
const AMBIENT_WORLD=['有人在西藏吗？风景绝了','上海的房价又涨了...','我在海南晒太阳🌴','这游戏地图真大','北京的朋友举个手','成都有人组队吗','高铁真快，嗖一下就到了'];
const NPC_TOPICS=['这年头生意不好做啊','本地特产可好吃了','你从哪来呀？','最近治安不错','明天天气应该挺好','我在这儿住了大半辈子咯','年轻人要多走走看看'];
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function escapeHtml(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/"/g,'&quot;')}
function switchChat(ch){curChat=ch;document.getElementById('ctab_near').classList.toggle('on',ch==='near');document.getElementById('ctab_world').classList.toggle('on',ch==='world')}
function addChat(channel,name,text,cls){const arr=chats[channel];arr.push({name,text,cls:cls||'sys'});if(arr.length>60)arr.shift();const L=document.getElementById('chatL');if(!L)return;const d=document.createElement('div');d.className='cl';d.innerHTML=`<span class="cn ${cls||'sys'}">[${channel==='near'?'附近':'世界'}]${escapeHtml(name)}:</span> <span class="ct">${escapeHtml(text)}</span>`;L.appendChild(d);L.scrollTop=L.scrollHeight}
function chatSay(text,channel){channel=channel||curChat;addChat(channel,'我',text,channel==='world'?'world':'near')}
function chatSend(){const i=document.getElementById('chatI');const t=i.value.trim();if(!t)return;i.value='';chatSay(t)}
function togChat(){const p=document.getElementById('chatP');const show=!p.classList.contains('show');p.classList.toggle('show');if(show){const L=document.getElementById('chatL');L.innerHTML='';for(const ch of['near','world'])for(const m of chats[ch]){const d=document.createElement('div');d.className='cl';d.innerHTML=`<span class="cn ${m.cls}">[${ch==='near'?'附近':'世界'}]${escapeHtml(m.name)}:</span> <span class="ct">${escapeHtml(m.text)}</span>`;L.appendChild(d)}L.scrollTop=L.scrollHeight}}
function ambientChat(){let near=null,bd=500;for(const n of npcs){const d=Math.hypot(n.wx-P.x,n.wy-P.y);if(d<bd){bd=d;near=n}}if(near&&Math.random()<.5)addChat('near',near.n,pick(AMBIENT_NEAR),'near');if(Math.random()<.6)addChat('world',pick(CHAT_NAMES),pick(AMBIENT_WORLD),'world')}

// ========== NPC 智能对话 ==========
function npcGreeting(n){const hr=gameTime.getHours();const tod=hr<6?'凌晨':hr<11?'早上':hr<14?'中午':hr<18?'下午':'晚上';const prov=getProvince(P.x,P.y);const cls=P.cls?CLASSES.find(c=>c.id===P.cls).n:'路人';const lines=[`${tod}好啊！看你是${cls}吧？`,`欢迎来到${prov}，这儿可比别处热闹。`,`${tod}的${prov}不错吧？我是${n.j}。`,`你好呀，我是${n.n}，${n.per}。`];return lines[Math.floor(Math.random()*lines.length)]}
function npcReply(n){const cls=P.cls?CLASSES.find(c=>c.id===P.cls).n:'自由人';return pick(NPC_TOPICS)+`（你是${cls}吧？）`}
function npcChat(e){if(e)e.preventDefault();const n=dlgNPC;if(!n)return;const r=npcReply(n);document.getElementById('dT').textContent='"'+r+'"';toast(`${n.n}: ${r}`)}

// ========== HUD 更新 ==========
function updateHud(){document.getElementById('ecoT').textContent='💰 ¥'+P.money;document.getElementById('clT').textContent='职业: '+(P.cls?CLASSES.find(c=>c.id===P.cls).n:'自由人');const nm=document.getElementById('nmT');if(nm)nm.textContent=P.name?('🧍 '+P.name):'';
  // 显示金币
  const gl=document.getElementById('goldT');if(gl)gl.textContent='🪙'+(P.gold||0);
  // 更新商店面板金币
  const sg=document.getElementById('shopGold');if(sg)sg.textContent='🪙'+(P.gold||0);
}

// ========== 伤害 / PVP / 警察通缉 (§9) ==========
const polices=[];let policeCd=0;
const ATTACK_RANGE=90,CATCH_RANGE=28;
const CRIME={assault:30,injure:50,kill:150,assaultPolice:80,killPolice:300};
const WANT_TH=[0,20,80,200,500,1000]; // 通缉星级阈值
function isSafe(x,y){
  const tx=Math.floor(x/T),ty=Math.floor(y/T);
  if(tx<0||tx>=MW||ty<0||ty>=MH)return false;
  if(md[ty][tx]===TT.CITY){
    for(const c of majorCities){const[ctx,cty]=geo2tile(c[0],c[1]);const cxw=ctx*T+T/2,cyw=cty*T+T/2;if(Math.hypot(x-cxw,y-cyw)<c[3]*T*0.5)return true}
  }
  return false;
}
function computeStars(){let s=0;for(let i=1;i<WANT_TH.length;i++)if(P.wanted>=WANT_TH[i])s=i;return s}
function addWanted(v){P.wanted=Math.max(0,P.wanted+v);P.lastCrime=Date.now();P.stars=computeStars();if(P.wanted===0)P.stars=0}
function setHp(v){P.hp=Math.max(0,Math.min(P.mhp,v));P.lastHit=Date.now();if(P.hp<=0&&!P.downed&&!P.dead)goDown()}
function goDown(){P.downed=15;toast('你倒下了！等待救援或将被送医…')}
function nearestTarget(){let best=null,bd=ATTACK_RANGE;for(const n of npcs){if(n.downed)continue;const d=Math.hypot(n.wx-P.x,n.wy-P.y);if(d<bd){bd=d;best=n}}for(const p of polices){if(p.downed)continue;const d=Math.hypot(p.wx-P.x,p.wy-P.y);if(d<bd){bd=d;best=p}}return best}
function attack(){
  if(P.jail>0||P.downed>0||P.dead||P.atkCd>0)return;
  if(isSafe(P.x,P.y)){toast('安全区内禁止战斗');return}
  const t=nearestTarget();if(!t){toast('附近没有可攻击目标');return}
  P.atkCd=0.5;
  const crit=Math.random()<.12;const dmg=8*(crit?1.8:1)*(0.9+Math.random()*.2);
  t.hp=(t.hp||100)-dmg;
  const parts=['头部','胸部','手臂','腿部'];const part=parts[Math.floor(Math.random()*parts.length)];
  toast('你对'+t.n+'造成 '+(dmg|0)+' 伤害'+(crit?'（暴击!）':'')+' ['+part+']');
  P.injury=Math.min(3,P.injury+.5);
  if(t.isPolice){addWanted(CRIME.assaultPolice);t.hostile=true}
  else{addWanted(CRIME.assault);t.hostile=true}
  if(t.hp<=0){
    if(t.isPolice){addWanted(CRIME.killPolice);toast('你击倒了警察！通缉等级飙升');t.downed=20}
    else{addWanted(CRIME.kill);toast('你击倒了'+t.n);t.downed=30;t.hostile=false}
  }
}
function spawnPolice(){
  const ang=Math.random()*6.28,dist=420+Math.random()*320;
  const x=P.x+Math.cos(ang)*dist,y=P.y+Math.sin(ang)*dist;
  const tx=Math.floor(x/T),ty=Math.floor(y/T);if(tx<0||tx>=MW||ty<0||ty>=MH)return;
  polices.push({n:'警察',em:'👮',col:'#2233aa',isPolice:true,hp:120,mhp:120,wx:x,wy:y,ang:0,st:'run',at:0,hostile:true,downed:0,arrestT:0,loseT:0});
}
function updatePolice(dt){
  for(let i=polices.length-1;i>=0;i--){const p=polices[i];
    if(p.downed>0){p.downed-=dt;if(p.downed<=0){polices.splice(i,1);toast('警察已恢复')}continue}
    const d=Math.hypot(P.x-p.wx,P.y-p.wy);
    if(isSafe(P.x,P.y)&&d>CATCH_RANGE){p.loseT+=dt;if(p.loseT>6){polices.splice(i,1);continue}}else p.loseT=0;
    if(d>CATCH_RANGE){const dx=P.x-p.wx,dy=P.y-p.wy,l=Math.hypot(dx,dy);p.ang=Math.atan2(dx,-dy);p.wx+=dx/l*P.rs*1.05*dt;p.wy+=dy/l*P.rs*1.05*dt;p.st='run'}
    else{p.st='idle';p.arrestT+=dt;
      if(p.arrestT>2.5){const fine=P.stars*200+100;
        if(P.money>=fine){P.money-=fine;toast('被逮捕，缴纳罚款 ¥'+fine)}
        else{P.jail=20+P.stars*10;toast('无力缴纳罚款，入狱 '+(P.jail|0)+'s')}
        P.wanted=0;P.stars=0;polices.splice(i,1);continue;
      }
    }
  }
}
function nearestCity(){let best=majorCities[0],bd=Infinity;for(const c of majorCities){const[tx,ty]=geo2tile(c[0],c[1]);const d=Math.hypot(tx*T-P.x,ty*T-P.y);if(d<bd){bd=d;best=c}}return best}
function respawn(){const c=nearestCity();const[tx,ty]=geo2tile(c[0],c[1]);P.x=tx*T+T/2;P.y=ty*T+T/2;P.hp=P.mhp;P.downed=0;P.dead=false;P.wanted=Math.max(0,P.wanted-50);P.stars=computeStars();P.injury=0;const loss=Math.floor(P.money*.1);P.money-=loss;toast('已送医（'+c[2]+'），损失 ¥'+loss);cam.x=P.x;cam.y=P.y}
function updateCombat(dt){
  P.atkCd=Math.max(0,P.atkCd-dt);
  if(Date.now()-P.lastHit>5000&&P.hp<P.mhp)P.hp=Math.min(P.mhp,P.hp+2*dt);
  if(P.wanted>0&&Date.now()-P.lastCrime>30000){P.wanted=Math.max(0,P.wanted-6*dt);P.stars=P.wanted>0?computeStars():0}
  if(P.downed>0){P.downed-=dt;if(P.downed<=0)respawn()}
  if(P.jail>0){P.jail-=dt;if(P.jail<=0){P.jail=0;toast('刑满释放')}}
  if(Date.now()-P.lastHit>8000&&P.injury>0)P.injury=Math.max(0,P.injury-0.1*dt);
  for(const n of npcs){if(n.downed>0){n.downed-=dt;if(n.downed<=0){n.downed=0;n.hostile=false}continue}if(n.hostile&&Math.hypot(n.wx-P.x,n.wy-P.y)<ATTACK_RANGE){n.cd=(n.cd||0)-dt;if(n.cd<=0){n.cd=1.4;setHp(P.hp-6);P.injury=Math.min(3,P.injury+.3);toast(n.n+'反击，你受到 6 伤害')}}}
  if(P.stars>=1&&!isSafe(P.x,P.y)){policeCd-=dt;if(policeCd<=0&&polices.length<4){spawnPolice();policeCd=4}}else policeCd=0;
  updatePolice(dt);
}

// ===== 相机 =====
const cam={x:P.x,y:P.y,z:1,tz:1};
function w2s(wx,wy){return{x:(wx-cam.x)*cam.z+W/2,y:(wy-cam.y)*cam.z+H/2}}
// 世界坐标→经纬度
function w2geo(wx,wy){
const lon=73.5+(wx/T)/MW*(135-73.5);
const lat=54-(wy/T)/MH*(54-18);
return{lon,lat};}
// 所在省份
function getProvince(wx,wy){
const tx=Math.floor(wx/T),ty=Math.floor(wy/T);
if(tx>=0&&tx<MW&&ty>=0&&ty<MH&&provMap[ty]&&provMap[ty][tx]>=0)return provinces[provMap[ty][tx]].name;
return'公海';}

// ===== 渲染 =====
function drawTile(x,y,type,sx,sy,sz){
const cs=TC[type]||TC[TT.OCEAN];
cx.fillStyle=cs[((x*7+y*13)&0xff)%cs.length];
cx.fillRect(sx,sy,sz+.5,sz+.5);
// 特殊效果
if(type===TT.OCEAN){const wv=Math.sin(Date.now()/1200+x*.3+y*.2)*.06;cx.fillStyle=`rgba(80,160,255,${.08+wv})`;cx.fillRect(sx,sy,sz+.5,sz+.5)}
if(type===TT.CITY&&cam.z>.3){cx.fillStyle='rgba(255,240,150,.2)';const ws=2*cam.z;
for(let i=0;i<3;i++){const ox=((x*31+y*17+i*7)%7)*sz/8,oy=((x*13+y*23+i*11)%7)*sz/8;cx.fillRect(sx+ox,sy+oy,ws,ws)}}
if(type===TT.DESERT){cx.fillStyle='rgba(200,180,100,.08)';const d=Math.sin(Date.now()/2000+x*.5)*.04;cx.fillRect(sx,sy,sz+.5,sz+.5)}
if(type===TT.SNOW&&cam.z>.4){cx.fillStyle='rgba(255,255,255,.15)';cx.fillRect(sx,sy,sz+.5,sz+.5)}
if(type===TT.MOUNTAIN&&cam.z>.5){cx.fillStyle='rgba(0,0,0,.1)';cx.fillRect(sx+sz*.7,sy,sz*.3,sz)}
}

function drawDeco(d){const s=w2s(d.x,d.y);if(s.x<-50||s.x>W+50||s.y<-80||s.y>H+50)return;const z=cam.z;
if(d.t==='tree'){const sz=(d.sz||1)*z;
cx.fillStyle='rgba(0,0,0,.08)';cx.beginPath();cx.ellipse(s.x+2*z,s.y+3*z,8*z*sz,3*z*sz,0,0,6.28);cx.fill();
cx.fillStyle='#5a3a1a';cx.fillRect(s.x-z,s.y-3*z,2*z,8*z);
cx.fillStyle='#2a6a2a';cx.beginPath();cx.ellipse(s.x,s.y-10*z*sz,10*z*sz,12*z*sz,0,0,6.28);cx.fill();
cx.fillStyle='#3a8a3a';cx.beginPath();cx.ellipse(s.x-2*z,s.y-13*z*sz,7*z*sz,9*z*sz,0,0,6.28);cx.fill()}
else if(d.t==='rock'){const sz=(d.sz||1)*z;
cx.fillStyle='#6a6a6a';cx.beginPath();cx.ellipse(s.x,s.y-3*z*sz,8*z*sz,6*z*sz,0,0,6.28);cx.fill();
cx.fillStyle='#7a7a7a';cx.beginPath();cx.ellipse(s.x-2*z,s.y-5*z*sz,5*z*sz,4*z*sz,.3,0,6.28);cx.fill()}
else if(d.t==='cactus'){const sz=(d.sz||1)*z;
cx.fillStyle='#4a8a3a';cx.fillRect(s.x-z,s.y-12*z*sz,2*z,12*z*sz);
cx.fillRect(s.x-5*z,s.y-8*z*sz,4*z,2*z);cx.fillRect(s.x-5*z,s.y-10*z*sz,2*z,4*z);
cx.fillRect(s.x+z,s.y-6*z*sz,4*z,2*z);cx.fillRect(s.x+3*z,s.y-8*z*sz,2*z,4*z)}
else if(d.t==='building'){const sz=d.sz||1,h=(d.h||3)*z;
cx.fillStyle=`rgb(${90+((d.x*7+d.y*3)%40)},${90+((d.x*3+d.y*7)%40)},${95+((d.x*5+d.y*2)%40)})`;
cx.fillRect(s.x-sz*3*z,s.y-h,sz*6*z,h+2*z);
cx.fillStyle='rgba(0,0,0,.15)';cx.fillRect(s.x+sz*3*z-2*z,s.y-h,2*z,h+2*z);
if(cam.z>.3){cx.fillStyle='rgba(255,240,150,.3)';const ws=2*z;
for(let wy=0;wy<Math.min(d.h,6);wy++)for(let wx=0;wx<2;wx++){if(((d.x+d.y+wx+wy)*13)%4>0)cx.fillRect(s.x-sz*2*z+wx*(ws+3*z),s.y-h+2*z+wy*(ws+2*z),ws,ws)}}}
}

function drawRiver(r){
cx.strokeStyle=r.color;cx.lineWidth=r.width*cam.z;cx.lineCap='round';cx.lineJoin='round';
cx.beginPath();
for(let i=0;i<r.path.length;i++){
const[tx,ty]=geo2tile(r.path[i][0],r.path[i][1]);
const s=w2s(tx*T+T/2,ty*T+T/2);
if(i===0)cx.moveTo(s.x,s.y);else cx.lineTo(s.x,s.y);}
cx.stroke();
// 河流光效
cx.strokeStyle='rgba(255,255,255,.1)';cx.lineWidth=r.width*cam.z*.3;
cx.stroke();
}

function drawLake(lk){
const[tx,ty]=geo2tile(lk.lon,lk.lat);
const s=w2s(tx*T+T/2,ty*T+T/2);
const r=lk.r*T*cam.z;
cx.fillStyle=lk.color;cx.beginPath();cx.ellipse(s.x,s.y,r*1.3,r,0,0,6.28);cx.fill();
cx.fillStyle='rgba(255,255,255,.08)';cx.beginPath();cx.ellipse(s.x-r*.2,s.y-r*.2,r*.5,r*.3,0,0,6.28);cx.fill();
// 湖名
if(cam.z>.5){cx.fillStyle='rgba(255,255,255,.6)';cx.font=`${9*cam.z}px sans-serif`;cx.textAlign='center';cx.fillText(lk.name,s.x,s.y+r+10*cam.z)}
}

function drawProvinceBorder(){
if(cam.z<.15)return; // 太远了不画省界
cx.strokeStyle='rgba(255,255,255,.12)';cx.lineWidth=1;
for(const prov of provinces){
cx.beginPath();
for(let i=0;i<prov.border.length;i++){
const[tx,ty]=geo2tile(prov.border[i][0],prov.border[i][1]);
const s=w2s(tx*T,ty*T);
if(i===0)cx.moveTo(s.x,s.y);else cx.lineTo(s.x,s.y);}
cx.closePath();cx.stroke();
// 省名
if(cam.z>.25){
const center=prov.border[0];let cx2=0,cy2=0;
for(const b of prov.border){cx2+=b[0];cy2+=b[1]}
cx2/=prov.border.length;cy2/=prov.border.length;
const[tx2,ty2]=geo2tile(cx2,cy2);
const sp=w2s(tx2*T,ty2*T);
cx.fillStyle='rgba(255,255,255,.25)';cx.font=`${Math.max(8,10*cam.z)}px sans-serif`;cx.textAlign='center';
cx.fillText(prov.name,sp.x,sp.y);
}}}

function drawCityLabels(){
for(const c of majorCities){
const[tx,ty]=geo2tile(c[0],c[1]);
const s=w2s(tx*T+T/2,ty*T+T/2);
if(s.x<-100||s.x>W+100||s.y<-100||s.y>H+100)continue;
const sz=c[3];
// 城市标记
const r=(sz*2+3)*cam.z;
cx.fillStyle=sz>=4?'rgba(255,100,50,.6)':'rgba(255,200,100,.4)';
cx.beginPath();cx.arc(s.x,s.y,r,0,6.28);cx.fill();
cx.fillStyle=sz>=4?'#ff6644':'#ffcc66';
cx.beginPath();cx.arc(s.x,s.y,r*.5,0,6.28);cx.fill();
// 城市名
if(cam.z>.2||(sz>=4&&cam.z>.1)){
cx.fillStyle='#fff';cx.font=`bold ${Math.max(8,(sz+8)*cam.z)}px sans-serif`;cx.textAlign='center';
cx.fillText(c[2],s.x,s.y-r-3*cam.z);
}}}

function drawChar(e,isP){
const s=w2s(e.x||e.wx,e.y||e.wy);if(s.x<-60||s.x>W+60||s.y<-80||s.y>H+80)return;
const z=cam.z,t=e.at||0,st=e.st||'idle';
cx.save();cx.translate(s.x,s.y);
cx.fillStyle='rgba(0,0,0,.15)';cx.beginPath();cx.ellipse(0,2*z,10*z,4*z,0,0,6.28);cx.fill();
let ls=0,as=0,bb=0,bl=0;
if(st==='walk'){ls=Math.sin(t*8)*20;as=Math.sin(t*8+3.14)*15;bb=Math.abs(Math.sin(t*8))*2}
else if(st==='run'){ls=Math.sin(t*12)*35;as=Math.sin(t*12+3.14)*30;bb=Math.abs(Math.sin(t*12))*4;bl=5}
else if(st==='sprint'){ls=Math.sin(t*16)*45;as=Math.sin(t*16+3.14)*40;bb=Math.abs(Math.sin(t*16))*5;bl=10}
else if(st==='idle'){bb=Math.sin(t*2)*1;as=Math.sin(t*1.5)*2}
else if(st==='jump'){ls=15;as=-25}
const sc=isP?z:z*.85,skin=isP?P.skin:(e.col||'#d4a574'),shirt=isP?P.shirt:(e.col||'#5566aa'),pants=isP?P.pants:'#3a3a4a',hair=isP?P.hair:'#2a1a0a';
// 腿
cx.save();cx.translate(-4*sc,-2*sc);cx.rotate(ls*.0175);cx.fillStyle=pants;cx.fillRect(-2.5*sc,0,5*sc,15*sc);cx.fillStyle='#222';cx.fillRect(-3*sc,13*sc,6*sc,3*sc);cx.restore();
cx.save();cx.translate(4*sc,-2*sc);cx.rotate(-ls*.0175);cx.fillStyle=pants;cx.fillRect(-2.5*sc,0,5*sc,15*sc);cx.fillStyle='#222';cx.fillRect(-3*sc,13*sc,6*sc,3*sc);cx.restore();
cx.save();cx.translate(0,-bb*sc);cx.rotate(bl*.0175);
cx.fillStyle=shirt;cx.beginPath();cx.moveTo(-5*sc,-28*sc);cx.lineTo(5*sc,-28*sc);cx.quadraticCurveTo(8*sc,-28*sc,8*sc,-25*sc);cx.lineTo(8*sc,-2*sc);cx.quadraticCurveTo(8*sc,0,5*sc,0);cx.lineTo(-5*sc,0);cx.quadraticCurveTo(-8*sc,0,-8*sc,-2*sc);cx.lineTo(-8*sc,-25*sc);cx.quadraticCurveTo(-8*sc,-28*sc,-5*sc,-28*sc);cx.fill();
cx.save();cx.translate(-9*sc,-26*sc);cx.rotate(as*.0175);cx.fillStyle=shirt;cx.fillRect(-2.5*sc,0,5*sc,13*sc);cx.fillStyle=skin;cx.fillRect(-2*sc,11*sc,4*sc,5*sc);cx.restore();
cx.save();cx.translate(9*sc,-26*sc);cx.rotate(-as*.0175);cx.fillStyle=shirt;cx.fillRect(-2.5*sc,0,5*sc,13*sc);cx.fillStyle=skin;cx.fillRect(-2*sc,11*sc,4*sc,5*sc);cx.restore();
const hy=-34*sc,hr=8*sc;
cx.fillStyle=skin;cx.fillRect(-2.5*sc,-30*sc,5*sc,4*sc);
cx.fillStyle=skin;cx.beginPath();cx.ellipse(0,hy,hr*(isP?.9+P.fp.fw*.3:1),hr*(isP?.95+P.fp.fl*.15:1.05),0,0,6.28);cx.fill();
cx.fillStyle=hair;cx.beginPath();cx.ellipse(0,hy-2*sc,hr*1.04,hr*.7,0,3.14,6.28);cx.fill();
if(!isP&&e.em){cx.font=`${12*sc}px sans-serif`;cx.textAlign='center';cx.fillText(e.em,0,hy+4*sc)}
else if(isP){const es=(.7+P.fp.es*.6)*sc,ed=(2+P.fp.ed*3)*sc;
cx.fillStyle='#fff';cx.beginPath();cx.ellipse(-ed,hy-sc,es*1.2,es*.8,0,0,6.28);cx.ellipse(ed,hy-sc,es*1.2,es*.8,0,0,6.28);cx.fill();
cx.fillStyle='#1a1a2a';cx.beginPath();cx.arc(-ed,hy-sc,es*.5,0,6.28);cx.arc(ed,hy-sc,es*.5,0,6.28);cx.fill();
cx.fillStyle='rgba(0,0,0,.1)';cx.beginPath();cx.ellipse(0,hy+2*sc,1.5*sc,sc,0,0,6.28);cx.fill();
cx.strokeStyle='rgba(180,80,60,.5)';cx.lineWidth=1.2*sc;cx.beginPath();cx.arc(0,hy+4*sc,2.5*sc,.1,3.04);cx.stroke()}
if(!isP&&e.n){cx.fillStyle='rgba(0,0,0,.5)';cx.beginPath();cx.rect(-28*sc,hy-18*sc,56*sc,12*sc);cx.fill();
cx.fillStyle='#fff';cx.font=`${8*sc}px sans-serif`;cx.textAlign='center';cx.fillText(e.n,0,hy-9*sc)}
cx.restore();cx.restore()}

// ===== 小地图 =====
function drawMM(){
const cw=mc.width,ch=mc.height;
mx.fillStyle='#1a3a5a';mx.fillRect(0,0,cw,ch);
const scX=cw/MW,scY=ch/MH;
// 简化渲染
for(let y=0;y<MH;y+=3)for(let x=0;x<MW;x+=3){
const t=md[y][x],cs=TC[t];mx.fillStyle=cs?cs[0]:'#333';
mx.fillRect(x*scX,y*scY,scX*3+1,scY*3+1)}
// 河流
for(const r of rivers){mx.strokeStyle=r.color;mx.lineWidth=1;mx.beginPath();
for(let i=0;i<r.path.length;i++){const[tx,ty]=geo2tile(r.path[i][0],r.path[i][1]);
if(i===0)mx.moveTo(tx*scX,ty*scY);else mx.lineTo(tx*scX,ty*scY)}mx.stroke()}
// 省界
mx.strokeStyle='rgba(255,255,255,.15)';mx.lineWidth=.5;
for(const prov of provinces){mx.beginPath();
for(let i=0;i<prov.border.length;i++){const[tx,ty]=geo2tile(prov.border[i][0],prov.border[i][1]);
if(i===0)mx.moveTo(tx*scX,ty*scY);else mx.lineTo(tx*scX,ty*scY)}mx.closePath();mx.stroke()}
// 城市
for(const c of majorCities){const[tx,ty]=geo2tile(c[0],c[1]);
mx.fillStyle=c[3]>=4?'#ff4444':'#ffaa44';mx.beginPath();mx.arc(tx*scX,ty*scY,c[3]*.6,0,6.28);mx.fill()}
// 国境线
mx.strokeStyle='rgba(255,80,80,.4)';mx.lineWidth=1;mx.beginPath();
for(let i=0;i<chinaBorder.length;i++){const[tx,ty]=geo2tile(chinaBorder[i][0],chinaBorder[i][1]);
if(i===0)mx.moveTo(tx*scX,ty*scY);else mx.lineTo(tx*scX,ty*scY)}mx.closePath();mx.stroke();
// 玩家
mx.fillStyle='#00ff88';mx.beginPath();mx.arc(P.x/T*scX,P.y/T*scY,3,0,6.28);mx.fill();
mx.strokeStyle='#fff';mx.lineWidth=1;mx.stroke();
// 载具
for(const v of vehicles){const tx=Math.floor(v.x/T),ty=Math.floor(v.y/T);mx.fillStyle=v.type==='sea'?'#4cf':v.type==='air'?'#f4f':'#ffcc44';mx.fillRect(tx*scX-1.5,ty*scY-1.5,3,3)}
// 警察
for(const p of polices){const tx=Math.floor(p.wx/T),ty=Math.floor(p.wy/T);mx.fillStyle='#2244ff';mx.fillRect(tx*scX-1.5,ty*scY-1.5,3,3)}
}

// ===== 更新 =====
let lt=0;
function update(dt){
rk();
const frozen=P.jail>0||P.downed>0||P.dead;if(frozen){inp.jx=0;inp.jy=0}
const jx=inp.jx,jy=inp.jy,mag=Math.hypot(jx,jy);let ts=0,moving=mag>.1;
const sf=1-Math.min(.45,P.injury*0.15);
if(moving){P.ang=Math.atan2(jx,-jy);
if(inp.sprint&&P.sp>0){ts=P.ss;P.st='sprint';P.sprint=true;P.sp=Math.max(0,P.sp-20*dt)}
else if(mag>.7){ts=P.rs;P.st='run';P.sprint=false}else{ts=P.ws;P.st='walk';P.sprint=false}
}else{P.st=P.gnd?'idle':'fall';P.sprint=false}
ts*=sf;
if(!P.sprint)P.sp=Math.min(P.msp,P.sp+10*dt);
if(inp.jump&&P.gnd){P.vz=250;P.gnd=false;P.st='jump';inp.jump=false}
if(!P.gnd){P.vz-=600*dt;P.z+=P.vz*dt;if(P.z<=0){P.z=0;P.vz=0;P.gnd=true}if(P.vz<-10)P.st='fall'}
if(inVeh){
 const v=inVeh,jx=inp.jx,jy=inp.jy,mag=Math.hypot(jx,jy);let vts=0;
 if(mag>.1){v.ang=Math.atan2(jx,-jy);vts=v.spd*(P.cls==='driver'?1.3:1);v.st='run'}else v.st='idle';
 const dx=Math.sin(v.ang)*vts*dt,dy=-Math.cos(v.ang)*vts*dt,nx=v.x+dx,ny=v.y+dy;
 if(canDrive(v,nx,ny)){v.x=nx;v.y=ny}
 P.x=v.x;P.y=v.y;P.spd=vts;
}else{
 const dx=Math.sin(P.ang)*ts*dt,dy=-Math.cos(P.ang)*ts*dt;
 const nx=P.x+dx,ny=P.y+dy;
 const tx=Math.floor(nx/T),ty=Math.floor(ny/T);
 if(tx>=0&&tx<MW&&ty>=0&&ty<MH){const tile=md[ty][tx];if(tile!==TT.MOUNTAIN&&tile!==TT.OCEAN){P.x=nx;P.y=ny}}
 P.spd=ts;if(moving)P.at+=dt;
}
// 推进游戏时间
gameTime=new Date(gameTime.getTime()+dt*TIME_SPEED*1000);
const cs=5*dt;cam.x+=(P.x-cam.x)*cs;cam.y+=(P.y-cam.y)*cs;
cam.tz=P.sprint?.85:1;cam.z+=(cam.tz-cam.z)*3*dt;
// NPC
for(const n of npcs){if(n.downed>0){n.downed-=dt;if(n.downed<=0){n.downed=0;n.hostile=false}continue}n.at+=dt;
if(n.pat!=='idle'){n.pt-=dt;if(n.pt<=0){const r=n.pat==='wander'?200:100;n.tx=n.sx+(Math.random()-.5)*r*2;n.ty=n.sy+(Math.random()-.5)*r*2;n.pt=3+Math.random()*4}
const ddx=n.tx-n.wx,ddy=n.ty-n.wy,dd=Math.hypot(ddx,ddy);if(dd>3){n.ang=Math.atan2(ddx,-ddy);n.wx+=ddx/dd*80*dt;n.wy+=ddy/dd*80*dt;n.st='walk';n.at+=dt}else n.st='idle'}else n.st='idle'}
// 载具巡逻
for(const v of vehicles){if(v===inVeh)continue;v.at+=dt;if(v.type==='land'&&!v.occ){v.pt-=dt;if(v.pt<=0){v.tx=v.x+(Math.random()-.5)*300;v.ty=v.y+(Math.random()-.5)*300;v.pt=4+Math.random()*5}const ddx=v.tx-v.x,ddy=v.ty-v.y,dd=Math.hypot(ddx,ddy);if(dd>3){v.ang=Math.atan2(ddx,-ddy);const mx2=v.x+ddx/dd*30*dt,my2=v.y+ddy/dd*30*dt;if(canDrive(v,mx2,my2)){v.x=mx2;v.y=my2}v.st='run'}else v.st='idle'}}
// 聊天环境音
chatTimer-=dt;if(chatTimer<=0){chatTimer=8+Math.random()*8;ambientChat()}
// 任务
for(const q of quests){if(q.done)continue;if(q.tp==='visit'){q.pr=visNPCs.size;if(q.pr>=q.gl)q.done=true}}
// 战斗/通缉
updateCombat(dt);
// HUD
document.getElementById('hpB').style.width=(P.hp/P.mhp*100)+'%';
document.getElementById('spB').style.width=(P.sp/P.msp*100)+'%';
document.getElementById('hpT').textContent=`HP ${P.hp|0}/${P.mhp}`;
document.getElementById('spT').textContent=`体力 ${P.sp|0}/${P.msp}`;
const wEl=document.getElementById('wanted');if(wEl)wEl.textContent=P.stars>0?('⭐'.repeat(P.stars)+' 通缉'+P.wanted):'';
const jEl=document.getElementById('jailP');if(jEl)jEl.style.display=P.jail>0?'flex':'none';
const jt=document.getElementById('jailT');if(jt)jt.textContent='剩余 '+(Math.ceil(P.jail))+'s';
const dEl=document.getElementById('downP');if(dEl)dEl.style.display=P.downed>0?'flex':'none';
const dt2=document.getElementById('downT');if(dt2)dt2.textContent='倒地 '+(Math.ceil(P.downed))+'s（等待救援）';
const geo=w2geo(P.x,P.y);
const provName=getProvince(P.x,P.y);
document.getElementById('cT').textContent=provName;
document.getElementById('gT').textContent=`${geo.lon.toFixed(2)}°E ${geo.lat.toFixed(2)}°N`;
const hr=gameTime.getHours(),mn=gameTime.getMinutes();
const ss=['冬','冬','春','春','春','夏','夏','夏','秋','秋','秋','冬'];
document.getElementById('tT').textContent=`${String(hr).padStart(2,'0')}:${String(mn).padStart(2,'0')} ${ss[gameTime.getMonth()]}`;
updateHud();
let nearN=null;for(const n of npcs){if(Math.hypot(n.wx-P.x,n.wy-P.y)<80){nearN=n;break}}
const ip=document.getElementById('iP');
if(nearN){ip.style.display='block';ip.textContent=`按[互动]与${nearN.n}交谈`}else ip.style.display='none';
let qh='';for(const q of quests){qh+=`<div class="qi">${q.done?'✅':'📌'} ${q.n} ${q.done?'':`<span class="qp">${q.pr}/${q.gl}</span>`}</div>`}
document.getElementById('qL').innerHTML=qh}

// ===== 交互 =====
let dlgNPC=null;
function tryInteract(){let best=null,bd=100;for(const n of npcs){const d=Math.hypot(n.wx-P.x,n.wy-P.y);if(d<bd){bd=d;best=n}}if(!best)return;dlgNPC=best;
visNPCs.add(best.id);for(const q of quests){if(!q.done&&q.tp==='talk'&&q.tg===best.id){q.pr=1;q.done=true;toast(`任务完成: ${q.n}`)}}
document.getElementById('dA').textContent=best.em||'👤';
document.getElementById('dN').textContent=best.n;
document.getElementById('dJ').textContent=`${best.j} · ${best.ag}岁 · ${best.per}`;
document.getElementById('dT').textContent=`"${npcGreeting(best)}"`;
const os=document.getElementById('dOs');
let opts=`<div class="do" onclick="npcChat(event)" ontouchstart="npcChat(event)">聊天</div>`;
if(best.shop)opts+=`<div class="do" onclick="openShopById('${best.shop}',event)" ontouchstart="openShopById('${best.shop}',event)">逛店铺</div>`;
opts+=`<div class="do" onclick="closeDlg(event)" ontouchstart="closeDlg(event)">告辞</div>`;
os.innerHTML=opts;
document.getElementById('dO').classList.add('show')}
function closeDlg(e){if(e)e.preventDefault();document.getElementById('dO').classList.remove('show');if(dlgNPC){toast(`${dlgNPC.n}: "${dlgNPC.fw}"`);dlgNPC=null}}
document.getElementById('dO').addEventListener('touchstart',e=>{if(e.target===e.currentTarget)closeDlg(e)});
document.getElementById('dO').addEventListener('click',e=>{if(e.target===e.currentTarget)closeDlg(e)});

// ===== 面板 =====
function togBag(){const p=document.getElementById('bagP');p.classList.toggle('show');if(p.classList.contains('show'))rebuildBag()}
function rebuildBag(){let h='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';for(const it of P.inv)h+=`<div style="text-align:center;background:#fff08;border-radius:8px;padding:10px 4px;border:1px solid #fff1"><div style="font-size:24px">${it.i}</div><div style="font-size:10px;color:#ccc;margin-top:3px">${it.n}</div><div style="font-size:9px;color:#0df">x${it.c}</div></div>`;h+='</div>';document.getElementById('bagB').innerHTML=h}
function togFace(){const p=document.getElementById('faceP');const show=!p.classList.contains('show');p.classList.toggle('show');if(show)buildFE()}
function buildFE(){
const gs=[{n:'脸型',ps:[['fw','脸宽'],['fl','脸长'],['ja','下颌角'],['cb','颧骨']]},{n:'眉毛',ps:[['bh','眉高'],['bd','眉间距'],['bt','眉粗细']]},{n:'眼睛',ps:[['ed','眼间距'],['es','眼大小'],['ea','眼角'],['eo','眼开合'],['ei','眼内距']]},{n:'鼻子',ps:[['nb','鼻梁'],['nt','鼻尖'],['nw','鼻翼'],['nl','鼻长']]},{n:'嘴巴',ps:[['mw','嘴宽'],['lu','上唇'],['ll','下唇'],['ma','嘴角'],['mc','唇角']]},{n:'耳朵',ps:[['esz','耳大小'],['eaa','耳角度']]}];
let h='';for(const g of gs){h+=`<div class="fg"><h4>${g.n}</h4>`;for(const[k,l]of g.ps){const v=P.fp[k]||.5;h+=`<div class="fr"><label>${l}</label><input type="range" min="0" max="100" value="${v*100}" oninput="setFP('${k}',this.value)"><span class="v" id="fv_${k}">${v.toFixed(2)}</span></div>`}h+='</div>'}
h+=`<div class="fg"><h4>颜色</h4><div class="fr"><label>肤色</label><input type="color" value="${P.skin}" oninput="P.skin=this.value" style="flex:1;height:28px;border:none;background:none"></div><div class="fr"><label>发色</label><input type="color" value="${P.hair}" oninput="P.hair=this.value" style="flex:1;height:28px;border:none;background:none"></div><div class="fr"><label>上衣</label><input type="color" value="${P.shirt}" oninput="P.shirt=this.value" style="flex:1;height:28px;border:none;background:none"></div></div>`;
document.getElementById('faceB').innerHTML=h}
function setFP(n,v){P.fp[n]=v/100;const e=document.getElementById('fv_'+n);if(e)e.textContent=(v/100).toFixed(2)}
let tt;function toast(m){const t=document.getElementById('tst');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2500)}

// ===== 游戏时间 =====
let gameTime=new Date(2024,2,20,8,0,0);
const TIME_SPEED=60; // 1秒现实时间=60秒游戏时间

// ===== 主渲染 =====
function render(){
cx.clearRect(0,0,W,H);
// 天空
const hr=gameTime.getHours();let st2,sb2;
if(hr>=6&&hr<8){st2='#ff8844';sb2='#ffcc88'}else if(hr>=8&&hr<17){st2='#4488cc';sb2='#88bbee'}else if(hr>=17&&hr<19){st2='#cc6644';sb2='#ffaa66'}else{st2='#0a0a2a';sb2='#1a1a3a'}
const gr=cx.createLinearGradient(0,0,0,H);gr.addColorStop(0,st2);gr.addColorStop(1,sb2);cx.fillStyle=gr;cx.fillRect(0,0,W,H);
// 可见tile范围
const hw=W/2/cam.z,hh=H/2/cam.z;
const sx=Math.max(0,Math.floor((cam.x-hw)/T)-1),ex=Math.min(MW-1,Math.ceil((cam.x+hw)/T)+1);
const sy=Math.max(0,Math.floor((cam.y-hh)/T)-1),ey=Math.min(MH-1,Math.ceil((cam.y+hh)/T)+1);
const ts=T*cam.z;
// 高德地图瓦片底图
drawAmapTiles();
// 程序化地形底图 (当关闭高德时使用)
if(!useAmap){for(let y=sy;y<=ey;y++)for(let x=sx;x<=ex;x++){const s=w2s(x*T,y*T);drawTile(x,y,md[y][x],s.x,s.y,ts)}}
// 河流
for(const r of rivers)drawRiver(r);
// 湖泊
for(const lk of lakes)drawLake(lk);
// 省界
drawProvinceBorder();
// 城市标签
drawCityLabels();
// 深度排序实体
const ents=[];
if(!useAmap){for(const d of deco){const s=w2s(d.x,d.y);if(s.x>-50&&s.x<W+50&&s.y>-80&&s.y<H+50)ents.push({y:d.y,fn:()=>drawDeco(d)})}}
for(const n of npcs)ents.push({y:n.wy,fn:()=>drawChar(n,false)});
for(const p of polices)ents.push({y:p.wy,fn:()=>drawChar(p,false)});
for(const v of vehicles){if(v!==inVeh)ents.push({y:v.y,fn:()=>drawVehicle(v,false)})}
if(inVeh)ents.push({y:P.y,fn:()=>drawVehicle(inVeh,true)});
else ents.push({y:P.y,fn:()=>{const s=w2s(P.x,P.y);if(s.on)drawAvatar(cx,P,s,cam.z,P.at||0,P.st||'idle')}});
ents.sort((a,b)=>a.y-b.y);
for(const e of ents)e.fn();
// 昼夜
if(hr>=19||hr<6){cx.fillStyle=`rgba(0,0,30,${hr>=19?Math.min(.35,(hr-19)*.08+.08):Math.min(.35,(6-hr)*.08+.08)})`;cx.fillRect(0,0,W,H)}
// 国境线高亮
cx.strokeStyle='rgba(255,50,50,.25)';cx.lineWidth=2;cx.beginPath();
for(let i=0;i<chinaBorder.length;i++){const[tx,ty]=geo2tile(chinaBorder[i][0],chinaBorder[i][1]);const s=w2s(tx*T,ty*T);if(i===0)cx.moveTo(s.x,s.y);else cx.lineTo(s.x,s.y)}
cx.closePath();cx.stroke();
drawMM()}

function loop(now){const dt=Math.min((now-lt)/1000,.05);lt=now;update(dt);render();requestAnimationFrame(loop)}

// ========== 账号 / 登录注册 / 第三方授权 (§3.1) ==========
const LS_ACC='hx_accounts',LS_SES='hx_sessions',LS_CUR='hx_cur',LS_DEV='hx_device';
const _mem={};
function lsGet(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return k in _mem?_mem[k]:d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){_mem[k]=v}}
function hashP(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(16)}
function genUid(){return 'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function genTok(){return 'tk_'+Math.random().toString(36).slice(2,12)+Date.now().toString(36)}
function genDev(){let d=lsGet(LS_DEV,null);if(!d){d='dev_'+Math.random().toString(36).slice(2,14);lsSet(LS_DEV,d)}return d}
function getAccounts(){return lsGet(LS_ACC,[])||[]}
function saveAccounts(a){lsSet(LS_ACC,a)}
function acctByUser(u){return getAccounts().find(a=>a.user===u)}
function acctByBind(t,id){return getAccounts().find(a=>(a.binds||[]).some(b=>b.type===t&&b.id===id))}
function defaultChar(name){return{name:name||'玩家',gender:'m',skin:'#e8b88a',hair:'#2a1a0a',shirt:'#3366aa',pants:'#2a2a3a',fp:{...P.fp},hairStyle:'hair_002',body:{h:1.72,build:.5},charDone:false}}
function ensureChar(a){if(!a.char)a.char=defaultChar(a.name);return a.char}
function applyChar(a){const c=ensureChar(a);P.name=c.name;P.gender=c.gender;P.skin=c.skin;P.hair=c.hair;P.shirt=c.shirt;P.pants=c.pants;P.fp=Object.assign({},c.fp);P.hairStyle=c.hairStyle||'hair_002';P.body=Object.assign({h:1.72,build:.5},c.body);
  // 应用API金币和载具
  if(a._apiGold!==undefined){P.gold=a._apiGold;delete a._apiGold}
  if(a._apiVehicles!==undefined){P.myVehicles=a._apiVehicles;delete a._apiVehicles}
}
let cur=null; // {uid,platform}
function issueSession(uid,platform){const tok=genTok(),loginTs=Date.now(),exp=loginTs+15*864e5;const ses=lsGet(LS_SES,{});ses[platform]={uid,token:tok,loginTs,deviceId:genDev(),exp};lsSet(LS_SES,ses);lsSet(LS_CUR,{uid,platform});cur={uid,platform}}
function validSession(){const c=lsGet(LS_CUR,null);if(!c)return null;const ses=lsGet(LS_SES,{});const s=ses[c.platform];if(!s||s.uid!==c.uid||Date.now()>s.exp)return null;const a=getAccounts().find(x=>x.uid===c.uid);return a?{account:a,session:s,platform:c.platform}:null}
function afterAuth(a,platform){ensureChar(a);issueSession(a.uid,platform);closeLogin();if(!a.char||!a.char.charDone)openCharCreate();else enterWithExpiryCheck(a)}
async function afterApiAuth(data){
  // 兼容 {account,tokens}(登录/注册) 与 {account}(me) 两种返回
  const acc=data.account||data;
  const uid=acc.account_id||data.account_id;
  const uname=acc.username||data.username||'云端用户';
  // API认证后加载角色数据
  let local=acctByUser(uname);
  if(!local){local={uid,user:uname,pass:'',binds:[{type:'server',id:uid}],char:defaultChar(uname),created:Date.now()};const accs=getAccounts();accs.push(local);saveAccounts(accs)}
  // 尝试从后端加载角色
  const prof=await apiGet('/api/player/profile');
  if(prof&&prof.nickname){local.char=prof;local.char.charDone=true}
  // 加载金币
  const goldR=await apiGet('/api/shop/gold');
  if(goldR&&goldR.gold!==undefined)local._apiGold=goldR.gold;
  // 加载载具
  const vehR=await apiGet('/api/shop/vehicles');
  if(vehR&&vehR.vehicles)local._apiVehicles=vehR.vehicles;
  issueSession(uid,'pc');closeLogin();
  if(!local.char||!local.char.charDone)openCharCreate();else enterWithExpiryCheck(local)
}
function closeLogin(){const l=document.getElementById('loginP');if(l)l.style.display='none';const ld=document.getElementById('ld');if(ld)ld.style.display='none'}
async function boot(){
  // ===== 始终显示登录面板，只显示第三方登录（微信/QQ/Apple/游客）=====
  try{openLogin()}catch(e){if(window.__hxErr)window.__hxErr('openLogin: '+e.message)}

  // 检查是否有已注册账号，给出提示
  let localAccs=[];
  try{localAccs=getAccounts()}catch(e){console.warn('getAccounts failed',e)}
  const hasLocal=localAccs.length>0;
  let wasRegistered=false;
  try{wasRegistered=hasLocal||!!apiToken}catch(e){}

  try{
    if(hasLocal){
      showLoginTip('👋 欢迎回来！请选择微信/QQ/Apple 或游客模式登录');
    }else{
      showLoginTip('🎉 欢迎来到遗梦！请选择登录方式');
    }
  }catch(e){if(window.__hxErr)window.__hxErr('showLoginTip: '+e.message)}
}


function enterGame(){startGame()}

// ===== 账号会员到期检测（§3.1 强化）=====
// 会员为可选增值服务：未开通(vipExpire 为空)永不过期；
// 已开通且时间已过 → 弹窗提示续费，可免费模式继续。
function vipExpired(a){return !!(a&&a.vipExpire&&Date.now()>a.vipExpire)}
function proceedEnter(a){if(!a.char||!a.char.charDone)openCharCreate();else{applyChar(a);enterGame()}}
function enterWithExpiryCheck(a){if(vipExpired(a))showExpireModal(a);else proceedEnter(a)}
function showExpireModal(a){
  const p=document.getElementById('expireP');if(!p)return;
  const days=a.vipExpire?Math.max(1,Math.ceil((Date.now()-a.vipExpire)/864e5)):1;
  const ed=document.getElementById('expireDays');if(ed)ed.textContent=days+' 天前';
  p.style.display='flex';
  const rn=document.getElementById('expireRenew');
  if(rn)rn.onclick=()=>{p.style.display='none';togRecharge()};
  const fr=document.getElementById('expireFree');
  if(fr)fr.onclick=()=>{p.style.display='none';toast('🆓 已以免费模式进入（会员功能受限）');proceedEnter(a)};
}

// 登录界面交互 - 模仿王者荣耀/和平精英风格
function openLogin(){
  const ld=document.getElementById('ld');if(ld)ld.style.display='none';
  const l=document.getElementById('loginP');if(l)l.style.display='flex';
  // 生成星空背景粒子
  try{generateLoginStars()}catch(e){}
  try{renderAccList()}catch(e){}
}
function showLoginTip(msg){const t=document.getElementById('loginTip');if(t)t.textContent=msg}
function closeLogin(){const l=document.getElementById('loginP');if(l)l.style.display='none'}

// 登录背景星空粒子
function generateLoginStars(){
  const fx=document.getElementById('loginBgFx');if(!fx)return;
  fx.innerHTML='';
  for(let i=0;i<60;i++){
    const s=document.createElement('div');s.className='bgStar';
    s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';
    s.style.animationDelay=Math.random()*3+'s';
    s.style.width=s.style.height=(Math.random()*2+1)+'px';
    fx.appendChild(s);
  }
}

// 渲染历史账号列表
function renderAccList(){
  const box=document.getElementById('lgAccs');if(!box)return;
  const accs=getAccounts();if(!accs.length){box.innerHTML='';return}
  box.innerHTML='<div style="font-size:11px;opacity:.5;margin-bottom:6px;text-align:center">历史账号（点击快速进入）：</div>'+accs.map(a=>{
    const b=a.binds[0]||{};
    const em=OA[b.type]?OA[b.type].e:(b.type==='guest'?'👤':'🔑');
    const nm=a.char&&a.char.name?a.char.name:a.user;
    return `<div class="loginAccRow" onclick="quickLogin('${a.uid}')"><span class="lae">${em}</span><span class="lai">${nm}</span><span>➜</span></div>`
  }).join('');
}

// 游客模式
function doGuest(){let a=acctByBind('guest',genDev());if(!a){a={uid:genUid(),user:'游客'+Math.random().toString(36).slice(2,6),pass:'',binds:[{type:'guest',id:genDev()}],char:defaultChar(),created:Date.now()};const accs=getAccounts();accs.push(a);saveAccounts(accs)}closeLogin();toast('✅ 游客模式登录');afterAuth(a,'pc')}

// ===== 第三方OAuth授权 - 模仿王者荣耀/和平精英扫码授权流程 =====
const OA={
  wx:{n:'微信',c:'#07c160',bg:'#1aad19',e:'💬',qrTip:'请使用微信扫描二维码登录',btnText:'确认登录',scanText:'微信授权登录中...'},
  qq:{n:'QQ',c:'#12b7f5',bg:'#0ea0e9',e:'企鹅',qrTip:'请使用QQ扫描二维码登录',btnText:'QQ授权登录',scanText:'QQ授权登录中...'},
  apple:{n:'Apple',c:'#333',bg:'#1a1a1a',e:'🍎',qrTip:'请使用Apple ID登录',btnText:'通过Apple ID登录',scanText:'Apple ID验证中...'}
};
let oaProv=null,oaQRTimer=null;

// 点击第三方按钮 → 弹出OAuth授权页面（带二维码）
function oauthStart(p){
  try{
    if(!OA[p]){if(window.toast)toast('登录方式不存在');return}
    oaProv=p;const o=OA[p];
    // 更新授权弹窗UI
    const logo=document.getElementById('oaLogo');if(logo){logo.textContent=o.e;logo.style.background=o.bg}
    const an=document.getElementById('oaAppName');if(an)an.textContent='遗梦 申请'+o.n+'授权';
    const at=document.getElementById('oaAuthTip');if(at)at.textContent='该应用将获取你的'+o.n+'昵称、头像等公开信息';
    const qt=document.getElementById('oaQRText');if(qt)qt.textContent=o.qrTip;
    // 确认按钮颜色跟随平台
    const btn=document.getElementById('oaConfirmBtn');if(btn){btn.textContent=o.btnText;btn.style.color=o.c}
    // 隐藏扫码动画层
    const scan=document.getElementById('oaScanning');if(scan)scan.classList.remove('show');
    // 生成模拟二维码
    drawFakeQRCode(p,o);
    // 显示弹窗
    document.getElementById('oauthP').classList.add('show');
  }catch(e){
    console.error('oauthStart err:',e);
    if(window.__hxErr)window.__hxErr('oauthStart('+p+'): '+e.message+'\n'+(e.stack||''));
  }
}

// 绘制模拟二维码（真实感）
function drawFakeQRCode(p,o){
  const canvas=document.getElementById('oaQRCanvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');const W=160,H=160;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  // 模拟QR码方格
  const seed=p+Date.now().toString(36);let hash=0;for(let i=0;i<seed.length;i++)hash=((hash<<5)-hash)+seed.charCodeAt(i);
  const cellSize=4;const cols=W/cellSize;const rows=H/cellSize;
  // 三个定位方块（QR码特征）
  function drawFinder(x,y){
    ctx.fillStyle='#000';
    ctx.fillRect(x,y,7*cellSize,7*cellSize);
    ctx.fillStyle='#fff';
    ctx.fillRect(x+cellSize,y+cellSize,5*cellSize,5*cellSize);
    ctx.fillStyle='#000';
    ctx.fillRect(x+2*cellSize,y+2*cellSize,3*cellSize,3*cellSize);
  }
  drawFinder(2*cellSize,2*cellSize);
  drawFinder(W-9*cellSize,2*cellSize);
  drawFinder(2*cellSize,H-9*cellSize);
  // 随机数据区域
  ctx.fillStyle='#000';
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      // 避开定位块区域
      if((r<10&&c<10)||(r<10&&c>=cols-10)||(r>=rows-10&&c<10))continue;
      if(Math.abs(hash*r*c)%3===0){
        ctx.fillRect(c*cellSize,r*cellSize,cellSize,cellSize);
      }
    }
  }
  // 中央logo（平台图标）
  const cx=W/2,cy=H/2;
  ctx.fillStyle='#fff';ctx.fillRect(cx-14,cy-14,28,28);
  ctx.fillStyle=o.bg||o.c;ctx.fillRect(cx-12,cy-12,24,24);
  ctx.fillStyle='#fff';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(o.e==='企鹅'?'Q':o.e,cx,cy);
}

// 取消授权
function oauthCancel(){
  document.getElementById('oauthP').classList.remove('show');
  oaProv=null;if(oaQRTimer){clearTimeout(oaQRTimer);oaQRTimer=null}
}

// 确认授权 → 模仿王者荣耀的扫码授权动画流程
function oauthConsent(){
  const p=oaProv;if(!p){oauthCancel();return}
  const o=OA[p];
  const scan=document.getElementById('oaScanning');
  const bar=document.getElementById('oaScanBar');
  const text=document.getElementById('oaScanText');
  // 阶段1：显示扫码动画
  if(scan){scan.classList.add('show')}
  if(text){text.textContent=o.scanText}
  if(bar){bar.style.width='0%'}
  // 阶段2：进度条动画（模拟真实扫码验证过程）
  let progress=0;
  const steps=[10,25,40,55,70,85,95,100];
  let i=0;
  function nextStep(){
    if(i>=steps.length){
      // 阶段3：完成 → 创建账号 → 进入游戏
      finishOAuth(p);return;
    }
    progress=steps[i];if(bar)bar.style.width=progress+'%';
    if(progress===40&&text)text.textContent='验证身份信息...';
    if(progress===70&&text)text.textContent='获取授权令牌...';
    if(progress===95&&text)text.textContent='登录成功！';
    i++;oaQRTimer=setTimeout(nextStep,200+Math.random()*300);
  }
  nextStep();
}

// OAuth完成：创建账号并进入游戏
function finishOAuth(p){
  const o=OA[p];
  const pid=p+'_'+Math.random().toString(36).slice(2,12);
  let a=acctByBind(p,pid);
  if(!a){
    const name=o.n+'用户_'+Math.random().toString(36).slice(2,6);
    a={uid:genUid(),user:name,pass:'',binds:[{type:p,id:pid}],char:defaultChar(name),created:Date.now()};
    const accs=getAccounts();accs.push(a);saveAccounts(accs);
  }
  // 关闭弹窗
  document.getElementById('oauthP').classList.remove('show');
  oaProv=null;if(oaQRTimer){clearTimeout(oaQRTimer);oaQRTimer=null}
  toast('✅ 已通过'+o.n+'授权登录');
  afterAuth(a,'pc');
}

// 快速登录（历史账号）
function quickLogin(uid){const a=getAccounts().find(x=>x.uid===uid);if(a){closeLogin();afterAuth(a,'pc')}}
function logout(){apiClearAuth();apiToken='';lsSet(LS_CUR,null);location.reload()}

// ========== 人物模块 / 角色创建 (§7) ==========
const HAIRS=[{id:'hair_001',n:'寸头'},{id:'hair_002',n:'中分'},{id:'hair_003',n:'马尾'},{id:'hair_004',n:'卷发'},{id:'hair_005',n:'光头'},{id:'hair_006',n:'长直发'}];
const FACE_G=[{n:'脸型',ps:[['fw','脸宽'],['fl','脸长'],['ja','下颌角'],['cb','颧骨']]},{n:'眉毛',ps:[['bh','眉高'],['bd','眉间距'],['bt','眉粗细']]},{n:'眼睛',ps:[['ed','眼间距'],['es','眼大小'],['ea','眼角'],['eo','眼开合'],['ei','眼内距']]},{n:'鼻子',ps:[['nb','鼻梁'],['nt','鼻尖'],['nw','鼻翼'],['nl','鼻长']]},{n:'嘴巴',ps:[['mw','嘴宽'],['lu','上唇'],['ll','下唇'],['ma','嘴角'],['mc','唇角']]},{n:'耳朵',ps:[['esz','耳大小'],['eaa','耳角度']]}];
let charData=defaultChar('玩家'),charTab='face',prevRAF=null,photoStream=null;
function openCharCreate(){const a=cur&&getAccounts().find(x=>x.uid===cur.uid);charData=JSON.parse(JSON.stringify(ensureChar(a||{char:defaultChar()})));charTab='face';document.getElementById('chName').value=charData.name;setGenderUI();document.getElementById('charP').classList.add('show');buildCharUI();if(!prevRAF)prevLoop()}
function closeCharCreate(){document.getElementById('charP').classList.remove('show')}
function chTab(t){charTab=t;['face','body','hair','col'].forEach(x=>{const e=document.getElementById('ct_'+x);if(e)e.classList.toggle('on',x===t)});buildCharUI()}
function setGender(g){charData.gender=g;setGenderUI()}
function setGenderUI(){document.getElementById('gM').classList.toggle('on',charData.gender==='m');document.getElementById('gF').classList.toggle('on',charData.gender==='f')}
function buildCharUI(){const b=document.getElementById('chB');let h='';
  if(charTab==='photo'){h=`<div class="fg" style="text-align:center"><h4>📷 拍照生成角色</h4><p style="font-size:13px;opacity:.7;margin:8px 0">用摄像头拍照，AI自动识别面部特征生成你的真人角色</p><div class="fr" style="justify-content:center;margin:16px 0"><span class="cb2 snap-btn" onclick="photoOpen()" style="background:linear-gradient(90deg,#07c160,#1aad19);color:#fff;border:none;padding:12px 28px;font-size:14px;border-radius:12px">📷 打开摄像头拍照</span></div><p style="font-size:12px;opacity:.5">支持：肤色识别、发色提取、脸型分析、五官参数生成</p></div>`}
  else if(charTab==='face'){for(const g of FACE_G){h+=`<div class="fg"><h4>${g.n}</h4>`;for(const[k,l]of g.ps){const v=(charData.fp[k]??.5);h+=`<div class="fr"><label>${l}</label><input type="range" min="0" max="100" value="${v*100}" oninput="charData.fp['${k}']=this.value/100;const t=document.getElementById('cf_${k}');if(t)t.textContent=(this.value/100).toFixed(2)"><span class="v" id="cf_${k}">${v.toFixed(2)}</span></div>`}h+='</div>'}}
  else if(charTab==='body'){h+=`<div class="fg"><h4>体型</h4><div class="fr"><label>身高</label><input type="range" min="155" max="195" value="${charData.body.h*100}" oninput="charData.body.h=this.value/100;document.getElementById('cbh').textContent=this.value+'cm'"><span class="v" id="cbh">${charData.body.h*100|0}cm</span></div><div class="fr"><label>胖瘦</label><input type="range" min="0" max="100" value="${charData.body.build*100}" oninput="charData.body.build=this.value/100;document.getElementById('cbb').textContent=this.value+'%'"><span class="v" id="cbb">${charData.body.build*100|0}%</span></div></div>`}
  else if(charTab==='hair'){h+=`<div class="fg"><h4>发型</h4><div class="fr"><label>样式</label><select onchange="charData.hairStyle=this.value" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.35);color:#fff">`+HAIRS.map(x=>`<option value="${x.id}" ${charData.hairStyle===x.id?'selected':''}>${x.n}</option>`).join('')+`</select></div><div class="fr"><label>发色</label><input type="color" value="${charData.hair}" oninput="charData.hair=this.value" style="flex:1;height:30px;border:none;background:none"></div></div>`}
  else if(charTab==='col'){h+=`<div class="fg"><h4>颜色</h4><div class="fr"><label>肤色</label><input type="color" value="${charData.skin}" oninput="charData.skin=this.value" style="flex:1;height:30px;border:none;background:none"></div><div class="fr"><label>上衣</label><input type="color" value="${charData.shirt}" oninput="charData.shirt=this.value" style="flex:1;height:30px;border:none;background:none"></div><div class="fr"><label>裤子</label><input type="color" value="${charData.pants}" oninput="charData.pants=this.value" style="flex:1;height:30px;border:none;background:none"></div></div>`}
  b.innerHTML=h}
function randomChar(){const r=()=>Math.random();charData={name:charData.name,gender:r()<.5?'m':'f',skin:['#f3d2b3','#e8b88a','#d9a06b','#c68642','#8d5524'][Math.floor(r()*5)],hair:['#2a1a0a','#1a1a1a','#4a2c12','#b0b0b0','#7a3b1a','#c0392b'][Math.floor(r()*6)],shirt:`hsl(${r()*360|0},55%,${35+r()*25|0}%)`,pants:`hsl(${r()*360|0},30%,${20+r()*25|0}%)`,fp:Object.fromEntries(FACE_G.flatMap(g=>g.ps.map(([k])=>[k,r()]))),hairStyle:HAIRS[Math.floor(r()*HAIRS.length)].id,body:{h:1.55+r()*0.4,build:r()},charDone:false};setGenderUI();buildCharUI()}
function resetChar(){charData=defaultChar(charData.name);setGenderUI();buildCharUI()}
async function saveChar(){const nm=(document.getElementById('chName').value||'玩家').replace(/[<>]/g,'').slice(0,12)||'玩家';charData.name=nm;const accs=getAccounts();const i=accs.findIndex(x=>x.uid===cur.uid);
  // 同步角色到后端API
  if(apiOnline()){
   try{
    const prof={nickname:nm,gender:charData.gender==='f'?2:1,appearance:charData};
    await apiPost('/api/player/profile',prof);
   }catch(e){console.warn('API save char failed:',e)}
  }
  if(i>=0){accs[i].char=JSON.parse(JSON.stringify(charData));accs[i].charDone=true;saveAccounts(accs);applyChar(accs[i])}else{applyChar({char:charData})}
  closeCharCreate();enterGame()}
function prevLoop(){const el=document.getElementById('charP');if(!el||!el.classList.contains('show')){prevRAF=null;return}const c=document.getElementById('chrC'),pctx=c.getContext('2d'),W=c.width,H=c.height;pctx.clearRect(0,0,W,H);const t=performance.now()/1000;drawAvatar(pctx,charData,{x:W/2,y:H*0.62},Math.min(W,H)/120,t,'idle');prevRAF=requestAnimationFrame(prevLoop)}

// ========== 拍照生成人物模块 (§7b) ==========

// 打开摄像头弹窗
async function photoOpen(){
  const panel=document.getElementById('photoP');
  const video=document.getElementById('photoVideo');
  const hint=document.getElementById('photoHint');
  const result=document.getElementById('photoResult');
  const snapBtn=document.getElementById('photoSnapBtn');
  const overlay=document.getElementById('scanOverlay');
  result.style.display='none';overlay.style.display='none';
  hint.textContent='请正对摄像头，保持面部居中';
  snapBtn.disabled=false;snapBtn.textContent='📸 拍照';
  panel.classList.add('show');
  try{
    photoStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:640}},audio:false});
    video.srcObject=photoStream;
  }catch(e){
    hint.textContent='⚠️ 无法访问摄像头，请检查权限设置';
    snapBtn.disabled=true;
  }
}

// 关闭摄像头弹窗
function photoCancel(){
  if(photoStream){photoStream.getTracks().forEach(t=>t.stop());photoStream=null}
  document.getElementById('photoVideo').srcObject=null;
  document.getElementById('photoP').classList.remove('show');
}

// 拍照并分析
function photoSnap(){
  const video=document.getElementById('photoVideo');
  const canvas=document.getElementById('photoCapCanvas');
  const overlay=document.getElementById('scanOverlay');
  const hint=document.getElementById('photoHint');
  const snapBtn=document.getElementById('photoSnapBtn');
  if(!video.srcObject)return;
  // 截取画面
  const ctx=canvas.getContext('2d');
  const vw=video.videoWidth,vh=video.videoHeight;
  // 取中心正方形区域（面部区域）
  const sz=Math.min(vw,vh);
  const sx=(vw-sz)/2,sy=(vh-sz)/2;
  canvas.width=280;canvas.height=280;
  ctx.drawImage(video,sx,sy,sz,sz,0,0,280,280);
  // 显示扫描动画
  overlay.style.display='block';
  hint.textContent='🔍 正在分析面部特征…';
  snapBtn.disabled=true;snapBtn.textContent='分析中…';
  // 延迟分析（让扫描动画展示2秒）
  setTimeout(()=>{analyzePhoto(ctx,280,280)},2000);
}

// 照片分析算法：提取肤色/发色/脸型/五官参数
function analyzePhoto(ctx,w,h){
  const imgData=ctx.getImageData(0,0,w,h);
  const d=imgData.data;
  // 1. 肤色提取：取中心区域(25%-75%)的平均肤色像素
  let skinR=0,skinG=0,skinB=0,skinCount=0;
  for(let y=Math.floor(h*.3);y<Math.floor(h*.7);y++){
    for(let x=Math.floor(w*.3);x<Math.floor(w*.7);x++){
      const i=(y*w+x)*4;
      const r=d[i],g=d[i+1],b=d[i+2];
      // 判断是否为肤色像素（HSV范围：H 0-50, S 20-80%, V 30-100%）
      const hsv=rgb2hsv(r,g,b);
      if(hsv.h>=0&&hsv.h<=50&&hsv.s>=0.08&&hsv.s<=0.75&&hsv.v>=0.2){
        skinR+=r;skinG+=g;skinB+=b;skinCount++;
      }
    }
  }
  const skinHex=skinCount>20?rgb2hex(skinR/skinCount,skinG/skinCount,skinB/skinCount):'#e8b88a';
  // 2. 发色提取：取顶部区域(0%-25%)非肤色的平均颜色
  let hairR=0,hairG=0,hairB=0,hairCount=0;
  for(let y=0;y<Math.floor(h*.25);y++){
    for(let x=Math.floor(w*.2);x<Math.floor(w*.8);x++){
      const i=(y*w+x)*4;
      const r=d[i],g=d[i+1],b=d[i+2];
      const hsv=rgb2hsv(r,g,b);
      // 非肤色、较暗或饱和度低的像素视为头发
      if(!(hsv.h>=0&&hsv.h<=50&&hsv.s>=0.08&&hsv.s<=0.75&&hsv.v>=0.35)){
        hairR+=r;hairG+=g;hairB+=b;hairCount++;
      }
    }
  }
  const hairHex=hairCount>10?rgb2hex(hairR/hairCount,hairG/hairCount,hairB/hairCount):'#2a1a0a';
  // 3. 脸型比例：统计肤色像素的宽高分布
  // 找肤色区域的水平范围（脸宽）
  let minX=w,maxX=0;
  let minY=h,maxY=0;
  for(let y=Math.floor(h*.25);y<Math.floor(h*.8);y++){
    for(let x=0;x<w;x++){
      const i=(y*w+x)*4;
      const hsv=rgb2hsv(d[i],d[i+1],d[i+2]);
      if(hsv.h>=0&&hsv.h<=50&&hsv.s>=0.08&&hsv.s<=0.75&&hsv.v>=0.2){
        if(x<minX)minX=x;if(x>maxX)maxX=x;
        if(y<minY)minY=y;if(y>maxY)maxY=y;
      }
    }
  }
  const faceW=maxX-minX,faceH=maxY-minY;
  const fwRatio=faceW>0?(faceW/w):0.5;
  const flRatio=faceH>0?(faceH/h):0.5;
  // 4. 下颌角：比较脸下半部宽度 vs 上半部宽度
  let upperW=0,lowerW=0;
  const midY=minY+(maxY-minY)*0.5;
  for(let y=minY;y<midY;y++){for(let x=minX;x<=maxX;x++){const i=(y*w+x)*4;const hsv=rgb2hsv(d[i],d[i+1],d[i+2]);if(hsv.h>=0&&hsv.h<=50&&hsv.s>=0.08&&hsv.s<=0.75&&hsv.v>=0.2)upperW++}}
  for(let y=midY;y<=maxY;y++){for(let x=minX;x<=maxX;x++){const i=(y*w+x)*4;const hsv=rgb2hsv(d[i],d[i+1],d[i+2]);if(hsv.h>=0&&hsv.h<=50&&hsv.s>=0.08&&hsv.s<=0.75&&hsv.v>=0.2)lowerW++}}
  const jaRatio=lowerW>0&&upperW>0?(lowerW/upperW):0.5;
  // 5. 眼睛检测：在眼区(y 30-45%)找暗色斑点
  let eyeDarkCount=0,totalEyeArea=0;
  let eye1X=-1,eye2X=-1,eyeY=-1;
  for(let y=Math.floor(h*.3);y<Math.floor(h*.45);y++){
    let rowDark=[];
    for(let x=Math.floor(w*.2);x<Math.floor(w*.8);x++){
      const i=(y*w+x)*4;
      const brightness=(d[i]+d[i+1]+d[i+2])/3;
      if(brightness<80)rowDark.push(x);
      totalEyeArea++;
    }
    if(rowDark.length>3)eyeDarkCount+=rowDark.length;
  }
  const esRatio=eyeDarkCount>0&&totalEyeArea>0?Math.min(1,Math.max(0,(eyeDarkCount/totalEyeArea)*5)):0.5;
  // 找两眼中心位置（暗像素分布的两个峰值）
  const eyeCols={};
  for(let y=Math.floor(h*.3);y<Math.floor(h*.45);y++){
    for(let x=Math.floor(w*.2);x<Math.floor(w*.8);x++){
      const i=(y*w+x)*4;
      if((d[i]+d[i+1]+d[i+2])/3<80){
        const col=Math.floor(x/10);
        eyeCols[col]=(eyeCols[col]||0)+1;
      }
    }
  }
  const sortedCols=Object.entries(eyeCols).sort((a,b)=>b[1]-a[1]);
  if(sortedCols.length>=2){
    eye1X=parseInt(sortedCols[0][0])*10+5;
    eye2X=parseInt(sortedCols[1][0])*10+5;
  }
  const edRatio=eye1X>0&&eye2X>0?Math.min(1,Math.max(0,(Math.abs(eye1X-eye2X)/w)*2.5)):0.5;
  // 6. 嘴巴检测：在嘴区(y 55-70%)找暗色/红色像素
  let mouthDark=0,mouthArea=0;
  for(let y=Math.floor(h*.55);y<Math.floor(h*.7);y++){
    for(let x=Math.floor(w*.3);x<Math.floor(w*.7);x++){
      const i=(y*w+x)*4;
      const r=d[i],g=d[i+1],b=d[i+2];
      const hsv=rgb2hsv(r,g,b);
      if((hsv.h>=0&&hsv.h<=15&&hsv.s>=0.15)||(d[i]+d[i+1]+d[i+2])/3<70){
        mouthDark++;
      }
      mouthArea++;
    }
  }
  const mwRatio=mouthDark>0&&mouthArea>0?Math.min(1,Math.max(0,(mouthDark/mouthArea)*4)):0.5;
  // 7. 性别推测：通过脸宽/脸长比和肤色深浅做简单判断
  const skinBright=(skinR/skinCount+skinG/skinCount+skinB/skinCount)/(3*255);
  const genderGuess=fwRatio>0.38&&skinBright<0.6?'m':'f';
  // 8. 构建面部参数
  const fp={
    fw:clamp01(fwRatio*1.8),
    fl:clamp01(flRatio*1.5),
    ja:clamp01(jaRatio),
    cb:clamp01(0.4+(fwRatio-0.3)*1.5),
    bh:clamp01(0.35+esRatio*0.3),
    bd:clamp01(edRatio),
    bt:clamp01(0.4+(1-esRatio)*0.2),
    ed:clamp01(edRatio),
    es:clamp01(esRatio),
    ea:clamp01(0.45),
    eo:clamp01(0.5),
    ei:clamp01(0.45),
    nb:clamp01(0.5),
    nt:clamp01(0.5),
    nw:clamp01(0.4+(fwRatio-0.3)*1),
    nl:clamp01(flRatio*1.2),
    mw:clamp01(mwRatio),
    lu:clamp01(0.4),
    ll:clamp01(0.35),
    ma:clamp01(0.45),
    mc:clamp01(0.45),
    esz:clamp01(0.5),
    eaa:clamp01(0.5)
  };
  // 9. 应用到角色数据
  charData.skin=skinHex;
  charData.hair=hairHex;
  charData.gender=genderGuess;
  charData.fp=fp;
  charData.body.h=1.55+fwRatio*0.4;
  charData.body.build=0.3+(1-clamp01(skinBright))*0.5;
  setGenderUI();buildCharUI();
  // 10. 显示结果
  const overlay=document.getElementById('scanOverlay');
  overlay.style.display='none';
  const hint=document.getElementById('photoHint');
  hint.textContent='✅ 角色已生成！可继续微调参数';
  const snapBtn=document.getElementById('photoSnapBtn');
  snapBtn.disabled=false;snapBtn.textContent='📸 重新拍照';
  const result=document.getElementById('photoResult');
  const rows=document.getElementById('photoResultRows');
  const faceShape=fwRatio>.35?'宽脸':'窄脸';
  const faceLength=flRatio>.35?'长脸':'短脸';
  const eyeDistStr=edRatio>.5?'较宽':'较近';
  const genderStr=genderGuess==='m'?'男':'女';
  rows.innerHTML='<div class="prRow"><span>肤色</span><span style="color:'+skinHex+'">■ '+skinHex+'</span></div><div class="prRow"><span>发色</span><span style="color:'+hairHex+'">■ '+hairHex+'</span></div><div class="prRow"><span>脸型</span><span>'+faceShape+' / '+faceLength+'</span></div><div class="prRow"><span>眼距</span><span>'+eyeDistStr+'</span></div><div class="prRow"><span>推测性别</span><span>'+genderStr+'</span></div>';
  result.style.display='block';
}

function clamp01(v){return Math.max(0,Math.min(1,v))}
function rgb2hsv(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0,s=mx===0?0:d/mx,v=mx;if(d>0){if(mx===r)h=((g-b)/d+(g<b?6:0))/6;else if(mx===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6}return{h:h*360,s,v}}
function rgb2hex(r,g,b){return'#'+[r,g,b].map(x=>Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,'0')).join('')}

// 游戏内人物面板
function openPer(){const a=getAccounts().find(x=>x.uid===cur&&x.uid);const cls=P.cls?CLASSES.find(c=>c.id===P.cls).n:'自由人';const b=document.getElementById('perB');b.innerHTML=`<div class="perRow"><b>昵称</b><span>${P.name||'—'}</span></div><div class="perRow"><b>性别</b><span>${P.gender==='f'?'女':'男'}</span></div><div class="perRow"><b>职业</b><span>${cls}</span></div><div class="perRow"><b>资金</b><span>💰 ¥${P.money}</span></div><div class="perRow"><b>金币</b><span>🪙 ${P.gold||0}</span></div><div class="perRow"><b>身高</b><span>${(P.body.h*100|0)} cm</span></div><div class="perRow"><b>账号</b><span style="font-size:10px">${apiOnline()?'云端已同步':'离线模式'}</span></div>`;document.getElementById('perP').classList.add('show')}
function closePer(){document.getElementById('perP').classList.remove('show')}

// 角色渲染（真人1:1还原：性别/体型/发型/肤色/精细五官），用于玩家与预览
function drawHair(ctx,ch,hy,hr,sc,hair,g){const style=ch.hairStyle||'hair_002';if(style==='hair_005')return;ctx.fillStyle=hair;ctx.beginPath();ctx.ellipse(0,hy-2*sc,hr*1.05,hr*.72,0,Math.PI,Math.PI*2);ctx.fill();if(style==='hair_003'||style==='hair_006'){ctx.fillRect(-hr*1.05,hy-2*sc,hr*0.5,hr*1.5);ctx.fillRect(hr*0.55,hy-2*sc,hr*0.5,hr*1.5)}if(style==='hair_004'){for(let i=-2;i<=2;i++){ctx.beginPath();ctx.arc(i*hr*0.5,hy-3*sc,hr*0.4,0,6.28);ctx.fill()}}if(style==='hair_002'){ctx.strokeStyle=hair;ctx.lineWidth=1.5*sc;ctx.beginPath();ctx.moveTo(-hr,hy-1*sc);ctx.lineTo(hr,hy-1*sc);ctx.stroke()}if(style==='hair_006'){ctx.fillRect(-hr*0.4,hy-2*sc,hr*0.8,hr*1.7)}}
function drawAvatar(ctx,ch,s,z,t,st){const g=ch.gender||'m';const body=ch.body||{h:1.72,build:.5};const bScale=0.92+(Math.max(1.5,Math.min(1.95,body.h))-1.55)/0.4*0.16;const sc=z*bScale;ctx.save();ctx.translate(s.x,s.y);
  // 阴影
  ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.ellipse(0,2*z,10*z,4*z,0,0,6.28);ctx.fill();
  // 动画参数
  let ls=0,as=0,bb=0,bl=0;if(st==='walk'){ls=Math.sin(t*8)*20;as=Math.sin(t*8+3.14)*15;bb=Math.abs(Math.sin(t*8))*2}else if(st==='run'){ls=Math.sin(t*12)*35;as=Math.sin(t*12+3.14)*30;bb=Math.abs(Math.sin(t*12))*4;bl=5}else if(st==='sprint'){ls=Math.sin(t*16)*45;as=Math.sin(t*16+3.14)*40;bb=Math.abs(Math.sin(t*16))*5;bl=10}else if(st==='idle'){bb=Math.sin(t*2)*1;as=Math.sin(t*1.5)*2}else if(st==='jump'){ls=15;as=-25}
  const shW=(g==='f'?7:8)*sc*(0.85+body.build*0.3);const skin=ch.skin||'#e8b88a',shirt=ch.shirt||'#3366aa',pants=ch.pants||'#2a2a3a',hair=ch.hair||'#2a1a0a';
  // === 腿部 ===
  ctx.save();ctx.translate(-4*sc,-2*sc);ctx.rotate(ls*.0175);ctx.fillStyle=pants;ctx.fillRect(-2.5*sc,0,5*sc,15*sc);ctx.fillStyle='#222';ctx.fillRect(-3*sc,13*sc,6*sc,3*sc);ctx.restore();
  ctx.save();ctx.translate(4*sc,-2*sc);ctx.rotate(-ls*.0175);ctx.fillStyle=pants;ctx.fillRect(-2.5*sc,0,5*sc,15*sc);ctx.fillStyle='#222';ctx.fillRect(-3*sc,13*sc,6*sc,3*sc);ctx.restore();
  // === 身体（上衣）===
  ctx.save();ctx.translate(0,-bb*sc);ctx.rotate(bl*.0175);const tw=shW+1*sc;ctx.fillStyle=shirt;ctx.beginPath();ctx.moveTo(-tw,-28*sc);ctx.lineTo(tw,-28*sc);ctx.quadraticCurveTo(tw+3*sc,-28*sc,tw+3*sc,-25*sc);ctx.lineTo(tw+3*sc,-2*sc);ctx.quadraticCurveTo(tw+3*sc,0,tw,-2*sc);ctx.lineTo(-tw,-2*sc);ctx.quadraticCurveTo(-tw-3*sc,0,-tw-3*sc,-2*sc);ctx.lineTo(-tw-3*sc,-25*sc);ctx.quadraticCurveTo(-tw-3*sc,-28*sc,-tw,-28*sc);ctx.fill();
  // 衣领细节
  ctx.strokeStyle='rgba(0,0,0,.15)';ctx.lineWidth=.8*sc;ctx.beginPath();ctx.moveTo(-1.5*sc,-28*sc);ctx.lineTo(0,-26*sc);ctx.lineTo(1.5*sc,-28*sc);ctx.stroke();
  // === 手臂 ===
  ctx.save();ctx.translate(-(tw+4*sc),-26*sc);ctx.rotate(as*.0175);ctx.fillStyle=shirt;ctx.fillRect(-2.5*sc,0,5*sc,13*sc);ctx.fillStyle=skin;ctx.fillRect(-2*sc,11*sc,4*sc,5*sc);ctx.restore();
  ctx.save();ctx.translate((tw+4*sc),-26*sc);ctx.rotate(-as*.0175);ctx.fillStyle=shirt;ctx.fillRect(-2.5*sc,0,5*sc,13*sc);ctx.fillStyle=skin;ctx.fillRect(-2*sc,11*sc,4*sc,5*sc);ctx.restore();
  // === 头部 ===
  const hy=-34*sc,hr=8*sc;const fp=ch.fp||{};
  // 脖子
  ctx.fillStyle=skin;ctx.fillRect(-2.5*sc,-30*sc,5*sc,4*sc);
  // 脸型（椭圆+下颌角参数）
  const faceW=hr*(.9+(fp.fw||.5)*.3),faceH=hr*(.95+(fp.fl||.5)*.15);
  const jawW=faceW*((fp.ja||.5)*.4+.6);
  ctx.fillStyle=skin;
  ctx.beginPath();
  ctx.moveTo(-jawW,hy+faceH*.7);
  ctx.quadraticCurveTo(-faceW*1.05,hy+faceH*.3,-faceW,hy);
  ctx.ellipse(0,hy,faceW,faceH,0,Math.PI,0,true);
  ctx.quadraticCurveTo(faceW*1.05,hy+faceH*.3,jawW,hy+faceH*.7);
  ctx.quadraticCurveTo(jawW*.3,hy+faceH*1.05,0,hy+faceH);
  ctx.quadraticCurveTo(-jawW*.3,hy+faceH*1.05,-jawW,hy+faceH*.7);
  ctx.fill();
  // 颧骨阴影
  ctx.fillStyle='rgba(0,0,0,.06)';ctx.beginPath();ctx.ellipse(-(faceW*.85),(hy+faceH*.2),1.2*sc,2*sc,0,0,6.28);ctx.ellipse((faceW*.85),(hy+faceH*.2),1.2*sc,2*sc,0,0,6.28);ctx.fill();
  // 头发
  drawHair(ctx,ch,hy,hr,sc,hair,g);
  // === 眉毛 ===
  const browY=hy-faceH*.38;const browDist=(2+(fp.bd||.5)*3)*sc;const browW=3.5*sc;const browH=((fp.bt||.5)*1.5+.8)*sc;
  ctx.fillStyle=darken(hair,.7);
  ctx.beginPath();
  // 左眉
  ctx.moveTo(-browDist-browW,browY);ctx.quadraticCurveTo(-browDist,browY-browH*((fp.bh||.5)*.8+.5),-browDist+browW,browY+browH*.3);ctx.quadraticCurveTo(-browDist,-browDist,browY+browH*.1,-browDist-browW,browY);
  ctx.fill();
  ctx.beginPath();
  // 右眉
  ctx.moveTo(browDist-browW,browY+browH*.1);ctx.quadraticCurveTo(browDist,browY-browH*((fp.bh||.5)*.8+.5),browDist+browW,browY);ctx.quadraticCurveTo(browDist+browW*.5,browY+browH*.3,browDist-browW,browY+browH*.1);
  ctx.fill();
  // === 眼睛（精细版）===
  const es=(.7+(fp.es||.5)*.6)*sc,ed=(2+(fp.ed||.5)*3)*sc;
  const eyeY=hy-faceH*.15;const eyeOpen=((fp.eo||.5)*.7+.3);
  // 眼白
  ctx.fillStyle='#f5f5f0';ctx.beginPath();ctx.ellipse(-ed,eyeY,es*1.3,es*eyeOpen,0,0,6.28);ctx.ellipse(ed,eyeY,es*1.3,es*eyeOpen,0,0,6.28);ctx.fill();
  // 虹膜
  const irisR=es*.65;
  ctx.fillStyle='#5a7a5a';ctx.beginPath();ctx.arc(-ed,eyeY,irisR,0,6.28);ctx.arc(ed,eyeY,irisR,0,6.28);ctx.fill();
  // 瞳孔
  ctx.fillStyle='#1a1a2a';ctx.beginPath();ctx.arc(-ed,eyeY,irisR*.45,0,6.28);ctx.arc(ed,eyeY,irisR*.45,0,6.28);ctx.fill();
  // 眼睛高光
  ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(-ed+irisR*.2,eyeY-irisR*.2,irisR*.2,0,6.28);ctx.arc(ed+irisR*.2,eyeY-irisR*.2,irisR*.2,0,6.28);ctx.fill();
  // 上眼线
  ctx.strokeStyle='#3a2a1a';ctx.lineWidth=((fp.bt||.5)*0.6+.4)*sc;ctx.beginPath();ctx.ellipse(-ed,eyeY-es*.1,es*1.4,es*eyeOpen*1.05,0,Math.PI+.2,-.2);ctx.ellipse(ed,eyeY-es*.1,es*1.4,es*eyeOpen*1.05,0,Math.PI+.2,-.2);ctx.stroke();
  // 下眼线（淡）
  ctx.strokeStyle='rgba(60,40,20,.3)';ctx.lineWidth=.4*sc;ctx.beginPath();ctx.ellipse(-ed,eyeY+es*.1,es*1.2,es*eyeOpen*.6,0,.2,Math.PI-.2);ctx.ellipse(ed,eyeY+es*.1,es*1.2,es*eyeOpen*.6,0,.2,Math.PI-.2);ctx.stroke();
  // === 鼻子 ===
  const noseY=hy+faceH*.1;
  ctx.strokeStyle='rgba(120,80,50,.4)';ctx.lineWidth=((fp.nw||.5)*.6+.3)*sc;
  // 鼻梁
  ctx.beginPath();ctx.moveTo(-(fp.nw||.5)*sc*1,noseY-faceH*.2);ctx.quadraticCurveTo(0,noseY-faceH*((fp.nl||.5)*.1+.05),0,noseY);ctx.stroke();
  // 鼻翼
  ctx.beginPath();ctx.moveTo(0,noseY);ctx.quadraticCurveTo((fp.nw||.5)*sc*2.5,noseY+sc*.5,(fp.nt||.5)*sc*1.2,noseY+sc*((fp.nl||.5)*.5+.3));ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,noseY);ctx.quadraticCurveTo(-(fp.nw||.5)*sc*2.5,noseY+sc*.5,-(fp.nt||.5)*sc*1.2,noseY+sc*((fp.nl||.5)*.5+.3));ctx.stroke();
  // 鼻头阴影
  ctx.fillStyle='rgba(0,0,0,.08)';ctx.beginPath();ctx.ellipse(0,noseY+sc*.5,(fp.nw||.5)*sc*1.8,sc*.8,0,0,6.28);ctx.fill();
  // === 嘴巴（精细版）===
  const mouthY=hy+faceH*.45;const mouthW=((fp.mw||.5)*4+2)*sc;
  const lipThick=(fp.lu||.5)*sc*1.5+(fp.ll||.5)*sc*1;
  const mouthAngle=(fp.ma||.5)-.5;
  // 嘴唇阴影
  ctx.fillStyle=darken(skin,.85);ctx.beginPath();ctx.ellipse(0,mouthY,mouthW*1.1,1*sc,0,0,6.28);ctx.fill();
  // 上唇
  ctx.fillStyle=darken(skin,.7);ctx.beginPath();
  ctx.moveTo(-mouthW,mouthY);ctx.quadraticCurveTo(-mouthW*.5,mouthY-lipThick*.6,mouthAngle*mouthW,mouthY-lipThick*.8);
  ctx.quadraticCurveTo(mouthW*.5,mouthY-lipThick*.6,mouthW,mouthY);
  ctx.quadraticCurveTo(mouthW*.5,mouthY-lipThick*.3,0,mouthY-lipThick*.5);
  ctx.quadraticCurveTo(-mouthW*.5,mouthY-lipThick*.3,-mouthW,mouthY);
  ctx.fill();
  // 下唇
  ctx.fillStyle=darken(skin,.75);ctx.beginPath();
  ctx.moveTo(-mouthW,mouthY);ctx.quadraticCurveTo(-mouthW*.5,mouthY+lipThick*.5,mouthAngle*mouthW,mouthY+lipThick*.7);
  ctx.quadraticCurveTo(mouthW*.5,mouthY+lipThick*.5,mouthW,mouthY);
  ctx.quadraticCurveTo(mouthW*.5,mouthY+lipThick*.3,0,mouthY+lipThick*.4);
  ctx.quadraticCurveTo(-mouthW*.5,mouthY+lipThick*.3,-mouthW,mouthY);
  ctx.fill();
  // 嘴角
  ctx.strokeStyle='rgba(120,60,40,.3)';ctx.lineWidth=.3*sc;ctx.beginPath();ctx.arc(-mouthW,mouthY,sc*.4,mouthAngle>0?-.3:-1.3,mouthAngle>0?.8:.3);ctx.arc(mouthW,mouthY,sc*.4,mouthAngle>0?Math.PI-.8:Math.PI+.3,mouthAngle>0?Math.PI+.3:Math.PI+1.3);ctx.stroke();
  // === 耳朵 ===
  const earSz=((fp.esz||.5)*2+1)*sc;const earX=faceW*1.02;const earAng=((fp.eaa||.5)-.5)*.3;
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(-earX,hy+faceH*.1,earSz*.4,earSz,earAng,0,6.28);ctx.ellipse(earX,hy+faceH*.1,earSz*.4,earSz,-earAng,0,6.28);ctx.fill();
  // 耳朵阴影
  ctx.fillStyle=darken(skin,.85);
  ctx.beginPath();ctx.ellipse(-earX,hy+faceH*.1,earSz*.25,earSz*.7,earAng,0,6.28);ctx.ellipse(earX,hy+faceH*.1,earSz*.25,earSz*.7,-earAng,0,6.28);ctx.fill();

  ctx.restore();ctx.restore();}

// 颜色加深工具函数
function darken(hex,factor){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return rgb2hex(r*factor,g*factor,b*factor);
}

// ========== 充值系统 (§12 1元=10金币) ==========
function togRecharge(){const p=document.getElementById('rechargeP');p.classList.toggle('show');if(p.classList.contains('show'))buildRechargeUI()}
function buildRechargeUI(){
  document.getElementById('rcGold').textContent='🪙 '+(P.gold||0);
  const rates=[{rmb:1,gold:10,desc:'首充体验'},{rmb:6,gold:60,desc:'小额充值'},{rmb:30,gold:300,desc:'超值套餐'},{rmb:68,gold:680,desc:'推荐'},{rmb:128,gold:1280,desc:'大额'},{rmb:328,gold:3280,desc:'豪礼'},{rmb:648,gold:6480,desc:'奢华'}];
  let h='';for(const r of rates){h+=`<div class="rci" onclick="doRecharge(${r.rmb})"><span class="ramt">¥${r.rmb}</span><span class="rgold">🪙+${r.gold}</span><span class="rdsc">${r.desc}</span><span class="rcbtn">充值</span></div>`}
  // 会员开通（可选增值，过期后游戏仍可免费游玩）
  h+=`<div class="rci" onclick="doVip(30)" style="border-color:rgba(255,215,0,.45)"><span class="ramt">👑</span><span class="rgold">会员30天</span><span class="rdsc">去广告·专属外观·优先匹配（¥30）</span><span class="rcbtn">开通</span></div>`;
  document.getElementById('rechargeB').innerHTML=h;
}
// 开通会员（本地持久化；若已云端登录则同步到服务端）
async function doVip(days){
  const accs=getAccounts();const a=accs.find(x=>x.uid===(cur&&cur.uid));
  if(!a){toast('请先登录后再开通会员');return}
  a.vipExpire=Date.now()+days*864e5;saveAccounts(accs);
  if(apiOnline()){try{await apiPost('/api/player/vip',{expire_at:a.vipExpire})}catch(e){}}
  const ep=document.getElementById('expireP');if(ep)ep.style.display='none';
  toast('👑 会员已开通，有效期 '+days+' 天！');buildRechargeUI();
}
async function doRecharge(amount){
  if(!apiOnline()){toast('请先通过云端账号登录后再充值');return}
  toast('正在处理充值…');
  const res=await apiPost('/api/shop/recharge',{amount_rmb:amount});
  if(res&&res.order){
    P.gold=res.gold||P.gold;
    toast(`✅ 充值成功！¥${amount} = 🪙${res.order.gold_amount} 金币已到账`);
    buildRechargeUI();updateHud();
    // 保存到本地
    try{let ses=JSON.parse(localStorage.getItem('hx_sessions')||'{}');const c=JSON.parse(localStorage.getItem('hx_cur')||'null');if(c&&ses){ses[c.platform]=ses[c.platform]||{};ses[c.platform].gold=P.gold;localStorage.setItem('hx_sessions',JSON.stringify(ses))}}catch(e){}
  }else{
    toast('充值失败，请检查网络连接后重试');
  }
}

// ===================================================================
// 百度地图街景（全景）模块
// 玩家在游戏内的位置是 1:1 真实经纬度，可一键查看所在位置的真实街景。
// 使用百度 JSAPI GL 版 BMapGL.Panorama，需要在百度地图开放平台申请
// 「浏览器端」类型 AK（白名单设为 * 以支持本地 file:// 运行）。
// ===================================================================
const SV_AK_KEY='hx_baidu_ak';
function svGetAK(){try{return localStorage.getItem(SV_AK_KEY)||''}catch(e){return ''}}
function svSetAK(){
  const cur=svGetAK();
  const ak=prompt('请输入百度地图开放平台 AK\n（应用类型选「浏览器端」，Referer白名单填 * ）\n申请地址: lbs.baidu.com/apiconsole/key',cur);
  if(ak===null)return;
  const v=ak.trim();
  try{if(v)localStorage.setItem(SV_AK_KEY,v);else localStorage.removeItem(SV_AK_KEY)}catch(e){}
  if(v){toast('✅ 百度AK已保存');svApiPromise=null}
}

// ---- 坐标转换: WGS84 → GCJ02 → BD09 (百度全景使用BD09坐标) ----
const SV_PI=Math.PI,SV_A=6378245.0,SV_EE=0.00669342162296594323;
function svOutOfChina(lng,lat){return lng<72.004||lng>137.8347||lat<0.8293||lat>55.8271}
function svTLat(x,y){let r=-100+2*x+3*y+0.2*y*y+0.1*x*y+0.2*Math.sqrt(Math.abs(x));
  r+=(20*Math.sin(6*x*SV_PI)+20*Math.sin(2*x*SV_PI))*2/3;
  r+=(20*Math.sin(y*SV_PI)+40*Math.sin(y/3*SV_PI))*2/3;
  r+=(160*Math.sin(y/12*SV_PI)+320*Math.sin(y*SV_PI/30))*2/3;return r}
function svTLng(x,y){let r=300+x+2*y+0.1*x*x+0.1*x*y+0.1*Math.sqrt(Math.abs(x));
  r+=(20*Math.sin(6*x*SV_PI)+20*Math.sin(2*x*SV_PI))*2/3;
  r+=(20*Math.sin(x*SV_PI)+40*Math.sin(x/3*SV_PI))*2/3;
  r+=(150*Math.sin(x/12*SV_PI)+300*Math.sin(x/30*SV_PI))*2/3;return r}
function svWgs2Gcj(lng,lat){
  if(svOutOfChina(lng,lat))return[lng,lat];
  let dLat=svTLat(lng-105,lat-35),dLng=svTLng(lng-105,lat-35);
  const radLat=lat/180*SV_PI;let magic=Math.sin(radLat);magic=1-SV_EE*magic*magic;
  const sqrtMagic=Math.sqrt(magic);
  dLat=(dLat*180)/((SV_A*(1-SV_EE))/(magic*sqrtMagic)*SV_PI);
  dLng=(dLng*180)/(SV_A/sqrtMagic*Math.cos(radLat)*SV_PI);
  return[lng+dLng,lat+dLat]}
function svGcj2Bd(lng,lat){
  const xpi=SV_PI*3000/180;
  const z=Math.sqrt(lng*lng+lat*lat)+0.00002*Math.sin(lat*xpi);
  const t=Math.atan2(lat,lng)+0.000003*Math.cos(lng*xpi);
  return[z*Math.cos(t)+0.0065,z*Math.sin(t)+0.006]}
function svWgs2Bd(lng,lat){const g=svWgs2Gcj(lng,lat);return svGcj2Bd(g[0],g[1])}

// ---- 百度 JSAPI GL 动态加载 ----
let svApiPromise=null;
function svLoadAPI(){
  if(window.BMapGL&&window.BMapGL.Panorama)return Promise.resolve();
  if(svApiPromise)return svApiPromise;
  const ak=svGetAK();
  svApiPromise=new Promise((resolve,reject)=>{
    window._svApiReady=function(){
      if(window.BMapGL&&window.BMapGL.Panorama)resolve();
      else reject(new Error('BMapGL加载不完整'));
    };
    const s=document.createElement('script');
    s.src='https://api.map.baidu.com/api?type=webgl&v=1.0&ak='+encodeURIComponent(ak)+'&callback=_svApiReady';
    s.onerror=()=>{svApiPromise=null;reject(new Error('脚本加载失败'))};
    document.head.appendChild(s);
    setTimeout(()=>{if(!(window.BMapGL&&window.BMapGL.Panorama)){svApiPromise=null;reject(new Error('加载超时'))}},12000);
  });
  return svApiPromise;
}

// ---- 街景面板 ----
let svPanorama=null,svService=null;
function svHint(html){const h=document.getElementById('svHint');if(!h)return;
  if(html){h.innerHTML=html;h.style.display='block'}else h.style.display='none'}
function closeStreetView(){const p=document.getElementById('svP');if(p)p.style.display='none'}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStreetView()});

async function openStreetView(){
  const geo=w2geo(P.x,P.y);
  const prov=typeof getProvince==='function'?getProvince(P.x,P.y):'';
  // 首次使用需配置百度AK
  if(!svGetAK()){toast('首次使用街景需配置百度地图AK');svSetAK();if(!svGetAK())return}
  const p=document.getElementById('svP');p.style.display='flex';
  document.getElementById('svLoc').textContent=
    `${prov} · ${geo.lon.toFixed(5)}°E, ${geo.lat.toFixed(5)}°N`;
  svHint('⏳ 正在加载百度街景…');
  // 加载百度API
  try{await svLoadAPI()}catch(e){
    const[bx,by]=svWgs2Bd(geo.lon,geo.lat);
    svHint('❌ 百度地图API加载失败（请检查网络或AK配置）<br>'+
      `<a href="https://api.map.baidu.com/pano/?x=${bx.toFixed(6)}&y=${by.toFixed(6)}&ak=${encodeURIComponent(svGetAK())}" target="_blank">🌐 改在浏览器中打开百度全景页</a>`+
      '<br><span style="font-size:11px;opacity:.7" onclick="svSetAK()" >点此重新配置AK</span>');
    return;
  }
  // WGS84 → BD09
  const[bx,by]=svWgs2Bd(geo.lon,geo.lat);
  const pt=new BMapGL.Point(bx,by);
  if(!svService)svService=new BMapGL.PanoramaService();
  // 搜索附近1公里内最近的街景点
  svService.getPanoramaByLocation(pt,1000,data=>{
    if(data&&data.id){
      svHint('');
      if(!svPanorama){
        svPanorama=new BMapGL.Panorama('svPano',{navigationControl:true,linksControl:true,indoorSceneSwitchControl:false,albumsControl:false});
      }
      svPanorama.setId(data.id);
      if(data.position)svPanorama.setPosition(data.position);
      toast('📷 已进入真实街景，拖动画面环视四周');
    }else{
      svHint('📭 附近 1 公里内没有街景数据<br><span style="font-size:12px;opacity:.8">百度街景主要覆盖城市道路，试试传送到北京、上海、广州等大城市市区</span>');
    }
  });
}

// ========== 载具面板 ==========
function togVehicle(){const p=document.getElementById('vehicleP');p.classList.toggle('show');if(p.classList.contains('show'))buildVehicleUI()}
async function buildVehicleUI(){
  let vehicles=[];
  // 先从API加载
  if(apiOnline()){const res=await apiGet('/api/shop/vehicles');if(res&&res.vehicles){vehicles=res.vehicles;P.myVehicles=vehicles}}
  if(vehicles.length===0&&P.myVehicles&&P.myVehicles.length>0)vehicles=P.myVehicles;
  if(vehicles.length===0){
    document.getElementById('vehicleB').innerHTML='<div class="vehEmpty">还没有载具<br><span style="font-size:11px">去车行购买或充值购买载具</span></div>';
    return;
  }
  let h='';for(const v of vehicles){h+=`<div class="vehRow"><span class="vhI">${v.icon||'🚗'}</span><div><span class="vhN">${v.vehicle_name||v.VehicleName||'载具'}</span><br><span class="vhS">时速 ${v.speed||0} km/h</span></div><span class="vhR" onclick="rideVehicle('${v.vehicle_id||v.VehicleID}','${v.icon||'🚗'}','${v.speed||0}')">骑行</span></div>`}
  document.getElementById('vehicleB').innerHTML=h;
}
function rideVehicle(vid,icon,speed){
  P.vehicle=vid;P.vehicleIcon=icon;P.vehicleSpeed=parseInt(speed)||60;
  document.getElementById('vehicleP').classList.remove('show');
  toast('已骑上 '+icon+'，速度 x'+(P.vehicleSpeed/P.rs).toFixed(1));
}
function openNearShop(){
  if(!apiOnline()){let best=null,bd=Infinity;for(const s of SHOPS){const[tx,ty]=geo2tile(s.lon,s.lat);const wx=tx*T+T/2,wy=ty*T+T/2;const d=Math.hypot(wx-P.x,wy-P.y);if(d<bd){bd=d;best=s}}if(best&&bd<best.r*T+250)openShop(best);else toast('附近没有商店，去城市里找（北京/上海/深圳/广州）');return}
  // 从服务器获取商店列表
  apiGet('/api/shop/list').then(data=>{
   if(data&&data.shops){let best=null,bd=Infinity;for(const s of data.shops){const d=Math.hypot(s.shop_lon-P.x/10,s.shop_lat-P.y/10);if(d<bd){bd=d;best=s}}if(best&&bd<8){const shop={id:best.shop_id,n:best.shop_name,lon:best.shop_lon,lat:best.shop_lat,r:best.shop_range||6,items:(best.items||[]).map(it=>({n:it.item_name,i:it.icon,price:it.price}))};openShop(shop);return}}
   // fallback
   let best=null,bd=Infinity;for(const s of SHOPS){const[tx,ty]=geo2tile(s.lon,s.lat);const wx=tx*T+T/2,wy=ty*T+T/2;const d=Math.hypot(wx-P.x,wy-P.y);if(d<bd){bd=d;best=s}}if(best&&bd<best.r*T+250)openShop(best);else toast('附近没有商店')
  }).catch(()=>{let best=null,bd=Infinity;for(const s of SHOPS){const[tx,ty]=geo2tile(s.lon,s.lat);const wx=tx*T+T/2,wy=ty*T+T/2;const d=Math.hypot(wx-P.x,wy-P.y);if(d<bd){bd=d;best=s}}if(best&&bd<best.r*T+250)openShop(best);else toast('附近没有商店，去城市里找（北京/上海/深圳/广州）')})
}

// ===== 加载 =====
let lp=0;const tips=['正在连接高德地图服务...','正在加载卫星影像...','正在绘制省份边界...','正在放置城市地标...','正在注入河流湖泊...','正在召唤NPC...','准备就绪！'];
function loadStep(){lp+=14;document.getElementById('lFi').style.width=Math.min(lp,100)+'%';document.getElementById('lT').textContent=tips[Math.min(Math.floor(lp/14),tips.length-1)];
if(lp>=100){setTimeout(()=>{const p=boot();if(p&&p.catch)p.catch(e=>{if(window.__hxErr)window.__hxErr('启动失败: '+((e&&e.stack)||e));else console.error(e)})},50);return}
setTimeout(loadStep,250)}
function startGame(){
setTimeout(function(){
genMap();genVehicles();preloadTiles();
polices.length=0;P.wanted=0;P.stars=0;P.injury=0;P.jail=0;P.downed=0;P.dead=false;P.hp=P.mhp;P.sp=P.msp;P.lastCrime=0;P.lastHit=0;
document.getElementById('ld').classList.add('hide');
setTimeout(function(){document.getElementById('ld').style.display='none'},600);
lt=performance.now();requestAnimationFrame(loop);toast('欢迎来到中国！你在：'+getProvince(P.x,P.y))
},50)}
loadStep();
function preloadTiles(){
const tz=BZ;
const[cpx,cpy]=lonLatToMercPx(116.4,39.9,tz);
const hw=W/2/cam.z,hh=H/2/cam.z;
const corners=[w2sMerc(P.x-hw,P.y-hh,tz),w2sMerc(P.x+hw,P.y+hh,tz)];
const t0x=Math.floor((corners[0].x-TILE_SZ)/TILE_SZ),t0y=Math.floor((corners[0].y-TILE_SZ)/TILE_SZ);
const t1x=Math.ceil((corners[1].x+TILE_SZ)/TILE_SZ),t1y=Math.ceil((corners[1].y+TILE_SZ)/TILE_SZ);
const maxT=Math.pow(2,tz);
for(let ty=Math.max(0,t0y);ty<=Math.min(maxT-1,t1y);ty++)
for(let tx=Math.max(0,t0x);tx<=Math.min(maxT-1,t1x);tx++)
loadTile(tz+'/'+tx+'/'+ty,tx,ty,tz);}