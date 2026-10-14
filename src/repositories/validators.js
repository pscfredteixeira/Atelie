/* Atelier · Sprint 2 · Validação estrutural sem dependências externas.
 * O esquema JSON publicado em schemas/ é a especificação; estes validadores
 * garantem as invariantes usadas pelo cliente, com mensagens compreensíveis.
 */
export class ContentError extends Error {
  constructor(message, code="invalid", location="") {
    super(message);
    this.name="ContentError";
    this.code=code;
    this.location=location;
  }
}
function fail(where,message) { throw new ContentError(where+": "+message,"invalid",where); }
function obj(x) {return !!x && typeof x==="object" && !Array.isArray(x);}
function str(x) {return typeof x==="string" && x.trim().length>0;}
function list(x) {return Array.isArray(x);}
function base(x,kind,where) {
  if(!obj(x))fail(where,"esperado um objeto JSON.");
  if(x.schemaVersion!==1)fail(where,"versão de esquema não suportada (necessária: 1).");
  if(x.kind!==kind)fail(where,"tipo de documento deve ser \""+kind+"\".");
}
function identifier(x,where) {
  if(!str(x)||!/^[A-Za-z0-9_-]+$/.test(x))fail(where,"ID obrigatório: letras, números, hífens e sublinhados.");
}
function uniqueIds(items,where) {
  const found=new Set();
  for(const item of items) {
    if(found.has(item.id))fail(where,"identificador duplicado: "+item.id+".");
    found.add(item.id);
  }
}
function status(s,where){if(!["draft","review","published","archived"].includes(s))fail(where,"status editorial inválido.");}
export function validateCatalog(x) {
  base(x,"catalog","Catálogo");
  if(!list(x.courses))fail("Catálogo","o campo courses precisa ser uma lista.");
  x.courses.forEach((item,i)=>{
    const p="Catálogo / curso "+(i+1);
    if(!obj(item))fail(p,"esperado objeto.");
    identifier(item.id,p+" / id");
    if(!str(item.title)||!str(item.manifest))fail(p,"título e endereço do manifesto são obrigatórios.");
    status(item.status,p);
  });
  uniqueIds(x.courses,"Catálogo");
  return x;
}
export function validateCourse(x) {
  base(x,"course","Curso");
  identifier(x.id,"Curso");
  if(!str(x.title)||!str(x.slug))fail("Curso","título e slug são obrigatórios.");
  if(!Number.isInteger(x.revision)||x.revision<1)fail("Curso","revision deve ser inteiro positivo.");
  status(x.status,"Curso");
  if(!list(x.modules))fail("Curso","modules precisa ser uma lista.");
  x.modules.forEach((m,i)=>{
    const p="Curso / módulo "+(i+1);
    if(!obj(m))fail(p,"esperado objeto.");
    identifier(m.id,p);
    if(!str(m.title)||!list(m.lessons))fail(p,"título e lessons são obrigatórios.");
    if(!Number.isInteger(m.position)||m.position<1)fail(p,"position deve ser inteiro positivo.");
    m.lessons.forEach((l,j)=>{
      const lp=p+" / aula "+(j+1);
      if(!obj(l))fail(lp,"esperado objeto.");
      identifier(l.id,lp);
      if(!str(l.path)||!Number.isInteger(l.position)||l.position<1)fail(lp,"path e position válidos são obrigatórios.");
    });
    uniqueIds(m.lessons,p);
    if(new Set(m.lessons.map(l=>l.position)).size!==m.lessons.length)fail(p,"posição repetida entre aulas.");
  });
  uniqueIds(x.modules,"Curso");
  if(new Set(x.modules.map(m=>m.position)).size!==x.modules.length)fail("Curso","posição repetida entre módulos.");
  if(new Set(x.modules.flatMap(m=>m.lessons.map(l=>l.id))).size!==x.modules.reduce((n,m)=>n+m.lessons.length,0))
    fail("Curso","ID de aula repetido em mais de um módulo.");
  return x;
}
export function validateLesson(x) {
  base(x,"lesson","Aula");
  identifier(x.id,"Aula");
  identifier(x.courseId,"Aula / courseId");
  identifier(x.moduleId,"Aula / moduleId");
  if(!str(x.title)||!str(x.slug))fail("Aula","título e slug são obrigatórios.");
  if(!Number.isInteger(x.revision)||x.revision<1)fail("Aula","revision deve ser inteiro positivo.");
  status(x.status,"Aula");
  if(!list(x.blocks))fail("Aula","blocks precisa ser uma lista.");
  if(!list(x.references))fail("Aula","references precisa ser uma lista.");
  x.references.forEach((r,i)=>{
    const p="Referência "+(i+1);
    if(!obj(r))fail(p,"esperado objeto.");
    identifier(r.id,p);
    if(!str(r.title))fail(p,"título é obrigatório.");
  });
  uniqueIds(x.references,"Referências");
  x.blocks.forEach((b,i)=>{
    const p="Bloco "+(i+1);
    if(!obj(b))fail(p,"esperado objeto.");
    identifier(b.id,p);
    if(!str(b.type))fail(p,"type é obrigatório.");
    if(!Number.isInteger(b.version)||b.version<1)fail(p,"version deve ser inteiro positivo.");
    if(!obj(b.data))fail(p,"data precisa ser um objeto.");
    if(b.settings!==undefined&&!obj(b.settings))fail(p,"settings precisa ser objeto.");
    const d=b.data;
    if(b.type==="rich_text") {
      if(!list(d.paragraphs)||!d.paragraphs.every(s=>typeof s==="string"))fail(p,"rich_text exige paragraphs de texto.");
    }
    if(b.type==="question"&&!str(d.prompt))fail(p,"question exige prompt.");
    if(b.type==="clinical_vignette"&&(!str(d.narrative)||!str(d.reflection)))fail(p,"vinheta exige narrative e reflection.");
    if(b.type==="multiple_choice"){
      if(!str(d.prompt)||!list(d.options)||d.options.length<2)fail(p,"quiz exige pergunta e pelo menos duas alternativas.");
      d.options.forEach(o=>{if(!obj(o)||!str(o.id)||!str(o.text))fail(p,"alternativa incompleta.");});
      uniqueIds(d.options,p+" / opções");
      if(!d.options.some(o=>o.id===d.correctOptionId))fail(p,"correctOptionId não existe nas alternativas.");
      if(!str(d.feedbackCorrect)||!str(d.feedbackIncorrect))fail(p,"feedback obrigatório.");
    }
    if(b.type==="references"){
      if(!list(d.referenceIds))fail(p,"referenceIds precisa ser uma lista.");
      if(!d.referenceIds.every(id=>x.references.some(r=>r.id===id)))fail(p,"referência bibliográfica não encontrada.");
    }
  });
  uniqueIds(x.blocks,"Aula");
  return x;
}
export function validateLessonLink(lesson,course,moduleId) {
  validateLesson(lesson);
  if(lesson.courseId!==course.id)fail("Aula","courseId não corresponde ao curso.");
  if(lesson.moduleId!==moduleId)fail("Aula","moduleId não corresponde ao manifesto.");
  const module=course.modules.find(m=>m.id===moduleId);
  if(!module||!module.lessons.some(l=>l.id===lesson.id))fail("Aula","ID não existe no manifesto.");
  return lesson;
}
