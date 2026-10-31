"""Convert the CC0 Innerscene STEP assembly into compact browser meshes.
Requires cadquery. Runtime and normal builds do not require CAD tools.
"""
import cadquery as cq,json,pathlib,urllib.request
source=pathlib.Path('assets/source/pump.step')
if not source.exists():
 urllib.request.urlretrieve('https://www.innerscene.com/api/library/centrifugal-pump-with-electric-motor-486d9de9/download',source)
solids=cq.importers.importStep('assets/source/pump.step').solids().vals()
out={}
for name,idx in [('casing',9),('cover',10),('impeller',37)]:
 shape=solids[idx]
 vertices,triangles=shape.tessellate(.8,.25)
 positions=[]
 for v in vertices:
  if name=='casing': p=(v.x*.085,(v.y+225)*.04,(v.z-185)*.057)
  elif name=='cover': p=(v.x*.027,(v.y+234)*.025,(v.z-185)*.027)
  else:p=(v.x*.025,(v.y+208)*.025,(v.z-185)*.025)
  positions.extend(round(n,4) for n in p)
 out[name]={'positions':positions,'indices':[n for t in triangles for n in reversed(t)]}
pathlib.Path('src/pump-meshes.json').write_text(json.dumps(out,separators=(',',':')))
print({k:len(v['indices'])//3 for k,v in out.items()})
