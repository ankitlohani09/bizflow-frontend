import { getDashboardSummary } from "../services/dashboardService";

export function useDashboardStats() {
  // This hook keeps page components focused on rendering, not data fetching details.
  return getDashboardSummary();
}
