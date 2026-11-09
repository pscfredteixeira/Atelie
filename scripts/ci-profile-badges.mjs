import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const rules=await readFile('firestore.rules','utf8');
for(const token of ["match /users/{userId}/profile/{docId}","request.auth.uid == userId","allow list: if false","hasOnly(['preferredName','phone','updatedAt'])"]){
 assert.ok(rules.includes(token),'Regra ausente: '+token);
}
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const base='http://127.0.0.1:4173/';
const login=(uid,name,email)=>({uid,displayName:name,email,photoURL:null});
const cloudState=(completed,updatedAt)=>({saved:['formacao-freudiana'],completed,notes:{},answers:{},updatedAt});
try{
 await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await page.goto(base+'#/perfil',{waitUntil:'domcontentloaded'});
 await page.locator('[data-profile-login]').waitFor();
 assert.equal(await page.locator('.personal-badge-card').count(),0);
 await page.evaluate(({user,profile,state})=>{
  window.__profileWrites=[];
  window.AtelieCloud={
   user,ready:true,profileStatus:'ready',profile,
   save:async()=>true,logout:async()=>true,
   saveProfile:async fields=>{
    window.__profileWrites.push({...fields});
    const saved={...fields,updatedAt:Date.now()};
    window.AtelieCloud.profile=saved;
    dispatchEvent(new CustomEvent('atelie-cloud-profile',{detail:{uid:window.AtelieCloud.user.uid,status:'ready',profile:saved}}));
    return saved;
   }
  };
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:user.uid}}));
  dispatchEvent(new CustomEvent('atelie-cloud-profile',{detail:{uid:user.uid,status:'ready',profile}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid:user.uid,exists:true,state}}));
 },{user:login('student-A','Estudante A','a@example.com'),profile:{preferredName:'A',phone:''},state:cloudState(['escuta-que-mudou-a-clinica'],100)});
 await page.locator('#profilePreferredName').waitFor();
 assert.equal(await page.locator('#profilePreferredName').inputValue(),'A');
 assert.equal(await page.locator('.personal-badge-card.is-earned').count(),1);
 await page.locator('#profilePreferredName').fill('Nome A');
 await page.locator('#profilePhone').fill('(11) 90000-0000');
 await page.locator('#profileSave').click();
 await page.locator('#profileSaveStatus').getByText('Alterações salvas',{exact:false}).waitFor();
 assert.equal(await page.evaluate(()=>window.__profileWrites[0].phone),'(11) 90000-0000');
 await page.evaluate(({user})=>{
  window.AtelieCloud.user=user;
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:user.uid}}));
  dispatchEvent(new CustomEvent('atelie-cloud-profile',{detail:{uid:user.uid,status:'ready',profile:null}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid:user.uid,exists:false,state:null}}));
 },{user:login('student-B','Estudante B','b@example.com')});
 await page.locator('#profilePreferredName').waitFor();
 assert.equal(await page.locator('#profilePreferredName').inputValue(),'');
 assert.equal(await page.locator('.personal-badge-card.is-earned').count(),0);
 assert.match(await page.locator('.profile-identity-head').innerText(),/b@example.com/);
 await page.evaluate(({user,profile,state})=>{
  window.AtelieCloud.user=user;
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:user.uid}}));
  dispatchEvent(new CustomEvent('atelie-cloud-profile',{detail:{uid:user.uid,status:'ready',profile}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid:user.uid,exists:true,state}}));
 },{user:login('student-A','Estudante A','a@example.com'),profile:{preferredName:'Nome A',phone:'(11) 90000-0000'},state:cloudState(['escuta-que-mudou-a-clinica'],101)});
 assert.equal(await page.locator('.personal-badge-card.is-earned').count(),1);
 assert.equal(await page.locator('#profilePreferredName').inputValue(),'Nome A');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
 console.log('OK — perfil editável e conquistas isolados por conta Google simulada.');
 console.log('Nota: regras lidas no repositório; publicação real no Firestore não é comprovada aqui.');
} finally {await browser.close();}
