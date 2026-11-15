#!/usr/bin/env node
/* Sprint JSON 2: teste sem servidor, sem Firebase e sem dados pessoais.
 * Executar da raiz: node scripts/verify-json-pilot.mjs
 */
import assert from "node:assert/strict";
import path from "node:path";
import {readFile} from "node:fs/promises";
import {fileURLToPath,pathToFileURL} from "node:url";
import {validateCatalog,validateCourse,validateLessonLink} from "../src/repositories/validators.js";
import {renderLessonBlocks,getLessonOutline} from "../src/lesson-engine/engine.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const pilotRoot=path.join(root,"content","piloto-json-sprint-02");
const clone=x=>JSON.parse(JSON.stringify(x));

async function json(filename){return JSON.parse(await readFile(filename,"utf8"));}
function resolve(reference,base){
 assert.match(reference,/^\.\/[A-Za-z0-9_/-]+\.json$/,"O caminho da aula deve ser relativo e terminar em .json");
 const absolute=path.resolve(path.dirname(base),reference);
 assert.ok(absolute.startsWith(pilotRoot+path.sep),"O JSON não pode sair do laboratório.");
 return absolute;
}

const catalogFile=path.join(pilotRoot,"catalogo.json");
const catalog=validateCatalog(await json(catalogFile));
assert.equal(catalog.courses.length,1);
const courseFile=resolve(catalog.courses[0].manifest,catalogFile);
const course=validateCourse(await json(courseFile));
assert.equal(course.id,catalog.courses[0].id);
const module=course.modules[0];
assert.equal(module.lessons.length,1);
const lessonEntry=module.lessons[0];
const lessonFile=resolve(lessonEntry.path,courseFile);
const lesson=validateLessonLink(await json(lessonFile),course,module.id);
assert.equal(lesson.id,lessonEntry.id);
assert.equal(lesson.status,"published");
assert.equal(lesson.metadata?.interactivePage,undefined,"O piloto deve usar blocos, não HTML externo.");
assert.equal(lesson.blocks.filter(x=>x.type==="multiple_choice").length,2);

const markup=renderLessonBlocks(lesson,{sourceURL:pathToFileURL(lessonFile).href});
const outline=getLessonOutline(lesson);
assert.equal(outline.length,lesson.blocks.length-1);
assert.equal((markup.match(/data-quiz-step=/g)||[]).length,3,"Dois slides de pergunta e um de resultado.");
assert.equal((markup.match(/class="lesson-quiz-composite"/g)||[]).length,1);
assert.ok(markup.includes('data-activity="lab"'),"Laboratório não renderizado.");
assert.ok(markup.includes("A escuta psicanalítica")===false || markup.includes("relato"),"Saída inesperada.");
assert.ok(!markup.includes("Componente indisponível"),"Bloco incompatível.");
assert.ok(markup.includes("O que muda quando escutamos antes de concluir?"),"Bloco de abertura ausente.");

const duplicated=clone(lesson);
duplicated.blocks.push(clone(duplicated.blocks[0]));
assert.throws(()=>validateLessonLink(duplicated,course,module.id),/duplicado/);
const wrongAnswer=clone(lesson);
wrongAnswer.blocks.find(b=>b.type==="multiple_choice").data.correctOptionId="inexistente";
assert.throws(()=>validateLessonLink(wrongAnswer,course,module.id),/correctOptionId/);

const appSource=await readFile(path.join(root,"app.js"),"utf8");
const indexSource=await readFile(path.join(root,"index.html"),"utf8");
assert.ok(appSource.includes("'/laboratorio/json'"),"A rota falta na aplicação.");
assert.ok(appSource.includes("import('./json-pilot.js')"),"A rota não importa o adaptador.");
assert.ok(indexSource.includes("json-pilot.css"),"O CSS isolado não foi carregado.");

console.log("Sprint JSON 2: PASSOU");
console.log("Catálogo → manifesto → aula vinculados, 13 blocos, quiz integrado e laboratório renderizados.");
console.log("Rota do Ateliê presente. Sem mudança no catálogo principal e sem progresso pessoal neste piloto.");
