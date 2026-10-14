import {BETA_TASKS,getBetaChecks} from "./beta.js";
import {escapeHTML as e,pageHead,action,note} from "../../ui/components.js";
export function renderBeta(){
 const checked=getBetaChecks(),count=BETA_TASKS.filter(x=>checked[x.id]).length;
 return pageHead("Administrador / Piloto","Beta com <em>pessoas convidadas.</em>",
  "Roteiro de testes para alunos e colaboradores verificarem a experiência sem cadastro ou contas reais.")+
  '<section class="card"><div class="card-label">Preparação do piloto</div><h2 class="section-title">'+count+' de '+BETA_TASKS.length+' tarefas assinaladas</h2>'+
  '<p>Este checklist fica somente neste navegador. Assinalar não comprova que um teste com convidados ocorreu.</p>'+
  '<form class="beta-form" data-beta-feedback>'+
  BETA_TASKS.map((x,i)=>'<label class="beta-task"><input type="checkbox" data-beta-check="'+e(x.id)+'"'+
    (checked[x.id]?' checked':'')+'><span><strong>'+String(i+1).padStart(2,"0")+' · '+e(x.role)+'</strong>'+
    '<span>'+e(x.text)+'</span></span></label>').join("")+
  '<div class="studio-form"><label class="field-label" for="beta-role">Papel usado no teste</label>'+
  '<select class="field" name="role" id="beta-role"><option>Aluno</option><option>Professor</option><option>Organização</option></select>'+
  '<label class="field-label" for="beta-device">Dispositivo</label>'+
  '<input class="field" id="beta-device" name="device" placeholder="Ex.: smartphone Android" maxlength="180">'+
  '<label class="field-label" for="beta-browser">Navegador</label>'+
  '<input class="field" id="beta-browser" name="browser" placeholder="Ex.: Chrome" maxlength="180">'+
  '<label class="field-label" for="beta-difficulties">Onde houve dificuldades?</label>'+
  '<textarea class="field" id="beta-difficulties" name="difficulties" rows="4" placeholder="Descreva a dificuldade sem informar dados pessoais."></textarea>'+
  '<label class="field-label" for="beta-suggestions">O que poderia melhorar?</label>'+
  '<textarea class="field" id="beta-suggestions" name="suggestions" rows="4"></textarea>'+
  '<button class="button action" type="submit">Baixar relatório de teste em JSON</button></div></form></section>'+
  note('<strong>Limites do beta:</strong> perfis não são login; a edição do professor não é protegida; as aulas JSON estão públicas. Convidados devem usar apenas informações fictícias. A preparação do roteiro não substitui testes reais.');
}
