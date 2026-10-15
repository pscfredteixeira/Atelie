/* Atelier — Reúne todas as questões objetivas em uma sequência horizontal
 * dentro da mesma aula. O editor continua usando os blocos JSON v1. */
import {escapeHTML as e} from "../ui/components.js";
import {getBlockRenderer} from "./block-registry.js";

export const QUIZ_GROUP_ID="bloco-quiz-integrado";
export const QUIZ_GROUP_LABEL="Quiz de revisão";

export function renderQuizCarousel(blocks){
 if(!Array.isArray(blocks)||blocks.length===0)return "";
 const total=blocks.length;
 const slides=blocks.map((block,index)=>{
   const definition=getBlockRenderer(block.type,block.version);
   let inside="";
   try{inside=definition?.render(block.data,{})||""}
   catch(error){console.warn("Atelier: questão indisponível",block.id,error)}
   if(!inside)return "";
   return '<div class="quiz-carousel-slide" data-quiz-step="'+index+'" data-block-id="'+e(block.id)+'" '+
     (index?'aria-hidden="true" inert':'aria-hidden="false"')+'>'+
       '<div class="quiz-carousel-question-no">QUESTÃO '+String(index+1).padStart(2,"0")+'</div>'+
       inside+
       '<div class="quiz-carousel-actions"><button class="button action quiz-carousel-next" type="button" data-quiz-next hidden>'+
         (index===total-1?"Ver meu resultado →":"Continuar →")+'</button></div>'+
     '</div>';
 }).join("");
 const finish='<div class="quiz-carousel-slide quiz-carousel-finish" data-quiz-step="'+total+'" data-quiz-finish aria-hidden="true" inert>'+
   '<span class="quiz-carousel-finish-mark" aria-hidden="true">✦</span>'+
   '<span class="overline">Revisão concluída</span>'+
   '<h3>Você chegou ao fim do quiz.</h3>'+
   '<p data-quiz-summary role="status" aria-live="polite"></p>'+
   '<p class="quiz-carousel-finish-note">O objetivo é revisar ideias e reconhecer pontos que merecem outra leitura. Este resultado não é uma certificação.</p>'+
   '<button type="button" class="button" data-quiz-restart>Refazer o quiz ↺</button></div>';
 return '<section class="lesson-block lesson-quiz-composite" id="'+QUIZ_GROUP_ID+'" tabindex="-1" data-block-type="quiz_group">'+
  '<div class="quiz-carousel" data-quiz-carousel data-total="'+total+'" aria-label="Quiz de revisão da aula">'+
    '<header class="quiz-carousel-heading"><span class="overline">Momento de revisar</span>'+
      '<h3>Quiz da aula</h3><p>Responda, confira o comentário e avance para a próxima questão sem sair desta tela.</p></header>'+
    '<div class="quiz-carousel-status"><span data-quiz-current aria-live="polite">Questão 1 de '+total+'</span>'+
      '<span data-quiz-score>0 respondidas</span></div>'+
    '<div class="quiz-carousel-progress" role="progressbar" aria-label="Progresso do quiz" aria-valuemin="0" aria-valuemax="'+total+
      '" aria-valuenow="0"><span data-quiz-progress-fill style="width:0%"></span></div>'+
    '<div class="quiz-carousel-viewport"><div class="quiz-carousel-track" data-quiz-track>'+
     slides+finish+'</div></div>'+
  '</div></section>';
}
