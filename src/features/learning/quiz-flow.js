/* Controlador do quiz deslizante — sem troca de rota, sem reload,
 * movimento reduzido respeitado via CSS. Histórico salvo pelo app. */
import {checkQuiz} from "./activities.js";

const slides=carousel=>[...carousel.querySelectorAll(".quiz-carousel-slide")];
const total=carousel=>Number(carousel.dataset.total)||0;
function updateStatus(carousel){
 const steps=slides(carousel).filter(s=>!s.hasAttribute("data-quiz-finish"));
 const answered=steps.filter(s=>s.dataset.answered==="true");
 const correct=answered.filter(s=>s.dataset.correct==="true").length;
 const done=answered.length;
 const progress=carousel.querySelector(".quiz-carousel-progress");
 progress?.setAttribute("aria-valuenow",String(done));
 const fill=carousel.querySelector("[data-quiz-progress-fill]");
 if(fill)fill.style.width=(total(carousel)?100*done/total(carousel):0)+"%";
 const label=carousel.querySelector("[data-quiz-score]");
 if(label)label.textContent=done+" de "+total(carousel)+" respondidas";
 const summary=carousel.querySelector("[data-quiz-summary]");
 if(summary)summary.textContent="Você acertou "+correct+" de "+total(carousel)+" "+(total(carousel)===1?"questão":"questões")+".";
}
function switchSlide(carousel,index,{focus=true}={}){
 const nodes=slides(carousel);
 if(!nodes.length)return;
 const at=Math.max(0,Math.min(index,nodes.length-1));
 carousel.dataset.current=String(at);
 const track=carousel.querySelector("[data-quiz-track]");
 if(track)track.style.transform="translate3d(-"+at*100+"%,0,0)";
 nodes.forEach((slide,i)=>{
  slide.inert=i!==at;
  slide.setAttribute("aria-hidden",i===at?"false":"true");
 });
 const current=carousel.querySelector("[data-quiz-current]");
 if(current)current.textContent=at===total(carousel)?"Quiz concluído":"Questão "+(at+1)+" de "+total(carousel);
 updateStatus(carousel);
 if(focus){
  const node=nodes[at];
  node.setAttribute("tabindex","-1");
  node.focus({preventScroll:true});
 }
}
export function confirmQuizStep(form,result){
 if(!result?.answered)return false;
 const slide=form.closest(".quiz-carousel-slide");
 if(!slide||slide.dataset.answered==="true")return false;
 slide.dataset.answered="true";
 slide.dataset.correct=String(result.correct);
 form.querySelectorAll('input[type="radio"]').forEach(input=>input.disabled=true);
 const check=form.querySelector('button[type="submit"]');
 if(check)check.hidden=true;
 const next=slide.querySelector("[data-quiz-next]");
 if(next)next.hidden=false;
 updateStatus(slide.closest("[data-quiz-carousel]"));
 return true;
}
export function advanceQuiz(button){
 const slide=button.closest(".quiz-carousel-slide");
 const carousel=slide?.closest("[data-quiz-carousel]");
 if(!carousel||slide.dataset.answered!=="true")return false;
 const index=Number(slide.dataset.quizStep);
 if(!Number.isInteger(index))return false;
 switchSlide(carousel,index+1);
 return true;
}
export function restartQuiz(button){
 const carousel=button.closest("[data-quiz-carousel]");
 if(!carousel)return [];
 const questionSlides=slides(carousel).filter(slide=>!slide.hasAttribute("data-quiz-finish"));
 const ids=[];
 for(const slide of questionSlides){
  if(slide.dataset.blockId)ids.push(slide.dataset.blockId);
  delete slide.dataset.answered;
  delete slide.dataset.correct;
  const form=slide.querySelector('form[data-activity="quiz"]');
  if(!form)continue;
  form.querySelectorAll('input[type="radio"]').forEach(input=>{input.checked=false;input.disabled=false});
  form.querySelectorAll(".learning-option").forEach(label=>label.classList.remove("is-chosen"));
  const feedback=form.querySelector(".learning-feedback");
  if(feedback){feedback.hidden=true;feedback.textContent="";delete feedback.dataset.result;}
  const check=form.querySelector('button[type="submit"]');
  if(check)check.hidden=false;
  const next=slide.querySelector("[data-quiz-next]");
  if(next)next.hidden=true;
 }
 switchSlide(carousel,0);
 return ids;
}
export function restoreQuizAnswers(carousel,answers={}){
 if(!carousel)return;
 const questionSlides=slides(carousel).filter(slide=>!slide.hasAttribute("data-quiz-finish"));
 for(const slide of questionSlides){
  const stored=answers[slide.dataset.blockId];
  if(!stored||typeof stored.selection!=="string")continue;
  const form=slide.querySelector('form[data-activity="quiz"]');
  if(!form)continue;
  const input=[...form.querySelectorAll('input[type="radio"]')].find(r=>r.value===stored.selection);
  if(!input)continue;
  input.checked=true;
  const result=checkQuiz(form);
  confirmQuizStep(form,result);
 }
 const first=questionSlides.findIndex(slide=>slide.dataset.answered!=="true");
 // Reinicie a leitura pelo primeiro item pendente, sem sair da aula.
 switchSlide(carousel,first===-1?total(carousel):first,{focus:false});
}
