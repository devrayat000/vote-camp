import { useState } from "react";
import type { CampaignArea, MarkerStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface MarkerSidebarProps {
  marker?: CampaignArea;
  isNew: boolean;
  onSave: (status: MarkerStatus, notes: string) => void;
  onUpdate: (id: string, status: MarkerStatus, notes: string) => void;
  onClose: () => void;
}

export function MarkerSidebar({
  marker,
  isNew,
  onSave,
  onUpdate,
  onClose,
}: MarkerSidebarProps) {
  const [status, setStatus] = useState<MarkerStatus>(
    marker?.status || "pending"
  );
  const [notes, setNotes] = useState(marker?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      onSave(status, notes);
    } else if (marker) {
      onUpdate(marker.id, status, notes);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {isNew ? "New Area Status" : "Area Details"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {(
              ["pending", "visited", "absent", "completed"] as MarkerStatus[]
            ).map((s) => (
              <Button
                key={s}
                type="button"
                variant={status === s ? "default" : "outline"}
                className={`capitalize ${
                  status === s ? getStatusColorClass(s) : ""
                }`}
                onClick={() => setStatus(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNotes(e.target.value)
            }
            placeholder="Enter area details..."
            className="h-24"
          />
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full">
            {isNew ? "Save Area" : "Update Area"}
          </Button>
        </div>
      </form>

      {!isNew && marker && (
        <div className="text-xs text-gray-400 mt-auto">
          ID: {marker.id}
          <br />
          Created: {new Date(marker.createdAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function getStatusColorClass(status: MarkerStatus) {
  switch (status) {
    case "visited":
      return "bg-green-600 hover:bg-green-700";
    case "absent":
      return "bg-red-500 hover:bg-red-600";
    case "completed":
      return "bg-blue-600 hover:bg-blue-700";
    default:
      return "";
  }
}
