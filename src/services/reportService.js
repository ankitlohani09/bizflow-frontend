import invoiceService from './invoiceService';
import expenseService from './expenseService';
import purchaseService from './purchaseService';

/**
 * reportService – Client-side BI Engine for aggregating financial data
 */
const reportService = {
    /**
     * Get a comprehensive financial summary for the current month
     * @returns {Promise<object>}
     */
    async getFinancialSummary() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        try {
            const [invoices, purchases, expenses] = await Promise.all([
                invoiceService.getAll(), // Ideally these would accept date range if API supported it
                purchaseService.getAll(),
                expenseService.getAll()
            ]);

            const revenue = invoices
                .filter(inv => inv.status === 'PAID')
                .reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

            const purchaseCosts = purchases
                .reduce((acc, p) => acc + (p.totalAmount || 0), 0);

            const directExpenses = expenses
                .reduce((acc, e) => acc + (e.amount || 0), 0);

            const totalCosts = purchaseCosts + directExpenses;
            const netProfit = revenue - totalCosts;

            return {
                revenue,
                costs: totalCosts,
                netProfit,
                margin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0,
                breakdown: {
                    invoices: invoices.length,
                    purchases: purchases.length,
                    expenses: expenses.length
                }
            };
        } catch (error) {
            console.error('BI Engine Aggregation Error:', error);
            throw new Error('Failed to generate financial summary.');
        }
    }
};

export default reportService;
