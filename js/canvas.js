/* ─── Sidebar ───────────────────────────────────────── */
let sidebarOpen=true;
function toggleSidebar() {
  if (window.innerWidth<=680) {
    const sb=document.getElementById('sidebar'), ov=document.getElementById('sb-overlay');
    const open=sb.classList.toggle('open'); ov.classList.toggle('visible',open);
  } else {
    sidebarOpen=!sidebarOpen;
    document.getElementById('sidebar').classList.toggle('collapsed',!sidebarOpen);
  }
}
function closeSidebar() { UI._closeSidebarMobile(); }

/* ─── Canvas ────────────────────────────────────────── */
function _drawHex(ctx, cx, cy, s, strokeColor) {
  const pts=[];
  for (let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6;pts.push([cx+Math.round(s*Math.cos(a)),cy+Math.round(s*Math.sin(a))]);}
  ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
  for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.closePath(); ctx.lineWidth=1; ctx.strokeStyle=strokeColor; ctx.stroke();
}
function drawHoneycomb() {
  const canvas=document.getElementById('key-honeycomb'); if (!canvas) return;
  const W=window.innerWidth, H=window.innerHeight;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,W,H);
  const sz=16, cols=Math.ceil(W/(sz*1.73))+2, rows=Math.ceil(H/(sz*2))+2;
  for (let row=-1;row<rows;row++)
    for (let col=-1;col<cols;col++)
      _drawHex(ctx, col*sz*1.73+(row%2===0?0:sz*0.87), row*sz*1.5, sz, 'rgba(200,160,60,0.35)');
}
function drawChatHoneycomb() {
  const canvas=document.getElementById('chat-honeycomb'); if (!canvas) return;
  const W=window.innerWidth, H=window.innerHeight;
  canvas.width=W; canvas.height=H;
  const showIt = state.honeycomb;
  canvas.style.opacity = showIt ? '0.18' : '0';
  const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,W,H);
  const sz=16, cols=Math.ceil(W/(sz*1.73))+2, rows=Math.ceil(H/(sz*2))+2;
  for (let row=-1;row<rows;row++)
    for (let col=-1;col<cols;col++)
      _drawHex(ctx, col*sz*1.73+(row%2===0?0:sz*0.87), row*sz*1.5, sz, 'rgba(200,160,60,0.35)');
}
function setHoneycomb(on) {
  state.honeycomb=on;
  localStorage.setItem('pollen_honeycomb', on?'1':'0');
  const c=document.getElementById('chat-honeycomb');
  if(c) c.style.opacity=on?'0.18':'0';
}
