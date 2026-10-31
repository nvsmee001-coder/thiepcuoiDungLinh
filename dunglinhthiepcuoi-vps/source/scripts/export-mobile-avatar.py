# Export the supplied puppet as layered front-facing SVGs for the fixed phone avatar.
# Preserve front-face winding so projected back caps do not cancel the SVG fill.
from pathlib import Path
import struct,json
b=Path('public/models/thu_mo_vit_xanh_2d.glb').read_bytes(); n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);binary=b[28+n:]
def values(index):
 a=j['accessors'][index];v=j['bufferViews'][a['bufferView']];c={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];f={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];step=v.get('byteStride',struct.calcsize(f)*c);start=v.get('byteOffset',0)+a.get('byteOffset',0)
 return [struct.unpack_from('<'+f*c,binary,start+i*step)for i in range(a['count'])]
def srgb(x): return round(255*(12.92*x if x<=.0031308 else 1.055*x**(1/2.4)-.055))
layers={'back':[],'hands':[],'front':[]}
for mesh in j['meshes']:
 for p in mesh['primitives']:
  pos=values(p['attributes']['POSITION']); indices=[v[0] for v in values(p['indices'])];z=max(v[2]for v in pos)
  paths=[]
  for k in range(0,len(indices),3):
   ids=indices[k:k+3]
   a,c,d=[pos[i]for i in ids]
   u=[c[t]-a[t]for t in range(3)];v=[d[t]-a[t]for t in range(3)]
   cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
   norm=sum(t*t for t in cross)**.5
   if norm==0 or cross[2]/norm<.9:continue
   coords=[(220+pos[i][0]*100,300-pos[i][1]*100)for i in ids]
   paths.append('M'+'L'.join(f'{x:.3f} {y:.3f}'for x,y in coords)+'Z')
  color=j['materials'][p['material']]['pbrMetallicRoughness']['baseColorFactor']
  fill='#'+''.join(f'{srgb(v):02x}'for v in color[:3])
  layer='back'if z<=.065 else 'hands'if z<=.125 else 'front'
  layers[layer].append((z,f'<path fill="{fill}" d="'+''.join(paths)+'"/>'))
for name,shapes in layers.items():
 Path(f'public/wardrobe/mobile-avatar-{name}.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 600" width="440" height="600">'+''.join(s for _,s in sorted(shapes))+'</svg>')
 print(name,len(shapes))
