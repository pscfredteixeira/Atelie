/* Dados fictícios de apresentação. Sprint 2 substituirá por JSON. */
export const COURSE_ID = "curso-fundamentos";
export const LESSON_ID = "aula-recalque";
export const demoCourse = {
  id: COURSE_ID,
  title: "Fundamentos da Psicanálise",
  subtitle: "Um percurso pelas perguntas que deram origem à escuta psicanalítica.",
  objectives: ["Distinguir conceitos de interpretações automáticas", "Situar ideias no momento histórico de sua formulação", "Desenvolver leitura crítica e investigação"],
  modules: [
    {id:"modulo-escuta",title:"O nascimento de uma escuta",lessons:[
      {id:"aula-escuta",title:"A invenção da escuta",minutes:14},
      {id:"aula-inconsciente",title:"O inconsciente como problema",minutes:18},
      {id:"aula-histeria",title:"O debate sobre a histeria",minutes:21}
    ]},
    {id:"modulo-conflito",title:"Conflito, recalque e defesa",lessons:[
      {id:LESSON_ID,title:"O recalque em Freud",minutes:18},
      {id:"aula-retorno",title:"O retorno do recalcado",minutes:20},
      {id:"aula-defesa",title:"O problema das defesas",minutes:19}
    ]},
    {id:"modulo-sonhos",title:"Sonhos e linguagem",lessons:[
      {id:"aula-sonhos",title:"Por que estudar os sonhos?",minutes:17},
      {id:"aula-trabalho",title:"O trabalho do sonho",minutes:23},
      {id:"aula-associacao",title:"A associação livre",minutes:18}
    ]}
  ]
};
export const demoCourses = [
  {id:COURSE_ID,title:demoCourse.title,summary:"Conceitos iniciais, leitura crítica e exercícios de compreensão.",icon:"ψ",category:"Formação introdutória"},
  {id:"curso-clinica",title:"A Clínica Psicanalítica",summary:"Enquadre, escuta, transferência e responsabilidade ética.",icon:"✧",category:"Percurso temático"},
  {id:"curso-freud",title:"Ler Freud",summary:"Estudos dos textos em seu percurso histórico e conceitual.",icon:"◈",category:"Leitura orientada"}
];
export const demoBlocks = [
  {id:"abertura",type:"question",label:"Pergunta de abertura",title:"Antes de começar",body:"Esquecer alguma coisa é sempre recalcar?"},
  {id:"conceito",type:"rich_text",label:"Leitura conceitual",title:"Um conceito, não um sinônimo de esquecer",body:"Na formulação freudiana, o recalque é uma hipótese relacionada ao conflito psíquico. Um esquecimento cotidiano, isoladamente, não permite concluir que houve recalque."},
  {id:"exemplo",type:"clinical_vignette",label:"Situação fictícia",title:"Uma situação para pensar",body:"Alguém não se lembra de uma conversa importante. Quais perguntas ajudariam a investigar esse relato sem impor uma conclusão?"},
  {id:"verificacao",type:"multiple_choice",label:"Questão formativa",title:"Verificação de compreensão",body:"O que diferencia observar um esquecimento de formular uma hipótese sobre o recalque?"}
];
