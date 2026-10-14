/* Rascunhos locais do Atelier. IndexedDB; nenhuma conexão com servidor. */
import {ContentError,validateLesson} from "./validators.js";
const DB_NAME="atelier-local-v1";
const STORE="lesson-drafts";
let openPromise;
function database(){
  if(!globalThis.indexedDB)return Promise.reject(new ContentError("Este navegador não disponibiliza armazenamento local IndexedDB.","storage_unavailable"));
  if(openPromise)return openPromise;
  openPromise=new Promise((resolve,reject)=>{
    let request;
    try{request=indexedDB.open(DB_NAME,1);}
    catch(e){reject(new ContentError("O armazenamento local está bloqueado.","storage_unavailable"));return;}
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:"key"});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(new ContentError("Não foi possível abrir o armazenamento de rascunhos.","storage_unavailable"));
    request.onblocked=()=>reject(new ContentError("Feche outras abas antigas do Atelier para continuar.","storage_unavailable"));
  }).catch(err=>{openPromise=null;throw err});
  return openPromise;
}
async function operation(mode,action){
  const db=await database();
  return new Promise((resolve,reject)=>{
    let tx;
    try{tx=db.transaction(STORE,mode);}
    catch{reject(new ContentError("Armazenamento local indisponível.","storage_unavailable"));return;}
    let result;
    tx.oncomplete=()=>resolve(result);
    tx.onerror=()=>reject(new ContentError("Falha ao salvar ou consultar dados neste navegador.","storage_unavailable"));
    tx.onabort=()=>reject(new ContentError("A operação local foi interrompida.","storage_unavailable"));
    try{
      const req=action(tx.objectStore(STORE));
      if(req)req.onsuccess=()=>{result=req.result};
    }catch{tx.abort();}
  });
}
const key=(courseId,lessonId)=>courseId+"::"+lessonId;
export async function getDraft(courseId,lessonId){
  const value=await operation("readonly",store=>store.get(key(courseId,lessonId)));
  return value??null;
}
export async function saveDraft(courseId,lesson) {
  validateLesson(lesson);
  if(lesson.courseId!==courseId)throw new ContentError("O rascunho pertence a outro curso.","invalid");
  // Restrições editoriais: rascunho jamais recebe status publicado por acidente.
  const copy=JSON.parse(JSON.stringify({...lesson,status:"draft"}));
  const record={key:key(courseId,lesson.id),courseId,lessonId:lesson.id,savedAt:new Date().toISOString(),lesson:copy};
  await operation("readwrite",store=>store.put(record));
  return record;
}
export async function deleteDraft(courseId,lessonId){await operation("readwrite",store=>store.delete(key(courseId,lessonId)));}
export async function listDrafts(){
  return (await operation("readonly",store=>store.getAll())||[]).sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
}
export function downloadJSON(data,filename){
  const blob=new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
