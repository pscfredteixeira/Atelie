#!/usr/bin/env node
/* Sprint JSON 5 — teste reproduzível da preparação de publicação.
 * Executar da raiz do repositório: node scripts/verify-json-publication.mjs
 * Não toca no GitHub, no catálogo público nem no Firestore.
 */
import assert from "node:assert/strict";
import path from "node:path";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {startLessonDraft,createLesson} from "../src/features/authoring/lesson-editor.js";
import {validateCatalog,validateCourse,validateLesson,validateLessonLink} from "../src/repositories/validators.js";
import {planJSONPublication} from "../src/features/authoring/publication-plan.js";
import {makeReviewZIP} from "../src/features/authoring/review-zip.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=async filename=>JSON.parse(await readFile(path.join(root,filename),"utf8"));
const copy=x=>JSON.parse(JSON.stringify(x));
const manifestPath="content/piloto-json-sprint-02/curso.json";
const originalCatalog=await read("content/catalogo.json");
const labCatalog=await read("content/piloto-json-sprint-02/catalogo.json");
const course=validateCourse(await read(manifestPath));
const original=validateLessonLink(
 await read("content/piloto-json-sprint-02/aulas/escuta-e-hipoteses.json"),
 course,"modulo-piloto-json-02"
);
const snapshot=JSON.stringify([course,original,originalCatalog,labCatalog]);
const prepared=planJSONPublication({
 course,draft:startLessonDraft(original),publishedLesson:original,manifestPath
});
assert.equal(prepared.mode,"update");
assert.equal(prepared.files.length,4);
assert.equal(prepared.lesson.status,"published");
assert.equal(prepared.lesson.revision,original.revision+1);
assert.equal(prepared.report.baseLessonRevision,original.revision);
assert.equal(prepared.manifest.revision,course.revision+1);
assert.equal(prepared.report.lessonPath,"content/piloto-json-sprint-02/aulas/escuta-e-hipoteses.json");
assert.ok(prepared.manifest.modules[0].lessons.some(l=>l.id===original.id));
assert.ok(prepared.files.every(f=>typeof f.path==="string"&&typeof f.content==="string"));
const manifestCandidate=validateCourse(JSON.parse(prepared.files[1].content));
const lessonCandidate=validateLesson(JSON.parse(prepared.files[0].content));
validateLessonLink(lessonCandidate,manifestCandidate,lessonCandidate.moduleId);
assert.equal(manifestCandidate.status,"published");
assert.equal(JSON.parse(prepared.files[2].content).publicationPerformed,false);
assert.ok(prepared.files[3].content.includes("pull request"));

const newData=createLesson({...course,status:"draft"},"modulo-piloto-json-02","Nova aula de revisão");
const newly=planJSONPublication({course,draft:newData.lesson,manifestPath});
assert.equal(newly.mode,"create");
assert.equal(newly.lesson.status,"published");
assert.equal(newly.manifest.modules[0].lessons.length,course.modules[0].lessons.length+1);
assert.ok(newly.files[0].path.includes("/aulas/"));
assert.equal(newly.report.baseLessonRevision,null);
assert.equal(newly.manifest.revision,course.revision+1);
validateLessonLink(newly.lesson,newly.manifest,newly.lesson.moduleId);

function rejected(params,message){
 assert.throws(()=>planJSONPublication(params),message);
}
const stale=startLessonDraft(original);
stale.revision+=3;
rejected({course,draft:stale,publishedLesson:original,manifestPath},/revisão do rascunho/);
rejected({course,draft:startLessonDraft(original),manifestPath},/versão publicada atual/);
const colliding=copy(newData.lesson);
colliding.slug="escuta-e-hipoteses";
rejected({course,draft:colliding,manifestPath},/já existe outra aula/);
const badMedia=copy(newData.lesson);
badMedia.blocks=[{id:"foto",type:"image",version:1,data:{src:"./../privado.jpg",alt:"Foto"},settings:{}}];
rejected({course,draft:badMedia,manifestPath},/caminho relativo inadequado/);
const unknown=copy(newData.lesson);
unknown.blocks[0].type="unregistered";
rejected({course,draft:unknown,manifestPath},/sem suporte/);
const legacy=copy(newData.lesson);
legacy.metadata={interactivePage:"./aula.html"};
rejected({course,draft:legacy,manifestPath},/HTML especiais/);
rejected({course,draft:copy(newData.lesson),manifestPath:"content/catalogo.json"},/catálogo técnico/);
const wrongModule=copy(newData.lesson);
wrongModule.moduleId="modulo-inexistente";
rejected({course,draft:wrongModule,manifestPath},/módulo/);

const crcInput=new TextEncoder().encode("123456789");
function crcTest(bytes){
 let crc=0xffffffff;
 for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
 return (crc^0xffffffff)>>>0;
}
assert.equal(crcTest(crcInput),0xcbf43926);
const archive=makeReviewZIP(prepared.files);
const view=new DataView(archive.buffer,archive.byteOffset,archive.byteLength);
assert.equal(view.getUint32(0,true),0x04034b50);
assert.equal(view.getUint32(archive.byteLength-22,true),0x06054b50);
assert.equal(view.getUint16(archive.byteLength-12,true),4);
let offset=0;
for(const file of prepared.files){
 assert.equal(view.getUint32(offset,true),0x04034b50);
 const nameLen=view.getUint16(offset+26,true);
 const dataLen=view.getUint32(offset+18,true);
 const name=new TextDecoder().decode(archive.subarray(offset+30,offset+30+nameLen));
 const contents=new TextDecoder().decode(archive.subarray(offset+30+nameLen,offset+30+nameLen+dataLen));
 assert.equal(name,file.path);
 assert.equal(contents,file.content);
 offset+=30+nameLen+dataLen;
}
assert.equal(view.getUint32(offset,true),0x02014b50);
assert.throws(()=>makeReviewZIP([{path:"../escape",content:"x"}]),/inadequado/);
assert.throws(()=>makeReviewZIP([{path:"a.txt",content:"a"},{path:"a.txt",content:"b"}]),/repetido/);
validateCatalog(originalCatalog);
validateCatalog(labCatalog);
assert.equal(JSON.stringify([course,original,originalCatalog,labCatalog]),snapshot);

const editor=await readFile(path.join(root,"json-studio.js"),"utf8");
assert.ok(editor.includes('data-json-studio-action="analyse"'));
assert.ok(editor.includes('data-json-studio-action="download-review"'));
assert.ok(editor.includes("planJSONPublication("));
assert.ok(editor.includes("downloadReviewZIP("));

console.log("Sprint JSON 5: PASSOU");
console.log("Aula nova e atualização: OK; colisões, revisões e mídia insegura rejeitadas.");
console.log("ZIP com 4 arquivos verificado byte a byte. Arquivos de origem permaneceram intactos.");
console.log("Nenhum commit, publicação ou gravação no Firebase foi realizado.");
