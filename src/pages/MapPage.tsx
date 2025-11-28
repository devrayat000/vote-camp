import { Suspense } from "react";
import {
  Link,
  type LoaderFunctionArgs,
  useLoaderData,
  Await,
} from "react-router";
import { getConstituencyById } from "@/lib/api";
import { GoogleMapWrapper } from "@/components/map/GoogleMapWrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export async function loader({ params }: LoaderFunctionArgs) {
  const constituencyId = params.constituencyId;
  if (!constituencyId) {
    throw new Response("Constituency ID is required", { status: 400 });
  }
  const constituency = getConstituencyById(constituencyId);
  // const wards = getWardsByConstituency(constituencyId);
  return {
    constituency,
  };
}

export function Component() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button variant="secondary" size="icon" asChild className="shadow-md">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        {/* <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-md shadow-md">
          <h1 className="font-bold text-lg">{constituency.name}</h1>
          <p className="text-xs text-muted-foreground">
            {constituency.district}
          </p>
        </div> */}
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            Loading Map Data...
          </div>
        }
      >
        <Await resolve={loaderData.constituency}>
          {(constituency) => {
            if (!constituency) {
              return (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <h1 className="text-2xl font-bold">Constituency Not Found</h1>
                  <Button asChild>
                    <Link to="/">Go Home</Link>
                  </Button>
                </div>
              );
            }

            return <GoogleMapWrapper constituency={constituency} />;
          }}
        </Await>
      </Suspense>
    </div>
  );
}
Component.displayName = "MapPage";
