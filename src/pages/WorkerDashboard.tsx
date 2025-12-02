import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useNavigate } from "react-router";
import { getWardsByConstituency, updateWardStatus } from "@/lib/api";
import type { Ward } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const formSchema = z.object({
  wardId: z.string().min(1, "Please select a ward"),
  workerName: z.string().min(2, "Name must be at least 2 characters"),
});

export function Component() {
  const { constituencyId } = useParams();
  const navigate = useNavigate();
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wardId: "",
      workerName: "",
    },
  });

  useEffect(() => {
    if (constituencyId) {
      getWardsByConstituency(constituencyId).then((data) => {
        setWards(data);
        setLoading(false);
      });
    }
  }, [constituencyId]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateWardStatus(values.wardId, "completed", {
        workerName: values.workerName,
        timestamp: new Date().toISOString(),
        action: "marked_completed",
      });
      toast.success("Ward status updated successfully!");
      form.reset();
    } catch (error) {
      toast.error("Failed to update ward status.");
      console.error(error);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading wards...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Party Worker Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="wardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Ward</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a ward" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wards.map((ward) => (
                          <SelectItem key={ward.id} value={ward.id}>
                            {ward.name} ({ward.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Submit Report
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

Component.displayName = "WorkerDashboard";
