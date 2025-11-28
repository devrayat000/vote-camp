import { Routes, Route } from "react-router";
import { HomePage } from "@/pages/HomePage";
import { MapPage } from "@/pages/MapPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map/:constituencyId" element={<MapPage />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
