"""Build closed driving routes from a local OpenFreeMap / OSM vector extract.
No straight-line links are invented between disconnected streets.
"""
import json, math, heapq, gzip
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
raw=json.loads(gzip.decompress((ROOT/'data/moscow-map-extract.json.gz').read_bytes()))
west,south,east,north=raw['bounds']
SX=111320*math.cos(math.radians(55.758)); SY=111320

def local(p): return ((p[0]-37.608)*SX,(p[1]-55.758)*SY)
def inside(p,ring):
    x,y=p; hit=False
    for a,b in zip(ring,ring[1:]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]: hit=not hit
    return hit

def distance_to_segment(p,a,b):
    dx=b[0]-a[0];dy=b[1]-a[1];den=dx*dx+dy*dy
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
    return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)

buildings=[];polygons=[];grid=defaultdict(set)
for f in raw['features']['building']:
    geom=f['geometry'];groups=[geom['coordinates']] if geom['type']=='Polygon' else geom['coordinates']
    all_points=[p for polygon in groups for ring in polygon for p in ring]
    if not any(west-0.002<=p[0]<=east+0.002 and south-0.002<=p[1]<=north+0.002 for p in all_points):continue
    f['properties']['height']=max(0.5,float(f['properties'].get('render_height',10)))
    buildings.append(f)
    for polygon in groups:
        rings=[[local(p) for p in ring] for ring in polygon]
        points=rings[0];box=(min(p[0] for p in points)-3,min(p[1] for p in points)-3,max(p[0] for p in points)+3,max(p[1] for p in points)+3)
        idx=len(polygons);polygons.append((rings,box))
        for x in range(math.floor(box[0]/100),math.floor(box[2]/100)+1):
            for y in range(math.floor(box[1]/100),math.floor(box[3]/100)+1):grid[x,y].add(idx)

def blocked(p):
    for idx in grid[math.floor(p[0]/100),math.floor(p[1]/100)]:
        rings,box=polygons[idx]
        if not(box[0]<=p[0]<=box[2] and box[1]<=p[1]<=box[3]):continue
        if inside(p,rings[0]) and not any(inside(p,r) for r in rings[1:]):return True
        if any(distance_to_segment(p,a,b)<3 for ring in rings for a,b in zip(ring,ring[1:])):return True
    return False

coords={};graph=defaultdict(dict);road_features=[];seen=set();rejected=0
# Tile coordinates lie on the same global quantisation grid; round only floating-point noise.
def key(p):return (round(p[0],8),round(p[1],8))
for feature in raw['features']['transportation']:
    props=feature['properties']
    if props.get('access') in ('no','private') or props.get('motor_vehicle')=='no':continue
    geom=feature['geometry'];lines=[geom['coordinates']] if geom['type']=='LineString' else geom['coordinates']
    for line in lines:
        for a,b in zip(line,line[1:]):
            if not all(west<=p[0]<=east and south<=p[1]<=north for p in (a,b)):continue
            ka,kb=key(a),key(b)
            if ka==kb:continue
            pa,pb=local(a),local(b);length=math.dist(pa,pb);steps=max(1,math.ceil(length))
            if any(blocked((pa[0]+(pb[0]-pa[0])*i/steps,pa[1]+(pb[1]-pa[1])*i/steps)) for i in range(steps+1)):
                rejected+=1;continue
            coords[ka]=list(ka);coords[kb]=list(kb)
            oneway=props.get('oneway',0)
            if oneway!=-1:graph[ka][kb]=length
            if oneway!=1:graph[kb][ka]=length
            segment_key=tuple(sorted((ka,kb)))
            if segment_key not in seen:
                seen.add(segment_key);road_features.append({'type':'Feature','properties':{'class':props['class'],'oneway':oneway},'geometry':{'type':'LineString','coordinates':[list(ka),list(kb)]}})

# Largest strongly connected component: every chosen anchor must be reachable both ways.
vertices=set(graph)|{n for edges in graph.values() for n in edges};reverse=defaultdict(list)
for a,edges in list(graph.items()):
    for b in edges:reverse[b].append(a)
visited=set();order=[]
for start in sorted(vertices):
    if start in visited:continue
    stack=[(start,False)]
    while stack:
        n,done=stack.pop()
        if done:order.append(n);continue
        if n in visited:continue
        visited.add(n);stack.append((n,True));stack.extend((b,False) for b in graph[n] if b not in visited)
visited=set();components=[]
for start in reversed(order):
    if start in visited:continue
    component=set();stack=[start];visited.add(start)
    while stack:
        n=stack.pop();component.add(n)
        for b in reverse[n]:
            if b not in visited:visited.add(b);stack.append(b)
    components.append(component)
connected=max(components,key=len)
def nearest(p):return min(connected,key=lambda n:math.dist(local(n),local(p)))
def shortest(start,end):
    queue=[(0,start)];distance={start:0};previous={}
    while queue:
        d,a=heapq.heappop(queue)
        if a==end:break
        if d!=distance[a]:continue
        for b,length in graph[a].items():
            if b not in connected:continue
            nd=d+length
            if nd<distance.get(b,math.inf):distance[b]=nd;previous[b]=a;heapq.heappush(queue,(nd,b))
    if end not in distance:raise ValueError('Disconnected route anchors')
    path=[end]
    while path[-1]!=start:path.append(previous[path[-1]])
    return list(reversed(path))
anchor_sets=[
    [(37.612,55.759),(37.607,55.764),(37.601,55.761),(37.605,55.756)],
    [(37.607,55.764),(37.603,55.769),(37.615,55.770),(37.617,55.765)],
    [(37.607,55.755),(37.597,55.756),(37.598,55.763),(37.610,55.762)],
    [(37.618,55.760),(37.627,55.761),(37.623,55.765),(37.615,55.765)],
]
routes=[]
for index,anchors in enumerate(anchor_sets):
    nodes=[nearest(p) for p in anchors];path=[]
    for a,b in zip(nodes,nodes[1:]+nodes[:1]):
        part=shortest(a,b);path.extend(part if not path else part[1:])
    if len(path)<4 or path[0]!=path[-1]:raise ValueError('Route must form a closed road path')
    routes.append({'type':'Feature','properties':{'id':f'osm-loop-{index+1}','name':f'Центр Москвы · маршрут {index+1}','source':'OpenStreetMap / OpenFreeMap'},'geometry':{'type':'LineString','coordinates':[coords[n] for n in path]}})
for name,features in [('routes',routes),('buildings',buildings),('roads',road_features)]:
    (ROOT/f'public/data/{name}.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')))
print(f'{len(routes)} closed routes, {len(road_features)} road segments, {len(buildings)} building parts; connected graph: {len(connected)} nodes; excluded near-building segments: {rejected}')
