import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/mon-espace")({
  beforeLoad: () => {
    throw redirect({ to: "/ma-reservation" });
  },
  component: () => null,
});
