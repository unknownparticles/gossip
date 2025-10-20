/* =========================================================
   app.js — 美观重制版
   - 统一视觉：柔和配色、圆角、景深、边缘淡出
   - 三阶段中偏上居中；右上角齿轮设置 DeepSeek Key（无 Key 禁用）
   - 阴爻为两段断线；固定小卦高度，杜绝“丢爻”
   - 滚动更灵动：慢速丝滑 + 居中对位时的弹性缓动
   - DeepSeek 回复 ≤100 字
   资源：image/coin_front.png、image/coin_reverse.png
========================================================= */

/* ---------- 主题变量（可微调整体观感） ---------- */
const THEME = {
  lineDarkStart: '#0f172a',    // 卦线渐变深色
  lineDarkEnd:   '#0b1022',
  cardBg:        '#ffffff',
  cardBorder:    '#e7eaf0',
  cardGlow:      'rgba(79,70,229,.20)',
  wallBg:        'rgba(255,255,255,.78)',
  wallBlur:      '10px',
  accent:        '#4f46e5'
};

/* ---------- 必需 CSS 注入（风格整体焕新） ---------- */
(function injectCSS(){
  const css = `
  :root{
    --accent:${THEME.accent};
    --card-bg:${THEME.cardBg};
    --card-bd:${THEME.cardBorder};
    --glow:${THEME.cardGlow};
  }
  .card{background:var(--card-bg);border:1px solid var(--card-bd);border-radius:18px;box-shadow:0 10px 26px rgba(15,23,42,.06)}
  .fade-in{animation:fIn .28s ease-out}
  @keyframes fIn{from{opacity:.001;transform:translateY(6px)}to{opacity:1;transform:none}}
  .flip{animation:flip 720ms cubic-bezier(.3,.6,.2,1)}
  @keyframes flip{0%{transform:rotateY(0)}50%{transform:rotateY(540deg) scale(1.04)}100%{transform:rotateY(720deg)}}
  .btn-primary{background:var(--accent);border:1px solid var(--accent);color:#fff;font-weight:700;border-radius:12px;padding:12px 16px}
  .btn-primary:hover{filter:brightness(.98)}
  .gear{position:fixed;right:16px;top:16px;z-index:50;width:42px;height:42px;border-radius:12px;border:1px solid var(--card-bd);background:#fff;
        box-shadow:0 8px 18px rgba(15,23,42,.08);display:flex;align-items:center;justify-content:center;cursor:pointer}
  /* 滚动墙的磨砂 + 边缘淡出遮罩 */
  .wall-outer{backdrop-filter:blur(${THEME.wallBlur});background:${THEME.wallBg};border-radius:18px;border:1px solid var(--card-bd);
              box-shadow:0 12px 40px rgba(15,23,42,.07);-webkit-mask-image:linear-gradient(90deg,transparent 0, #000 6%, #000 94%, transparent 100%);
              mask-image:linear-gradient(90deg,transparent 0, #000 6%, #000 94%, transparent 100%);}
  /* 卡片初始轻微体积感 */
  .hex-card{transition:transform .45s ease, box-shadow .45s ease, opacity .45s ease, filter .45s ease, border-color .45s ease}
  `;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
})();

/* ---------- 八卦（上→下三爻） ---------- */
const TRIGRAM_BITS = {
  "乾":"111","坤":"000","坎":"010","离":"101",
  "震":"001","巽":"011","艮":"100","兑":"110",
};

