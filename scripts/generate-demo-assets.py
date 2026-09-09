"""Deterministic original car model. Map data is built separately from OSM."""
import json, math, struct, base64
from pathlib import Path
root = Path(__file__).resolve().parent.parent / 'public'
# One low-poly mesh in local Z-up metres. Forward direction +X.
positions=[]; normals=[]; colors=[]
def box(center,size,color):
 cx,cy,cz=center; sx,sy,sz=[v/2 for v in size]
 corners=[(cx+x*sx,cy+y*sy,cz+z*sz) for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
 for inds,n in [([0,3,2,1],(0,0,-1)),([4,5,6,7],(0,0,1)),([0,1,5,4],(0,-1,0)),([3,7,6,2],(0,1,0)),([0,4,7,3],(-1,0,0)),([1,2,6,5],(1,0,0))]:
  for j in [0,1,2,0,2,3]: positions.extend(corners[inds[j]]); normals.extend(n); colors.extend(color)
box((0,0,0.65),(4.4,1.85,0.8),(1,1,1))
box((-0.25,0,1.28),(2.3,1.6,0.65),(0.32,0.45,0.52))
for x in (-1.35,1.35):
 for y in (-0.92,0.92): box((x,y,0.4),(0.7,0.22,0.7),(0.10,0.12,0.14))
for y in (-0.6,0.6): box((2.22,y,0.75),(0.04,0.4,0.2),(1,0.96,0.7))
arrays=[positions,normals,colors]; blob=b''; views=[]; accessors=[]
for i,arr in enumerate(arrays):
 raw=struct.pack('<'+'f'*len(arr),*arr); views.append({'buffer':0,'byteOffset':len(blob),'byteLength':len(raw),'target':34962}); blob+=raw
 accessor={'bufferView':i,'componentType':5126,'count':len(arr)//3,'type':'VEC3'}
 if i==0: accessor.update(min=[min(arr[j::3]) for j in range(3)],max=[max(arr[j::3]) for j in range(3)])
 accessors.append(accessor)
gltf={'asset':{'version':'2.0','generator':'CityFlow original procedural car'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0}],'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1,'COLOR_0':2}}]}],'buffers':[{'byteLength':len(blob),'uri':'data:application/octet-stream;base64,'+base64.b64encode(blob).decode()}],'bufferViews':views,'accessors':accessors}
(root/'models/car.gltf').write_text(json.dumps(gltf))
