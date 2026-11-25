# BioColeta

Preventive urban drainage monitoring. v2 is a single React + TypeScript app with a mocked API.

```bash
npm install
npm run dev
```

The v1 (PHP + MariaDB) folders are still in the tree until the removal is approved. They are also
preserved by the `v1-php-mvp` tag.

## Terrain data

Drain elevations are sampled once by `npm run terrain` and committed. The 3D relief and the
elevations come from [Terrain Tiles on AWS](https://registry.opendata.aws/terrain-tiles)
([attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)): SRTM and
GMTED2010 terrain data courtesy of the U.S. Geological Survey; global ETOPO1 terrain data from the
U.S. National Oceanic and Atmospheric Administration.
