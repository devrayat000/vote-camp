import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router";
import RootLayout from "./pages/Layout";

const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route
        index
        lazy={async () => {
          const module = await import("./pages/HomePage");
          return module;
        }}
      />
      <Route
        path="map/:constituencyId"
        lazy={async () => {
          const module = await import("./pages/MapPage");
          return module;
        }}
      />
      <Route
        path="worker/:constituencyId"
        lazy={async () => {
          const module = await import("./pages/WorkerDashboard");
          return module;
        }}
      />
    </Route>
  )
);

function App() {
  return <RouterProvider router={routes} />;
}

export default App;
