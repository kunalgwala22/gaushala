import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getBackendUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User as UserIcon, 
  Mail, 
  CreditCard,
  Calendar,
  CheckCircle,
  Download
} from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a 10-digit number').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be a 6-digit number').optional().or(z.literal('')),
  panNumber: z.string().optional().or(z.literal('')),
});

type ProfileFields = z.infer<typeof profileSchema>;

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDonor = user?.role === 'DONOR';

  // 1. Fetch Donor Profile if user has a donorId
  const { data: donor, isLoading: isDonorLoading } = useQuery({
    queryKey: ['donorProfile', user?.donorId],
    queryFn: async () => {
      if (!user?.donorId) return null;
      const res = await api.get(`/donors/${user.donorId}`);
      return res.data;
    },
    enabled: !!user?.donorId,
  });

  // 2. Fetch User's own donations
  const { data: donationsData, isLoading: isDonationsLoading } = useQuery({
    queryKey: ['myDonations'],
    queryFn: async () => {
      const res = await api.get('/donations', { params: { limit: 100 } });
      return res.data;
    },
    enabled: isDonor,
  });

  // 3. Fetch User's own sponsorships
  const { data: sponsorships, isLoading: isSponsorshipsLoading } = useQuery({
    queryKey: ['mySponsorships'],
    queryFn: async () => {
      const res = await api.get('/sponsorships');
      return res.data;
    },
    enabled: isDonor,
  });

  // Form setup
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    values: donor ? {
      fullName: donor.fullName,
      mobileNumber: donor.mobileNumber,
      email: donor.email || '',
      address: donor.address,
      city: donor.city,
      state: donor.state,
      pincode: donor.pincode,
      panNumber: donor.panNumber || '',
    } : undefined
  });

  // Update Donor Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (fields: ProfileFields) => api.put(`/donors/${user?.donorId}`, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donorProfile'] });
      setSuccessMsg('Profile details updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  });

  const onSubmit = (fields: ProfileFields) => {
    if (user?.donorId) {
      updateProfileMutation.mutate(fields);
    }
  };

  const handleDownloadReceipt = (pdfUrl?: string) => {
    if (pdfUrl) {
      window.open(`${getBackendUrl()}${pdfUrl}`, '_blank');
    } else {
      alert('Receipt PDF is not available.');
    }
  };

  if (isDonorLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <span className="inline-block w-8 h-8 rounded-full border-4 border-slate-800 border-t-saffron-500 animate-spin mb-2"></span>
        <p>Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl text-white tracking-wide">Account Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Manage registration details, view sponsorships, and audit receipts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile details & Editing */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg text-slate-200 mb-6">Personal Particulars</h3>

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-3 rounded-xl mb-4">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-350 text-xs px-4 py-3 rounded-xl mb-4">
                {errorMsg}
              </div>
            )}

            {isDonor ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Full Name</label>
                    <input
                      type="text"
                      {...register('fullName')}
                      className={`w-full glass-input ${errors.fullName ? 'border-red-500' : ''}`}
                    />
                    {errors.fullName && <span className="text-red-400 text-xs mt-1 block">{errors.fullName.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Mobile Number</label>
                    <input
                      type="text"
                      {...register('mobileNumber')}
                      className={`w-full glass-input ${errors.mobileNumber ? 'border-red-500' : ''}`}
                    />
                    {errors.mobileNumber && <span className="text-red-400 text-xs mt-1 block">{errors.mobileNumber.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Email Address</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">PAN Number</label>
                    <input
                      type="text"
                      {...register('panNumber')}
                      className="w-full glass-input uppercase"
                      placeholder="ABCDE1234F"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Billing Address</label>
                  <input
                    type="text"
                    {...register('address')}
                    className={`w-full glass-input ${errors.address ? 'border-red-500' : ''}`}
                  />
                  {errors.address && <span className="text-red-400 text-xs mt-1 block">{errors.address.message}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">City</label>
                    <input
                      type="text"
                      {...register('city')}
                      className={`w-full glass-input ${errors.city ? 'border-red-500' : ''}`}
                    />
                    {errors.city && <span className="text-red-400 text-xs mt-1 block">{errors.city.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">State</label>
                    <input
                      type="text"
                      {...register('state')}
                      className={`w-full glass-input ${errors.state ? 'border-red-500' : ''}`}
                    />
                    {errors.state && <span className="text-red-400 text-xs mt-1 block">{errors.state.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Pincode</label>
                    <input
                      type="text"
                      {...register('pincode')}
                      className={`w-full glass-input ${errors.pincode ? 'border-red-500' : ''}`}
                    />
                    {errors.pincode && <span className="text-red-400 text-xs mt-1 block">{errors.pincode.message}</span>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="btn-primary mt-2"
                >
                  {updateProfileMutation.isPending ? 'Updating...' : 'Update Details'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserIcon size={18} className="text-saffron-500" />
                  <div>
                    <span className="block text-xs text-slate-500 uppercase">Account Name</span>
                    <span className="text-sm font-semibold text-white">{user?.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-saffron-500" />
                  <div>
                    <span className="block text-xs text-slate-500 uppercase">Email Address</span>
                    <span className="text-sm font-semibold text-white">{user?.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-saffron-500" />
                  <div>
                    <span className="block text-xs text-slate-500 uppercase">Authorization Role</span>
                    <span className="text-sm font-semibold text-emerald-400">{user?.role}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Donation History if Donor */}
          {isDonor && (
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-lg text-slate-200 mb-6">My Donations</h3>

              {isDonationsLoading ? (
                <div className="text-center py-6 text-slate-500">Loading donation list...</div>
              ) : !donationsData?.donations || donationsData.donations.length === 0 ? (
                <div className="text-center py-6 text-slate-650 bg-slate-950/20 border border-slate-900 rounded-xl">No donations logged yet. You can support our cows from the Cow Directory.</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {donationsData.donations.map((d: any) => (
                    <div key={d._id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">₹{d.amount.toLocaleString('en-IN')}</span>
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-saffron-500/10 text-saffron-400 rounded-full uppercase">
                            {d.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                          <Calendar size={12} />
                          {new Date(d.date).toLocaleDateString('en-IN')}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadReceipt(d.receiptId?.pdfUrl)}
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 border-slate-800 hover:border-slate-700"
                      >
                        <Download size={13} />
                        Receipt
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar widgets (e.g. adoptions) */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-base text-slate-200 mb-4">Account Status</h3>
            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center gap-3">
              <CheckCircle size={28} className="text-emerald-500" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Security Status</span>
                <span className="text-sm font-bold text-slate-200">Verified Account</span>
              </div>
            </div>
          </div>

          {isDonor && (
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-base text-slate-200 mb-4">Adopted Cows</h3>
              
              {isSponsorshipsLoading ? (
                <div className="text-center py-6 text-slate-500">Loading sponsorships...</div>
              ) : !sponsorships || sponsorships.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-800 bg-slate-950/20 text-center rounded-xl text-xs text-slate-500 leading-relaxed">
                  You haven't adopted any cows yet. Adopting a cow supports their feeding and medical requirements.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {sponsorships.map((s: any) => (
                    <div key={s._id} className="p-3.5 bg-slate-950/50 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🐄</span>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-200">{s.cowId?.name}</h4>
                          <span className="text-[10px] text-slate-500 uppercase">Tag: {s.cowId?.tagNumber}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[8px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Profile;
