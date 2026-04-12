import Card from "../components/Card";
import { useDashboardStats } from "../hooks/useDashboardStats";
import DashboardLayout from "../layouts/DashboardLayout";
import { formatCurrency } from "../utils/formatCurrency";

export default function Dashboard() {
  const { stats, transactions } = useDashboardStats();

  return (
    <DashboardLayout>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            description={stat.description}
            key={stat.title}
            title={stat.title}
            tone={stat.tone}
            value={
              stat.type === "currency" ? formatCurrency(stat.value) : stat.value
            }
          />
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Transactions
          </h2>
          <p className="text-sm text-slate-500">
            Track the latest invoice activity.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 font-medium">Invoice</th>
                <th className="py-3 font-medium">Customer</th>
                <th className="py-3 font-medium">Amount</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  className="border-b border-slate-100 last:border-0"
                  key={transaction.invoice}
                >
                  <td className="py-3 font-medium text-slate-900">
                    {transaction.invoice}
                  </td>
                  <td className="py-3 text-slate-600">
                    {transaction.customer}
                  </td>
                  <td className="py-3 text-slate-600">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td
                    className={`py-3 font-medium ${
                      transaction.status === "Paid"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {transaction.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}
