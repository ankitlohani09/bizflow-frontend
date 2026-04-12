import invoiceService from './invoiceService';
import expenseService from './expenseService';
import purchaseService from './purchaseService';

/**
 * reportService – Client-side BI Engine for aggregating financial data
 */
const reportService = {
    /**
     * Get a comprehensive financial summary for the current month
     */
    async getFinancialSummary() {
        try {
            const [invoices, purchases, expenses] = await Promise.all([
                invoiceService.getAll(),
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
    },

    /**
     * Get historical monthly data for charts and item performance ranking
     */
    async getEnhancedAnalytics() {
        try {
            const [invoices, purchases, expenses] = await Promise.all([
                invoiceService.getAll(),
                purchaseService.getAll(),
                expenseService.getAll()
            ]);

            // 1. Monthly Bucketing (Last 6 Months)
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                months.push({
                    key: d.toLocaleString('default', { month: 'short' }),
                    monthIndex: d.getMonth(),
                    year: d.getFullYear(),
                    sales: 0,
                    expenses: 0,
                    profit: 0
                });
            }

            invoices.forEach(inv => {
                const d = new Date(inv.issueDate || inv.createdAt);
                const bucket = months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
                if (bucket && inv.status === 'PAID') bucket.sales += (inv.totalAmount || 0);
            });

            purchases.forEach(p => {
                const d = new Date(p.purchaseDate || p.createdAt);
                const bucket = months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
                if (bucket) bucket.expenses += (p.totalAmount || 0);
            });

            expenses.forEach(e => {
                const d = new Date(e.date || e.createdAt);
                const bucket = months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
                if (bucket) bucket.expenses += (e.amount || 0);
            });

            const monthlyData = months.map(m => ({
                name: m.key,
                sales: m.sales,
                expenses: m.expenses,
                profit: m.sales - m.expenses
            }));

            // 2. Top Selling Items
            const itemMap = {};
            invoices.forEach(inv => {
                if (inv.items && Array.isArray(inv.items)) {
                    inv.items.forEach(item => {
                        const id = item.itemId;
                        const qty = item.quantity || 0;
                        const price = item.unitPrice || 0;
                        if (!itemMap[id]) {
                            itemMap[id] = { 
                                name: item.itemName || `Item #${id}`, 
                                quantity: 0, 
                                revenue: 0 
                            };
                        }
                        itemMap[id].quantity += qty;
                        itemMap[id].revenue += (qty * price);
                    });
                }
            });

            const topItems = Object.values(itemMap)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            return {
                monthlyData,
                topItems,
            };
        } catch (error) {
            console.error('BI Engine Enhanced Error:', error);
            throw new Error('Failed to fetch detailed analytics.');
        }
    }
};

export default reportService;
