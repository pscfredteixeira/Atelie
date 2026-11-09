/* Ateliê — consulta acadêmica individual, somente leitura.
 * Nenhuma matrícula é ativada, renovada ou modificada no navegador. */
(() => {
 'use strict';
 let currentUid=null,request=0,status='idle',items=[],message='';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const notify=()=>window.dispatchEvent(new Event('atelie-enrollments-updated'));
 function reset(uid){
  currentUid=uid||null;request++;status='idle';items=[];message='';
 }
 function displayDate(raw){
  if(typeof raw!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(raw))return null;
  const [y,m,d]=raw.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));
  if(date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)return null;
  const now=new Date();
  return {label:new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC'}).format(date),
   days:Math.round((date.getTime()-Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))/86400000)};
 }
 async function load(force=false){
  const cloud=window.AtelieCloud,uid=cloud?.user?.uid;
  if(!uid||!cloud?.loadEnrollments)return;
  if(uid!==currentUid)reset(uid);
  if(!force&&status!=='idle')return;
  const myRequest=++request;
  status='loading';message='';notify();
  try{
   const result=await cloud.loadEnrollments();
   if(uid!==currentUid||myRequest!==request)return;
   items=Array.isArray(result)?result:[];status='ready';
  }catch(error){
   if(uid!==currentUid||myRequest!==request)return;
   status='error';
   message=error?.code==='permission-denied'
    ?'O Firestore ainda não autorizou a consulta. Publique as regras de matrícula no Firebase Console.'
    :'Não foi possível consultar o Firestore: '+String(error?.code||error?.message||'erro desconhecido');
  }
  notify();
 }
 function render(){
  let html='<header class="page-heading"><span class="eyebrow">MEU ESTUDO</span><h1>Minhas matrículas</h1>'+
   '<p>Cada curso tem uma matrícula independente de quatro anos, a partir da ativação.</p></header>';
  if(status==='idle'||status==='loading')return html+
   '<section class="enroll-message"><h2>Consultando suas matrículas...</h2><p>Buscando os registros acadêmicos da sua conta Google.</p></section>';
  if(status==='error')return html+
   '<section class="enroll-message" role="alert"><h2>Não foi possível consultar suas matrículas</h2><p>'+esc(message)+'</p>'+
   '<button type="button" class="btn btn-outline" data-retry-enrollments>Tentar novamente</button></section>';
  if(!items.length)return html+
   '<section class="enroll-message"><h2>Nenhuma matrícula registrada</h2>'+
   '<p>Entrar com Google não ativa automaticamente um curso. Ainda não há matrículas administrativas vinculadas a esta conta.</p>'+
   '<a class="btn btn-primary" href="#/cursos">Explorar os cursos</a></section>';
  html+='<section class="enroll-list" aria-label="Matrículas por curso">';
  for(const item of items){
   const activated=displayDate(item.activatedOn),original=displayDate(item.originalExpiresOn),expiry=displayDate(item.expiresOn);
   const renewal=Number.isSafeInteger(item.renewalCount)&&item.renewalCount>=0?item.renewalCount:0;
   let label='Ativa',tone='active';
   if(item.state==='cancelled'){label='Cancelada';tone='inactive';}
   else if(item.state==='suspended'){label='Suspensa';tone='inactive';}
   else if(!expiry){label='Data a conferir';tone='attention';}
   else if(expiry.days<0){label='Vencida';tone='inactive';}
   else if(renewal>0){label='Adiada';tone='renewed';}
   const near=item.state==='active'&&expiry&&expiry.days>=0&&expiry.days<=90;
   const course=String(item.courseTitle||item.courseId||'Curso sem título');
   html+='<article class="enroll-card"><div class="enroll-card-heading"><div><span class="eyebrow">CURSO MATRICULADO</span>'+
    '<h2>'+esc(course)+'</h2></div><span class="enroll-pill enroll-pill--'+tone+'">'+label+'</span></div>'+
    '<dl class="enroll-details"><div><dt>Ativação</dt><dd>'+esc(activated?.label||'Não informada')+'</dd></div>'+
    '<div><dt>Vencimento original</dt><dd>'+esc(original?.label||'Não informado')+'</dd></div>'+
    '<div><dt>Vencimento atual</dt><dd>'+esc(expiry?.label||'Não informado')+'</dd></div>'+
    '<div><dt>Prorrogações anuais</dt><dd>'+renewal+'</dd></div></dl>'+
    (near?'<p class="enroll-alert">Próxima do vencimento · '+expiry.days+' dia(s) restante(s).</p>':'')+
    '<p class="enroll-footnote">Seu histórico de estudos permanece preservado mesmo depois do vencimento.</p></article>';
  }
  return html+'</section><p class="enroll-note">Somente leitura. Ativação, suspensão e prorrogação dependem de autorização administrativa e ainda não estão disponíveis no site.</p>';
 }
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-retry-enrollments]'))load(true);
 });
 window.addEventListener('atelie-cloud-auth',event=>reset(event.detail?.uid));
 window.AtelieEnrollments={render,load,reset};
})();
