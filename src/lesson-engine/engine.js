import "./block-renderers.js";
import {getBlockRenderer,getBlockLabel,listRegisteredBlocks,registerBlockRenderer} from "./block-registry.js";
import {escapeHTML as e} from "../ui/components.js";
import {renderQuizCarousel,QUIZ_GROUP_ID,QUIZ_GROUP_LABEL} from "./quiz-carousel.js";

/**
 * Motor de aulas v1. Recebe um objeto lesson válido.
 * Não lê diretamente o GitHub, IndexedDB ou a rota atual.
 * A mesma função é utilizada na sala publicada e na prévia do Estúdio.
 */
function unavailable(type,reason){
  return '<div class="lesson-unsupported" role="note"><strong>Componente indisponível</strong><p>'+
    e(reason)+'</p><small>Tipo: '+e(type??"desconhecido")+'. A leitura pode continuar.</small></div>';
}
function organizedLessonBlocks(lesson){
 const blocks=lesson?.blocks||[];
 const quizzes=blocks.filter(b=>b.type==="multiple_choice"&&b.version===1);
 if(!quizzes.length)return blocks.map(b=>({block:b}));
 // Coloque o quiz unificado depois do estudo, antes da bibliografia.
 const rest=blocks.filter(b=>!quizzes.includes(b));
 const refs=rest.findIndex(b=>b.type==="references");
 const insertAt=refs<0?rest.length:refs;
 const ordered=rest.map(b=>({block:b}));
 ordered.splice(insertAt,0,{quizzes});
 return ordered;
}
export function getLessonOutline(lesson){
 return organizedLessonBlocks(lesson).flatMap(entry=>{
   if(entry.quizzes)return [{id:QUIZ_GROUP_ID,label:QUIZ_GROUP_LABEL,type:"quiz_group"}];
   const b=entry.block;
   if(b.settings?.showInOutline===false)return [];
   const definition=getBlockRenderer(b.type,b.version);
   let title=definition?.label||"Bloco não disponível";
   if(definition?.outline){
     try{title=definition.outline(b.data,{lesson})||title}catch{/* preserve safe label */}
   }
   return [{id:"bloco-"+b.id,label:String(title),type:b.type}];
 });
}
export function renderLessonBlocks(lesson,{sourceURL}={}){
 if(!lesson||!Array.isArray(lesson.blocks))return unavailable("aula","Nenhuma estrutura de aula foi encontrada.");
 const context={lesson,sourceURL};
 return organizedLessonBlocks(lesson).map((entry,i)=>{
   if(entry.quizzes)return renderQuizCarousel(entry.quizzes);
   const b=entry.block;
   const label=String(i+1).padStart(2,"0");
   const definition=getBlockRenderer(b.type,b.version);
   let inside="";
   if(!definition)inside=unavailable(b.type,
     "Este bloco precisa de um componente ou versão ainda não instalada.");
   else{
     try{inside=definition.render(b.data,context)||unavailable(b.type,"O bloco ainda não possui conteúdo.");}
     catch(err){
       console.warn("Atelier: falha ao renderizar bloco",b.id,err);
       inside=unavailable(b.type,"Não foi possível apresentar este bloco. Os demais continuam disponíveis.");
     }
   }
   const featured=b.settings?.emphasis==="featured";
   return '<section class="lesson-block'+(featured?' lesson-featured':'')+
     '" id="bloco-'+e(b.id)+'" data-block-type="'+e(b.type)+'" data-block-id="'+e(b.id)+'" tabindex="-1">'+
     '<span class="block-kicker">'+label+' · '+e(definition?.label||"Bloco indisponível")+'</span>'+inside+'</section>';
 }).join("");
}
export {getBlockRenderer,getBlockLabel,listRegisteredBlocks,registerBlockRenderer};
