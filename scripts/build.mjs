import { build } from "esbuild";
import { mkdir, cp, copyFile, writeFile, rm, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const output="public";
await rm(output,{recursive:true,force:true});
await mkdir(output+"/vendor",{recursive:true});
for(const name of ["index.html","legacy.html","game.js","physics.js","style.css"]){
  await copyFile(name,output+"/"+name);
}
await copyFile("src/style.css",output+"/crew.css");
await copyFile("src/clock.css",output+"/clock.css");
await cp("vendor",output+"/vendor",{recursive:true});
await build({
  entryPoints:["factory.js"],
  outfile:output+"/factory.bundle.js",
  bundle:true,
  minify:true,
  treeShaking:true,
  format:"esm",
  platform:"browser",
  target:["es2020","safari15"],
  legalComments:"eof",
  logLevel:"info"
});
// Fingerprint deployed assets so mobile Safari cannot keep using an old game bundle.
const digest=bytes=>createHash("sha256").update(bytes).digest("hex").slice(0,12);
const bundleVersion=digest(await readFile(output+"/factory.bundle.js"));
const cssVersion=digest(await readFile(output+"/crew.css"));
const clockVersion=digest(await readFile(output+"/clock.css"));
let html=await readFile(output+"/index.html","utf8");
html=html.replace("crew.css?v=9",`crew.css?v=${cssVersion}`)
         .replace("factory.bundle.js?v=9",`factory.bundle.js?v=${bundleVersion}`);
await writeFile(output+"/index.html",html);
// The dynamically inserted clock stylesheet must also use its own fingerprint.
let bundle=await readFile(output+"/factory.bundle.js","utf8");
bundle=bundle.replace("clock.css?v=7",`clock.css?v=${clockVersion}`);
await writeFile(output+"/factory.bundle.js",bundle);
if(!html.includes(`factory.bundle.js?v=${bundleVersion}`)||!bundle.includes(`clock.css?v=${clockVersion}`))throw Error("Asset versioning failed");
await writeFile(output+"/.nojekyll","");
console.log("Machine Rescue and original SprayWorks ready for GitHub Pages.");