/* ---------- 六十四卦（展示名不带括号来源） ---------- */
const HEX_DATA_RAW = [
  { name:"乾为天", top:"乾", bottom:"乾", brief:"六阳纯刚，天行健，君子以自强不息。" },
  { name:"坤为地", top:"坤", bottom:"坤", brief:"六阴纯柔，地势坤，君子以厚德载物。" },
  { name:"水雷屯", top:"坎", bottom:"震", brief:"水雷始生，万物初屯，宜建侯而不宁。" },
  { name:"山水蒙", top:"艮", bottom:"坎", brief:"山下出泉，童蒙待启，教学相长。" },
  { name:"水天需", top:"坎", bottom:"乾", brief:"水天相望，守正待时，有孚光亨。" },
  { name:"天水讼", top:"乾", bottom:"坎", brief:"天水分歧，争讼起，终凶宜和。" },
  { name:"地水师", top:"坤", bottom:"坎", brief:"地水聚师，众正行险，以律取胜。" },
  { name:"水地比", top:"坎", bottom:"坤", brief:"水地相亲，择主而比，吉原永贞。" },
  { name:"风天小畜", top:"巽", bottom:"乾", brief:"风天小蓄，德积未充，密云不雨。" },
  { name:"天泽履", top:"乾", bottom:"兑", brief:"天泽践履，以柔克刚，虎尾不咥。" },
  { name:"地天泰", top:"坤", bottom:"乾", brief:"天地交泰，上下相通，小往大来。" },
  { name:"天地否", top:"乾", bottom:"坤", brief:"天地不交，上下闭塞，大往小来。" },
  { name:"天火同人", top:"乾", bottom:"离", brief:"天火同德，类族辨物，同心协力。" },
  { name:"火天大有", top:"离", bottom:"乾", brief:"火天大有，遏恶扬善，万有归丰。" },
  { name:"地山谦", top:"坤", bottom:"艮", brief:"地山藏锋，卑以自牧，尊而光。" },
  { name:"雷地豫", top:"震", bottom:"坤", brief:"雷出地震，顺动豫乐，勿耽逸豫。" },
  { name:"泽雷随", top:"兑", bottom:"震", brief:"泽雷相随，随时变通，元亨无咎。" },
  { name:"山风蛊", top:"艮", bottom:"巽", brief:"山下生风，蛊坏当治，振民育德。" },
  { name:"地泽临", top:"坤", bottom:"兑", brief:"地泽临民，教思无穷，元亨利贞。" },
  { name:"风地观", top:"巽", bottom:"坤", brief:"风行地上，省方观民，盥而不荐。" },
  { name:"火雷噬嗑", top:"离", bottom:"震", brief:"雷电交击，咬合去梗，明罚敕法。" },
  { name:"山火贲", top:"艮", bottom:"离", brief:"山下有火，文质彬彬，小利有攸往。" },
  { name:"山地剥", top:"艮", bottom:"坤", brief:"山附于地，剥烂渐消，君子得舆。" },
  { name:"地雷复", top:"坤", bottom:"震", brief:"雷在地中，一阳来复，先王闭关。" },
  { name:"天雷无妄", top:"乾", bottom:"震", brief:"天雷动而无妄，循正免祸。" },
  { name:"山天大畜", top:"艮", bottom:"乾", brief:"山天蕴大，蓄德养贤，不家食吉。" },
  { name:"山雷颐", top:"艮", bottom:"震", brief:"山下有雷，慎言语节饮食，自养正。" },
  { name:"泽风大过", top:"兑", bottom:"巽", brief:"泽灭木，大过栋梁，独立不惧。" },
  { name:"坎为水", top:"坎", bottom:"坎", brief:"水洊至，行险而不失信，维心亨。" },
  { name:"离为火", top:"离", bottom:"离", brief:"火丽天，重明照四方，柔中而顺。" },
  { name:"泽山咸", top:"兑", bottom:"艮", brief:"山泽通气，感而遂通，取女吉。" },
  { name:"雷风恒", top:"震", bottom:"巽", brief:"雷风相与，久常之道，立不易方。" },
  { name:"天山遁", top:"乾", bottom:"艮", brief:"天下有山，遁世无闷，嘉遁贞吉。" },
  { name:"雷天大壮", top:"震", bottom:"乾", brief:"雷在天上，刚大盛，非礼勿履。" },
  { name:"火地晋", top:"离", bottom:"坤", brief:"火地明出，晋升有庆，昼日三接。" },
  { name:"地火明夷", top:"坤", bottom:"离", brief:"地火受伤，韬光养晦，利艰贞。" },
  { name:"风火家人", top:"巽", bottom:"离", brief:"风火相依，家道正，女内男外。" },
  { name:"火泽睽", top:"离", bottom:"兑", brief:"火泽异志，睽违终合，同而异。" },
  { name:"水山蹇", top:"坎", bottom:"艮", brief:"山上有水，蹇难在前，反身修德。" },
  { name:"雷水解", top:"震", bottom:"坎", brief:"雷雨作解，赦过宥罪，君子纾难。" },
  { name:"山泽损", top:"艮", bottom:"兑", brief:"山下有泽，损下益上，与时偕行。" },
  { name:"风雷益", top:"巽", bottom:"震", brief:"风雷激荡，损上益下，民说无疆。" },
  { name:"泽天夬", top:"兑", bottom:"乾", brief:"泽上于天，决而去小人，扬于王庭。" },
  { name:"天风姤", top:"乾", bottom:"巽", brief:"天下有风，遇而合，女壮勿用。" },
  { name:"泽地萃", top:"兑", bottom:"坤", brief:"泽地聚萃，立庙以聚，利见大人。" },
  { name:"地风升", top:"坤", bottom:"巽", brief:"地中生木，积小成高，顺而上行。" },
  { name:"泽水困", top:"兑", bottom:"坎", brief:"泽无水，困于株木，致命遂志。" },
  { name:"水风井", top:"坎", bottom:"巽", brief:"木上有水，井养不穷，改邑不改井。" },
  { name:"泽火革", top:"兑", bottom:"离", brief:"泽火相息，革命改元，顺天应人。" },
  { name:"火风鼎", top:"离", bottom:"巽", brief:"木火烹饪，鼎立新命，正位凝命。" },
  { name:"震为雷", top:"震", bottom:"震", brief:"洊雷震，恐惧修省，笑言哑哑。" },
  { name:"艮为山", top:"艮", bottom:"艮", brief:"兼山艮，止其所也，思不出位。" },
  { name:"风山渐", top:"巽", bottom:"艮", brief:"山上有木，循序渐进，女归吉。" },
  { name:"雷泽归妹", top:"震", bottom:"兑", brief:"雷泽动而嫁，悦以动，征凶无攸利。" },
  { name:"雷火丰", top:"震", bottom:"离", brief:"雷电皆至，丰大也，宜照天下。" },
  { name:"火山旅", top:"离", bottom:"艮", brief:"山上有火，旅次不安，柔得中乎外。" },
  { name:"巽为风", top:"巽", bottom:"巽", brief:"随风巽，申命行事，刚巽乎中正。" },
  { name:"兑为泽", top:"兑", bottom:"兑", brief:"丽泽兑，朋友讲习，和说以利。" },
  { name:"风水涣", top:"巽", bottom:"坎", brief:"风行水上，涣离散，王假有庙。" },
  { name:"水泽节", top:"坎", bottom:"兑", brief:"水泽有节，制度数议德行，不逾矩。" },
  { name:"风泽中孚", top:"巽", bottom:"兑", brief:"泽上有风，信及豚鱼，柔在内刚得中。" },
  { name:"雷山小过", top:"震", bottom:"艮", brief:"小过于大，宜下不宜上。" },
  { name:"水火既济", top:"坎", bottom:"离", brief:"水在火上，事已成，思患豫防。" },
  { name:"火水未济", top:"离", bottom:"坎", brief:"火在水上，事未竟，续终正也。" },
];

