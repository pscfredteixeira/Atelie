#!/usr/bin/env node
/* Sprint JSON 6 — bloqueio de integração do laboratório.
 * Detecta alterações involuntárias em identidade dos quatro percursos,
 * dependências do motor e distinção entre catálogo público e laboratório.
 * Teste estático: não substitui avaliação manual, segurança de conta ou E2E.
 */
import assert from "node:assert/strict";
import {readFile,access} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {validateCatalog,validateCourse,validateLessonLink} from "../src/repositories/validators.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const text=async p=>readFile(path.join(root,p),"utf8");
const json=async p=>JSON.parse(await text(p));
const exists=async p=>{await access(path.join(root,p));return true};

const publicCatalog=validateCatalog(await json("content/catalogo.json"));
assert.equal(publicCatalog.courses.length,1,"O catálogo principal não deve publicar cursos experimentais.");
assert.equal(publicCatalog.courses[0].id,"formacao-freudiana");
assert.equal(publicCatalog.courses[0].status,"published");
assert.ok(!publicCatalog.courses.some(c=>/piloto|laboratorio/i.test(c.id+" "+c.manifest)));

const course=validateCourse(await json("content/courses/formacao-freudiana/curso.json"));
assert.equal(course.id,"formacao-freudiana");
const mainApp=await text("app.js");
const expected=[
 {id:"escuta-que-mudou-a-clinica",file:"escuta-que-mudou-a-clinica.html"},
 {id:"primeira-topica-freud",file:"primeira-topica.html"},
 {id:"freud-antes-de-ser-freud",file:"freud-antes-de-ser-freud.html"},
 {id:"freud-obra-e-fundador",file:"freud-obra-e-fundador.html"}
];
for(const item of expected){
 assert.ok(mainApp.includes(item.id),"Aula oficial não registrada na aplicação: "+item.id);
 assert.ok(mainApp.includes(item.file),"Arquivo oficial não registrado na aplicação: "+item.file);
 const html=await text("content/courses/formacao-freudiana/aulas/"+item.file);
 assert.ok(html.length>1000&&/<html[\s>]/i.test(html),"HTML da aula ausente ou incompleto: "+item.file);
}
assert.ok(mainApp.includes("'/laboratorio/editor'"));
assert.ok(mainApp.includes("'/laboratorio/json'"));
const index=await text("index.html");
assert.ok(index.includes("json-studio.css")&&index.includes("json-pilot.css"));

const lab=validateCatalog(await json("content/piloto-json-sprint-02/catalogo.json"));
assert.equal(lab.courses.length,2,"Laboratório deve conter 2 cursos de demonstração.");
for(const entry of lab.courses){
 assert.equal(entry.status,"published");
 const prefix="content/piloto-json-sprint-02/";
 const manifestPath=path.posix.normalize(prefix+entry.manifest.replace(/^\.\//,""));
 assert.ok(manifestPath.startsWith(prefix),"Manifesto saiu da área de teste.");
 const manifest=validateCourse(await json(manifestPath));
 assert.equal(manifest.id,entry.id);
 for(const module of manifest.modules){
  for(const lesson of module.lessons){
   const lessonPath=path.posix.normalize(path.posix.dirname(manifestPath)+"/"+lesson.path);
   assert.ok(lessonPath.startsWith(prefix));
   const content=await json(lessonPath);
   validateLessonLink(content,manifest,module.id);
   assert.equal(content.id,lesson.id);
   assert.ok(content.blocks.length>0);
   assert.equal(content.metadata?.interactivePage,undefined);
  }
 }
}
const studio=await text("json-studio.js");
const plan=await text("src/features/authoring/publication-plan.js");
const zip=await text("src/features/authoring/review-zip.js");
assert.ok(studio.includes("saveDraft(")&&studio.includes("downloadReviewZIP("));
assert.ok(plan.includes("content/piloto-json-sprint-02/"));
assert.ok(plan.includes("publicationPerformed:false"));
assert.ok(zip.includes("makeReviewZIP"));
assert.ok(!studio.includes("api.github.com")&&!studio.includes("firestore.collection"));
const scripts=[await text("scripts/ci-sprint18.mjs"),await text("scripts/ci-sprint19.mjs")];
assert.ok(scripts.every(s=>!s.includes("#/caderno")&&!s.includes("locator(\"#lessonNote\").fill")&&!s.includes("locator(\'#lessonNote\').fill")));
for(const doc of ["docs/SPRINT_JSON_03_RESULTADO.md","docs/SPRINT_JSON_04_RESULTADO.md","docs/SPRINT_JSON_05_RESULTADO.md"])
 assert.ok(await exists(doc));
console.log("Sprint JSON 6 — contrato de integração: PASSOU.");
console.log("Catálogo público isolado; 4 páginas HTML oficiais preservadas; 2 cursos JSON técnicos válidos.");
console.log("Editor limitado a rascunhos; pacote restrito ao laboratório e testes legados atualizados.");
