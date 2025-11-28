import { Toaster } from "@/components/ui/sonner";
import { Fragment } from "react";
import { Outlet } from "react-router";

export default function RootLayout() {
  return (
    <Fragment>
      <Outlet />
      <Toaster />
    </Fragment>
  );
}