const HEXES = HEX_DATA_RAW.map(h=>{
  const bitsTop = TRIGRAM_BITS[h.top];
  const bitsBottom = TRIGRAM_BITS[h.bottom];
  return { topdown_bits: `${bitsTop}${bitsBottom}`, name_display:h.name, brief:h.brief };
});
const HEX_BY_TOPDOWN = Object.fromEntries(HEXES.map(h=>[h.topdown_bits,h]));

/* ---------- 工具 ---------- */
const reverseBits = s => s.split('').reverse().join('');
const hasKey = () => !!(localStorage.getItem('deepseek_key')||'').trim();

/* ---------- 自适配尺寸（更匀称的线宽/间距） ---------- */
function getSizes(){
  const w = window.innerWidth;
  if (w < 480)  return { lineH:14,lineGap:7,lineRadius:8, cardW:116,cardH:174,cardGap:14, focusMiniW:200, coin:82,title:26,textMax:38,nameH:24 };
  if (w < 1024) return { lineH:16,lineGap:8,lineRadius:9, cardW:136,cardH:188,cardGap:16, focusMiniW:220, coin:92,title:30,textMax:54,nameH:26 };
  return { lineH:18,lineGap:9,lineRadius:10,cardW:152,cardH:204,cardGap:18, focusMiniW:242, coin:98,title:34,textMax:62,nameH:28 };
}

