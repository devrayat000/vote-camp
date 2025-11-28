import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getConstituencies } from "@/lib/api";
import type { Constituency } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export function HomePage() {
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConstituencies().then((data) => {
      setConstituencies(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Vote Camp</h1>
        <p className="text-muted-foreground">
          Select a constituency to manage your campaign.
        </p>
      </header>

      {loading ? (
        <div className="text-center">Loading constituencies...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {constituencies.map((c) => (
            <Card key={c.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  District: {c.district}
                </p>
                <Button asChild className="w-full">
                  <Link to={`/map/${c.id}`}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Open Map
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
