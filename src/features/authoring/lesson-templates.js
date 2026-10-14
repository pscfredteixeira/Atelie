/* Sprint 7 — modelos didáticos como pontos de partida editáveis. */
import {blockTemplate,updateLesson} from "./lesson-editor.js";
export const LESSON_TEMPLATES=Object.freeze([
 {id:"blank",title:"Aula em branco",description:"Comece por um texto e construa seu próprio percurso.",types:[]},
 {id:"deep-reading",title:"Leitura aprofundada",description:"Pergunta, texto, conceito, citação editorial e bibliografia.",types:["question","rich_text","concept","quote","references"]},
 {id:"investigation",title:"Investigação conceitual",description:"Problema inicial, comparação de ideias e revisão.",types:["question","rich_text","comparison","multiple_choice"]},
 {id:"fictional-case",title:"Situação fictícia",description:"Contexto teórico, cena ficcional, reflexão e síntese.",types:["heading","rich_text","clinical_vignette","question","rich_text"]},
 {id:"visual",title:"Aula visual",description:"Linha do tempo, imagem, conceito e pergunta.",types:["timeline","image","concept","question"]},
 {id:"seminar",title:"Seminário e revisão",description:"Preparação de debate e avaliação formativa.",types:["question","concept","quote","multiple_choice","references"]}
]);
export function useLessonTemplate(lesson,templateId){
 const template=LESSON_TEMPLATES.find(x=>x.id===templateId);
 if(!template)throw Error("Modelo pedagógico não encontrado.");
 if(lesson.status!=="draft")throw Error("Aplique modelos somente a aulas em rascunho.");
 const result={...lesson,blocks:template.types.length?template.types.map(blockTemplate):[]};
 // validate on engine layer via updateLesson on no-op? validated at save by caller.
 return JSON.parse(JSON.stringify(result));
}
