/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "../src/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import * as turf from "@turf/turf";
import fs from "fs";
import path from "path";

// Read the JSON file
const cccPath = path.join(__dirname, "ccc.json");
const cccData = JSON.parse(fs.readFileSync(cccPath, "utf-8"));

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
};

async function seedData() {
  console.log("Starting seed process...");

  const features = cccData.features;
  const constituenciesMap = new Map<string, any[]>();

  // Group by layer (Constituency)
  features.forEach((feature: any) => {
    const layer = feature.properties.layer;
    if (!constituenciesMap.has(layer)) {
      constituenciesMap.set(layer, []);
    }
    constituenciesMap.get(layer)?.push(feature);
  });

  console.log(`Found ${constituenciesMap.size} constituencies.`);

  for (const [layerName, wardFeatures] of constituenciesMap) {
    const constituencyId = slugify(layerName);
    console.log(`Processing ${layerName} (${wardFeatures.length} wards)...`);

    // 1. Create Wards
    const batch = writeBatch(db);
    const wardPolygons: any[] = [];

    for (const feature of wardFeatures) {
      const wardName =
        feature.properties.UNION_NAME || `Ward-${feature.properties.fid}`;
      const wardId = `${constituencyId}-${slugify(wardName)}`;

      // Convert GeoJSON coords to Firestore format if needed,
      // but for now we store the GeoJSON geometry object directly as a map
      // Note: Firestore has document size limits (1MB). Complex polygons might exceed this.
      // We might need to simplify.

      const geometry = feature.geometry;
      wardPolygons.push(geometry);

      const wardRef = doc(db, "wards", wardId);
      batch.set(wardRef, {
        id: wardId,
        name: wardName,
        constituencyId: constituencyId,
        geometry: JSON.stringify(geometry), // Stringify to avoid nested array error
        properties: feature.properties, // Store extra props just in case
      });
    }

    // 2. Create Constituency
    // Merge polygons to get constituency boundary
    let constituencyGeo = null;
    let center = { lat: 23.8103, lng: 90.4125 }; // Default Dhaka

    try {
      if (wardPolygons.length > 0) {
        // Convert geometries to features for Turf
        const polyFeatures = wardFeatures.map((f: any) =>
          turf.feature(f.geometry)
        );
        const featureCollection = turf.featureCollection(polyFeatures);

        // Calculate center
        const centroid = turf.centroid(featureCollection);
        center = {
          lat: centroid.geometry.coordinates[1],
          lng: centroid.geometry.coordinates[0],
        };

        // Union polygons
        // turf.union takes a FeatureCollection in v7? Or varargs?
        // Checking docs: v7 takes FeatureCollection.
        // Actually, union might return a MultiPolygon if they aren't touching.
        // We'll try to union them one by one or use a dissolve-like approach if available,
        // but union(featureCollection) is not standard turf.
        // Usually it's union(poly1, poly2).

        if (polyFeatures.length === 1) {
          constituencyGeo = polyFeatures[0].geometry;
        } else {
          let unionPoly = polyFeatures[0];
          for (let i = 1; i < polyFeatures.length; i++) {
            try {
              unionPoly = turf.union(
                turf.featureCollection([unionPoly, polyFeatures[i]])
              );
            } catch (e) {
              console.warn(`Failed to union ward ${i} in ${layerName}`, e);
            }
          }
          constituencyGeo = unionPoly?.geometry;
        }
      }
    } catch (e) {
      console.error(`Error processing geometry for ${layerName}:`, e);
    }

    const constituencyRef = doc(db, "constituencies", constituencyId);

    const props = wardFeatures[0].properties;
    const totalPopulation = wardFeatures.reduce(
      (sum, f) => sum + (f.properties.TOTAL_POP || 0),
      0
    );

    batch.set(constituencyRef, {
      id: constituencyId,
      name: layerName,
      district: props.DISTRICT_N || "Dhaka",
      center: center,
      geometry: constituencyGeo ? JSON.stringify(constituencyGeo) : null,
      divisionCode: props.DIVISION_C,
      divisionName: props.DIVISION_N,
      districtCode: props.DISTRICT_C,
      cityCode: props.CITY_CODE,
      cityName: props.CITY_NAME,
      totalPopulation: totalPopulation,
    });

    // Commit batch for this constituency
    await batch.commit();
    console.log(`Saved ${layerName} and its wards.`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seedData().catch(console.error);
