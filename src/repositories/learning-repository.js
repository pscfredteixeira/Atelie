/* Sprint 10 — Progresso e notas locais, isolados por perfil SIMULADO.
   Não autentica ninguém, não coleta nome/email e não sincroniza. */
const DB="atelier-learning-v1",STORE="states";
const pendingWrites=new Map(); // Sequencial por perfil/curso/aula: evita perda de nota ou resposta.

const PROFILE_KEY="atelier-demo-profile-v1";
export const DEMO_PROFILES=Object.freeze([
 {id:"teste-a",label:"Aluno de teste A"},{id:"teste-b",label:"Aluno de teste B"}
]);
let memoryProfile="teste-a",connection;
export function getDemoProfile(){
 try{
  const value=localStorage.getItem(PROFILE_KEY);
  return DEMO_PROFILES.some(p=>p.id===value)?value:memoryProfile;
 }catch{return memoryProfile}
}
export function setDemoProfile(id){
 if(!DEMO_PROFILES.some(p=>p.id===id))throw Error("Perfil de teste inválido.");
 memoryProfile=id;
 try{localStorage.setItem(PROFILE_KEY,id)}catch{/* armazenamento negado; válido nesta sessão */}
}
function openDB(){
 if(!globalThis.indexedDB)return Promise.reject(Error("IndexedDB indisponível neste navegador."));
 if(connection)return connection;
 connection=new Promise((resolve,reject)=>{
   let request;
   try{request=indexedDB.open(DB,1)}catch(err){reject(err);return}
   request.onupgradeneeded=()=>{
     const db=request.result;
     if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:"key"});
   };
   request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();connection=null};resolve(db)};
   request.onerror=()=>reject(Error("Não foi possível acessar o histórico local."));
   request.onblocked=()=>reject(Error("Feche outras abas antes de continuar."));
 }).catch(err=>{connection=null;throw err});
 return connection;
}
async function operate(mode,handler){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  let tx,output;
  try{tx=db.transaction(STORE,mode)}catch(err){reject(err);return}
  tx.oncomplete=()=>resolve(output);
  tx.onerror=()=>reject(tx.error||Error("Falha ao salvar histórico local."));
  tx.onabort=()=>reject(Error("Operação de histórico interrompida."));
  try{const req=handler(tx.objectStore(STORE));if(req)req.onsuccess=()=>output=req.result}
  catch(err){try{tx.abort()}catch{}reject(err)}
 });
}
const key=(p,c,l)=>p+"::"+c+"::"+l;
function defaults(profileId,courseId,lessonId){
 return {key:key(profileId,courseId,lessonId),profileId,courseId,lessonId,completed:false,
  completedAt:null,note:"",answers:{},lastOpenedAt:null,updatedAt:null,revision:1};
}
export async function getLearningState(courseId,lessonId,profileId=getDemoProfile()){
 return (await operate("readonly",s=>s.get(key(profileId,courseId,lessonId))))||defaults(profileId,courseId,lessonId);
}
export async function updateLearningState(courseId,lessonId,change,profileId=getDemoProfile()){
 const writeKey=key(profileId,courseId,lessonId);
 const previous=pendingWrites.get(writeKey)||Promise.resolve();
 const running=previous.catch(()=>{}).then(async()=>{
 if(!/^[\w-]+$/.test(courseId)||!/^[\w-]+$/.test(lessonId)||!/^[\w-]+$/.test(profileId))throw Error("Identificador inválido.");
 const prev=await getLearningState(courseId,lessonId,profileId);
 const next={...prev};
 if(Object.hasOwn(change,"note")){
  if(typeof change.note!=="string"||change.note.length>20000)throw Error("Anotação deve ter até 20 mil caracteres.");
  next.note=change.note;
 }
 if(Object.hasOwn(change,"completed")){
  next.completed=change.completed===true;
  next.completedAt=next.completed?new Date().toISOString():null;
 }
 if(Object.hasOwn(change,"answer")&&change.answer){
   const {blockId,selection,correct}=change.answer;
   if(!/^[\w-]+$/.test(blockId)||typeof selection!=="string")throw Error("Resposta inválida.");
   next.answers={...prev.answers,[blockId]:{selection,correct:correct===true,at:new Date().toISOString()}};
 }
 if(Object.hasOwn(change,"clearAnswerIds")){
   const ids=change.clearAnswerIds;
   if(!Array.isArray(ids)||ids.length>2000||!ids.every(x=>typeof x==="string"&&/^[A-Za-z0-9_-]+$/.test(x)))
     throw Error("Lista de questões inválida para reiniciar o quiz.");
   next.answers={...next.answers};
   for(const id of ids)delete next.answers[id];
 }
 if(change.opened===true)next.lastOpenedAt=new Date().toISOString();
 next.updatedAt=new Date().toISOString();
 await operate("readwrite",s=>s.put(next));
 return next;

 });
 pendingWrites.set(writeKey,running);
 try{return await running;}
 finally{if(pendingWrites.get(writeKey)===running)pendingWrites.delete(writeKey);}
}
export async function deleteLearningState(courseId,lessonId,profileId=getDemoProfile()){
 await operate("readwrite",s=>s.delete(key(profileId,courseId,lessonId)));
}
export async function listLearningStates(profileId=getDemoProfile()){
 const all=await operate("readonly",s=>s.getAll());
 return (all||[]).filter(x=>x.profileId===profileId);
}
export async function exportLearningStates(){
 return {format:"atelier-learning-backup",schemaVersion:1,exportedAt:new Date().toISOString(),
  profiles:DEMO_PROFILES,states:await operate("readonly",s=>s.getAll())};
}
export function validateLearningBackup(data){
 if(data?.format!=="atelier-learning-backup"||data.schemaVersion!==1||!Array.isArray(data.states))
   throw Error("Arquivo não é um backup de aprendizagem compatível.");
 if(data.states.length>25000)throw Error("Backup de aprendizagem excessivamente grande.");
 const records=data.states.map(x=>{
  if(!x||!DEMO_PROFILES.some(p=>p.id===x.profileId)||
    typeof x.courseId!=="string"||!(/^[A-Za-z0-9_-]+$/).test(x.courseId)||
    typeof x.lessonId!=="string"||!(/^[A-Za-z0-9_-]+$/).test(x.lessonId)||
    typeof x.note!=="string"||x.note.length>20000||
    typeof x.answers!=="object"||x.answers===null||Array.isArray(x.answers)||
    Object.keys(x.answers).length>2000)
    throw Error("Registro de aprendizagem inválido no backup.");
  for(const [blockId,answer] of Object.entries(x.answers)){
    if(!(/^[A-Za-z0-9_-]+$/).test(blockId)||!answer||typeof answer.selection!=="string"||
      answer.selection.length>1000||typeof answer.correct!=="boolean")
      throw Error("Resposta inválida no backup de aprendizagem.");
  }
  return {...x,key:key(x.profileId,x.courseId,x.lessonId),completed:x.completed===true};
 });
 return records;
}
export async function importLearningStates(data){
 const records=validateLearningBackup(data);
 const db=await openDB();
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite"),s=tx.objectStore(STORE);
  records.forEach(item=>s.put(item));
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error("Importação interrompida."));tx.onabort=()=>reject(Error("Importação cancelada."));
 });
 return records.length;
}
