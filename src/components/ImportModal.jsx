import React, { useState } from 'react';
import { Upload, X, Check, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Alert from './ui/Alert';
import itemService from '../services/itemService';

/**
 * ImportModal – Bulk import items from Excel/CSV
 */
export default function ImportModal({ isOpen, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    setError('No data found in file.');
                    return;
                }

                setPreview(data.slice(0, 5)); // Show first 5 for preview
                setFile(selectedFile);
                setStats({ total: data.length, success: 0, failed: 0 });
                setError(null);
            } catch {
                setError('Failed to parse file. Ensure it is a valid Excel/CSV.');
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws);

            let successCount = 0;
            let failedCount = 0;

            for (const row of data) {
                try {
                    // Normalize data mapping
                    const itemData = {
                        name: row.Name || row.name || row.Item || '',
                        barcode: row.SKU || row.sku || row.Code || row.Barcode || '',
                        category: row.Category || row.category || 'General',
                        sellingPrice: Number(row.Price || row['Base Price'] || row.price || row['Selling Price'] || 0),
                        costPrice: Number(row['Cost Price'] || row.cost || 0),
                        unit: row.Unit || row.unit || 'pcs',
                        type: row.Type || row.type || 'PRODUCT',
                        trackInventory: true,
                        taxRate: 0,
                        hasVariants: false,
                        isActive: true
                    };

                    if (itemData.name) {
                        await itemService.create(itemData);
                        successCount++;
                    } else {
                        failedCount++;
                    }

                    setStats(prev => ({ ...prev, success: successCount, failed: failedCount }));
                } catch {
                    failedCount++;
                    setStats(prev => ({ ...prev, success: successCount, failed: failedCount }));
                }
            }

            setImporting(false);
            if (successCount > 0) {
                onSuccess();
                onClose();
            } else {
                setError('Failed to import any items. Check your file headers (Name, SKU, Price).');
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Many Items">
            <div className="space-y-6">
                {!file ? (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer group" onClick={() => document.getElementById('file-upload').click()}>
                        <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <Upload size={32} />
                        </div>
                        <p className="mt-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Upload List File (Excel/CSV)</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Columns: Name, SKU, Price, Unit</p>
                        <input id="file-upload" type="file" accept=".xlsx, .xls, .csv" hidden onChange={handleFileChange} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="text-emerald-600" size={20} />
                                <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-emerald-400 uppercase tracking-tighter">{file.name}</p>
                                    <p className="text-[10px] text-emerald-600/60 font-bold">{stats.total} Items Found</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="h-8 w-8 p-0 rounded-full">
                                <X size={14} />
                            </Button>
                        </div>

                        {preview.length > 0 && (
                            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Preview Items</p>
                                </div>
                                <div className="p-4 max-h-40 overflow-y-auto">
                                    <table className="w-full text-[10px] font-bold">
                                        <thead>
                                            <tr className="text-slate-400 text-left border-b border-slate-50 dark:border-slate-800">
                                                <th className="pb-1">Item Name</th>
                                                <th className="pb-1">Code</th>
                                                <th className="pb-1 text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-600 dark:text-slate-300">
                                            {preview.map((row, i) => (
                                                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/20 last:border-0">
                                                    <td className="py-2">{row.Name || row.name || row.Item}</td>
                                                    <td className="py-2">{row.SKU || row.sku}</td>
                                                    <td className="py-2 text-right">{row.Price || row.price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {error && <Alert variant="error" message={error} />}

                {importing && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Saving Items...</span>
                            <span>{Math.round((stats.success + stats.failed) / stats.total * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${(stats.success + stats.failed) / stats.total * 100}%` }}
                            />
                        </div>
                        <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest">
                            <span className="text-emerald-500">{stats.success} Done</span>
                            <span className="text-rose-500">{stats.failed} Failed</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={importing}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white gap-2 font-black uppercase tracking-widest"
                        onClick={handleImport}
                        disabled={!file || importing}
                    >
                        {importing ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        Start Saving
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
