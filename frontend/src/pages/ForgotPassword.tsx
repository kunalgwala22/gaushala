import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { Mail, ArrowLeft } from 'lucide-react';

const forgotPasswordValidation = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFields = z.infer<typeof forgotPasswordValidation>;

export const ForgotPassword: React.FC = () => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordValidation),
  });

  const onSubmit = async (data: ForgotPasswordFields) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.post('/auth/forgot-password', data);
      setSuccessMsg('If a user exists with this email, a reset link has been dispatched.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-white text-center mb-4">Forgot Password</h2>
      <p className="text-slate-400 text-xs text-center mb-6 leading-relaxed">
        Provide your registered email address and we will send you a reset link to change your password.
      </p>

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
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input
              type="email"
              placeholder="e.g. donor@gaushala.com"
              {...register('email')}
              className={`w-full glass-input pl-12 ${errors.email ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.email && (
            <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting ? (
            <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <div className="text-center mt-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};
export default ForgotPassword;
