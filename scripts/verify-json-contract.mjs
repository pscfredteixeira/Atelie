#!/usr/bin/env node
/**
 * Verificação independente de navegador para o contrato JSON v1.
 * Executar na raiz do projeto: node scripts/verify-json-contract.mjs
 * Requer Node.js 22+, sem dependências externas.
 *
 * Usa os validadores da própria aplicação. A leitura dos schemas abaixo
 * verifica sua sintaxe, não substitui validação JSON Schema 2020-12 (AJV).
 */
import assert from "node:assert/strict";
import path from "node:path";
import {readFile, access} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {validateCatalog,validateCourse,validateLesson,validateLessonLink} from "../src/repositories/validators.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const contentRoot=path.join(root,"content");

async function readJSON(filename){
  const text=await readFile(filename,"utf8");
  try{return JSON.parse(text)}
  catch(error){throw new Error(`JSON inválido em ${path.relative(root,filename)}: ${error.message}`)}
}
function localReference(fromFile,relative,ext){
  if(typeof relative!=="string"||!relative.startsWith("./")||relative.includes("?")||relative.includes("#")||relative.includes("\\"))
    throw new Error(`Caminho relativo inválido em ${path.relative(root,fromFile)}: ${relative}`);
  const absolute=path.resolve(path.dirname(fromFile),relative);
  if(!absolute.startsWith(contentRoot+path.sep)||path.extname(absolute)!==ext)
    throw new Error(`Caminho fora de content/ ou com extensão incorreta: ${relative}`);
  return absolute;
}

async function main(){
  for(const name of ["catalog","course","lesson"]){
    const schema=await readJSON(path.join(root,"schemas",`${name}.schema.json`));
    assert.equal(schema.$schema,"https://json-schema.org/draft/2020-12/schema");
  }

  const examplePath=path.join(root,"docs","exemplos","aula-contrato-json-v1-piloto.json");
  const example=validateLesson(await readJSON(examplePath));
  assert.equal(example.status,"draft");
  assert.ok(example.blocks.length>0);
  // Testes negativos: as regras do contrato realmente rejeitam erros.
  const duplicated=structuredClone(example);
  duplicated.blocks.push(structuredClone(duplicated.blocks[0]));
  assert.throws(()=>validateLesson(duplicated),/duplicado/);
  const wrongAnswer=structuredClone(example);
  wrongAnswer.blocks.find(b=>b.type==="multiple_choice").data.correctOptionId="opcao-inexistente";
  assert.throws(()=>validateLesson(wrongAnswer),/correctOptionId/);
  const missingRef=structuredClone(example);
  missingRef.blocks.find(b=>b.type==="references").data.referenceIds=["fonte-inexistente"];
  assert.throws(()=>validateLesson(missingRef),/bibliográfica/);

  const catalogPath=path.join(contentRoot,"catalogo.json");
  const catalog=validateCatalog(await readJSON(catalogPath));
  let courses=0,lessons=0,blockLessons=0,interactivePages=0;
  for(const entry of catalog.courses.filter(c=>c.status==="published")){
    const coursePath=localReference(catalogPath,entry.manifest,".json");
    const course=validateCourse(await readJSON(coursePath));
    assert.equal(course.id,entry.id,`Curso com ID divergente: ${entry.id}`);
    assert.equal(course.status,"published",`Manifesto não publicado: ${entry.id}`);
    courses++;
    for(const module of course.modules){
      for(const listedLesson of module.lessons){
        // Aulas previstas, marcadas explicitamente como não publicadas,
        // podem ainda não possuir um arquivo publicado no repositório.
        if(listedLesson.status && listedLesson.status!=="published")continue;
        const lessonPath=localReference(coursePath,listedLesson.path,".json");
        const lesson=validateLessonLink(await readJSON(lessonPath),course,module.id);
        assert.equal(lesson.id,listedLesson.id,`ID divergente na aula ${listedLesson.id}`);
        assert.equal(lesson.status,"published",`Aula não publicada: ${listedLesson.id}`);
        if(lesson.blocks.length)blockLessons++;
        if(lesson.metadata?.interactivePage){
          const htmlPath=localReference(lessonPath,lesson.metadata.interactivePage,".html");
          await access(htmlPath); // Uma página especial precisa existir fisicamente.
          interactivePages++;
        }
        lessons++;
      }
    }
  }

  console.log("Contrato JSON v1: OK");
  console.log("3 arquivos de JSON Schema com sintaxe válida (sem execução de AJV).");
  console.log("Exemplo piloto e 3 casos de erro: OK.");
  console.log(`Catálogo público: ${courses} curso(s), ${lessons} aula(s), ${blockLessons} com blocos, ${interactivePages} com página especial HTML.`);
  console.log("Nenhuma aula existente foi modificada ou publicada por este teste.");
}
main().catch(error=>{
  console.error("Falha na verificação do contrato JSON v1:",error.message);
  process.exitCode=1;
});
