import invoiceService from './invoiceService';
import expenseService from './expenseService';
import purchaseService from './purchaseService';
import inventoryService from './inventoryService';

/**
 * reportService – Client-side BI Engine for aggregating financial data
 */
const reportService = {
    // ── Helper: Data Cache ──────────────────────────────────────────────────
    // Prevents redundant API calls during complex aggregation
    _cache: {
        data: null,
        promise: null,
        timestamp: 0
    },

    async _getRawData() {
        const now = Date.now();
        
        // 1. If we have fresh data, return it
        if (this._cache.data && (now - this._cache.timestamp < 2000)) {
            return this._cache.data;
        }

        // 2. If a request is already in flight, return that promise
        if (this._cache.promise) {
            return this._cache.promise;
        }

        // 3. Otherwise, start a new request and cache the promise
        this._cache.promise = (async () => {
            try {
                const [invoices, purchases, expenses, inventory] = await Promise.all([
                    invoiceService.getAll(),
                    purchaseService.getAll(),
                    expenseService.getAll(),
                    inventoryService.getAll()
                ]);

                const data = { invoices, purchases, expenses, inventory };
                this._cache.data = data;
                this._cache.timestamp = Date.now();
                return data;
            } finally {
                // Clear the promise once finished
                this._cache.promise = null;
            }
        })();

        return this._cache.promise;
    },

    /**
     * Get a comprehensive financial summary for the current month
     */
    async getFinancialSummary() {
        try {
            const { invoices, purchases, expenses, inventory } = await this._getRawData();

            const revenue = invoices
                .filter(inv => (inv.paymentStatus || inv.status) === 'PAID')
                .reduce((acc, inv) => acc + (inv.grandTotal || inv.totalAmount || 0), 0);

            const purchaseCosts = purchases
                .reduce((acc, p) => acc + (p.grandTotal || p.totalAmount || 0), 0);

            const directExpenses = expenses
                .reduce((acc, e) => acc + (e.amount || 0), 0);

            const totalCosts = purchaseCosts + directExpenses;
            const netProfit = revenue - totalCosts;

            const lowStockCount = inventory ? inventory.filter(i => (i.availableQty || 0) < 10).length : 0;
            const totalItems = inventory ? inventory.length : 0;

            return {
                revenue,
                costs: totalCosts,
                netProfit,
                margin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0,
                lowStockCount,
                totalItems,
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
            const { invoices, purchases, expenses } = await this._getRawData();

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
                if (bucket && (inv.paymentStatus || inv.status) === 'PAID') bucket.sales += (inv.grandTotal || inv.totalAmount || 0);
            });

            purchases.forEach(p => {
                const d = new Date(p.purchaseDate || p.createdAt);
                const bucket = months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
                if (bucket) bucket.expenses += (p.grandTotal || p.totalAmount || 0);
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
    },

    /**
     * Generate Smart AI Insights (Phase 1)
     */
    async getSmartInsights() {
        try {
            const summary = await this.getFinancialSummary();
            const analytics = await this.getEnhancedAnalytics();
            const insights = [];

            // 1. Revenue Insight
            if (summary.revenue > 0) {
                insights.push({
                    type: 'POSITIVE',
                    category: 'SALES',
                    textKey: 'sales_insight',
                    params: { amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.revenue) },
                    relevance: 0.9
                });
            }

            // 2. Profitability Insight
            if (parseFloat(summary.margin) > 20) {
                insights.push({
                    type: 'POSITIVE',
                    category: 'PROFIT',
                    textKey: 'profit_good_insight',
                    params: { margin: summary.margin },
                    relevance: 0.85
                });
            } else if (parseFloat(summary.margin) < 5 && summary.revenue > 0) {
                insights.push({
                    type: 'WARNING',
                    category: 'PROFIT',
                    textKey: 'profit_low_insight',
                    params: { margin: summary.margin },
                    relevance: 0.95
                });
            }

            // 3. Inventory Insight
            const topItem = analytics.topItems[0];
            if (topItem) {
                insights.push({
                    type: 'POSITIVE',
                    category: 'STOCK',
                    textKey: 'stock_insight',
                    params: { itemName: topItem.name },
                    relevance: 0.8
                });
            }

            // 4. Expense Insight
            if (summary.costs > summary.revenue * 0.5) {
                insights.push({
                    type: 'WARNING',
                    category: 'EXPENSES',
                    textKey: 'expense_insight',
                    relevance: 0.9
                });
            }

            return insights;
        } catch (error) {
            console.error('AI Insights Engine Error:', error);
            return [];
        }
    },

    /**
     * Predictive Inventory Engine (AI Phase 2)
     * Calculates velocity and Stock-Out dates
     */
    async getPredictiveInventory() {
        try {
            const { invoices, inventory } = await this._getRawData();

            const itemVelocity = {};
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            invoices.forEach(inv => {
                const date = new Date(inv.issueDate || inv.createdAt);
                if (date >= thirtyDaysAgo && inv.items) {
                    inv.items.forEach(item => {
                        itemVelocity[item.itemId] = (itemVelocity[item.itemId] || 0) + (item.quantity || 0);
                    });
                }
            });

            const predictions = inventory.map(rec => {
                const velocity = (itemVelocity[rec.itemId] || 0) / 30; // Avg per day
                const daysLeft = velocity > 0 ? Math.floor(rec.availableQty / velocity) : 999;
                
                return {
                    ...rec,
                    dailyVelocity: velocity.toFixed(2),
                    daysRemaining: daysLeft,
                    status: daysLeft < 7 ? 'CRITICAL' : daysLeft < 15 ? 'WARNING' : 'HEALTHY'
                };
            }).filter(p => (itemVelocity[p.itemId] || 0) > 0); // Only predicting for active items

            return predictions.sort((a, b) => a.daysRemaining - b.daysRemaining);
        } catch (error) {
            console.error('Predictive Engine Error:', error);
            return [];
        }
    }
};

export default reportService;
