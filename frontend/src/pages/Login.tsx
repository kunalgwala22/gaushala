import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const loginValidation = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFields = z.infer<typeof loginValidation>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginValidation),
  });

  const onSubmit = async (data: LoginFields) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const loggedUser = await login(data.email, data.password);
      if (loggedUser.role === 'DONOR') {
        navigate('/profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-white text-center mb-6">Sign In</h2>

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl mb-4"
        >
          {errorMsg}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input
              type="email"
              placeholder="e.g. admin@gaushala.com"
              {...register('email')}
              className={`w-full glass-input pl-12 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
          </div>
          {errors.email && (
            <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <Link to="/forgot-password" className="text-xs text-saffron-500 hover:text-saffron-400 font-medium transition-colors">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={`w-full glass-input pl-12 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <span className="text-red-400 text-xs mt-1 block">{errors.password.message}</span>
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
            'Sign In to Dashboard'
          )}
        </button>
      </form>

      <div className="text-center mt-6 text-sm text-slate-400">
        Are you a donor?{' '}
        <Link to="/register" className="text-saffron-500 hover:text-saffron-400 font-semibold transition-colors">
          Create Account
        </Link>
      </div>
    </div>
  );
};
export default Login;
