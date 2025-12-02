import { Suspense } from "react";
import { Await, Link, useLoaderData } from "react-router";
import { getConstituencies } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export async function loader() {
  const constituencies = getConstituencies();
  return { constituencies };
}

export function Component() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Vote Camp</h1>
        <p className="text-muted-foreground">
          Select a constituency to manage your campaign.
        </p>
      </header>

      <Suspense
        fallback={<div className="text-center">Loading constituencies...</div>}
      >
        <Await resolve={loaderData.constituencies}>
          {(constituencies) => {
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {constituencies.map((c) => (
                  <Card
                    key={c.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle>{c.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        District: {c.district}
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                          <Link to={`/map/${c.id}`}>
                            <MapPin className="mr-2 h-4 w-4" />
                            Admin Map
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                          <Link to={`/worker/${c.id}`}>Worker Form</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}
Component.displayName = "HomePage";
