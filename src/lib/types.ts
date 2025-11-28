export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Constituency {
  id: string;
  name: string;
  district: string;
  center: GeoPoint;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any[]; // GeoJSON coordinates
  };
  divisionCode?: string;
  divisionName?: string;
  districtCode?: string;
  cityCode?: string;
  cityName?: string;
  totalPopulation?: number;
}

export interface Ward {
  id: string;
  name: string;
  constituencyId: string;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any[];
  };
}

export type MarkerStatus = "pending" | "visited" | "absent" | "completed";

export interface CampaignMarker {
  id: string;
  location: GeoPoint;
  status: MarkerStatus;
  notes: string;
  createdAt: string; // ISO string
  constituencyId: string;
  wardId?: string;
}
