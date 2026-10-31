import { build } from "esbuild";
import { mkdir, cp, copyFile, writeFile, rm } from "node:fs/promises";
const output="public";
await rm(output,{recursive:true,force:true});
await mkdir(output+"/vendor",{recursive:true});
for(const name of ["index.html","crew.css","legacy.html","game.js","physics.js","style.css"]){
  await copyFile(name,output+"/"+name);
}
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
console.log("Factory Crew and original SprayWorks ready for GitHub Pages.");
