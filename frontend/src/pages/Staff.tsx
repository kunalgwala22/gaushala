import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { User } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Shield, UserCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const staffValidationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
});

type StaffFields = z.infer<typeof staffValidationSchema>;

export const Staff: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFields>({
    resolver: zodResolver(staffValidationSchema),
    defaultValues: {
      role: 'STAFF',
    }
  });

  // Query to fetch all system users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['systemUsers'],
    queryFn: async () => {
      const res = await api.get('/auth/users');
      return res.data;
    },
  });

  // Create Staff account Mutation
  const createStaffMutation = useMutation({
    mutationFn: (data: StaffFields) => api.post('/auth/register', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemUsers'] });
      setSuccessMsg('Staff account created successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg(null);
        reset();
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create staff account.');
    }
  });

  const onSubmit = (fields: StaffFields) => {
    setErrorMsg(null);
    createStaffMutation.mutate(fields);
  };

  const handleOpenAdd = () => {
    reset();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-wide">Staff Management</h1>
          <p className="text-slate-400 text-sm mt-1">Configure credentials and view authorization levels for operators</p>
        </div>

        <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create Staff Account
        </button>
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-900/30 border border-slate-850 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : !users || users.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500">
          No system users found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((item) => (
            <div key={item.id} className="glass-card p-5 relative overflow-hidden flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                item.role === 'ADMIN' 
                  ? 'bg-saffron-500/10 text-saffron-500 border border-saffron-500/30' 
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
              }`}>
                {item.role === 'ADMIN' ? <Shield size={22} /> : <UserCheck size={22} />}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-display font-semibold text-base text-white truncate">{item.name}</h3>
                <p className="text-slate-400 text-xs truncate">{item.email}</p>
                <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full uppercase mt-2 ${
                  item.role === 'ADMIN' 
                    ? 'bg-saffron-500/10 text-saffron-400 border border-saffron-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {item.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
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
                <h3 className="font-display font-bold text-xl text-white">Create Staff Account</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl mb-4">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs px-4 py-3 rounded-xl mb-4">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Full Name *</label>
                  <input
                    type="text"
                    {...register('name')}
                    className={`w-full glass-input ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="e.g. Ramesh Chandra"
                  />
                  {errors.name && <span className="text-red-400 text-xs mt-1 block">{errors.name.message}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Email Address *</label>
                  <input
                    type="email"
                    {...register('email')}
                    className={`w-full glass-input ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="ramesh@gaushala.com"
                  />
                  {errors.email && <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Temporary Password *</label>
                  <input
                    type="password"
                    {...register('password')}
                    className={`w-full glass-input ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  {errors.password && <span className="text-red-400 text-xs mt-1 block">{errors.password.message}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Access Role *</label>
                  <select {...register('role')} className="w-full glass-input">
                    <option value="STAFF">Staff Operator (Data Entry)</option>
                    <option value="ADMIN">System Administrator (Full Access)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={createStaffMutation.isPending} className="btn-primary">
                    {createStaffMutation.isPending ? 'Creating...' : 'Create Account'}
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
export default Staff;
