import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader } from 'pbf';
// A bounded local extract; never called by the application or its render loop.
const bounds = [37.588, 55.748, 37.633, 55.776],
  z = 14;
const tileX = (lng) => Math.floor(((lng + 180) / 360) * 2 ** z);
const tileY = (lat) =>
  Math.floor(((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z);
const metadata = await fetch('https://tiles.openfreemap.org/planet').then((r) => {
  if (!r.ok) throw new Error(`TileJSON ${r.status}`);
  return r.json();
});
const template = metadata.tiles[0];
const features = { transportation: [], building: [] };
const seen = new Set();
for (let x = tileX(bounds[0]); x <= tileX(bounds[2]); x++)
  for (let y = tileY(bounds[3]); y <= tileY(bounds[1]); y++) {
    const url = template.replace('{z}', z).replace('{x}', x).replace('{y}', y);
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Tile ${z}/${x}/${y}: ${response.status}`);
    const tile = new VectorTile(new PbfReader(new Uint8Array(await response.arrayBuffer())));
    for (const name of Object.keys(features)) {
      const layer = tile.layers[name];
      if (!layer) continue;
      for (let i = 0; i < layer.length; i++) {
        const f = layer.feature(i).toGeoJSON(x, y, z);
        if (
          name === 'transportation' &&
          (!['primary', 'secondary', 'tertiary', 'minor'].includes(f.properties.class) ||
            f.properties.brunnel ||
            Number(f.properties.layer || 0) !== 0)
        )
          continue;
        if (
          name === 'building' &&
          (f.properties.hide_3d || Number(f.properties.render_min_height || 0) > 0)
        )
          continue;
        const key = name + ':' + JSON.stringify(f.geometry);
        if (seen.has(key)) continue;
        seen.add(key);
        features[name].push(f);
      }
    }
    console.log(`Read ${z}/${x}/${y}`);
  }
writeFileSync(
  'data/moscow-map-extract.json.gz',
  gzipSync(
    JSON.stringify({ source: template, bounds, attribution: metadata.attribution, features }),
  ),
);
console.log(
  `Saved ${features.transportation.length} road features and ${features.building.length} building features`,
);
