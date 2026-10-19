/* Alternância visual global do Atelier. Sem dependências de autenticação ou backend. */
const KEY="atelier-theme-golden-v1";
const THEMES=["dark","light"];
export function getTheme(){
 const current=document.documentElement.dataset.theme;
 return THEMES.includes(current)?current:"light";
}
export function applyTheme(theme,{persist=true}={}){
 const normalized=THEMES.includes(theme)?theme:"light";
 document.documentElement.dataset.theme=normalized;
 document.documentElement.style.colorScheme=normalized;
 if(persist){
  try{localStorage.setItem(KEY,normalized)}catch{/* preferência apenas nesta aba */}
 }
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.setAttribute("content",normalized==="light"?"#fff8f1":"#1b1714");
 syncThemeControls();
 return normalized;
}
export function toggleTheme(){
 return applyTheme(getTheme()==="dark"?"light":"dark");
}
export function themeToggleHTML(){
 const light=getTheme()==="light";
 return '<button class="theme-toggle" type="button" data-theme-toggle aria-pressed="'+light+'" '+
  'aria-label="Modo claro" title="'+
   (light?"Mudar para tema escuro":"Mudar para tema claro")+'">'+
  '<svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+
   '<circle cx="12" cy="12" r="4"></circle>'+
   '<path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path></svg>'+
  '<svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+
   '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"></path></svg>'+
  '<span class="theme-toggle-text">Tema '+(light?"escuro":"claro")+'</span></button>';
}
export function syncThemeControls(){
 const light=getTheme()==="light";
 document.querySelectorAll("[data-theme-toggle]").forEach(button=>{
  button.setAttribute("aria-pressed",String(light));
  button.setAttribute("aria-label","Modo claro");
  button.setAttribute("title",light?"Mudar para tema escuro":"Mudar para tema claro");
  const text=button.querySelector(".theme-toggle-text");
  if(text)text.textContent="Tema "+(light?"escuro":"claro");
 });
}
