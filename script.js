let peer, localStream, model, detecting=false, lastPerson=false, dataConn=null, blackMode=false;
let laptopId='bestie-'+Math.floor(1000+Math.random()*9000);

async function loadAI(){
 document.getElementById('aiLoad').textContent='🧠 Loading local AI... 5 sec';
 try{
  model=await cocoSsd.load({base:'lite_mobilenet_v2'});
  document.getElementById('aiLoad').textContent='✅ AI Ready - Local, No API Key - GitHub Safe';
  document.getElementById('aiLoad').style.color='var(--green)';
 }catch(e){ document.getElementById('aiLoad').textContent='AI failed: '+e.message; }
}

function beLaptop(){
 document.getElementById('laptopBox').style.display='block'; document.getElementById('phoneBox').style.display='none';
 peer=new Peer(laptopId);
 peer.on('open', id=>{
  document.getElementById('myIdText').textContent=id;
  document.getElementById('qrcodeBox').innerHTML=''; new QRCode(document.getElementById('qrcodeBox'),{text:id,width:190,height:190});
 });
 peer.on('call', call=>{
  call.answer();
  call.on('stream', s=>{ document.getElementById('remoteVideo').srcObject=s; document.getElementById('liveText').textContent='● LIVE AI'; document.getElementById('qrArea').style.display='none'; });
 });
 peer.on('connection', conn=>{
  conn.on('data', d=>{ if(d.type==='person') showLaptopAlert(d.found); });
 });
 loadAI();
}

async function bePhone(){
 document.getElementById('laptopBox').style.display='none'; document.getElementById('phoneBox').style.display='block';
 try{
  localStream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:480},height:{ideal:480},aspectRatio:1,facingMode:'environment',frameRate:{ideal:10,max:12}},audio:false});
  document.getElementById('localVideo').srcObject=localStream;
  peer=new Peer(); await loadAI(); startAIDetect();
  if('wakeLock' in navigator){ try{ await navigator.wakeLock.request('screen'); }catch(e){} }
  document.getElementById('stealthBtn').style.display='block';
 }catch(e){ alert(e.message); }
}

function connectPhone(){
 const rid=document.getElementById('remoteId').value.trim(); if(!rid) return alert('Type ID');
 peer.call(rid, localStream); dataConn=peer.connect(rid);
 document.getElementById('phoneStatus').textContent='✅ Connected - AI Watching'; document.getElementById('phoneConnectArea').style.display='none';
}

async function startAIDetect(){
 if(!model) return;
 const video=document.getElementById('localVideo'), canvas=document.getElementById('localCanvas'), ctx=canvas.getContext('2d');
 setInterval(async ()=>{
  if(video.readyState<2) return;
  canvas.width=video.videoWidth; canvas.height=video.videoHeight;
  const preds=await model.detect(video); ctx.clearRect(0,0,canvas.width,canvas.height);
  let personFound=false;
  preds.forEach(p=>{
   if(p.class==='person' && p.score>0.55){
    personFound=true; ctx.strokeStyle='#ff3b30'; ctx.lineWidth=4; ctx.strokeRect(p.bbox[0],p.bbox[1],p.bbox[2],p.bbox[3]);
    ctx.fillStyle='#ff3b30'; ctx.fillRect(p.bbox[0],p.bbox[1]-20,p.bbox[2],20);
    ctx.fillStyle='white'; ctx.font='14px sans-serif'; ctx.fillText('PERSON '+(p.score*100).toFixed(0)+'%',p.bbox[0]+5,p.bbox[1]-5);
   }
  });
  const alertEl=document.getElementById('phoneAlert'), blackAI=document.getElementById('blackAI');
  if(personFound &&!lastPerson){ alertEl.style.display='block'; blackAI.textContent='🚨 PERSON DETECTED!'; if(dataConn) dataConn.send({type:'person',found:true}); if(navigator.vibrate) navigator.vibrate([200,100,200]); }
  else if(!personFound && lastPerson){ alertEl.style.display='none'; blackAI.textContent='✅ No person'; if(dataConn) dataConn.send({type:'person',found:false}); }
  lastPerson=personFound;
 }, 800);
}

function showLaptopAlert(found){
 const a=document.getElementById('laptopAlert'), s=document.getElementById('laptopSafe');
 if(found){ a.style.display='block'; s.style.display='none'; document.getElementById('beep').play().catch(()=>{}); document.title='🚨 PERSON IN SHOP!'; }
 else{ a.style.display='none'; s.style.display='block'; document.title='Shop CCTV AI'; setTimeout(()=>{s.style.display='none'},3000); }
}

async function startPiP(){
 const video=document.getElementById('remoteVideo');
 try{ if(document.pictureInPictureElement) await document.exitPictureInPicture(); else await video.requestPictureInPicture(); }catch(e){ alert(e.message); }
}

function toggleBlack(){ const b=document.getElementById('blackScreen'); blackMode=!blackMode; if(blackMode) b.classList.add('on'); else b.classList.remove('on'); }