/* ---------- 齿轮设置 ---------- */
function renderGear(){
  if (document.getElementById('gear-btn')) return;
  const gear = document.createElement('button'); gear.id='gear-btn'; gear.className='gear';
  gear.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="#0f172a" stroke-width="1.6"/>
      <path d="M19.4 12a7.4 7.4 0 0 0-.1-1l1.8-1.3-1.8-3.2-2.1.7a7.5 7.5 0 0 0-1.8-1l-.3-2.2h-3.6l-.3 2.2a7.5 7.5 0 0 0-1.8 1l-2.1-.7-1.8 3.2 1.8 1.3a7.4 7.4 0 0 0 0 2l-1.8 1.3 1.8 3.2 2.1-.7a7.5 7.5 0 0 0 1.8 1l.3 2.2h3.6l.3-2.2a7.5 7.5 0 0 0 1.8-1l2.1.7 1.8-3.2-1.8-1.3c.1-.3.1-.7.1-1Z" stroke="#0f172a" stroke-width="1.3"/>
    </svg>`;
  gear.onclick = openSettings;
  document.body.appendChild(gear);
}
function openSettings(){
  let modal = document.getElementById('settings-modal');
  if (!modal){
    modal = document.createElement('div');
    modal.id='settings-modal';
    modal.style.cssText=`position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:60;background:rgba(0,0,0,.35)`;
    modal.innerHTML = `
      <div class="card" style="width:min(92vw,420px);padding:18px;border-radius:18px;background:#fff">
        <h3 style="font-size:18px;font-weight:800;margin:4px 0 10px">设置</h3>
        <label style="font-size:14px;color:#334155">DeepSeek API Key</label>
        <input id="keyInput" type="password"
               style="width:100%;margin-top:6px;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;outline:none"
               placeholder="粘贴你的 API Key">
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px">
          <button id="cancelBtn" style="padding:8px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff">取消</button>
          <button id="saveBtn" class="btn-primary">保存</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{ if(e.target===modal) modal.remove(); });
    modal.querySelector('#cancelBtn').onclick=()=>modal.remove();
    modal.querySelector('#saveBtn').onclick=()=>{
      const v=(modal.querySelector('#keyInput').value||'').trim();
      if(!v){ alert('请输入有效的 API Key'); return; }
      localStorage.setItem('deepseek_key',v);
      modal.remove();
      const btn=document.getElementById('go');
      if(btn){ btn.disabled=false; btn.style.opacity='1'; btn.style.cursor='pointer'; btn.onclick=btn._submit; }
    };
  }
  modal.querySelector('#keyInput').value=localStorage.getItem('deepseek_key')||'';
}

/* ---------- 布局容器：中偏上 ---------- */
function wrapUpperCenter(innerHTML){
  return `
    <section class="fade-in" style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
      <div style="transform:translateY(-10vh);width:100%;display:flex;justify-content:center;">
        <div style="width:min(92vw,1100px);">${innerHTML}</div>
      </div>
    </section>`;
}

