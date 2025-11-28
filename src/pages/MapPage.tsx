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
import { APIProvider } from "@vis.gl/react-google-maps";

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

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export function Component() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
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
                    <h1 className="text-2xl font-bold">
                      Constituency Not Found
                    </h1>
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
      </APIProvider>
    </div>
  );
}
Component.displayName = "MapPage";
