import { queryOptions } from "@tanstack/react-query";
import { listFixtures } from "./fixtures.functions";

export const fixturesQueryOptions = queryOptions({
  queryKey: ["fixtures"],
  queryFn: () => listFixtures(),
  staleTime: 10_000,
  refetchInterval: 30_000,
});