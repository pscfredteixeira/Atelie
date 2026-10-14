import {ContentError,validateCatalog,validateCourse,validateLessonLink} from "./validators.js";
const ROOT = new URL("../../content/",import.meta.url);
const CATALOG = new URL("catalogo.json",ROOT);
const cache = new Map();
function safeURL(relative,base) {
  if(typeof relative!=="string"||!relative.startsWith("./"))throw new ContentError("Endereço de conteúdo inválido: use caminhos relativos que começam com ./","invalid_path");
  const url=new URL(relative,base);
  if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname)||url.search||url.hash||!url.pathname.endsWith(".json"))
    throw new ContentError("Caminho fora da pasta pública de conteúdo: "+relative,"invalid_path");
  return url;
}
async function readJSON(url,validate) {
  const key=url.href;
  if(cache.has(key))return cache.get(key);
  const load=(async()=>{
    let response;
    try{response=await fetch(url.href,{cache:"no-cache"});}
    catch{throw new ContentError("Não foi possível conectar para carregar o conteúdo.","network_error",url.pathname);}
    if(response.status===404)throw new ContentError("Arquivo JSON não encontrado.","not_found",url.pathname);
    if(!response.ok)throw new ContentError("Falha ao carregar conteúdo (HTTP "+response.status+").","network_error",url.pathname);
    let body;
    try{body=await response.json();}
    catch{throw new ContentError("O arquivo carregado não é um JSON válido.","invalid",url.pathname);}
    validate(body);
    return body;
  })();
  cache.set(key,load);
  try{return await load;}
  catch(err){cache.delete(key);throw err;}
}
export function resetContentCache(){cache.clear();}
export async function listPublishedCourses(){
  const index=await readJSON(CATALOG,validateCatalog);
  return index.courses.filter(c=>c.status==="published").map(c=>({
    id:c.id,title:c.title,slug:c.slug,summary:c.summary||"",manifest:c.manifest,status:c.status
  }));
}
export async function getPublishedCourse(courseId) {
  const index=await readJSON(CATALOG,validateCatalog);
  const entry=index.courses.find(c=>c.id===courseId&&c.status==="published");
  if(!entry)throw new ContentError("Este curso não foi encontrado no catálogo publicado.","not_found",courseId);
  const manifestURL=safeURL(entry.manifest,CATALOG);
  const course=await readJSON(manifestURL,validateCourse);
  if(course.id!==entry.id)throw new ContentError("O manifesto aponta para um curso com identificador diferente.","invalid");
  if(course.status!=="published")throw new ContentError("O curso ainda não está publicado.","not_found");
  return {course,manifestURL:manifestURL.href,entry};
}
export async function getPublishedLesson(courseId,lessonId){
  const {course,manifestURL}=await getPublishedCourse(courseId);
  const module=course.modules.find(m=>m.lessons.some(l=>l.id===lessonId));
  if(!module)throw new ContentError("Esta aula não existe no programa do curso.","not_found",lessonId);
  const lessonEntry=module.lessons.find(l=>l.id===lessonId);
  const path=safeURL(lessonEntry.path,manifestURL);
  const lesson=await readJSON(path,x=>validateLessonLink(x,course,module.id));
  if(lesson.id!==lessonId)throw new ContentError("O ID do arquivo não corresponde à aula solicitada.","invalid",lessonId);
  if(lesson.status!=="published")throw new ContentError("Esta aula ainda não está publicada.","not_found",lessonId);
  return {course,module,lesson,contentURL:path.href};
}
export const contentRepository={listPublishedCourses,getPublishedCourse,getPublishedLesson,resetContentCache};
