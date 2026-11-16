#!/usr/bin/env node
/* Ateliê — Sprint JSON 4: regressão do editor visual.
 * node scripts/verify-json-studio.mjs  (Node.js 22+)
 * Sem Firebase, navegador ou persistência de dados de alunos.
 */
import assert from "node:assert/strict";
import path from "node:path";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {validateCourse,validateLesson,validateLessonLink} from "../src/repositories/validators.js";
import {createLesson,startLessonDraft,updateLesson,blockTemplate,BLOCK_TYPES} from "../src/features/authoring/lesson-editor.js";
import {renderBlockFields,formatReferences,parseReferences} from "../src/features/authoring/block-fields.js";
import {renderLessonBlocks} from "../src/lesson-engine/engine.js";
import {parseStudioSelection} from "../json-studio.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const clone=value=>JSON.parse(JSON.stringify(value));
const json=async p=>JSON.parse(await readFile(path.join(root,p),"utf8"));

assert.deepEqual(parseStudioSelection("#/laboratorio/editor"),{mode:"dashboard"});
assert.deepEqual(
 parseStudioSelection("#/laboratorio/editor?curso=curso-piloto-json-02&aula=aula-escuta-e-hipoteses-piloto"),
 {mode:"edit",courseId:"curso-piloto-json-02",lessonId:"aula-escuta-e-hipoteses-piloto"}
);
assert.deepEqual(
 parseStudioSelection("#/laboratorio/editor?curso=curso-piloto-json-02&novo=modulo-piloto-json-02"),
 {mode:"new",courseId:"curso-piloto-json-02",moduleId:"modulo-piloto-json-02"}
);
for(const bad of [
 "#/laboratorio/editor?curso=curso-piloto-json-02",
 "#/laboratorio/editor?curso=curso-piloto-json-02&aula=x&novo=y",
 "#/laboratorio/editor?curso=../segredo&aula=x",
 "#/laboratorio/editor?curso=curso-piloto-json-02&aula=x&aula=y",
 "#/laboratorio/editor?curso=curso-piloto-json-02&aula=x&outro=y"
])assert.ok(parseStudioSelection(bad).error,"Deveria recusar: "+bad);

const course=validateCourse(await json("content/piloto-json-sprint-02/curso.json"));
const published=validateLessonLink(
 await json("content/piloto-json-sprint-02/aulas/escuta-e-hipoteses.json"),
 course,"modulo-piloto-json-02"
);
const initialBlockCount=published.blocks.length;
const publishedCopy=JSON.stringify(published);
let draft=startLessonDraft(published);
assert.equal(draft.status,"draft");
assert.equal(draft.revision,published.revision+1);
assert.equal(published.status,"published");

draft=updateLesson(draft,"details",{
 title:"Uma nova hipótese de trabalho",summary:"Editor visual em teste",
 objectives:"Estudar possibilidades\nConstruir perguntas",estimatedMinutes:28
});
assert.equal(draft.title,"Uma nova hipótese de trabalho");
assert.equal(draft.objectives.length,2);

const beforeIds=new Set(draft.blocks.map(x=>x.id));
draft=updateLesson(draft,"add-block",{type:"rich_text"});
const inserted=draft.blocks.find(b=>!beforeIds.has(b.id));
assert.ok(inserted&&inserted.type==="rich_text");
assert.equal(draft.blocks.length,initialBlockCount+1);
const position=draft.blocks.findIndex(x=>x.id===inserted.id);
assert.ok(position>0);
draft=updateLesson(draft,"move-block",{blockId:inserted.id,direction:-1});
assert.equal(draft.blocks.findIndex(x=>x.id===inserted.id),position-1);
draft=updateLesson(draft,"edit-block",{
 blockId:inserted.id,data:{title:"Nova explicação",paragraphs:["Parágrafo editado pelo editor visual."]},
 showInOutline:false,featured:true
});
assert.equal(draft.blocks.find(x=>x.id===inserted.id).settings.emphasis,"featured");
assert.equal(draft.blocks.find(x=>x.id===inserted.id).settings.showInOutline,false);
const duplicatedBefore=draft.blocks.length;
draft=updateLesson(draft,"duplicate-block",{blockId:inserted.id});
assert.equal(draft.blocks.length,duplicatedBefore+1);
const duplicate=draft.blocks[draft.blocks.findIndex(x=>x.id===inserted.id)+1];
assert.notEqual(duplicate.id,inserted.id);
assert.equal(duplicate.data.title,"Nova explicação");
draft=updateLesson(draft,"remove-block",{blockId:duplicate.id});
assert.equal(draft.blocks.length,duplicatedBefore);

const formExamples=BLOCK_TYPES.map(([type])=>{
 const b=blockTemplate(type);
 const markup=renderBlockFields(b,draft);
 assert.ok(markup.length>0,"Formulário ausente para "+type);
 return type;
});
assert.equal(formExamples.length,14);
const author="Autor Teste",book="Obra de demonstração";
const bibliog=parseReferences(author+" | "+book+" | 2025 | Exemplo",[]);
assert.equal(bibliog[0].title,book);
draft=updateLesson(draft,"references",{references:[...draft.references,...bibliog]});
assert.ok(formatReferences(draft.references).includes(book));

const output=renderLessonBlocks(validateLesson(draft));
assert.ok(output.includes("Nova explicação"));
assert.ok(output.includes("lesson-quiz-composite"));
assert.ok(output.includes('data-activity="lab"'));
assert.equal(JSON.stringify(published),publishedCopy,"A aula original não pode ser modificada.");

const newLesson=createLesson({...course,status:"draft"},"modulo-piloto-json-02","Uma aula inédita");
validateCourse(newLesson.course);
validateLessonLink(newLesson.lesson,newLesson.course,"modulo-piloto-json-02");
assert.equal(newLesson.lesson.status,"draft");
assert.ok(newLesson.course.modules[0].lessons.some(l=>l.id===newLesson.lesson.id));
assert.ok(!course.modules[0].lessons.some(l=>l.id===newLesson.lesson.id),"O manifesto original não muda.");

const app=await readFile(path.join(root,"app.js"),"utf8");
const html=await readFile(path.join(root,"index.html"),"utf8");
const studio=await readFile(path.join(root,"json-studio.js"),"utf8");
assert.ok(app.includes("'/laboratorio/editor'"),"Rota do editor não foi integrada.");
assert.ok(app.includes("import('./json-studio.js')"));
assert.ok(app.includes("AtelieJSONStudio?.canNavigate"),"Proteção de formulário sujo não instalada.");
assert.ok(html.includes("json-studio.css"),"Estilos do editor não carregados.");
assert.ok(studio.includes("data-json-studio-import"),"Importação JSON ausente.");
assert.ok(studio.includes("saveDraft(")&&studio.includes("downloadJSON("));
assert.ok(!studio.includes("firebase.js"),"O editor não deve usar diretamente a infraestrutura de alunos.");

console.log("Sprint JSON 4 — PASSOU: rotas, 14 formulários, operações de blocos, prévia, bibliografia e nova aula.");
console.log("O catálogo original, os cursos oficiais e o Firestore não foram modificados pelo teste.");
