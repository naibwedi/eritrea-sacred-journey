import * as THREE from './assets/three.module.min.js';

const $ = (id) => document.getElementById(id);
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reduceQuery.matches;
let current = 0, night = false, touring = false, tourTimer, renderer, camera, scene;
let transition = null, dragging = false, lastPointer = null, yaw = 0, pitch = 0, currentFov = 48;
let soundContext, soundGain, soundOn = false, bellTimer, frame = 0;
const basePosition = new THREE.Vector3(), baseTarget = new THREE.Vector3();
const doors = [], candleFlames = [], interiorLights = [];
const stops = [
  {name:'Courtyard',label:'THE COURTYARD',title:'A journey into<br>the <em>sacred.</em>',description:'Beyond the doorway, a world of color, craftsmanship, and quiet devotion.',button:'Step inside',position:[26,14,35],target:[-1,5,-6],map:[80,164]},
  {name:'Doorway',label:'THE THRESHOLD',title:'Leave the world<br><em>at the door.</em>',description:'Warm stone, carved timber, and a glimpse of the luminous interior. Take a moment before entering.',button:'Enter the church',position:[0,3.1,8.5],target:[0,4,-15],map:[80,124]},
  {name:'Interior',label:'THE INTERIOR',title:'Where light<br>becomes <em>color.</em>',description:'Follow the patterned aisle beneath timber arches. Discover painted icons, brass lamps, and candlelit corners.',button:'Discover the icons',position:[0,3.1,-6],target:[0,4.5,-22],map:[80,84]},
  {name:'Sacred art',label:'SACRED ART',title:'Stories held<br>in <em>gold.</em>',description:'Look closely at the faces, colors, and fine ornament. Open the collection to explore three original illustrations.',button:'View the artwork',position:[2.7,3.65,-16.8],target:[5.1,4.3,-21.5],map:[101,50]},
  {name:'Stillness',label:'A MOMENT OF STILLNESS',title:'A little space<br>for <em>stillness.</em>',description:'The journey pauses before the sanctuary curtain. Stay a while, look around, and let the light settle.',button:'Return outside',position:[0,3.1,-15.4],target:[0,4.5,-22.5],map:[80,54]},
];
const iconInfo = [
  {name:'Mary & the Christ Child',subtitle:'A mother and her child',text:'This original illustration places Mary and the infant Christ within a field of gold, indigo, and crimson. Frontal figures and expressive eyes guide attention toward the faces.',note:'Mary has a central place in Eritrean Orthodox devotion. Enda Mariam in Asmara is dedicated to Saint Mary.'},
  {name:'Christ',subtitle:'A gesture of blessing',text:'Christ holds a closed Gospel and raises a hand in blessing. The illustration uses warm gold, deep red, and dark outlines to create a quiet, direct encounter.',note:'The composition is newly created for this demo and is not a reproduction of an icon from Enda Mariam.'},
  {name:'Archangel Michael',subtitle:'Wings, color, and intricate detail',text:'Feathered wings surround the figure of Michael. Small patterns in the garments and border reward a closer look, while the gold halo draws the composition together.',note:'This is a contemporary icon-inspired illustration. It is not a historical artifact or a claim of approved liturgical iconography.'},
];