/* ---------- 阶段1：输入 ---------- */
function stage1(app){
  renderGear();
  const SZ=getSizes();
  app.innerHTML = wrapUpperCenter(`
    <div style="text-align:center">
      <h1 style="font-size:${SZ.title}px;font-weight:900;letter-spacing:.5px;margin-bottom:18px">请输入心中所惑</h1>
      <div class="card" style="padding:16px 18px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center">
        <input id="q" maxlength="100"
          style="flex:1 1 420px;max-width:560px;border:1px solid #cbd5e1;border-radius:12px;padding:12px 14px;outline:none"
          placeholder="请用在一百个字内输入你的困惑" />
        <button id="go" class="btn-primary">卜卦</button>
      </div>
    </div>
  `);
  const q=document.getElementById('q');
  const go=document.getElementById('go');
  const submit=()=>{
    const text=(q.value||'').trim();
    if(!text){ alert('请先输入你的困惑（不超过100字）'); return; }
    if(!hasKey()){ openSettings(); return; }
    stage2(app,text);
  };
  go._submit=submit;
  if(!hasKey()){ go.disabled=true; go.style.opacity='.55'; go.style.cursor='not-allowed'; go.onclick=openSettings; }
  else go.onclick=submit;
  q.addEventListener('keydown',e=>{ if(e.key==='Enter') submit(); });
}

/* ---------- 阶段2：投币动画（两批自动） ---------- */
const IMG_FRONT='image/coin_front.png';
const IMG_BACK ='image/coin_reverse.png';

function stage2(app, question){
  renderGear();
  const SZ=getSizes();
  app.innerHTML = wrapUpperCenter(`
    <div class="card" style="width:min(92vw,560px);padding:24px 22px;margin:0 auto">
      <div style="display:flex;align-items:center;justify-content:center;gap:18px;">
        ${[0,1,2].map(()=>`
          <div class="coin" style="width:${SZ.coin}px;height:${SZ.coin}px;border-radius:9999px;overflow:hidden;box-shadow:0 10px 24px rgba(0,0,0,.16)">
            <img src="${IMG_FRONT}" alt="coin" style="width:100%;height:100%;object-fit:cover;display:block">
          </div>`).join('')}
      </div>
    </div>
  `);
  const coins=[...document.querySelectorAll('.coin')];

  let linesBU=[]; // 自下而上共6爻
  let moving=[];

  const castBatch=()=>new Promise(res=>{
    coins.forEach(c=>{ c.classList.remove('flip'); void c.offsetWidth; c.classList.add('flip'); });
    setTimeout(()=>{
      coins.forEach(c=>{
        c.classList.remove('flip');
        const isFront=Math.random()<0.5;
        c.innerHTML=`<img src="${isFront?IMG_FRONT:IMG_BACK}" alt="${isFront?'front':'back'}" style="width:100%;height:100%;object-fit:cover;display:block">`;
        linesBU.push(isFront?'yang':'yin');
        // 简易动爻：与正反相关的小随机
        moving.push( (Math.random()<0.5) === isFront );
      });
      res();
    },720);
  });

  (async()=>{
    await castBatch();
    await new Promise(r=>setTimeout(r,240));
    await castBatch();

    const bitsBU = linesBU.map(x=>x==='yang'?1:0).join('');
    const bitsTD = reverseBits(bitsBU);
    const metaA = HEX_BY_TOPDOWN[bitsTD] || { name_display:'未知', brief:'', topdown_bits:bitsTD };

    const linesZhi = linesBU.map((t,i)=> moving[i] ? (t==='yang'?'yin':'yang') : t);
    const bitsBU_Z = linesZhi.map(x=>x==='yang'?1:0).join('');
    const bitsTD_Z = reverseBits(bitsBU_Z);
    const metaB = HEX_BY_TOPDOWN[bitsTD_Z] || { name_display:'未知', brief:'', topdown_bits:bitsTD_Z };

    stage3(app,{question,metaA,metaB});
  })();
}

