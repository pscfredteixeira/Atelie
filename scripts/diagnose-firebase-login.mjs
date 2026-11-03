/* Diagnóstico seguro: consulta apenas a configuração pública do Firebase Auth. */
import fs from 'node:fs/promises';
const js=await fs.readFile('firebase.js','utf8');
const key=js.match(/apiKey:\s*['"]([^'"]+)['"]/)?.[1];
const expectedProjectNumber=js.match(/messagingSenderId:\s*['"]([^'"]+)['"]/)?.[1];
if(!key)throw new Error('Firebase API key ausente no arquivo de configuração.');
const url = new URL('https://identitytoolkit.googleapis.com/v1/projects');
url.searchParams.set('key', key);
const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
const data=await response.json().catch(()=>({}));
if(!response.ok){
 console.log('Config pública Firebase Auth: indisponível. HTTP '+response.status+', código '+(data.error?.status||'não informado')+', motivo '+String(data.error?.message||'não informado').replaceAll(key,'[chave omitida]').slice(0,250));
 if(data.error?.message==='CONFIGURATION_NOT_FOUND') console.warn('VERIFICAR: Authentication → Começar / Google, e se o projeto e a Web API Key correspondem.');
 else console.warn('Diagnóstico não conclusivo: configuração pública indisponível.');
}else{
 const allowed=Array.isArray(data.authorizedDomains)?data.authorizedDomains:[];
 // Identity Toolkit uses the numeric project identifier here;
 // Firebase Web SDK projectId is the readable alias (ateliepsi).
 console.log('Número do projeto Firebase Auth:', data.projectId || '(não informado)');
 console.log('Projeto correspondente ao aplicativo Web:', String(data.projectId) === expectedProjectNumber ? 'SIM' : 'VERIFICAR');
 console.log('Domínios OAuth autorizados:', allowed.length?allowed.join(', '):'(nenhum retornado)');
 console.log('GitHub Pages autorizado:',allowed.includes('pscfredteixeira.github.io')?'SIM':'NÃO');
 if(!allowed.includes('pscfredteixeira.github.io')){
   console.error('AÇÃO: Firebase Console > Authentication > Settings > Authorized domains > adicionar pscfredteixeira.github.io');
   console.warn('O site pode não conseguir autenticar até o domínio ser habilitado.');
 }
}
