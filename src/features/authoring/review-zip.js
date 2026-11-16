/* Sprint JSON 5 — ZIP simples e portátil (STORE/sem compactação).
 * Sem dependências ou rede; arquivo contém apenas textos do plano validado.
 */
const encoder=new TextEncoder();
const MAX_FILE=5*1024*1024;
const MAX_ARCHIVE=20*1024*1024;
const ENTRY=/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+$/;
function crc32(bytes){
 let crc=0xffffffff;
 for(const byte of bytes){
  crc^=byte;
  for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}
function u16(view,offset,n){view.setUint16(offset,n,true)}
function u32(view,offset,n){view.setUint32(offset,n,true)}
export function makeReviewZIP(files){
 if(!Array.isArray(files)||!files.length||files.length>50)
  throw Error("Pacote de publicação deve ter entre 1 e 50 arquivos.");
 let dataLen=22,entries=[];
 const paths=new Set();
 for(const file of files){
  if(!file||typeof file.path!=="string"||!ENTRY.test(file.path)||
     file.path.startsWith("/")||file.path.includes("..")||file.path.includes("\\"))
    throw Error("Nome de arquivo inadequado para ZIP: "+file?.path);
  if(paths.has(file.path))throw Error("Arquivo repetido no ZIP: "+file.path);
  paths.add(file.path);
  if(typeof file.content!=="string")throw Error("Conteúdo do ZIP deve ser texto UTF-8.");
  const name=encoder.encode(file.path),body=encoder.encode(file.content);
  if(name.length>65535||body.length>MAX_FILE)
   throw Error("Arquivo excede limites do ZIP: "+file.path);
  dataLen+=30+name.length+body.length+46+name.length;
  if(dataLen>MAX_ARCHIVE)throw Error("O pacote excede 20 MB.");
  entries.push({name,body,checksum:crc32(body)});
 }
 const result=new Uint8Array(dataLen),view=new DataView(result.buffer);
 let at=0;const central=[];
 for(const item of entries){
  const local=at;
  u32(view,at,0x04034b50);u16(view,at+4,20);u16(view,at+6,0x0800);
  u16(view,at+8,0);u16(view,at+10,0);u16(view,at+12,0);
  u32(view,at+14,item.checksum);u32(view,at+18,item.body.length);u32(view,at+22,item.body.length);
  u16(view,at+26,item.name.length);u16(view,at+28,0);at+=30;
  result.set(item.name,at);at+=item.name.length;
  result.set(item.body,at);at+=item.body.length;
  central.push({item,local});
 }
 const centralStart=at;
 for(const {item,local} of central){
  u32(view,at,0x02014b50);u16(view,at+4,20);u16(view,at+6,20);
  u16(view,at+8,0x0800);u16(view,at+10,0);
  u16(view,at+12,0);u16(view,at+14,0);
  u32(view,at+16,item.checksum);u32(view,at+20,item.body.length);
  u32(view,at+24,item.body.length);u16(view,at+28,item.name.length);
  u16(view,at+30,0);u16(view,at+32,0);u16(view,at+34,0);
  u16(view,at+36,0);u32(view,at+38,0);u32(view,at+42,local);at+=46;
  result.set(item.name,at);at+=item.name.length;
 }
 const centralSize=at-centralStart;
 u32(view,at,0x06054b50);u16(view,at+4,0);u16(view,at+6,0);
 u16(view,at+8,entries.length);u16(view,at+10,entries.length);
 u32(view,at+12,centralSize);u32(view,at+16,centralStart);u16(view,at+20,0);at+=22;
 if(at!==result.byteLength)throw Error("Falha ao montar o ZIP de revisão.");
 return result;
}
export function downloadReviewZIP(files,filename="atelie-pacote-revisao.zip"){
 if(typeof document==="undefined"||typeof URL==="undefined"||typeof Blob==="undefined")
  throw Error("O download precisa ser iniciado em um navegador.");
 const bytes=makeReviewZIP(files);
 const blob=new Blob([bytes],{type:"application/zip"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;
 a.download=filename;
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);
 return {filename,bytes:bytes.length};
}