/* ---------- 阶段3：滚动墙 + 对位 ---------- */
function stage3(app,{question,metaA,metaB}){
  renderGear();
  const SZ=getSizes();
  const miniH=6*SZ.lineH + 5*SZ.lineGap; // 固定高度，杜绝丢爻

  app.innerHTML = wrapUpperCenter(`
    <div style="display:flex;flex-direction:column;align-items:center;width:100%">
      <div class="wall-outer" style="width:min(92vw,1100px);padding:12px">
        <div id="track" style="position:relative;left:50%;display:flex;gap:${SZ.cardGap}px;transform:translateX(-50%);will-change:transform"></div>
      </div>

      <div id="focus" class="fade-in" style="margin-top:18px;width:min(92vw,1100px);display:none;flex-direction:column;align-items:center">
        <div class="card" style="width:min(92vw,760px);padding:22px 24px;text-align:center">
          <div id="focusMini" style="width:${SZ.focusMiniW}px;height:${miniH}px;margin:0 auto"></div>
          <div id="hexTitle" style="margin-top:10px;font-size:${SZ.title}px;font-weight:900"></div>
        </div>
        <div id="aiWrap" style="margin-top:14px;max-width:${SZ.textMax}ch">
          <p id="aiText" style="font-size:15.5px;line-height:1.8;color:#1f2937;text-align:left;letter-spacing:.2px"></p>
        </div>
        <button id="retry" class="btn-primary" style="margin-top:18px">再来一卦</button>
      </div>
    </div>
  `);

  const track=document.getElementById('track');
  const itemHTML=HEXES.map(m=>hexCard(m,SZ,miniH)).join('');
  track.innerHTML=itemHTML+itemHTML;

  // 连续滚动（更慢更顺）
  const ITEM_W = SZ.cardW + SZ.cardGap;
  const totalLen = HEXES.length * ITEM_W;
  let offset=0;
  const baseSpeed=Math.max(0.18, ITEM_W*0.006);
  let rafId=null;
  const loop=()=>{
    offset+=baseSpeed;
    if(offset>totalLen) offset-=totalLen;
    track.style.transform=`translateX(calc(-50% - ${offset}px))`;
    rafId=requestAnimationFrame(loop);
  };
  rafId=requestAnimationFrame(loop);

  // AI 并行；返回后“最近卡片”对位 + 柔和聚焦
  (async()=>{
    const ai = await callDeepSeek(question,metaA,metaB).catch(e=>`解卦失败：${e?.message||e}`);
    cancelAnimationFrame(rafId);

    const idx = HEXES.findIndex(h=>h.topdown_bits===metaA.topdown_bits);
    track.style.transform=`translateX(calc(-50% - ${offset}px))`;
    const cards=[...track.children];
    const centerX = track.getBoundingClientRect().left + track.getBoundingClientRect().width/2;
    const cands = cards.filter((_,i)=> i%HEXES.length===idx);
    let targetEl=cands[0], min=Infinity;
    cands.forEach(el=>{
      const r=el.getBoundingClientRect(); const d=Math.abs(r.left+r.width/2-centerX);
      if(d<min){min=d; targetEl=el;}
    });

    const r=targetEl.getBoundingClientRect();
    const need = (r.left + r.width/2) - centerX; // >0 说明偏右
    const current=offset, target= current + need;

    // 弹性缓动（比线性更自然）
    const dur=820, start=performance.now();
    const easeOutBack=t=>{ const c1=1.70158, c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); };
    function tween(now){
      const p=Math.min(1,(now-start)/dur);
      const cur = current + (target-current)*easeOutBack(p);
      track.style.transform=`translateX(calc(-50% - ${cur}px))`;
      if(p<1) requestAnimationFrame(tween);
      else afterAligned();
    }
    requestAnimationFrame(tween);

    function afterAligned(){
      const all=[...track.children];
      all.forEach(el=>{
        el.style.opacity='.18';
        el.style.filter='blur(1.2px)';
        el.style.transform='scale(.98)';
      });
      targetEl.style.opacity='1';
      targetEl.style.filter='none';
      targetEl.style.transform='translateY(-12px) scale(1.06)';
      targetEl.style.borderColor='#c7d2fe';
      targetEl.style.boxShadow=`0 24px 48px var(--glow)`;

      const focus=document.getElementById('focus');
      focus.style.display='flex';
      renderMini(document.getElementById('focusMini'), metaA.topdown_bits, SZ, miniH);
      document.getElementById('hexTitle').textContent=metaA.name_display;
      document.getElementById('aiText').textContent=ai;
      document.getElementById('retry').onclick=()=>stage1(document.getElementById('app'));
    }
  })();

  /* —— 卡片：固定卦高与标题高 —— */
  function hexCard(meta,SZ,miniH){
    const yao=renderLines(meta.topdown_bits,SZ);
    return `
      <div class="hex-card"
        style="width:${SZ.cardW}px;min-width:${SZ.cardW}px;height:${SZ.cardH}px;border-radius:16px;background:#fff;border:1px solid ${THEME.cardBorder};
               display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 12px;">
        <div class="hex-mini" style="width:100%;max-width:${SZ.cardW-20}px;height:${miniH}px;display:flex;flex-direction:column;justify-content:center">
          ${yao}
        </div>
        <div style="height:${SZ.nameH}px;line-height:${SZ.nameH}px;font-size:15px;font-weight:700;letter-spacing:.02em;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:6px">
          ${meta.name_display}
        </div>
      </div>`;
  }

  /* —— 卦线渲染：阳=整线；阴=两段断口 —— */
  function renderLines(bitsTopDown,SZ){
    const full =
      `height:${SZ.lineH}px;margin:${SZ.lineGap}px 0;border-radius:${SZ.lineRadius}px;`+
      `background:linear-gradient(180deg,${THEME.lineDarkStart},${THEME.lineDarkEnd});`+
      `box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.18)`;

    const seg =
      `height:${SZ.lineH}px;width:46%;border-radius:${SZ.lineRadius}px;`+
      `background:linear-gradient(180deg,${THEME.lineDarkStart},${THEME.lineDarkEnd});`+
      `box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.18)`;

    return bitsTopDown.split('').map(b=>{
      if (b==='1') return `<div style="${full}"></div>`;
      return `<div style="display:flex;justify-content:space-between;align-items:center;margin:${SZ.lineGap}px 0;">
                <div style="${seg}"></div><div style="${seg}"></div>
              </div>`;
    }).join('');
  }
  function renderMini(container,bitsTopDown,SZ,miniH){
    container.innerHTML = renderLines(bitsTopDown,SZ);
    container.style.height = `${miniH}px`;
  }
}

