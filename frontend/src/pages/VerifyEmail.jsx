import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiRefresh, HiLogout, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const { user, resendVerificationEmail, reloadUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
    else if (user.emailVerified) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error('Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const verified = await reloadUser();
      if (verified) {
        toast.success('Email verified! Redirecting...');
        navigate('/dashboard');
      } else {
        toast.error('Still not verified. Check your inbox and try again.');
      }
    } catch (err) {
      toast.error('Something went wrong. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-nature-gradient-light flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sage-100 flex items-center justify-center">
          <HiMail className="text-sage-700" size={32} />
        </div>

        <h1 className="font-display text-2xl text-forest-800 mb-2">Verify your email</h1>
        <p className="text-earth-600 mb-1">
          We sent a verification email to
        </p>
        <p className="font-medium text-forest-700 mb-6">{user?.email}</p>

        <div className="bg-beige-50 rounded-xl p-4 mb-6 text-left text-sm text-earth-600 space-y-2">
          <p>1. Open the email from Nivaran in your inbox</p>
          <p>2. Click the verification link</p>
          <p>3. Come back and click the button below</p>
        </div>

        <button
          onClick={handleCheckVerification}
          disabled={checking}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
        >
          {checking ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <HiCheckCircle size={18} />
              I've verified — continue
            </>
          )}
        </button>

        <button
          onClick={handleResend}
          disabled={sending}
          className="btn-secondary w-full flex items-center justify-center gap-2 mb-4"
        >
          <HiRefresh size={16} className={sending ? 'animate-spin' : ''} />
          {sending ? 'Sending...' : 'Resend verification email'}
        </button>

        <button
          onClick={handleLogout}
          className="text-sm text-earth-400 hover:text-earth-600 flex items-center justify-center gap-1.5 mx-auto"
        >
          <HiLogout size={14} />
          Sign out & try a different account
        </button>
      </motion.div>
    </div>
  );
}
