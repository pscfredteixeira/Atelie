/**
 * Atelier · Sprint 3 — Registro aberto de componentes pedagógicos.
 * O tipo de um bloco escolhe seu componente; nunca o ID de uma aula.
 * Componentes não recebem permissões de execução de código a partir do JSON.
 */
const types=new Map();
const typePattern=/^[a-z][a-z0-9_]*$/;

export function registerBlockRenderer({type,version=1,label,render,outline}){
  if(!typePattern.test(type)||!Number.isInteger(version)||version<1||typeof render!=="function")
    throw new TypeError("Registro de bloco inválido.");
  if(!label||typeof label!=="string")throw new TypeError("Todo bloco precisa de um nome pedagógico.");
  const versions=types.get(type)||new Map();
  if(versions.has(version))throw new Error("Componente já registrado: "+type+"@"+version);
  versions.set(version,Object.freeze({type,version,label,render,outline}));
  types.set(type,versions);
}
export function getBlockRenderer(type,version=1){
  return types.get(type)?.get(version)||null;
}
export function getBlockLabel(type,version=1){
  return getBlockRenderer(type,version)?.label||"Componente não disponível";
}
export function listRegisteredBlocks(){
  return [...types.values()].flatMap(versions=>[...versions.values()].map(x=>({type:x.type,version:x.version,label:x.label})));
}
