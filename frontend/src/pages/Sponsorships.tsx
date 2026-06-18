import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Sponsorship, Donor, Cow } from '../types';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Trash2, 
  X,
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sponsorshipFormSchema = z.object({
  donorId: z.string().min(1, 'Donor is required'),
  cowId: z.string().min(1, 'Cow is required'),
  amount: z.coerce.number().positive('Sponsorship amount must be positive'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

type SponsorshipFormFields = z.infer<typeof sponsorshipFormSchema>;

export const Sponsorships: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donorSearch, setDonorSearch] = useState('');
  const [cowSearch, setCowSearch] = useState('');

  // Form setup
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SponsorshipFormFields>({
    resolver: zodResolver(sponsorshipFormSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // 1 year from now
    }
  });

  // Fetch Sponsorships
  const { data: sponsorships, isLoading } = useQuery<Sponsorship[]>({
    queryKey: ['sponsorships', statusFilter],
    queryFn: async () => {
      const res = await api.get('/sponsorships', {
        params: { status: statusFilter },
      });
      return res.data;
    },
  });

  // Fetch Donors for dropdown
  const { data: donorData } = useQuery({
    queryKey: ['sponsorship-donors', donorSearch],
    queryFn: async () => {
      const res = await api.get('/donors', { params: { search: donorSearch, limit: 15 } });
      return res.data;
    },
    enabled: isModalOpen,
  });

  // Fetch Cows for dropdown
  const { data: cowData } = useQuery({
    queryKey: ['sponsorship-cows', cowSearch],
    queryFn: async () => {
      const res = await api.get('/cows', { params: { search: cowSearch, limit: 15 } });
      return res.data;
    },
    enabled: isModalOpen,
  });

  // Add Sponsorship Mutation
  const createMutation = useMutation({
    mutationFn: (newSponsorship: SponsorshipFormFields) => api.post('/sponsorships', newSponsorship),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorships'] });
      setIsModalOpen(false);
      reset();
    },
  });

  // Delete Sponsorship Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sponsorships/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorships'] });
    },
  });

  const onSubmit = (fields: SponsorshipFormFields) => {
    createMutation.mutate(fields);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this sponsorship?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-wide">
            {user?.role === 'DONOR' ? 'My Adoptions' : 'Cow Sponsorships'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.role === 'DONOR' 
              ? 'Active and historical adoptions of cows at Shree Sawariya Seth' 
              : 'Record cow adoptions, track sponsor relations, and monitor program lifespans'}
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Record Adoption
          </button>
        )}
      </div>

      {/* Filter status */}
      <div className="flex justify-between items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="glass-input text-xs py-2 w-48"
        >
          <option value="">All Sponsorships</option>
          <option value="ACTIVE">Active Only</option>
          <option value="EXPIRED">Expired Only</option>
        </select>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-900/30 border border-slate-850 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : !sponsorships || sponsorships.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500">
          No adoptions recorded in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsorships.map((sponsor: Sponsorship) => (
            <motion.div
              layout
              key={sponsor._id}
              className="glass-card p-5 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top Row status */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🐄</span>
                  <div>
                    <h3 className="font-display font-semibold text-base text-white">{sponsor.cowId?.name || 'Unknown Cow'}</h3>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tag: {sponsor.cowId?.tagNumber || 'N/A'}</span>
                  </div>
                </div>
                
                <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase flex items-center gap-1 ${
                  sponsor.status === 'ACTIVE' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {sponsor.status === 'ACTIVE' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                  {sponsor.status}
                </span>
              </div>

              {/* Sponsor details */}
              <div className="space-y-2 text-xs text-slate-400 bg-slate-950/30 border border-slate-850 p-3.5 rounded-xl mb-4">
                {user?.role !== 'DONOR' && (
                  <div>
                    <span className="text-slate-500 block">Sponsor:</span>
                    <span className="font-semibold text-slate-200">{sponsor.donorId?.fullName || 'Anonymous'}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Adopted Breed:</span>
                  <span className="font-semibold text-slate-300">{sponsor.cowId?.breed || 'Local Breed'}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <div>
                    <span className="text-slate-500 block">Start Date:</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(sponsor.startDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">End Date:</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(sponsor.endDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount and delete */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-500 block">Sponsorship Rate</span>
                  <span className="text-base font-bold text-white font-display flex items-center gap-0.5">
                    ₹{sponsor.amount.toLocaleString('en-IN')}/yr
                  </span>
                </div>

                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDelete(sponsor._id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                    title="Cancel Sponsorship"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Adoption Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass-card p-6 bg-slate-900/90 border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <h3 className="font-display font-bold text-xl text-white">Record Cow Adoption</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Select Donor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Select Donor *</label>
                  <input
                    type="text"
                    placeholder="Filter donor name..."
                    value={donorSearch}
                    onChange={(e) => setDonorSearch(e.target.value)}
                    className="w-full glass-input text-xs mb-2"
                  />
                  <select
                    {...register('donorId')}
                    className={`w-full glass-input ${errors.donorId ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Choose Sponsor --</option>
                    {donorData?.donors?.map((d: Donor) => (
                      <option key={d._id} value={d._id}>
                        {d.fullName} ({d.mobileNumber})
                      </option>
                    ))}
                  </select>
                  {errors.donorId && <span className="text-red-400 text-xs mt-1 block">{errors.donorId.message}</span>}
                </div>

                {/* Select Cow */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Select Cow *</label>
                  <input
                    type="text"
                    placeholder="Filter cow name/tag..."
                    value={cowSearch}
                    onChange={(e) => setCowSearch(e.target.value)}
                    className="w-full glass-input text-xs mb-2"
                  />
                  <select
                    {...register('cowId')}
                    className={`w-full glass-input ${errors.cowId ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Choose Cow --</option>
                    {cowData?.cows?.map((c: Cow) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.tagNumber} - {c.breed})
                      </option>
                    ))}
                  </select>
                  {errors.cowId && <span className="text-red-400 text-xs mt-1 block">{errors.cowId.message}</span>}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Annual Sponsorship Rate (INR) *</label>
                  <input
                    type="number"
                    {...register('amount')}
                    className={`w-full glass-input ${errors.amount ? 'border-red-500' : ''}`}
                    placeholder="e.g. 11000"
                  />
                  {errors.amount && <span className="text-red-400 text-xs mt-1 block">{errors.amount.message}</span>}
                </div>

                {/* Start Date & End Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Start Date *</label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className={`w-full glass-input ${errors.startDate ? 'border-red-500' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Expiry Date *</label>
                    <input
                      type="date"
                      {...register('endDate')}
                      className={`w-full glass-input ${errors.endDate ? 'border-red-500' : ''}`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                    {createMutation.isPending ? 'Saving...' : 'Add Sponsorship'}
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
export default Sponsorships;
