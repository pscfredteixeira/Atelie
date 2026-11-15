#!/usr/bin/env node
/* Ateliê — Sprint JSON 3: testes do catálogo e leitor genérico de aulas.
 * Execute na raiz do repositório: node scripts/verify-json-pilot.mjs
 * Usa somente módulos nativos e os arquivos do próprio repositório.
 */
import assert from "node:assert/strict";
import path from "node:path";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {validateCatalog,validateCourse,validateLessonLink} from "../src/repositories/validators.js";
import {renderLessonBlocks,getLessonOutline} from "../src/lesson-engine/engine.js";
import {readPilotCatalog,readPilotCourse,readPilotLesson,parsePilotSelection} from "../json-pilot.js";

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const pilotRoot=path.join(repoRoot,"content","piloto-json-sprint-02");
const clone=value=>JSON.parse(JSON.stringify(value));
const realFetch=globalThis.fetch;

// Mock somente de leitura dos JSON locais, para exercitar a interface de rede do
// adaptador sem depender da internet, GitHub Pages, Firebase ou navegador.
globalThis.fetch=async input=>{
 const url=new URL(String(input));
 assert.equal(url.protocol,"file:","O teste deve carregar apenas arquivos locais.");
 const filename=fileURLToPath(url);
 assert.ok(filename.startsWith(pilotRoot+path.sep),"Arquivo inesperado fora do laboratório.");
 try{
  const obj=JSON.parse(await readFile(filename,"utf8"));
  return {ok:true,status:200,json:async()=>obj};
 }catch{
  return {ok:false,status:404,json:async()=>({})};
 }
};
try{
 const catalog=validateCatalog(JSON.parse(await readFile(path.join(pilotRoot,"catalogo.json"),"utf8")));
 assert.ok(catalog.courses.length>=2,"Esperamos ao menos dois cursos técnicos para comprovar a descoberta pelo catálogo.");
 assert.deepEqual((await readPilotCatalog()).map(c=>c.id),catalog.courses.map(c=>c.id));
 let totalLessons=0;
 const courseIDs=new Set();
 const lessonIDs=new Set();
 for(const entry of catalog.courses){
  const {course,lessons}=await readPilotCourse(entry.id);
  validateCourse(course);
  assert.equal(course.id,entry.id);
  assert.ok(lessons.length>=1,"Cada curso de teste deve conter uma aula.");
  courseIDs.add(course.id);
  totalLessons+=lessons.length;
  for(const listed of lessons){
   const {lesson,lessonURL,module}=await readPilotLesson(course.id,listed.id);
   validateLessonLink(lesson,course,module.id);
   assert.ok(lessonURL.pathname.endsWith(".json"));
   assert.ok(lesson.blocks.length>0);
   assert.equal(lesson.metadata?.interactivePage,undefined);
   lessonIDs.add(lesson.id);
   const markup=renderLessonBlocks(lesson,{sourceURL:lessonURL.href});
   const outline=getLessonOutline(lesson);
   assert.ok(outline.length>0);
   assert.ok(markup.includes("lesson-block"));
   assert.ok(!markup.includes("Componente indisponível"),"Bloco não suportado: "+lesson.id);
   if(lesson.blocks.some(b=>b.type==="multiple_choice"))
    assert.ok(markup.includes("lesson-quiz-composite"),"Quiz não renderizado: "+lesson.id);
   if(lesson.blocks.some(b=>b.type==="interactive_lab"))
    assert.ok(markup.includes('data-activity="lab"'),"Laboratório não renderizado: "+lesson.id);
  }
 }
 assert.equal(courseIDs.size,catalog.courses.length);
 assert.ok(totalLessons>=3);
 assert.equal(lessonIDs.size,totalLessons);
 assert.deepEqual(parsePilotSelection("#/laboratorio/json"),{mode:"catalog"});
 assert.deepEqual(parsePilotSelection("#/laboratorio/json?curso=curso-piloto-json-02&aula=aula-perguntas-e-contexto-piloto"),
  {mode:"lesson",courseId:"curso-piloto-json-02",lessonId:"aula-perguntas-e-contexto-piloto"});
 assert.ok(parsePilotSelection("#/laboratorio/json?curso=../private&aula=teste").error);
 assert.ok(parsePilotSelection("#/laboratorio/json?curso=um&curso=dois&aula=tres").error);
 await assert.rejects(()=>readPilotLesson("curso-piloto-json-02","aula-inexistente"),/não encontrada/);
 await assert.rejects(()=>readPilotCourse("../fora"),/inválido/);
 const {course,lesson,module}=await readPilotLesson("curso-piloto-json-02","aula-escuta-e-hipoteses-piloto");
 const dupe=clone(lesson);dupe.blocks.push(clone(dupe.blocks[0]));
 assert.throws(()=>validateLessonLink(dupe,course,module.id),/duplicado/);
 const wrong=clone(lesson);wrong.blocks.find(b=>b.type==="multiple_choice").data.correctOptionId="inexistente";
 assert.throws(()=>validateLessonLink(wrong,course,module.id),/correctOptionId/);

 const app=await readFile(path.join(repoRoot,"app.js"),"utf8");
 const index=await readFile(path.join(repoRoot,"index.html"),"utf8");
 assert.ok(app.includes("'/laboratorio/json'"));
 assert.ok(app.includes("import('./json-pilot.js')"));
 assert.ok(index.includes('json-pilot.css'));
 console.log(`Sprint JSON 3 — PASSOU: ${courseIDs.size} cursos, ${totalLessons} aulas, blocos, quizzes, laboratórios, rota e vínculos.`);
 console.log("Os testes executam os validadores e renderizadores reais. Sem gravação no Firebase.");
}finally{globalThis.fetch=realFetch;}
