import * as turf from "@turf/turf";
import type { Constituency, Ward } from "./types";
import type { Polygon, MultiPolygon } from "geojson";

export function generateMockWards(
  constituency: Constituency,
  count: number = 12
): Ward[] {
  if (!constituency.geometry) return [];

  // Convert constituency geometry to a Turf feature
  const constituencyFeature = turf.feature(constituency.geometry);
  const bbox = turf.bbox(constituencyFeature);

  // Generate a grid of points or polygons within the bbox
  // We'll use a hex grid or square grid for simplicity
  // Calculate cell size to get roughly 'count' cells

  // A simple approach: Voronoi diagram of random points within the bbox, clipped to the constituency
  const points = turf.randomPoint(count, { bbox });
  const voronoi = turf.voronoi(points, { bbox });

  const wards: Ward[] = [];

  voronoi.features.forEach((feature, index) => {
    if (!feature) return;

    // Intersect with constituency to clip it
    // Note: intersect might be slow or complex if geometry is complex.
    // For simplicity in this mock, we might just use the voronoi cells if they are close enough,
    // or just use the points and create a simple grid.

    // Let's try a simpler approach: Square Grid
    // But square grid might not cover the shape well.

    // Let's stick to Voronoi but handle the clipping if possible, or just return the cell.
    // Since we want to show them on the map, clipping is better visually.

    let geometry: Polygon | MultiPolygon = feature.geometry;
    try {
      const clipped = turf.intersect(
        turf.featureCollection([feature, constituencyFeature])
      );
      if (clipped) {
        geometry = clipped.geometry;
      } else {
        // If no intersection (shouldn't happen if points are inside), skip
        return;
      }
    } catch {
      // Fallback if intersect fails
      console.warn("Clipping failed for ward", index);
    }

    wards.push({
      id: `ward-${index + 1}`,
      name: `Ward ${index + 1}`,
      constituencyId: constituency.id,
      geometry: geometry,
      status: "pending", // Default status
      activityLog: [],
    });
  });

  return wards;
}
