import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getBackendUrl } from '../services/api';
import type { Cow, HealthStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Camera,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cowFormSchema = z.object({
  name: z.string().min(1, 'Cow name is required'),
  tagNumber: z.string().min(3, 'Tag number must be at least 3 characters'),
  breed: z.string().min(2, 'Breed is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  age: z.coerce.number().nonnegative('Age must be a positive number'),
  healthStatus: z.enum(['HEALTHY', 'UNDER_TREATMENT', 'CRITICAL', 'RECOVERING']).default('HEALTHY'),
  shelterNumber: z.string().min(1, 'Shelter allocation is required'),
});

type CowFormFields = z.infer<typeof cowFormSchema>;

export const Cows: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCow, setEditingCow] = useState<Cow | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CowFormFields>({
    resolver: zodResolver(cowFormSchema),
  });

  // Fetch Cows Query
  const { data, isLoading } = useQuery({
    queryKey: ['cows', page, search, healthFilter, breedFilter],
    queryFn: async () => {
      const res = await api.get('/cows', {
        params: { page, limit: 12, search, healthStatus: healthFilter, breed: breedFilter },
      });
      return res.data;
    },
  });

  // Create Cow Mutation
  const createMutation = useMutation({
    mutationFn: (formData: FormData) => 
      api.post('/cows', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cows'] });
      setIsModalOpen(false);
      setSelectedFile(null);
      reset();
    },
  });

  // Update Cow Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; formData: FormData }) => 
      api.put(`/cows/${data.id}`, data.formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cows'] });
      setIsModalOpen(false);
      setEditingCow(null);
      setSelectedFile(null);
      reset();
    },
  });

  // Delete Cow Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cows'] });
    },
  });

  const onSubmit = (fields: CowFormFields) => {
    const formData = new FormData();
    formData.append('name', fields.name);
    formData.append('tagNumber', fields.tagNumber);
    formData.append('breed', fields.breed);
    formData.append('gender', fields.gender);
    formData.append('age', fields.age.toString());
    formData.append('healthStatus', fields.healthStatus);
    formData.append('shelterNumber', fields.shelterNumber);
    
    if (selectedFile) {
      formData.append('photo', selectedFile);
    }

    if (editingCow) {
      updateMutation.mutate({ id: editingCow._id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (cow: Cow) => {
    setEditingCow(cow);
    setValue('name', cow.name);
    setValue('tagNumber', cow.tagNumber);
    setValue('breed', cow.breed);
    setValue('gender', cow.gender);
    setValue('age', cow.age);
    setValue('healthStatus', cow.healthStatus);
    setValue('shelterNumber', cow.shelterNumber);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this cow? This action is permanent.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenAdd = () => {
    setEditingCow(null);
    reset();
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getHealthBadgeClass = (status: HealthStatus) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      case 'UNDER_TREATMENT':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-400 border border-red-500/25';
      case 'RECOVERING':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/25';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-wide">Cows Inventory</h1>
          <p className="text-slate-400 text-sm mt-1">Shelter management, medical logs, and adoption opportunities</p>
        </div>

        {user?.role === 'ADMIN' && (
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Register Cow
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by Name or Tag ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full glass-input pl-12"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={healthFilter}
            onChange={(e) => {
              setHealthFilter(e.target.value);
              setPage(1);
            }}
            className="glass-input text-xs py-2"
          >
            <option value="">All Health Statuses</option>
            <option value="HEALTHY">Healthy</option>
            <option value="UNDER_TREATMENT">Under Treatment</option>
            <option value="RECOVERING">Recovering</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            value={breedFilter}
            onChange={(e) => {
              setBreedFilter(e.target.value);
              setPage(1);
            }}
            className="glass-input text-xs py-2"
          >
            <option value="">All Breeds</option>
            <option value="Gir">Gir</option>
            <option value="Sahiwal">Sahiwal</option>
            <option value="Tharparkar">Tharparkar</option>
            <option value="Kankrej">Kankrej</option>
            <option value="Rathi">Rathi</option>
          </select>
        </div>
      </div>

      {/* Grid of Cows */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-slate-900/30 border border-slate-850 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : !data?.cows || data.cows.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500">
          No cows registered matching these criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.cows.map((cow: Cow) => (
            <motion.div
              layout
              key={cow._id}
              className="glass-card overflow-hidden flex flex-col group relative"
            >
              {/* Photo */}
              <div className="h-44 bg-slate-950 flex items-center justify-center relative overflow-hidden">
                {cow.photoUrl && !cow.photoUrl.includes('sample-cow') ? (
                  <img
                    src={`${getBackendUrl()}${cow.photoUrl}`}
                    alt={cow.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-600 gap-2 border-b border-slate-800/80">
                    <span className="text-5xl">🐄</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{cow.breed}</span>
                  </div>
                )}
                
                {/* Health Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${getHealthBadgeClass(cow.healthStatus)}`}>
                    {cow.healthStatus.replace('_', ' ')}
                  </span>
                </div>

                {/* Tag Number Badge */}
                <div className="absolute top-3 right-3 bg-slate-950/80 border border-slate-700/50 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-300">
                  {cow.tagNumber}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-semibold text-lg text-white mb-1.5">{cow.name}</h3>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Age:</span>
                      <span className="font-medium text-slate-200">{cow.age} yrs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Gender:</span>
                      <span className="font-medium text-slate-200 capitalize">{cow.gender.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Home size={12} className="text-saffron-500" />
                      <span className="text-slate-500">Shelter:</span>
                      <span className="font-medium text-slate-200">{cow.shelterNumber}</span>
                    </div>
                  </div>
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800/60">
                    <button
                      onClick={() => handleEdit(cow)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cow._id)}
                      className="py-1.5 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Cow Profile"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-4 bg-slate-900/10">
          <span className="text-xs text-slate-500">
            Showing page {page} of {data.pages} ({data.total} total cows)
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

      {/* Add / Edit Cow Modal */}
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
                <h3 className="font-display font-bold text-xl text-white">
                  {editingCow ? 'Edit Cow Record' : 'Register New Cow'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Cow Photo Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Cow Profile Picture</label>
                  <div className="flex items-center gap-3">
                    <label className="flex flex-col items-center justify-center w-24 h-20 border border-dashed border-slate-700 hover:border-saffron-500 rounded-xl cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-colors">
                      <Camera className="text-slate-500 hover:text-saffron-400" size={20} />
                      <span className="text-[10px] text-slate-500 mt-1">Upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <div className="text-xs text-slate-450">
                      {selectedFile ? (
                        <span className="text-emerald-400 font-semibold truncate max-w-[180px] block">
                          {selectedFile.name}
                        </span>
                      ) : editingCow?.photoUrl && !editingCow.photoUrl.includes('sample-cow') ? (
                        <span className="text-slate-400">Keep current picture</span>
                      ) : (
                        <span className="text-slate-500">No file selected</span>
                      )}
                      <p className="text-[10px] text-slate-600 mt-1">Accepts PNG, JPG, JPEG (Max 5MB)</p>
                    </div>
                  </div>
                </div>

                {/* Name & Tag Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Cow Name *</label>
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full glass-input ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="e.g. Ganga"
                    />
                    {errors.name && <span className="text-red-400 text-xs mt-1 block">{errors.name.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Tag ID/Number *</label>
                    <input
                      type="text"
                      {...register('tagNumber')}
                      className={`w-full glass-input uppercase ${errors.tagNumber ? 'border-red-500' : ''}`}
                      placeholder="e.g. SSS-1025"
                    />
                    {errors.tagNumber && <span className="text-red-400 text-xs mt-1 block">{errors.tagNumber.message}</span>}
                  </div>
                </div>

                {/* Breed & Age */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Breed *</label>
                    <select
                      {...register('breed')}
                      className="w-full glass-input"
                    >
                      <option value="Gir">Gir</option>
                      <option value="Sahiwal">Sahiwal</option>
                      <option value="Tharparkar">Tharparkar</option>
                      <option value="Kankrej">Kankrej</option>
                      <option value="Rathi">Rathi</option>
                      <option value="Red Sindhi">Red Sindhi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Age (in years) *</label>
                    <input
                      type="number"
                      step="any"
                      {...register('age')}
                      className={`w-full glass-input ${errors.age ? 'border-red-500' : ''}`}
                      placeholder="e.g. 5"
                    />
                    {errors.age && <span className="text-red-400 text-xs mt-1 block">{errors.age.message}</span>}
                  </div>
                </div>

                {/* Gender, Health, Shelter */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Gender *</label>
                    <select {...register('gender')} className="w-full glass-input px-2">
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Health *</label>
                    <select {...register('healthStatus')} className="w-full glass-input px-1.5">
                      <option value="HEALTHY">Healthy</option>
                      <option value="UNDER_TREATMENT">Treated</option>
                      <option value="RECOVERING">Recovering</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Shelter *</label>
                    <input
                      type="text"
                      {...register('shelterNumber')}
                      className={`w-full glass-input px-2.5 ${errors.shelterNumber ? 'border-red-500' : ''}`}
                      placeholder="e.g. A"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Record'}
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
export default Cows;
