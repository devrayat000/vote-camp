/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeBatch, doc } from "firebase/firestore";
import * as turf from "@turf/turf";
import { db } from "../src/lib/firebase";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

async function seedData() {
  console.log("Starting seed process...");

  // 1. Load Data
  const cccPath = path.join(__dirname, "ccc.json");
  const wardsPath = path.join(__dirname, "dhaka_wards.json");

  if (!fs.existsSync(cccPath) || !fs.existsSync(wardsPath)) {
    console.error("Data files not found!");
    process.exit(1);
  }

  const cccData = JSON.parse(fs.readFileSync(cccPath, "utf-8"));
  const wardsData = JSON.parse(fs.readFileSync(wardsPath, "utf-8"));

  console.log(
    `Loaded ${cccData.features.length} constituency fragments and ${wardsData.length} wards.`
  );

  // 2. Process Constituencies (Union fragments by 'layer')
  const fragmentsByLayer = new Map<string, any[]>();

  cccData.features.forEach((feature: any) => {
    const layer = feature.properties.layer;
    if (!fragmentsByLayer.has(layer)) {
      fragmentsByLayer.set(layer, []);
    }
    fragmentsByLayer.get(layer)?.push(feature);
  });

  console.log(`Found ${fragmentsByLayer.size} unique constituencies.`);

  const BATCH_LIMIT = 100;

  // Helper to manage batches
  let currentBatch = writeBatch(db);
  let currentBatchSize = 0;

  const addToBatch = async (ref: any, data: any) => {
    currentBatch.set(ref, data);
    currentBatchSize++;
    if (currentBatchSize >= BATCH_LIMIT) {
      console.log("Committing batch...");
      await currentBatch.commit();
      currentBatch = writeBatch(db);
      currentBatchSize = 0;
    }
  };

  // Build Constituency Geometries
  const constituencyGeometries: { [key: string]: any } = {}; // id -> geometry

  for (const [layerName, fragments] of fragmentsByLayer) {
    const id = slugify(layerName);
    console.log(
      `Processing constituency: ${layerName} (${fragments.length} fragments)`
    );

    let unionGeo: any = null;

    try {
      if (fragments.length === 1) {
        unionGeo = fragments[0].geometry;
      } else {
        // Turf v7 union takes a FeatureCollection
        const fc = turf.featureCollection(fragments);
        const unioned = turf.union(fc);
        if (unioned) {
          unionGeo = unioned.geometry;
        } else {
          console.warn(
            `Union returned null for ${layerName}, using first fragment.`
          );
          unionGeo = fragments[0].geometry;
        }
      }
    } catch (e) {
      console.error(`Error unioning ${layerName}:`, e);
      unionGeo = fragments[0].geometry;
    }

    constituencyGeometries[id] = unionGeo;

    // Calculate center
    let center = { lat: 23.8103, lng: 90.4125 };
    if (unionGeo) {
      const centroid = turf.centroid(turf.feature(unionGeo));
      center = {
        lat: centroid.geometry.coordinates[1],
        lng: centroid.geometry.coordinates[0],
      };
    }

    // Save Constituency
    const constituencyRef = doc(db, "constituencies", id);
    await addToBatch(constituencyRef, {
      id,
      name: layerName,
      geometry: JSON.stringify(unionGeo),
      center,
      totalPopulation: fragments.reduce(
        (sum: number, f: any) => sum + (f.properties.TOTAL_POP || 0),
        0
      ),
      divisionName: fragments[0].properties.DIVISION_N,
      districtName: fragments[0].properties.DISTRICT_N,
    });
  }

  // 3. Process Wards
  console.log("Processing wards...");
  let matchedWards = 0;
  let unmatchedWards = 0;

  for (const wardFeature of wardsData) {
    const wardName = wardFeature.properties.ADM4_EN;
    const wardId = slugify(
      wardName + "-" + (wardFeature.properties.ADM3_EN || "")
    );

    // Find containing constituencies
    const assignedConstituencyIds: string[] = [];
    const wardPoly = turf.feature(wardFeature.geometry);
    const wardArea = turf.area(wardPoly);

    for (const [constituencyId, constituencyGeo] of Object.entries(
      constituencyGeometries
    )) {
      if (!constituencyGeo) continue;
      const constituencyPoly = turf.feature(constituencyGeo);

      try {
        // Use v6 signature as verified by test script
        const intersection = turf.intersect(
          turf.featureCollection([wardPoly, constituencyPoly])
        );

        if (intersection) {
          const intersectionArea = turf.area(intersection);
          // If intersection is significant (e.g. > 1% of ward area)
          if (intersectionArea > wardArea * 0.01) {
            assignedConstituencyIds.push(constituencyId);
          }
        }
      } catch (_e) {
        // Ignore intersection errors
      }
    }

    if (assignedConstituencyIds.length > 0) {
      matchedWards++;
    } else {
      unmatchedWards++;
      console.warn(`Could not match ward: ${wardName}`);
    }

    // Save Ward
    const wardRef = doc(db, "wards", wardId);
    await addToBatch(wardRef, {
      id: wardId,
      name: wardName,
      constituencyIds: assignedConstituencyIds,
      thana: wardFeature.properties.ADM3_EN,
      district: wardFeature.properties.ADM2_EN,
      geometry: JSON.stringify(wardFeature.geometry),
      status: "pending",
      activityLog: [],
    });
  }

  console.log(`Matched ${matchedWards} wards. Unmatched: ${unmatchedWards}.`);

  // Commit remaining
  if (currentBatchSize > 0) {
    await currentBatch.commit();
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seedData().catch(console.error);
