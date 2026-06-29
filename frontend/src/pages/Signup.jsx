import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiMail, HiLockClosed, HiUser, HiArrowRight, HiShieldCheck, HiUserGroup,
  HiLocationMarker, HiChevronDown,
} from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { sanitizeError } from '../utils/errors';
import { states, citiesByState } from '../utils/indiaLocations';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t('auth.passwordMinError'));
      return;
    }
    if (!selectedState || !selectedCity) {
      toast.error('Please select your state and city');
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(name, email, password, role, selectedState, selectedCity, selectedArea);
      toast.success('Verification email sent! Check your inbox.');
      navigate('/verify-email');
    } catch (err) {
      toast.error(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithGoogle();
      toast.success(t('auth.welcomeToastSignup'));
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'EMAIL_EXISTS') {
        toast.error(`"${err.email}" ${t('auth.emailExistsSignup')}`);
        navigate('/login');
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
          {t('auth.join')}
        </h2>
        <p className="text-earth-600">
          {t('auth.signUpSub')}
        </p>
      </div>

      <form onSubmit={handleEmailSignup} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">
            {t('auth.fullName')}
          </label>
          <div className="relative">
            <HiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" size={18} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.namePlaceholder')}
              className="input-field pl-11"
              required
            />
          </div>
        </div>

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
              placeholder={t('auth.passwordMinPlaceholder')}
              className="input-field pl-11"
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('citizen')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                role === 'citizen'
                  ? 'bg-forest-50 border-forest-500 text-forest-700'
                  : 'bg-white border-beige-200 text-earth-600 hover:bg-beige-50'
              }`}
            >
              <HiUserGroup size={20} className={role === 'citizen' ? 'text-forest-600' : 'text-earth-400'} />
              <div className="text-left">
                <p className="font-medium">Citizen</p>
                <p className="text-xs text-earth-400">Report issues & upvote</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('officer')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                role === 'officer'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-beige-200 text-earth-600 hover:bg-beige-50'
              }`}
            >
              <HiShieldCheck size={20} className={role === 'officer' ? 'text-blue-600' : 'text-earth-400'} />
              <div className="text-left">
                <p className="font-medium">Officer</p>
                <p className="text-xs text-earth-400">Verify & resolve complaints</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-beige-50 rounded-xl p-4 space-y-4 border border-beige-200">
          <div className="flex items-center gap-2 text-earth-700 font-medium text-sm">
            <HiLocationMarker size={16} />
            Your Location
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-earth-600 mb-1">State</label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }}
                  className="input-field appearance-none text-sm py-2"
                >
                  <option value="">Select state</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" size={14} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-earth-600 mb-1">City / District</label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="input-field appearance-none text-sm py-2"
                  disabled={!selectedState}
                >
                  <option value="">Select city</option>
                  {(citiesByState[selectedState] || []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-earth-600 mb-1">Area / Locality <span className="text-earth-400">(optional)</span></label>
            <input
              type="text"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              placeholder="e.g. Koramangala, Indiranagar..."
              className="input-field text-sm py-2"
              disabled={!selectedCity}
            />
          </div>
          <p className="text-[11px] text-earth-400 leading-relaxed">You'll receive notifications about reports filed in your area.</p>
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
              {t('auth.createAccount')}
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
        onClick={handleGoogleSignup}
        className="btn-secondary w-full flex items-center justify-center gap-3"
      >
        <FcGoogle size={20} />
        {t('auth.signUpGoogle')}
      </button>

      <p className="mt-6 text-center text-sm text-earth-500">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="nature-link font-semibold">
          {t('auth.signIn')}
        </Link>
      </p>
    </motion.div>
  );
}
