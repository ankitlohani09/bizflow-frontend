// Services are a good place to keep API calls. This mock data can be replaced later.
export function getDashboardSummary() {
  return {
    stats: [
      {
        title: "Total Sales",
        value: 45000,
        description: "Revenue collected this month",
        type: "currency",
      },
      {
        title: "Expenses",
        value: 12000,
        description: "Business spending this month",
        tone: "danger",
        type: "currency",
      },
      {
        title: "Profit",
        value: 33000,
        description: "Sales minus expenses",
        tone: "success",
        type: "currency",
      },
      {
        title: "Low Stock",
        value: "8 Items",
        description: "Products that need attention",
        tone: "warning",
      },
    ],
    transactions: [
      {
        invoice: "INV-001",
        customer: "Ravi",
        amount: 1200,
        status: "Paid",
      },
      {
        invoice: "INV-002",
        customer: "Ajay",
        amount: 800,
        status: "Pending",
      },
    ],
  };
}
