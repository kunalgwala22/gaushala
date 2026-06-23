import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getBackendUrl } from '../services/api';
import type { Donation, Donor } from '../types';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  X,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const donationFormSchema = z.object({
  donorId: z.string().min(1, 'Donor selection is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  type: z.enum(['ONE_TIME', 'MONTHLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM']).default('ONE_TIME'),
  category: z.enum([
    'GENERAL',
    'COW_FEEDING',
    'MEDICAL_SUPPORT',
    'COW_ADOPTION',
    'SHELTER_MAINTENANCE',
    'FESTIVAL',
    'GAU_SEVA',
  ]).default('GENERAL'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'OTHER']).default('CASH'),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
});

type DonationFormFields = z.infer<typeof donationFormSchema>;

export const Donations: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donorSearchTerm, setDonorSearchTerm] = useState('');

  // Form setup
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<DonationFormFields>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      type: 'ONE_TIME',
      category: 'GENERAL',
      paymentMethod: 'CASH',
      date: new Date().toISOString().split('T')[0],
    }
  });

  const selectedPaymentMethod = watch('paymentMethod');

  // Fetch Donations Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['donations', page, search, categoryFilter],
    queryFn: async () => {
      const res = await api.get('/donations', {
        params: { 
          page, 
          limit: 10, 
          search: user?.role === 'DONOR' ? '' : search, 
          category: categoryFilter 
        },
      });
      return res.data;
    },
  });

  // Fetch Donors for dropdown (Staff/Admin only)
  const { data: donorData } = useQuery({
    queryKey: ['donors-list', donorSearchTerm],
    queryFn: async () => {
      if (user?.role === 'DONOR') return { donors: [] };
      const res = await api.get('/donors', {
        params: { limit: 50, search: donorSearchTerm },
      });
      return res.data;
    },
    enabled: isModalOpen && user?.role !== 'DONOR',
  });

  // Record Donation Mutation
  const createMutation = useMutation({
    mutationFn: (newDonation: DonationFormFields) => api.post('/donations', newDonation),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      setIsModalOpen(false);
      reset();
      
      // Auto trigger download of receipt
      const pdfPath = res.data.donation?.receiptId?.pdfUrl;
      if (pdfPath) {
        window.open(`${getBackendUrl()}${pdfPath}`, '_blank');
      }
    },
  });

  // Delete Donation Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/donations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
    },
  });

  const onSubmit = (fields: DonationFormFields) => {
    createMutation.mutate(fields);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this donation? Associated PDF receipt will be permanently deleted.')) {
      deleteMutation.mutate(id);
    }
  };

  const downloadPDFReceipt = (donationId: string, pdfUrl?: string) => {
    const token = localStorage.getItem('accessToken');
    const tokenParam = token ? `?token=${token}` : '';
    if (pdfUrl) {
      window.open(`${getBackendUrl()}${pdfUrl}`, '_blank');
    } else {
      window.open(`${getBackendUrl()}/api/donations/${donationId}/receipt${tokenParam}`, '_blank');
    }
  };

  const handleOpenAdd = () => {
    reset();
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-wide">
            {user?.role === 'DONOR' ? 'My Donations' : 'Donations Log'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.role === 'DONOR' 
              ? 'Review your donation history and download official tax receipts' 
              : 'Record donations, process receipts, and manage recurring programs'}
          </p>
        </div>

        {user?.role !== 'DONOR' && (
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Add Donation
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        {user?.role !== 'DONOR' ? (
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search donor name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full glass-input pl-12"
            />
          </div>
        ) : <div />}

        <div className="flex gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="glass-input text-sm py-2"
          >
            <option value="">All Categories</option>
            <option value="GENERAL">General Donation</option>
            <option value="COW_FEEDING">Cow Feeding</option>
            <option value="MEDICAL_SUPPORT">Medical Support</option>
            <option value="COW_ADOPTION">Cow Adoption</option>
            <option value="SHELTER_MAINTENANCE">Shelter Maintenance</option>
            <option value="FESTIVAL">Festival Donation</option>
            <option value="GAU_SEVA">Gau Seva</option>
          </select>
        </div>
      </div>

      {/* Donations Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <span className="inline-block w-8 h-8 rounded-full border-4 border-slate-800 border-t-saffron-500 animate-spin mb-2"></span>
            <p>Loading transaction database...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-red-400">
            <p className="font-semibold">Failed to load donations.</p>
            <p className="text-xs text-slate-500 mt-1">{(error as any)?.response?.data?.message || error.message}</p>
          </div>
        ) : !data?.donations || data.donations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No donations logged under this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Donor</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Method</th>
                  <th className="py-4 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {data.donations.map((donation: Donation) => (
                  <tr key={donation._id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">
                        {donation.donorId?.fullName || 'Anonymous'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{donation.donorId?.mobileNumber || ''}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {new Date(donation.date).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-white font-display">
                        ₹{donation.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">{donation.type.toLowerCase().replace('_', ' ')}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        {donation.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300 font-medium">{donation.paymentMethod}</div>
                      {donation.transactionId && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]" title={donation.transactionId}>
                          {donation.transactionId}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => downloadPDFReceipt(donation._id, donation.receiptId?.pdfUrl)}
                          className="p-2 rounded-lg bg-saffron-500/10 hover:bg-saffron-500/20 text-saffron-400 hover:text-saffron-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                          title="Download PDF"
                        >
                          <Download size={14} />
                          <span>Receipt</span>
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(donation._id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-4 bg-slate-900/10">
            <span className="text-xs text-slate-500">
              Showing page {page} of {data.pages} ({data.total} total donations)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, data.pages))}
                disabled={page === data.pages}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Donation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass-card p-6 bg-slate-900/90 border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <h3 className="font-display font-bold text-xl text-white">Record New Donation</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {createMutation.isError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl mb-4">
                  {(createMutation.error as any)?.response?.data?.message || createMutation.error.message}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Search Donor for selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Select Donor *</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Search donor by name/mobile..."
                      value={donorSearchTerm}
                      onChange={(e) => setDonorSearchTerm(e.target.value)}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <select
                    {...register('donorId')}
                    className={`w-full glass-input ${errors.donorId ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Choose Donor --</option>
                    {donorData?.donors?.map((d: Donor) => (
                      <option key={d._id} value={d._id}>
                        {d.fullName} ({d.mobileNumber})
                      </option>
                    ))}
                  </select>
                  {errors.donorId && <span className="text-red-400 text-xs mt-1 block">{errors.donorId.message}</span>}
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Donation Amount (INR) *</label>
                    <input
                      type="number"
                      step="any"
                      {...register('amount')}
                      className={`w-full glass-input ${errors.amount ? 'border-red-500' : ''}`}
                      placeholder="e.g. 1100"
                    />
                    {errors.amount && <span className="text-red-400 text-xs mt-1 block">{errors.amount.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Donation Date *</label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                {/* Category & Program Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Category *</label>
                    <select {...register('category')} className="w-full glass-input">
                      <option value="GENERAL">General Donation</option>
                      <option value="COW_FEEDING">Cow Feeding</option>
                      <option value="MEDICAL_SUPPORT">Medical Support</option>
                      <option value="COW_ADOPTION">Cow Adoption</option>
                      <option value="SHELTER_MAINTENANCE">Shelter Maintenance</option>
                      <option value="FESTIVAL">Festival Donation</option>
                      <option value="GAU_SEVA">Gau Seva</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Program Interval *</label>
                    <select {...register('type')} className="w-full glass-input">
                      <option value="ONE_TIME">One Time</option>
                      <option value="MONTHLY">Monthly Recurring</option>
                      <option value="HALF_YEARLY">Half Yearly Recurring</option>
                      <option value="YEARLY">Yearly Recurring</option>
                      <option value="CUSTOM">Custom Interval</option>
                    </select>
                  </div>
                </div>

                {/* Payment Method & Transaction ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Payment Mode *</label>
                    <select {...register('paymentMethod')} className="w-full glass-input">
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="OTHER">Other Method</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                      Transaction/Reference ID {selectedPaymentMethod === 'CASH' ? '(Optional)' : '*'}
                    </label>
                    <input
                      type="text"
                      {...register('transactionId')}
                      className="w-full glass-input"
                      placeholder="e.g. UPI Ref, Cheque No"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Add Notes</label>
                  <textarea
                    {...register('notes')}
                    className="w-full glass-input h-20"
                    placeholder="e.g. Donated in memory of..."
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                    {createMutation.isPending ? 'Processing...' : 'Submit & Download Receipt'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Donations;
