import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Donor } from '../types';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  X,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const donorFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a 10-digit number').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be a 6-digit number').optional().or(z.literal('')),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN (e.g. ABCDE1234F)').optional().or(z.literal('')),
  aadhaarNumber: z.string().regex(/^[0-9]{12}$/, 'Aadhaar must be a 12-digit number').optional().or(z.literal('')),
  donationPreference: z.string().optional(),
  notes: z.string().optional(),
});

type DonorFormFields = z.infer<typeof donorFormSchema>;

export const Donors: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [donorHistory, setDonorHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DonorFormFields>({
    resolver: zodResolver(donorFormSchema),
  });

  // Fetch Donors Query
  const { data, isLoading } = useQuery({
    queryKey: ['donors', page, search],
    queryFn: async () => {
      const res = await api.get('/donors', {
        params: { page, limit: 8, search },
      });
      return res.data;
    },
  });

  // Fetch Donor Donation History
  const fetchDonorHistory = async (donorId: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get('/donations', { params: { limit: 100 } });
      // Filter client-side for simplicity, or we can add a donor query filter
      const filtered = res.data.donations.filter((d: any) => d.donorId?._id === donorId);
      setDonorHistory(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Create Donor Mutation
  const createMutation = useMutation({
    mutationFn: (newDonor: DonorFormFields) => api.post('/donors', newDonor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      setIsModalOpen(false);
      reset();
    },
  });

  // Update Donor Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; fields: DonorFormFields }) => 
      api.put(`/donors/${data.id}`, data.fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      setIsModalOpen(false);
      setEditingDonor(null);
      reset();
    },
  });

  // Delete Donor Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/donors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
    },
  });

  const onSubmit = (fields: DonorFormFields) => {
    if (editingDonor) {
      updateMutation.mutate({ id: editingDonor._id, fields });
    } else {
      createMutation.mutate(fields);
    }
  };

  const handleEdit = (donor: Donor) => {
    setEditingDonor(donor);
    setValue('fullName', donor.fullName);
    setValue('mobileNumber', donor.mobileNumber);
    setValue('email', donor.email || '');
    setValue('address', donor.address);
    setValue('city', donor.city);
    setValue('state', donor.state);
    setValue('pincode', donor.pincode);
    setValue('panNumber', donor.panNumber || '');
    setValue('aadhaarNumber', donor.aadhaarNumber || '');
    setValue('donationPreference', donor.donationPreference || '');
    setValue('notes', donor.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this donor? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenAdd = () => {
    setEditingDonor(null);
    reset();
    setIsModalOpen(true);
  };

  const handleView = (donor: Donor) => {
    setSelectedDonor(donor);
    fetchDonorHistory(donor._id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-wide">Donors</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and view cow shelter patrons and contributors</p>
        </div>

        <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add New Donor
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search by Name, Phone, Email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full glass-input pl-12"
        />
      </div>

      {/* Donors Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <span className="inline-block w-8 h-8 rounded-full border-4 border-slate-800 border-t-saffron-500 animate-spin mb-2"></span>
            <p>Loading donors list...</p>
          </div>
        ) : !data?.donors || data.donors.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No donors found matching the query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Donor Details</th>
                  <th className="py-4 px-6">Contact info</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Preferences</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {data.donors.map((donor: Donor) => (
                  <tr key={donor._id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white group-hover:text-saffron-400 transition-colors">
                        {donor.fullName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">PAN: {donor.panNumber || 'N/A'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-350">
                        <Phone size={13} className="text-saffron-500/80" />
                        {donor.mobileNumber}
                      </div>
                      {donor.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Mail size={12} />
                          {donor.email}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <div>{donor.city}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{donor.state}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-saffron-500/10 text-saffron-400 border border-saffron-500/20 uppercase">
                        {donor.donationPreference || 'GENERAL'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleView(donor)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Profile & History"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => handleEdit(donor)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button 
                            onClick={() => handleDelete(donor._id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
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
              Showing page {page} of {data.pages} ({data.total} total donors)
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

      {/* View Donor Profile Drawer/Modal */}
      <AnimatePresence>
        {selectedDonor && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-slate-900 border-l border-slate-800 p-6 flex flex-col h-full overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                <h3 className="font-display font-bold text-xl text-white">Donor Profile</h3>
                <button 
                  onClick={() => setSelectedDonor(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                {/* Details Card */}
                <div className="glass-card p-5 bg-slate-950/40 border-slate-800/80">
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-full bg-saffron-500/10 border border-saffron-500/35 flex items-center justify-center text-xl font-bold text-saffron-500 font-display">
                      {selectedDonor.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-white leading-tight">{selectedDonor.fullName}</h4>
                      <p className="text-xs text-saffron-400 mt-1">Preference: {selectedDonor.donationPreference || 'General'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800/60 text-sm">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Phone size={16} className="text-slate-500 shrink-0" />
                      <span>{selectedDonor.mobileNumber}</span>
                    </div>
                    {selectedDonor.email && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <Mail size={16} className="text-slate-500 shrink-0" />
                        <span className="truncate">{selectedDonor.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3 text-slate-300">
                      <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
                      <span>{selectedDonor.address}, {selectedDonor.city}, {selectedDonor.state} - {selectedDonor.pincode}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider">PAN Number</span>
                        <span className="text-sm font-semibold text-slate-300 uppercase">{selectedDonor.panNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Aadhaar (Decrypted)</span>
                        <span className="text-sm font-semibold text-slate-350">{selectedDonor.aadhaarNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History list */}
                <div>
                  <h4 className="font-display font-semibold text-sm text-slate-400 uppercase tracking-wider mb-3">Donation History</h4>
                  
                  {isLoadingHistory ? (
                    <div className="text-center py-6 text-slate-500 text-sm">Loading history...</div>
                  ) : donorHistory.length === 0 ? (
                    <div className="text-center py-6 text-slate-600 text-sm bg-slate-950/20 border border-slate-900 rounded-xl">No donations recorded for this donor.</div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {donorHistory.map((d: any) => (
                        <div key={d._id} className="p-3.5 bg-slate-950/50 border border-slate-850 rounded-xl flex items-center justify-between hover:border-slate-800 transition-colors">
                          <div>
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full uppercase">
                              {d.category.replace('_', ' ')}
                            </span>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                              <Calendar size={12} />
                              {new Date(d.date).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white text-sm">₹{d.amount.toLocaleString('en-IN')}</div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{d.paymentMethod}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
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
                <h3 className="font-display font-bold text-xl text-white">
                  {editingDonor ? 'Edit Donor Profile' : 'Add New Donor'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Full Name *</label>
                  <input
                    type="text"
                    {...register('fullName')}
                    className={`w-full glass-input ${errors.fullName ? 'border-red-500' : ''}`}
                    placeholder="Ramesh Kumar Sharma"
                  />
                  {errors.fullName && <span className="text-red-400 text-xs mt-1 block">{errors.fullName.message}</span>}
                </div>

                {/* Mobile & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Mobile Number *</label>
                    <input
                      type="text"
                      {...register('mobileNumber')}
                      className={`w-full glass-input ${errors.mobileNumber ? 'border-red-500' : ''}`}
                      placeholder="9876543210"
                    />
                    {errors.mobileNumber && <span className="text-red-400 text-xs mt-1 block">{errors.mobileNumber.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Email Address</label>
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full glass-input ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="ramesh@gmail.com"
                    />
                    {errors.email && <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Address *</label>
                  <input
                    type="text"
                    {...register('address')}
                    className={`w-full glass-input ${errors.address ? 'border-red-500' : ''}`}
                    placeholder="e.g. 15, Dwaraka Nagar, Near Temple"
                  />
                  {errors.address && <span className="text-red-400 text-xs mt-1 block">{errors.address.message}</span>}
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">City *</label>
                    <input
                      type="text"
                      {...register('city')}
                      className={`w-full glass-input ${errors.city ? 'border-red-500' : ''}`}
                      placeholder="Udaipur"
                    />
                    {errors.city && <span className="text-red-400 text-xs mt-1 block">{errors.city.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">State *</label>
                    <input
                      type="text"
                      {...register('state')}
                      className={`w-full glass-input ${errors.state ? 'border-red-500' : ''}`}
                      placeholder="Rajasthan"
                    />
                    {errors.state && <span className="text-red-400 text-xs mt-1 block">{errors.state.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Pincode *</label>
                    <input
                      type="text"
                      {...register('pincode')}
                      className={`w-full glass-input ${errors.pincode ? 'border-red-500' : ''}`}
                      placeholder="313001"
                    />
                    {errors.pincode && <span className="text-red-400 text-xs mt-1 block">{errors.pincode.message}</span>}
                  </div>
                </div>

                {/* PAN & Aadhaar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">PAN Number</label>
                    <input
                      type="text"
                      {...register('panNumber')}
                      className={`w-full glass-input uppercase ${errors.panNumber ? 'border-red-500' : ''}`}
                      placeholder="ABCDE1234F"
                    />
                    {errors.panNumber && <span className="text-red-400 text-xs mt-1 block">{errors.panNumber.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Aadhaar Number</label>
                    <input
                      type="text"
                      {...register('aadhaarNumber')}
                      className={`w-full glass-input ${errors.aadhaarNumber ? 'border-red-500' : ''}`}
                      placeholder="12-digit number"
                    />
                    {errors.aadhaarNumber && <span className="text-red-400 text-xs mt-1 block">{errors.aadhaarNumber.message}</span>}
                  </div>
                </div>

                {/* Preferences & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Donation Preference</label>
                    <select
                      {...register('donationPreference')}
                      className="w-full glass-input"
                    >
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
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Notes</label>
                    <input
                      type="text"
                      {...register('notes')}
                      className="w-full glass-input"
                      placeholder="Any additional instructions..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn-primary"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Profile'}
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
export default Donors;