function toast(message) { $('toast').textContent=message; $('toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),3500); }
function stopTour() { touring=false;clearTimeout(tourTimer);$('tour').setAttribute('aria-pressed','false');$('tour-label').textContent='Guided journey';$('tour-symbol').textContent='▷'; }
function queueTour() { clearTimeout(tourTimer); if(touring) tourTimer=setTimeout(()=>{if(current===4){stopTour();toast('Your journey is complete. Stay as long as you like.');}else goTo(current+1);},10000); }
function updateUI() {
  const s=stops[current];$('chapter-number').textContent=`0${current+1} / 05`;$('chapter-label').textContent=s.label;$('scene-title').innerHTML=s.title;$('scene-description').textContent=s.description;$('next').innerHTML=`${s.button} <span aria-hidden="true">↗</span>`;
  $('map-position').setAttribute('cx',s.map[0]);$('map-position').setAttribute('cy',s.map[1]);$('map-count').textContent=`0${current+1}—05`;$('map-location').textContent=s.name;
  document.querySelectorAll('[data-stop]').forEach(b=>{const active=Number(b.dataset.stop)===current;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('art-hotspot').hidden=current<2;
}
function goTo(index,instant=false) {
  if(!camera)return;
  current=THREE.MathUtils.clamp(index,0,4);yaw=0;pitch=0;currentFov=48;
  const s=stops[current], targetPosition=new THREE.Vector3(...s.position), targetLook=new THREE.Vector3(...s.target);
  if(current===0&&camera.aspect<.85){const framing=new THREE.Spherical().setFromVector3(targetPosition.clone().sub(targetLook));framing.radius*=1.3;framing.theta*=.8;targetPosition.copy(targetLook).add(new THREE.Vector3().setFromSpherical(framing));}
  // Wide opening in the facade is aligned to this path. Long jumps route through the doorway.
  const startPosition=camera.position.clone();
  const route=[startPosition];
  if(startPosition.z>1&&targetPosition.z<1)route.push(new THREE.Vector3(0,3.1,8),new THREE.Vector3(0,3.1,-2));
  if(startPosition.z<1&&targetPosition.z>1)route.push(new THREE.Vector3(0,3.1,-2),new THREE.Vector3(0,3.1,8));
  route.push(targetPosition);
  if(instant||reduced){basePosition.copy(targetPosition);baseTarget.copy(targetLook);transition=null;}
  else transition={started:performance.now(),duration:route.length>2?5200:3200,path:new THREE.CatmullRomCurve3(route,false,'centripetal'),fromLook:baseTarget.clone(),toLook:targetLook};
  updateUI();queueTour();
}

function texture(kind) {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d');
  if(kind==='stone'){
    c.fillStyle='#c3b69a';c.fillRect(0,0,512,512);
    for(let row=0;row<8;row++)for(let col=-1;col<5;col++){const x=col*128+(row%2)*64,y=row*64;c.fillStyle=`hsl(36,${16+Math.random()*6}%,${63+Math.random()*10}%)`;c.fillRect(x+1,y+1,125,61);}
  } else if(kind==='paving'){
    c.fillStyle='#a89e88';c.fillRect(0,0,512,512);
    for(let y=0;y<4;y++)for(let x=0;x<4;x++){c.fillStyle=(x+y)%2===0?'#c5baa0':'#bfb196';c.fillRect(x*128+2,y*128+2,124,124);c.strokeStyle='#ddd0b030';c.strokeRect(x*128+5,y*128+5,117,117);}
  } else if(kind==='wood'){
    c.fillStyle='#543325';c.fillRect(0,0,512,512);for(let i=0;i<400;i++){c.strokeStyle=`rgba(191,141,82,${Math.random()*.11})`;c.beginPath();const y=Math.random()*512;c.moveTo(0,y);c.bezierCurveTo(160,y+Math.random()*12,280,y-10,512,y+4);c.stroke();}
  } else if(kind==='rug'){
    c.fillStyle='#782d27';c.fillRect(0,0,512,512);c.strokeStyle='#c09b56';c.lineWidth=9;c.strokeRect(17,0,478,512);c.lineWidth=2;c.strokeRect(31,0,450,512);
    for(let y=32;y<512;y+=96)for(let x=100;x<512;x+=156){c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle='#bd9650';c.fillRect(-18,-18,36,36);c.fillStyle='#273d36';c.fillRect(-11,-11,22,22);c.restore();}
  }
  if(kind!=='rug'&&kind!=='wood')for(let i=0;i<15000;i++){const v=Math.random()>.5?255:0;c.fillStyle=`rgba(${v},${v},${v},.035)`;c.fillRect(Math.random()*512,Math.random()*512,2,2);}
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function material(color,extra={}) {return new THREE.MeshStandardMaterial({color,roughness:.8,...extra});}
function mesh(geo,mat,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const boxGeometry=new THREE.BoxGeometry(1,1,1);
function box(w,h,d,x,y,z,mat,parent=scene){const m=mesh(boxGeometry,mat,x,y,z,parent);m.scale.set(w,h,d);return m;}
function column(x,z,height,mat,gold,parent=scene) {
  mesh(new THREE.CylinderGeometry(.31,.4,height,12),mat,x,height/2+.65,z,parent);
  box(.95,.23,.95,x,.71,z,gold,parent);box(.85,.18,.85,x,height+.6,z,gold,parent);box(1.05,.16,1.05,x,height+.8,z,mat,parent);
}
function arch(width,height,thickness,depth,mat,x,y,z,parent=scene) {
  const r=width/2, shape=new THREE.Shape();shape.moveTo(-r,0);shape.lineTo(-r,height-r);shape.absarc(0,height-r,r,Math.PI,0,true);shape.lineTo(r,0);shape.lineTo(r-thickness,0);shape.lineTo(r-thickness,height-r);shape.absarc(0,height-r,r-thickness,0,Math.PI,false);shape.lineTo(-r+thickness,0);shape.closePath();
  return mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:20}),mat,x,y,z,parent);
}
function cross(x,y,z,size,mat,parent=scene){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);box(size*.15,size,size*.13,0,0,0,mat,g);box(size*.7,size*.14,size*.13,0,size*.12,0,mat,g);for(const [dx,dy] of [[0,.5],[0,-.5],[-.35,.12],[.35,.12]]){const q=box(size*.22,size*.22,size*.14,dx*size,dy*size,0,mat,g);q.rotation.z=Math.PI/4;}return g;}

// Combine fixed architectural pieces by material to keep mobile draw calls low.
function combineArchitecture(){
  scene.updateMatrixWorld(true);
  const moving=new Set(candleFlames);
  for(const {group} of doors)group.traverse(object=>moving.add(object));
  const batches=new Map();
  scene.traverse(object=>{
    if(!object.isMesh||moving.has(object))return;
    const key=object.material.uuid;
    if(!batches.has(key))batches.set(key,{material:object.material,objects:[],geometries:[]});
    const batch=batches.get(key),geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);batch.objects.push(object);batch.geometries.push(geometry);
  });
  for(const {material,objects,geometries} of batches.values()){
    const merged=new THREE.BufferGeometry();
    for(const name of ['position','normal','uv']){
      const size=name==='uv'?2:3,total=geometries.reduce((sum,g)=>sum+g.attributes[name].array.length,0),data=new Float32Array(total);
      let offset=0;for(const g of geometries){data.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length;}
      merged.setAttribute(name,new THREE.BufferAttribute(data,size));
    }
    const combined=new THREE.Mesh(merged,material);combined.castShadow=true;combined.receiveShadow=true;scene.add(combined);
    for(const object of objects)object.removeFromParent();for(const geometry of geometries)geometry.dispose();
  }
}

async function buildScene() {
  scene=new THREE.Scene();scene.background=new THREE.Color('#aaa992');scene.fog=new THREE.FogExp2('#b3b19b',.004);
  camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.08,250);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:1.8));renderer.setSize($('scene').clientWidth,$('scene').clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;$('scene').appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','3D church: drag to look around; use the numbered stops to travel');renderer.domElement.setAttribute('role','img');
  const stoneMap=texture('stone');stoneMap.repeat.set(2,2);const paveMap=texture('paving');paveMap.repeat.set(22,22);const woodMap=texture('wood');const rugMap=texture('rug');rugMap.repeat.set(1,8);
  const stone=material('#e2ceaa',{map:stoneMap}), ivory=material('#e4d4b0'), brick=material('#855744'), darkBrick=material('#704b3c'), wood=material('#b09070',{map:woodMap}), darkWood=material('#654532',{map:woodMap}), gold=material('#cfaa59',{metalness:.7,roughness:.31}), roof=material('#747768',{metalness:.3,roughness:.7}), dark=material('#182b27'), cream=material('#dfd0ab');
  const hemi=new THREE.HemisphereLight('#fff1d3','#4b6457',2.5);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#ffe2aa',3.6);sun.position.set(-22,34,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-45,right:45,top:35,bottom:-35,near:1,far:110});sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);
  const fill=new THREE.DirectionalLight('#bdd5cd',.7);fill.position.set(20,10,-12);scene.add(fill);
  scene.userData={sun,hemi,fill};
  const ground=mesh(new THREE.PlaneGeometry(230,230),material('#8c9075'),0,-.13,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  const court=mesh(new THREE.PlaneGeometry(74,80),material('#dfd1b4',{map:paveMap}),0,-.02,10);court.rotation.x=-Math.PI/2;court.castShadow=false;
  // Forecourt paving and an approach aligned with the entrance.
  for(const x of [-4.6,4.6])box(.12,.03,31,x,.02,17,brick);
  for(const x of [-24,24]){box(.7,1.1,55,x,.5,4,stone);box(.85,.12,55,x,1.1,4,cream);for(let z=-20;z<29;z+=6){box(1.05,1.6,1.05,x,.8,z,stone);box(1.22,.18,1.22,x,1.65,z,cream);}}
  for(let i=0;i<3;i++)box(23-i*.5,.22,5-i*1.2,0,.1+i*.21,1.4,stone);
  // The main basilican volume: a continuous, explorable interior.
  box(17,.45,27,0,.36,-12,stone);
  const floorMap=texture('paving');floorMap.repeat.set(5,9);box(16.6,.06,26.5,0,.62,-12,material('#eee0c3',{map:floorMap}));
  box(3.35,.035,21.5,0,.66,-10.5,material('#fff',{map:rugMap}));
  box(.65,8.2,26,-8.25,4.7,-12,stone);box(.65,8.2,26,8.25,4.7,-12,stone);box(17,9,.7,0,5,-25,stone);
  for(const x of [-8.62,8.62])for(const y of [1.2,2.8,4.4,6,7.6,8.7])box(.13,.3,26.7,x,y,-12,brick);
  for(const x of [-8.62,8.62])for(const z of [-3,-9,-15,-21])box(.3,8.5,.72,x,4.9,z,ivory);
  // Three entrance bays, with a broad central doorway and detailed timber side doors.
  for(const x of [-7.35,-3.1,3.1,7.35])box(x===-7.35||x===7.35?2.1:1.5,5.2,1,x,3.25,.7,stone);
  box(17,3.5,1,0,7.55,.7,stone);
  for(const x of [-5.25,0,5.25]){const w=x===0?4.7:3;arch(w,5.8,.36,.36,cream,x,.65,1.23);arch(w+.42,6.04,.1,.12,brick,x,.65,1.24);if(x!==0){box(2.38,4.15,.13,x,2.75,1.3,darkWood);for(const xx of [-.62,.62])for(const yy of [1.7,3.6]){box(.9,1.25,.12,x+xx,yy,1.41,wood);cross(x+xx,yy,1.49,.48,gold);}}}
  for(const y of [6.3,8.85,9.4]){box(17.9,.22,1.45,0,y,.7,cream);box(17.5,.13,1.5,0,y-.2,.72,brick);}
  for(let x=-8.4;x<=8.4;x+=.75)box(.28,.3,.33,x,9.13,1.28,cream);
  for(const sign of [-1,1]){
    const doorGroup=new THREE.Group();doorGroup.position.set(sign*2.03,.67,.8);scene.add(doorGroup);const offset=-sign*1.01;
    box(2.01,4.6,.18,offset,2.3,0,darkWood,doorGroup);
    for(const yy of [1.18,3.4]){box(1.68,1.78,.09,offset,yy,.12,wood,doorGroup);cross(offset,yy,.19,.85,gold,doorGroup);}
    box(.09,.44,.1,offset-sign*.69,2.05,.22,gold,doorGroup);doors.push({group:doorGroup,sign});
  }
  // Twin towers with alternating masonry, projecting cornices and hipped roofs.
  for(const x of [-11.6,11.6]){
    box(4.4,12.6,4.5,x,6.9,.1,stone);
    for(let y=1.3;y<12.9;y+=.88)box(4.48,.29,4.58,x,y,.1,y%2>1?brick:darkBrick);
    box(4.8,.33,4.9,x,13.22,.1,cream);box(4.65,.25,4.75,x,13.61,.1,brick);
    box(3.42,3.2,3.45,x,15.2,.1,brick);
    for(const offset of [-1.28,1.28]){box(.45,3.2,.5,x+offset,15.2,1.75,ivory);box(.45,3.2,.5,x+offset,15.2,-1.55,ivory);}
    box(1.77,2.26,.06,x,15,1.86,dark);arch(1.84,2.57,.2,.12,cream,x,13.83,1.91);
    const bell=mesh(new THREE.CylinderGeometry(.27,.55,.8,16,1,true),gold,x,14.82,1.32);box(.08,1,.08,x,15.5,1.31,darkWood);bell.castShadow=false;
    box(4.42,.24,4.48,x,16.9,.1,cream);const cap=mesh(new THREE.ConeGeometry(3.65,1.7,4),roof,x,17.87,.1);cap.rotation.y=Math.PI/4;cross(x,19.3,.1,1.6,gold);
    for(const yy of [3,7,10.5]){box(.9,1.35,.1,x,yy,2.4,dark);arch(1.12,1.6,.13,.08,cream,x,yy-.73,2.49);}
    box(5,.4,5.1,x,.7,.1,stone);
  }
  // Raised central roof and side aisle roofs.
  for(const sign of [-1,1]){const r=box(4.1,.26,27,sign*6.5,8.83,-12,roof);r.rotation.z=-sign*.15;}
  box(10.3,.25,27,0,11,-12,roof);box(10.1,2.25,26.5,0,9.88,-12,wood);
  // Omit an inward roof box: the underside becomes a coffered wooden ceiling.
  const ceiling=box(9.8,.15,25,0,8.87,-12,darkWood);ceiling.castShadow=false;
  for(let z=-1;z>-25;z-=3){box(10,.28,.3,0,8.72,z,wood);for(const x of [-3,0,3]){const q=box(.8,.07,.8,x,8.62,z-1.25,gold);q.rotation.y=Math.PI/4;}}
  for(const x of [-4.9,4.9]){box(.23,.3,25,x,8.58,-12,gold);for(const z of [-3,-8,-13,-18,-23]){column(x,z,5.3,ivory,gold);}}
  for(const z of [-3,-8,-13,-18,-23])arch(10.1,8.1,.28,.26,wood,0,.7,z);
  // Paired side arches and glowing upper windows add depth to the nave.
  for(const x of [-7.88,7.88])for(const z of [-4.5,-10.5,-16.5,-22]){
    const wg=new THREE.Group();wg.position.set(x,0,z);wg.rotation.y=x<0?Math.PI/2:-Math.PI/2;scene.add(wg);
    box(1.45,2.5,.1,0,6.25,0,material('#dcbf77',{emissive:'#e9ad43',emissiveIntensity:.3}),wg);arch(1.77,3,.18,.1,wood,0,4.95,.1,wg);box(.075,2.5,.12,0,6.25,.1,gold,wg);box(1.45,.075,.12,0,6.1,.1,gold,wg);
  }
  // Sanctuary boundary: the curtain remains closed throughout the visitor journey.
  box(15.8,7.5,.4,0,4.4,-22.7,darkWood);box(15.9,.35,.7,0,8.2,-22.6,gold);
  for(const x of [-7.8,-2.25,2.25,7.8])column(x,-22.28,6.6,wood,gold);
  const curtainMat=material('#8b2730',{roughness:.95});
  for(let i=0;i<38;i++)mesh(new THREE.CylinderGeometry(.1,.1,5.3,8),curtainMat,-1.85+i*.1,3.38,-22.22+Math.sin(i*.9)*.07);
  arch(4.5,7.35,.3,.3,gold,0,.7,-22.32);cross(0,6.66,-21.98,1.4,gold);box(4.1,.13,.08,0,1.25,-22.04,gold);
  for(const x of [-3.4,3.4]){box(.06,1,1.4,x,1.2,-19.9,gold);box(.12,.1,1.5,x,1.75,-19.9,gold);}
  const iconTexture=await new THREE.TextureLoader().loadAsync('./assets/icons.png');iconTexture.colorSpace=THREE.SRGBColorSpace;iconTexture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
  const iconMats=[0,1,2].map(i=>{const t=iconTexture.clone();t.repeat.set(1/3,1);t.offset.set(i/3,0);t.needsUpdate=true;return material('#ffffff',{map:t,roughness:.65,emissive:'#ba7736',emissiveIntensity:.1});});
  function painting(x,y,z,w,h,index,rotation=0){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rotation;scene.add(g);box(w+.3,h+.3,.14,0,0,0,darkWood,g);box(w+.14,h+.14,.09,0,0,.1,gold,g);const art=mesh(new THREE.PlaneGeometry(w,h),iconMats[index],0,0,.161,g);art.castShadow=false;for(const dx of [-1,1])for(const dy of [-1,1]){const a=box(.15,.15,.045,dx*(w/2+.04),dy*(h/2+.04),.172,gold,g);a.rotation.z=Math.PI/4;}return art;}
  painting(-5.1,4.35,-22.15,2.35,3.53,0);painting(5.1,4.35,-22.15,2.35,3.53,1);
  for(const side of [-1,1])for(let i=0;i<3;i++)painting(side*7.86,3.4,-4.9-i*6,1.95,2.93,(i+(side>0?1:0))%3,side<0?Math.PI/2:-Math.PI/2);
  for(let i=0;i<7;i++)painting((i-3)*1.93,7.64,1.26,1.22,1.83,i%3);
  // Hanging brass lamps and candles; all light sources stay outside the sanctuary.
  const flameMat=new THREE.MeshBasicMaterial({color:'#ffdf8a'}), candleMat=material('#ead5a3');
  function candle(x,y,z){mesh(new THREE.CylinderGeometry(.065,.075,.47,8),candleMat,x,y+.24,z);const f=mesh(new THREE.SphereGeometry(.053,7,7),flameMat,x,y+.54,z);f.scale.y=2.1;f.castShadow=false;candleFlames.push(f);}
  for(const z of [-6,-14,-20])for(const sign of [-1,1]){
    const x=sign*3.5;mesh(new THREE.CylinderGeometry(.04,.04,2.5,6),gold,x,7.18,z);mesh(new THREE.TorusGeometry(.66,.045,6,24),gold,x,5.98,z).rotation.x=Math.PI/2;
    mesh(new THREE.CylinderGeometry(.25,.05,.44,12),gold,x,5.73,z);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;candle(x+Math.cos(a)*.63,5.97,z+Math.sin(a)*.63);}
    const light=new THREE.PointLight('#ffd395',13,17,1.4);light.position.set(x,5.6,z);scene.add(light);interiorLights.push(light);
  }
  for(const x of [-6.5,6.5]){mesh(new THREE.CylinderGeometry(.72,.6,.14,20),gold,x,1.68,-18.7);mesh(new THREE.CylinderGeometry(.09,.16,1.1,10),gold,x,1.1,-18.7);mesh(new THREE.CylinderGeometry(.3,.46,.12,12),gold,x,.7,-18.7);for(let i=0;i<9;i++){const a=i*2.4,r=.45*Math.sqrt(i/9);candle(x+Math.cos(a)*r,1.76,-18.7+Math.sin(a)*r);}}
  const interiorAmbient=new THREE.PointLight('#ffe1ad',30,37,1.1);interiorAmbient.position.set(0,6,-10);scene.add(interiorAmbient);interiorLights.push(interiorAmbient);
  // Cypress-like forms, shrubs, and planters frame the exterior.
  const leaf=material('#3f5640'), leafLight=material('#627051'), bark=material('#67513b');
  for(const [x,z,s] of [[-20,-8,1.1],[20,-8,1.2],[-20,11,1],[20,11,1],[-18,-24,1.3],[18,-24,1.2],[-29,0,1.2],[29,-17,1.4]]){
    mesh(new THREE.CylinderGeometry(.17,.25,2.8,7),bark,x,1.3,z);
    for(let k=0;k<4;k++){const t=mesh(new THREE.SphereGeometry(1,9,8),k%2?leaf:leafLight,x,3+k*1.2*s,z);t.scale.set((1.25-k*.22)*s,(2-k*.27)*s,(1.05-k*.17)*s);}
    box(2.9,.6,2.9,x,.27,z,stone);
  }
  for(const x of [-18,18])for(const z of [1,20]){box(3.2,.6,1.2,x,.3,z,stone);for(let i=0;i<3;i++){const b=mesh(new THREE.SphereGeometry(.75,9,7),leaf,x-1+i,.9,z);b.scale.y=.7;}}
  // A quiet horizon gives the model a place without claiming a reconstruction of Asmara.
  for(let i=0;i<18;i++){const a=i*Math.PI*2/18,r=90;const h=3+(i%4)*2;const hmesh=mesh(new THREE.ConeGeometry(24,h,5),material('#7c8e79'),Math.cos(a)*r,h/2-1,Math.sin(a)*r);hmesh.castShadow=false;}
  const points=new Float32Array(240*3);for(let i=0;i<points.length;i+=3){points[i]=(Math.random()-.5)*14;points[i+1]=1+Math.random()*7;points[i+2]=-Math.random()*23;}
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(points,3));const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:'#e8c58a',size:.023,transparent:true,opacity:.4,depthWrite:false}));scene.add(dust);scene.userData.dust=dust;
  combineArchitecture();goTo(0,true);resize();installPointerControls();
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('fallback').hidden=false;$('fallback').querySelector('p').textContent='The 3D view was interrupted. Reload the page to restart, or explore the story and artwork.';stopTour();});
  renderer.setAnimationLoop(animate);
  $('loading').style.opacity='0';setTimeout(()=>$('loading').hidden=true,750);
  window.__journey={get state(){return {stop:current,night,touring,transitioning:!!transition,position:camera.position.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
}
function resize(){if(!renderer)return;const w=$('scene').clientWidth,h=$('scene').clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);if(current===0&&!transition)goTo(0,true);}
addEventListener('resize',resize);
function installPointerControls(){const canvas=renderer.domElement;canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';stopTour();});canvas.addEventListener('pointermove',e=>{if(!dragging||transition)return;const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;lastPointer={x:e.clientX,y:e.clientY};yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch+dy*.003,-.65,.75);if(current!==0)yaw=THREE.MathUtils.clamp(yaw,-1.7,1.7);});function release(){dragging=false;canvas.style.cursor='grab';}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.style.cursor='grab';canvas.addEventListener('wheel',e=>{e.preventDefault();currentFov=THREE.MathUtils.clamp(currentFov+e.deltaY*.025,28,66);},{passive:false});}
function animate(time){
  if(document.hidden)return;frame++;
  if(transition){const t=THREE.MathUtils.clamp((time-transition.started)/transition.duration,0,1),ease=t*t*(3-2*t);basePosition.copy(transition.path.getPoint(ease));baseTarget.lerpVectors(transition.fromLook,transition.toLook,ease);if(t===1)transition=null;}
  if(current===0&&!transition){const offset=basePosition.clone().sub(baseTarget);const s=new THREE.Spherical().setFromVector3(offset);s.theta+=yaw;s.phi=THREE.MathUtils.clamp(s.phi+pitch,.3,1.48);camera.position.copy(baseTarget).add(new THREE.Vector3().setFromSpherical(s));camera.lookAt(baseTarget);}
  else{camera.position.copy(basePosition);const direction=baseTarget.clone().sub(basePosition);direction.applyAxisAngle(new THREE.Vector3(0,1,0),yaw);direction.y+=pitch*direction.length();camera.lookAt(basePosition.clone().add(direction));}
  // Portrait screens use a wider lens to keep both towers visible.
  camera.fov=currentFov+(camera.aspect<.85&&current===0?17:0);camera.updateProjectionMatrix();
  for(const {group,sign} of doors){const target=current>0?sign*1.42:sign*.2;group.rotation.y=reduced?target:THREE.MathUtils.lerp(group.rotation.y,target,.04);}
  if(!reduced){for(let i=0;i<candleFlames.length;i++)candleFlames[i].scale.y=1.8+Math.sin(time*.008+i*3.5)*.35;scene.userData.dust.position.y=Math.sin(time*.00013)*.2;}
  renderer.render(scene,camera);
}

function showIcons(index=0){stopTour();const i=iconInfo[index];$('detail-body').innerHTML=`<div class="eyebrow">THE ICON COLLECTION · 0${index+1} / 03</div><h2 id="detail-title">${i.name}</h2><div class="art-layout"><div class="art-large" role="img" aria-label="Original illustration of ${i.name}" style="background-position:${index*50}% 0"></div><div><h3>${i.subtitle}</h3><p>${i.text}</p><p>${i.note}</p><div class="art-tabs" aria-label="Select artwork">${iconInfo.map((a,j)=>`<button data-art="${j}" class="${j===index?'selected':''}" aria-pressed="${j===index}">${['Mary & Child','Christ','Michael'][j]}</button>`).join('')}</div></div></div><p class="modal-note">Original AI-generated illustrations inspired by Tewahedo sacred art. These are conceptual assets created for this experience, not photographs, historical reproductions, or parish-approved icons.</p>`;
  document.querySelectorAll('[data-art]').forEach(b=>b.onclick=()=>showIcons(Number(b.dataset.art)));if(!$('details').open)$('details').showModal();
}
function showAbout(){stopTour();$('detail-body').innerHTML=`<div class="eyebrow">ERITREA · ARCHITECTURE & LIVING HERITAGE</div><h2 id="detail-title">A place to slow down.</h2><p><strong>Selam</strong> is an imagined journey through Eritrean Orthodox Tewahedo-inspired architecture. Its twin towers, bands of masonry, and painted entrance draw on visual references of Enda Mariam in Asmara. The courtyard, floor plan, interior, and lighting are a creative interpretation.</p><h3>Beyond the doorway</h3><p>Travel through five viewpoints, look around by dragging, and discover original sacred-art illustrations. Golden hour and candlelight offer two different atmospheres. Optional sound is a synthesized ambient bell and breeze, not a recording of a church service.</p><h3>A respectful boundary</h3><p>The tour pauses before a closed sanctuary curtain. It does not model the sacred contents behind it. An accurate reconstruction would require measured references and review with the church community.</p><h3>Research & references</h3><div class="source-links"><a href="https://whc.unesco.org/en/list/1550/" target="_blank" rel="noopener noreferrer">UNESCO — Asmara’s architectural context ↗</a><a href="https://commons.wikimedia.org/wiki/Category:Enda_Mariam_Cathedral,_Asmara" target="_blank" rel="noopener noreferrer">Wikimedia Commons — Enda Mariam visual references ↗</a><a href="https://english.eritreantewahdo.org/?sermons=church-utensils-and-equipment-newaye-qdisat" target="_blank" rel="noopener noreferrer">Eritrean Orthodox Diocese — church objects & incense ↗</a><a href="https://english.eritreantewahdo.org/?sermons=beg-and-plea" target="_blank" rel="noopener noreferrer">Eritrean Orthodox Diocese — icons & devotion ↗</a></div><a class="brief-link" href="./creative-brief.md" download>Download the researched creative brief ↓</a><label class="reduced-label"><input type="checkbox" id="reduce-motion" ${reduced?'checked':''}> Reduce motion & skip camera animations</label><p class="modal-note">Use the numbered stops or Left / Right arrow keys to travel. Drag to look around. Scroll to zoom. Press H to hide or show the interface. The experience is a concept demo, not an official church website.</p>`;$('reduce-motion').onchange=e=>{reduced=e.target.checked;if(reduced)goTo(current,true);};if(!$('details').open)$('details').showModal();}
$('about').onclick=showAbout;$('fallback-about').onclick=()=>{showAbout();const gallery=document.createElement('button');gallery.className='brief-link';gallery.textContent='Explore the artwork';gallery.onclick=()=>showIcons();$('detail-body').appendChild(gallery);};$('art-hotspot').onclick=()=>showIcons();$('close-details').onclick=()=>$('details').close();$('details').addEventListener('click',e=>{if(e.target===$('details')){const r=$('details').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('details').close();}});
document.querySelectorAll('[data-stop]').forEach(b=>b.onclick=()=>{stopTour();goTo(Number(b.dataset.stop));});
document.querySelector('.brand').onclick=e=>{e.preventDefault();stopTour();goTo(0);};
$('next').onclick=()=>{stopTour();if(current===3)showIcons();else goTo(current===4?0:current+1);};
$('tour').onclick=()=>{if(touring){stopTour();return;}touring=true;$('tour').setAttribute('aria-pressed','true');$('tour-label').textContent='Pause journey';$('tour-symbol').textContent='Ⅱ';goTo(current===4?0:current+1);};
$('lighting').onclick=()=>{if(!scene)return;night=!night;$('lighting').setAttribute('aria-pressed',String(night));$('light-label').textContent=night?'Candlelight':'Golden hour';$('light-icon').textContent=night?'☾':'☀';scene.background.set(night?'#182c3c':'#aaa992');scene.fog.color.set(night?'#263a43':'#b3b19b');scene.userData.sun.intensity=night?.23:3.6;scene.userData.sun.color.set(night?'#b4caff':'#ffe2aa');scene.userData.hemi.intensity=night?.65:2.5;scene.userData.fill.intensity=night?.28:.7;renderer.toneMappingExposure=night?1.13:1.05;};
function setHidden(hide){$('experience').classList.toggle('ui-hidden',hide);$('show-ui').hidden=!hide;}$('hide-ui').onclick=()=>setHidden(true);$('show-ui').onclick=()=>setHidden(false);
$('fullscreen').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{toast('Fullscreen is unavailable in this browser.');}};document.addEventListener('fullscreenchange',()=>$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'));
addEventListener('keydown',e=>{if($('details').open||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();stopTour();goTo((current+1)%5);}if(e.key==='ArrowLeft'){e.preventDefault();stopTour();goTo((current+4)%5);}if(e.key.toLowerCase()==='h')setHidden(!$('experience').classList.contains('ui-hidden'));});
async function toggleSound(){
  try{
    if(!soundContext){soundContext=new (window.AudioContext||window.webkitAudioContext)();soundGain=soundContext.createGain();soundGain.gain.value=0;soundGain.connect(soundContext.destination);const buffer=soundContext.createBuffer(1,soundContext.sampleRate*3,soundContext.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const breeze=soundContext.createBufferSource();breeze.buffer=buffer;breeze.loop=true;const filter=soundContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=350;const level=soundContext.createGain();level.gain.value=.13;breeze.connect(filter);filter.connect(level);level.connect(soundGain);breeze.start();}
    await soundContext.resume();soundOn=!soundOn;soundGain.gain.setTargetAtTime(soundOn?.17:0,soundContext.currentTime,.7);$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').setAttribute('aria-label',soundOn?'Mute ambient sound':'Enable ambient sound');$('sound').querySelector('.sound-slash').hidden=soundOn;clearInterval(bellTimer);
    const chime=()=>{if(!soundOn||document.hidden)return;const now=soundContext.currentTime;for(const [freq,amp] of [[392,.38],[784,.13],[1098,.07]]){const osc=soundContext.createOscillator(),env=soundContext.createGain();osc.frequency.value=freq;env.gain.setValueAtTime(0,now);env.gain.linearRampToValueAtTime(amp,now+.012);env.gain.exponentialRampToValueAtTime(.001,now+5);osc.connect(env);env.connect(soundGain);osc.start(now);osc.stop(now+5.1);}};
    if(soundOn){chime();bellTimer=setInterval(chime,15000);toast('Ambient bells & breeze · sound on');}
  }catch{toast('Audio is unavailable in this browser.');}
}
$('sound').onclick=toggleSound;
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTour();soundContext?.suspend();}else if(soundOn)soundContext?.resume();});
reduceQuery.addEventListener('change',e=>{reduced=e.matches;if(reduced&&camera)goTo(current,true);});
buildScene().catch(error=>{console.error('Journey initialization failed',error);$('loading').hidden=true;$('fallback').hidden=false;$('next').disabled=true;$('tour').disabled=true;});
