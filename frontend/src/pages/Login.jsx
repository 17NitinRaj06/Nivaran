import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiLockClosed, HiArrowRight } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { sanitizeError } from '../utils/errors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success(t('auth.welcomeToast'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success(t('auth.googleSignInToast'));
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'EMAIL_EXISTS') {
        toast.error(`"${err.email}" ${t('auth.emailExists')}`);
        setEmail(err.email);
        return;
      }
      toast.error(sanitizeError(err));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-forest-800 mb-2">
          {t('auth.welcomeBack')}
        </h2>
        <p className="text-earth-600">
          {t('auth.signInSub')}
        </p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">
            {t('auth.email')}
          </label>
          <div className="relative">
            <HiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="input-field pl-11"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">
            {t('auth.password')}
          </label>
          <div className="relative">
            <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              className="input-field pl-11"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {t('auth.signIn')}
              <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-beige-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-earth-500">{t('auth.orContinue')}</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="btn-secondary w-full flex items-center justify-center gap-3"
      >
        <FcGoogle size={20} />
        {t('auth.signInGoogle')}
      </button>

      <p className="mt-6 text-center text-sm text-earth-500">
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="nature-link font-semibold">
          {t('auth.signUp')}
        </Link>
      </p>
    </motion.div>
  );
}
