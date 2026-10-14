/* Atividades formativas locais — sem gabarito enviado a servidor. */
export function activityFeedback(container,correct,text){
 const feedback=container.querySelector(".learning-feedback");
 if(!feedback)return;
 feedback.textContent=text;
 feedback.hidden=false;
 feedback.dataset.result=correct?"correct":"review";
}
export function checkQuiz(form){
 const selected=form.querySelector('input[type="radio"]:checked');
 if(!selected)return {answered:false,correct:false};
 const right=selected.value===form.dataset.correct;
 const message=form.querySelector(right?"[data-feedback-correct]":"[data-feedback-incorrect]")?.textContent||
  (right?"Boa reflexão.":"Revise as ideias e tente novamente.");
 activityFeedback(form,right,message);
 form.querySelectorAll(".learning-option").forEach(label=>{
   const option=label.querySelector("input");
   label.classList.toggle("is-chosen",option===selected);
 });
 return {answered:true,correct:right,selection:selected.value};
}
export function exploreLab(button){
 const fieldset=button.closest('[data-activity="lab"]');
 if(!fieldset)return false;
 const outcome=[...fieldset.querySelectorAll("[data-outcome]")].find(x=>x.dataset.outcome===button.dataset.branch);
 if(!outcome)return false;
 activityFeedback(fieldset,true,outcome.textContent);
 fieldset.querySelectorAll("[data-branch]").forEach(x=>x.classList.toggle("is-chosen",x===button));
 return true;
}
