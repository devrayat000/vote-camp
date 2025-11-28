import type { Constituency, Ward } from "./types";

// Helper to generate a simple square polygon around a center
const createSquare = (center: { lat: number; lng: number }, size: number) => {
  const half = size / 2;
  return [
    [center.lng - half, center.lat - half],
    [center.lng + half, center.lat - half],
    [center.lng + half, center.lat + half],
    [center.lng - half, center.lat + half],
    [center.lng - half, center.lat - half],
  ];
};

export const MOCK_CONSTITUENCIES: Constituency[] = [
  {
    id: "dhaka-10",
    name: "Dhaka-10",
    district: "Dhaka",
    center: { lat: 23.7461, lng: 90.3742 }, // Dhanmondi area
    geometry: {
      type: "Polygon",
      coordinates: [createSquare({ lat: 23.7461, lng: 90.3742 }, 0.04)],
    },
  },
  {
    id: "dhaka-11",
    name: "Dhaka-11",
    district: "Dhaka",
    center: { lat: 23.794, lng: 90.4043 }, // Banani area
    geometry: {
      type: "Polygon",
      coordinates: [createSquare({ lat: 23.794, lng: 90.4043 }, 0.04)],
    },
  },
];

export const MOCK_WARDS: Ward[] = [
  // Wards for Dhaka-10
  {
    id: "dhaka-10-w1",
    name: "Ward 15",
    constituencyId: "dhaka-10",
    geometry: {
      type: "Polygon",
      coordinates: [createSquare({ lat: 23.7461, lng: 90.3742 }, 0.015)], // Smaller square inside
    },
  },
  {
    id: "dhaka-10-w2",
    name: "Ward 16",
    constituencyId: "dhaka-10",
    geometry: {
      type: "Polygon",
      coordinates: [createSquare({ lat: 23.7561, lng: 90.3842 }, 0.015)],
    },
  },
];
