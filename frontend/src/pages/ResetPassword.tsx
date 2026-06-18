import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { Lock, ArrowLeft } from 'lucide-react';

const resetPasswordValidation = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFields = z.infer<typeof resetPasswordValidation>;

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordValidation),
  });

  const onSubmit = async (data: ResetPasswordFields) => {
    if (!token) {
      setErrorMsg('Missing or invalid reset token. Please request a new link.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      setSuccessMsg('Your password has been successfully reset. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-white text-center mb-4">Reset Password</h2>
      
      {!token ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl mb-4 text-center">
          Invalid token. Please request a password reset link again.
          <Link to="/forgot-password" className="block text-saffron-500 mt-2 font-medium">
            Go back to Request Link
          </Link>
        </div>
      ) : (
        <>
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full glass-input pl-12 ${errors.password ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.password && (
                <span className="text-red-400 text-xs mt-1 block">{errors.password.message}</span>
              )}
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
              {errors.confirmPassword && (
                <span className="text-red-400 text-xs mt-1 block">{errors.confirmPassword.message}</span>
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
                'Save New Password'
              )}
            </button>
          </form>
        </>
      )}

      <div className="text-center mt-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};
export default ResetPassword;
