import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getConstituencyById, getWardsByConstituency } from "@/lib/api";
import type { Constituency, Ward } from "@/lib/types";
import { GoogleMapWrapper } from "@/components/map/GoogleMapWrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function MapPage() {
  const { constituencyId } = useParams<{ constituencyId: string }>();
  const [constituency, setConstituency] = useState<Constituency | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!constituencyId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const c = await getConstituencyById(constituencyId);
        const w = await getWardsByConstituency(constituencyId);
        setConstituency(c || null);
        setWards(w);
      } catch (error) {
        console.error("Failed to fetch map data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [constituencyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading Map Data...
      </div>
    );
  }

  if (!constituency) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">Constituency Not Found</h1>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button variant="secondary" size="icon" asChild className="shadow-md">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-md shadow-md">
          <h1 className="font-bold text-lg">{constituency.name}</h1>
          <p className="text-xs text-muted-foreground">
            {constituency.district}
          </p>
        </div>
      </div>

      <GoogleMapWrapper constituency={constituency} wards={wards} />
    </div>
  );
}
