import * as XLSX from 'xlsx';

/**
 * exportUtils – Unified data export utilities
 */
export const exportToCSV = (data, filename = 'exported-data') => {
    if (!data || data.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    XLSX.writeFile(wb, `${filename}.csv`);
};

export const exportToExcel = (data, filename = 'exported-data') => {
    if (!data || data.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Flatten nested objects for clean spreadsheet export
 * @example flattenData([{ customer: { name: 'John' }, total: 100 }]) -> [{ customer_name: 'John', total: 100 }]
 */
export const flattenData = (data) => {
    return data.map(item => {
        const flat = {};
        function flatten(obj, prefix = '') {
            for (let [key, val] of Object.entries(obj)) {
                if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
                    flatten(val, `${prefix}${key}_`);
                } else {
                    flat[`${prefix}${key}`] = val;
                }
            }
        }
        flatten(item);
        return flat;
    });
};
