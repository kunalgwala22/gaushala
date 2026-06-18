import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Lock } from 'lucide-react';

const registerValidation = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFields = z.infer<typeof registerValidation>;

export const Register: React.FC = () => {
  const { registerDonorUser } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFields>({
    resolver: zodResolver(registerValidation),
  });

  const onSubmit = async (data: RegisterFields) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Exclude confirmPassword from data sent to server
      const { confirmPassword, ...submitData } = data;
      await registerDonorUser({ ...submitData, role: 'DONOR' });
      setSuccessMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-1">
      <h2 className="font-display font-bold text-xl text-white text-center mb-6">Create Donor Account</h2>

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
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="e.g. Ramesh Sharma"
              {...register('name')}
              className={`w-full glass-input pl-12 ${errors.name ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.name && <span className="text-red-400 text-xs mt-1 block">{errors.name.message}</span>}
        </div>

        {/* Email & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input
                type="email"
                placeholder="ramesh@example.com"
                {...register('email')}
                className={`w-full glass-input pl-12 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="9876543210"
                {...register('mobileNumber')}
                className={`w-full glass-input pl-12 ${errors.mobileNumber ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.mobileNumber && <span className="text-red-400 text-xs mt-1 block">{errors.mobileNumber.message}</span>}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="e.g. Flat 101, Shanti Sadan"
              {...register('address')}
              className={`w-full glass-input pl-12 ${errors.address ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.address && <span className="text-red-400 text-xs mt-1 block">{errors.address.message}</span>}
        </div>

        {/* City, State, Pincode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">City</label>
            <input
              type="text"
              placeholder="Chittorgarh"
              {...register('city')}
              className={`w-full glass-input ${errors.city ? 'border-red-500' : ''}`}
            />
            {errors.city && <span className="text-red-400 text-xs mt-1 block">{errors.city.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">State</label>
            <input
              type="text"
              placeholder="Rajasthan"
              {...register('state')}
              className={`w-full glass-input ${errors.state ? 'border-red-500' : ''}`}
            />
            {errors.state && <span className="text-red-400 text-xs mt-1 block">{errors.state.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pincode</label>
            <input
              type="text"
              placeholder="312001"
              {...register('pincode')}
              className={`w-full glass-input ${errors.pincode ? 'border-red-500' : ''}`}
            />
            {errors.pincode && <span className="text-red-400 text-xs mt-1 block">{errors.pincode.message}</span>}
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={`w-full glass-input pl-12 ${errors.password ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.password && <span className="text-red-400 text-xs mt-1 block">{errors.password.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={`w-full glass-input pl-12 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.confirmPassword && <span className="text-red-400 text-xs mt-1 block">{errors.confirmPassword.message}</span>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting ? (
            <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
          ) : (
            'Register Account'
          )}
        </button>
      </form>

      <div className="text-center mt-6 text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-saffron-500 hover:text-saffron-400 font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
};
export default Register;
