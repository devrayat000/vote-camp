import type { Constituency } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ConstituencySidebarProps {
  constituency: Constituency;
  onClose: () => void;
}

export function ConstituencySidebar({
  constituency,
  onClose,
}: ConstituencySidebarProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{constituency.name}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid gap-1">
          <h3 className="font-semibold text-sm text-muted-foreground">
            District
          </h3>
          <p className="text-base">
            {constituency.district}{" "}
            <span className="text-xs text-muted-foreground">
              ({constituency.districtCode || "N/A"})
            </span>
          </p>
        </div>

        <div className="grid gap-1">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Division
          </h3>
          <p className="text-base">
            {constituency.divisionName || "N/A"}{" "}
            <span className="text-xs text-muted-foreground">
              ({constituency.divisionCode || "N/A"})
            </span>
          </p>
        </div>

        <div className="grid gap-1">
          <h3 className="font-semibold text-sm text-muted-foreground">
            City Corporation
          </h3>
          <p className="text-base">
            {constituency.cityName || "N/A"}{" "}
            <span className="text-xs text-muted-foreground">
              ({constituency.cityCode || "N/A"})
            </span>
          </p>
        </div>

        <div className="grid gap-1">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Total Population
          </h3>
          <p className="text-2xl font-light">
            {constituency.totalPopulation?.toLocaleString() || "N/A"}
          </p>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">ID: {constituency.id}</p>
        </div>
      </div>
    </div>
  );
}
