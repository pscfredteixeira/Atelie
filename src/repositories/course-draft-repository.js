/* Sprint 5 — Armazenamento exclusivamente local de manifestos de curso.
   Banco separado de lesson-drafts para evitar mudanças incompatíveis no IndexedDB
   já usado pelas aulas. Nada é enviado ao GitHub automaticamente. */
import {validateCourse,ContentError} from "./validators.js";
const DB_NAME="atelier-course-drafts-v1";
const STORE="courses";
let connection;
function openDatabase(){
  if(!globalThis.indexedDB)
    return Promise.reject(new ContentError("Este navegador não permite salvar cursos localmente.","storage_unavailable"));
  if(connection)return connection;
  connection=new Promise((resolve,reject)=>{
    let request;
    try{request=indexedDB.open(DB_NAME,1)}
    catch{reject(new ContentError("O armazenamento de cursos foi bloqueado.","storage_unavailable"));return}
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:"id"});
    };
    request.onsuccess=()=>{
      const db=request.result;
      db.onversionchange=()=>{db.close();connection=null};
      resolve(db);
    };
    request.onerror=()=>reject(new ContentError("Não foi possível abrir os rascunhos de cursos.","storage_unavailable"));
    request.onblocked=()=>reject(new ContentError("Feche outras abas do Atelier para atualizar o armazenamento.","storage_unavailable"));
  }).catch(err=>{connection=null;throw err});
  return connection;
}
async function transaction(mode,operation){
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    let tx,output;
    try{tx=db.transaction(STORE,mode);}
    catch{reject(new ContentError("Armazenamento de cursos indisponível.","storage_unavailable"));return}
    tx.oncomplete=()=>resolve(output);
    tx.onerror=()=>reject(new ContentError("Falha ao acessar o armazenamento de cursos.","storage_unavailable"));
    tx.onabort=()=>reject(new ContentError("Operação de curso interrompida.","storage_unavailable"));
    try{
      const req=operation(tx.objectStore(STORE));
      if(req)req.onsuccess=()=>{output=req.result};
    }catch(err){tx.abort();}
  });
}
export async function getCourseDraft(id){
  return (await transaction("readonly",store=>store.get(id)))||null;
}
export async function listCourseDrafts(){
  const records=await transaction("readonly",store=>store.getAll());
  return (records||[]).sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
}
export async function saveCourseDraft(course){
  if(course.status!=="draft")throw new ContentError("Somente rascunhos podem ser gravados localmente.","invalid");
  validateCourse(course);
  const immutable=JSON.parse(JSON.stringify(course));
  const record={id:immutable.id,course:immutable,savedAt:new Date().toISOString()};
  await transaction("readwrite",store=>store.put(record));
  return record;
}
export async function deleteCourseDraft(id){
  await transaction("readwrite",store=>store.delete(id));
}
