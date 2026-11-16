/* Sprint JSON 5 — teste focal de navegador para revisão do ZIP.
 * Servidor local na porta 4173; npm install playwright; npx playwright install chromium.
 * Não usa conta real, OAuth nem Firestore. Nenhum deploy ou commit.
 */
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {chromium} from "playwright";

const BASE="http://127.0.0.1:4173/";
const originalManifest=await readFile("content/piloto-json-sprint-02/curso.json","utf8");
const originalLesson=await readFile("content/piloto-json-sprint-02/aulas/escuta-e-hipoteses.json","utf8");
const browser=await chromium.launch({headless:true});

function zipEntries(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const items=new Map();let at=0;
 while(at+30<=bytes.length&&view.getUint32(at,true)===0x04034b50){
  const len=view.getUint32(at+18,true),namesize=view.getUint16(at+26,true),extra=view.getUint16(at+28,true);
  const start=at+30+namesize+extra;
  assert.ok(start+len<=bytes.length,"Arquivo ZIP truncado.");
  const name=Buffer.from(bytes.subarray(at+30,at+30+namesize)).toString("utf8");
  const content=Buffer.from(bytes.subarray(start,start+len)).toString("utf8");
  assert.ok(!items.has(name),"Arquivo ZIP duplicado.");
  items.set(name,content);at=start+len;
 }
 assert.equal(items.size,4,"Pacote deve conter quatro arquivos.");
 return items;
}
async function openPage(hash,options={}){
 const page=await browser.newPage({acceptDownloads:true,...options});
 await page.route("https://www.gstatic.com/firebasejs/**",route=>route.abort());
 await page.goto(BASE+hash,{waitUntil:"domcontentloaded"});
 return page;
}
async function downloadPackage(page){
 const review=page.locator('[data-json-studio-panel="review"]');
 await review.click();
 const analyse=page.locator('[data-json-studio-action="analyse"]');
 await analyse.click();
 const checks=page.locator("input[data-json-studio-review]");
 await checks.first().waitFor({timeout:15000});
 assert.equal(await checks.count(),4);
 const button=page.locator('[data-json-studio-action="download-review"]');
 assert.equal(await button.isDisabled(),true);
 for(let i=0;i<4;i++)await checks.nth(i).check();
 assert.equal(await button.isEnabled(),true);
 const [download]=await Promise.all([page.waitForEvent("download",{timeout:15000}),button.click()]);
 assert.match(download.suggestedFilename(),/\.zip$/);
 return zipEntries(await readFile(await download.path()));
}
try{
 const catalog=await openPage("#/laboratorio/editor");
 await catalog.locator(".json-studio-dashboard").waitFor();
 assert.equal(await catalog.locator(".json-studio-course").count(),2);
 await catalog.locator('a[href*="aula=aula-escuta-e-hipoteses-piloto"]').click();
 const title=catalog.locator("#js-title");
 await title.waitFor();
 await title.fill("A escuta psicanalítica — revisão automatizada");
 const updateZIP=await downloadPackage(catalog);
 const lessonPath="content/piloto-json-sprint-02/aulas/escuta-e-hipoteses.json";
 const manifestPath="content/piloto-json-sprint-02/curso.json";
 const newContent=JSON.parse(updateZIP.get(lessonPath));
 const newManifest=JSON.parse(updateZIP.get(manifestPath));
 const report=JSON.parse(updateZIP.get("RELATORIO_REVISAO.json"));
 assert.equal(newContent.title,"A escuta psicanalítica — revisão automatizada");
 assert.equal(newContent.status,"published");
 assert.equal(newManifest.revision,3);
 assert.equal(report.mode,"update");
 assert.equal(report.publicationPerformed,false);
 assert.ok(updateZIP.get("INSTRUCOES_PUBLICACAO.md").includes("pull request"));
 console.log("OK — atualização no Estúdio, revisão de quatro itens e pacote ZIP validado.");

 const create=await openPage("#/laboratorio/editor?curso=curso-piloto-json-02&novo=modulo-piloto-json-02");
 const newTitle=create.locator("#new-lesson-title");
 await newTitle.waitFor();
 await newTitle.fill("Aula inédita de revisão");
 await create.locator("form[data-json-studio-new] button[type=submit]").click();
 await create.locator("#js-title").waitFor({timeout:15000});
 const createZIP=await downloadPackage(create);
 const creationReport=JSON.parse(createZIP.get("RELATORIO_REVISAO.json"));
 const created=JSON.parse(createZIP.get(creationReport.lessonPath));
 assert.equal(creationReport.mode,"create");
 assert.equal(created.status,"published");
 assert.equal(created.revision,1);
 assert.ok(JSON.parse(createZIP.get(creationReport.manifestPath)).modules[0].lessons.some(l=>l.id===created.id));
 console.log("OK — aula nova, cadastro no manifesto candidato e ZIP.");

 const mobile=await openPage("#/laboratorio/editor",{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.locator(".json-studio-dashboard").waitFor({timeout:15000});
 assert.equal(await mobile.locator(".json-studio-course").count(),2);
 const dimensions=await mobile.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(dimensions.scrollWidth<=dimensions.width+2,
  "A página do editor ultrapassa a largura do celular: "+JSON.stringify(dimensions));
 console.log("OK — índice do editor responsivo em viewport móvel Chromium.");

 assert.equal(await readFile("content/piloto-json-sprint-02/curso.json","utf8"),originalManifest);
 assert.equal(await readFile("content/piloto-json-sprint-02/aulas/escuta-e-hipoteses.json","utf8"),originalLesson);
 console.log("OK — nenhum arquivo do repositório foi alterado no teste de navegador.");
}finally{await browser.close()}
