/* Cursos disponíveis APENAS neste dispositivo.
 * Cópia integral e consistente do manifesto e das aulas em uma transação IndexedDB.
 * Não altera o catálogo público nem requer login, servidor ou token GitHub. */
import {ContentError,validateCourse,validateLessonLink} from "./validators.js";
const DB="atelier-local-catalog-v1",STORE="published-courses";
let connection=null;
const clone=value=>JSON.parse(JSON.stringify(value));
function database(){
 if(!globalThis.indexedDB)return Promise.reject(new ContentError("O navegador não permite disponibilizar cursos localmente.","storage_unavailable"));
 if(connection)return connection;
 connection=new Promise((resolve,reject)=>{
  let r;
  try{r=indexedDB.open(DB,1)}catch(err){reject(err);return}
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:"id"})};
  r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();connection=null};resolve(db)};
  r.onerror=()=>reject(new ContentError("Não foi possível abrir o catálogo local.","storage_unavailable"));
  r.onblocked=()=>reject(new ContentError("Feche outras abas do Atelier e tente novamente.","storage_unavailable"));
 }).catch(err=>{connection=null;throw err});
 return connection;
}
async function transact(mode,callback){
 const db=await database();
 return new Promise((resolve,reject)=>{
  let tx,result;
  try{tx=db.transaction(STORE,mode)}catch(err){reject(err);return}
  tx.oncomplete=()=>resolve(result);
  tx.onerror=()=>reject(tx.error||new Error("Falha no catálogo local."));
  tx.onabort=()=>reject(new Error("A operação no catálogo local foi interrompida."));
  try{const request=callback(tx.objectStore(STORE));if(request)request.onsuccess=()=>{result=request.result}}
  catch(err){try{tx.abort()}catch{}reject(err)}
 });
}
export function validateLocalSnapshot(record){
 if(!record||record.formatVersion!==1||!record.course||
   !record.lessons||typeof record.lessons!=="object"||Array.isArray(record.lessons))
   throw Error("Registro de catálogo local inválido.");
 validateCourse(record.course);
 if(record.course.status!=="published"||record.id!==record.course.id)
   throw Error("Registro de curso local inconsistente.");
 const entries=record.course.modules.flatMap(m=>m.lessons.map(l=>({l,moduleId:m.id})));
 const keys=Object.keys(record.lessons);
 if(keys.length!==entries.length)throw Error("Curso local possui aulas extras ou faltando.");
 for(const {l,moduleId} of entries){
   const lesson=record.lessons[l.id];
   if(!lesson||lesson.id!==l.id||lesson.status!=="published")
     throw Error("Aula indisponível no registro local: "+l.id);
   validateLessonLink(lesson,record.course,moduleId);
 }
 return record;
}
export async function listLocalAvailableSnapshots(){
 const records=await transact("readonly",store=>store.getAll());
 return clone(records||[]);
}
export async function listLocalAvailableCourses(){
 const records=await transact("readonly",store=>store.getAll());
 return (records||[]).map(({id,course,availableAt})=>({
   id,title:course.title,icon:course.icon||"ψ",slug:course.slug,summary:course.description||course.subtitle||"",
   status:"published",local:true,availableAt
 }));
}
export async function getLocalAvailableCourse(id){
 const record=await transact("readonly",store=>store.get(id));
 return record?clone(record):null;
}
export async function removeLocalAvailableCourse(id){
 await transact("readwrite",store=>store.delete(id));
}
/* Recuperação exata de um snapshot validado, incluindo availableAt. */
export async function restoreLocalSnapshot(snapshot){
 validateLocalSnapshot(snapshot);
 await transact("readwrite",store=>store.put(clone(snapshot)));
}

export async function publishLocalSnapshot(course,lessons){
 const normalized=clone(course);
 normalized.status="published";
 validateCourse(normalized);
 if(!Array.isArray(lessons))throw new Error("Aulas do curso não foram carregadas.");
 const map=new Map();
 for(const item of lessons){
   const lesson=clone(item);
   if(map.has(lesson.id))throw new Error("Aula duplicada na publicação local: "+lesson.id);
   lesson.status="published";
   validateLessonLink(lesson,normalized,lesson.moduleId);
   map.set(lesson.id,lesson);
 }
 const entries=normalized.modules.flatMap(m=>m.lessons);
 if(entries.length!==map.size || entries.some(x=>!map.has(x.id)))
   throw new Error("Faltam aulas para disponibilizar o curso. Salve cada aula antes de continuar.");
 const record={id:normalized.id,course:normalized,
   lessons:Object.fromEntries(map),availableAt:new Date().toISOString(),formatVersion:1};
 validateLocalSnapshot(record);
 await transact("readwrite",store=>store.put(record));
 return {id:record.id,title:record.course.title,lessonCount:entries.length,availableAt:record.availableAt};
}
