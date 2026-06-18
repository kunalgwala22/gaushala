import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  FileSpreadsheet, 
  FileText
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [range, setRange] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch report summary
  const { data, isLoading } = useQuery({
    queryKey: ['reportData', range, startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/reports/donations', {
        params: { range, startDate, endDate },
      });
      return res.data;
    },
  });

  const handleCsvExport = () => {
    // Fetch via axios, create a Blob, and download it
    downloadFile('/reports/donations/csv', `donation_report_${range}.csv`);
  };

  const handlePdfExport = () => {
    downloadFile('/reports/donations/pdf', `donation_report_${range}.pdf`, 'application/pdf');
  };

  const downloadFile = async (endpoint: string, filename: string, mimeType = 'text/csv') => {
    try {
      const res = await api.get(endpoint, {
        params: { range, startDate, endDate },
        responseType: 'blob',
      });
      
      const blob = new Blob([res.data], { type: mimeType });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to generate report export.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-white tracking-wide">Financial Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Audit donation logs, track allocation breakdowns, and export ledger datasets</p>
      </div>

      {/* Filter range dashboard */}
      <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-900/40">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preset Period</label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="w-full glass-input text-xs"
          >
            <option value="daily">Daily (Today)</option>
            <option value="weekly">Weekly (Last 7 Days)</option>
            <option value="monthly">Monthly (Last 30 Days)</option>
            <option value="yearly">Yearly (Last 365 Days)</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {range === 'custom' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>
          </>
        )}

        <div className={`flex gap-3 ${range !== 'custom' ? 'md:col-span-3 justify-end' : ''}`}>
          <button
            onClick={handleCsvExport}
            disabled={isLoading || !data}
            className="btn-secondary flex items-center gap-2 text-xs py-2.5 px-4"
          >
            <FileSpreadsheet size={15} className="text-emerald-500" />
            Export CSV
          </button>
          <button
            onClick={handlePdfExport}
            disabled={isLoading || !data}
            className="btn-primary flex items-center gap-2 text-xs py-2.5 px-4"
          >
            <FileText size={15} />
            Export PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">
          <span className="inline-block w-8 h-8 rounded-full border-4 border-slate-800 border-t-saffron-500 animate-spin mb-2"></span>
          <p>Compiling ledger report...</p>
        </div>
      ) : !data ? (
        <div className="glass-card p-12 text-center text-slate-500">
          Failed to generate report parameters.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Revenue</span>
              <h3 className="text-3xl font-bold text-white font-display">
                ₹{data.summary.totalAmount.toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2">Sum of successful donations</p>
            </div>

            <div className="glass-card p-5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Transactions</span>
              <h3 className="text-3xl font-bold text-white font-display">
                {data.summary.count}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2">Transactions completed successfully</p>
            </div>

            <div className="glass-card p-5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Average Donation</span>
              <h3 className="text-3xl font-bold text-saffron-400 font-display">
                ₹{Math.round(data.summary.averageAmount).toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2">Average value per ticket</p>
            </div>
          </div>

          {/* Breakdown lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-base text-slate-200 mb-4">Allocation Breakdown</h3>
              <div className="space-y-3.5">
                {data.categoryBreakdown.map((cat: any) => (
                  <div key={cat._id} className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                    <div>
                      <span className="text-sm font-medium text-slate-200 uppercase">{cat._id.replace('_', ' ')}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{cat.count} donations</span>
                    </div>
                    <span className="font-bold text-white font-display">₹{cat.total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                {data.categoryBreakdown.length === 0 && (
                  <p className="text-slate-500 text-xs text-center py-6">No categorised funds raised.</p>
                )}
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-base text-slate-200 mb-4">Payment Methods Breakdown</h3>
              <div className="space-y-3.5">
                {data.paymentBreakdown.map((pay: any) => (
                  <div key={pay._id} className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                    <div>
                      <span className="text-sm font-medium text-slate-200">{pay._id}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{pay.count} txns</span>
                    </div>
                    <span className="font-bold text-white font-display">₹{pay.total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                {data.paymentBreakdown.length === 0 && (
                  <p className="text-slate-500 text-xs text-center py-6">No payments processed.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Reports;
