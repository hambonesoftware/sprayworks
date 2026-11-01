import { build } from "esbuild";
import { mkdir, cp, copyFile, writeFile, rm } from "node:fs/promises";
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
await writeFile(output+"/.nojekyll","");
console.log("Machine Rescue and original SprayWorks ready for GitHub Pages.");