/* ---------- DeepSeek（≤100字） ---------- */
async function callDeepSeek(question,metaA,metaB){
  const q=(question||'').slice(0,100);
  const key=(localStorage.getItem('deepseek_key')||'').trim();
  if(!key) throw new Error('缺少 API Key');

  const prompt=[
    '您是一个卜卦助手，擅长根据卦象和提问生成智慧的回复，控制回复字数在100字内。',
    `问题：${q}`,
    `本卦：${metaA.name_display}；要点：${metaA.brief}`,
    `之卦：${metaB.name_display}；要点：${metaB.brief}`
  ].join('\n');

  const res = await fetch('https://api.deepseek.com/v1/chat/completions',{
    method:'POST',
    headers:{ 'Authorization':`Bearer ${key}`, 'Content-Type':'application/json' },
    body: JSON.stringify({
      model:'deepseek-chat',
      messages:[
        { role:'system', content:'您是一个卜卦助手，擅长根据卦象和提问生成智慧的回复，控制回复字数在100字内。' },
        { role:'user', content: prompt }
      ],
      max_tokens:220
    })
  });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  let out = data?.choices?.[0]?.message?.content?.trim() || '（未返回内容）';
  return out.slice(0,100);
}

/* ---------- 启动 ---------- */
(function(){
  const app=document.getElementById('app');
  stage1(app);
})();
