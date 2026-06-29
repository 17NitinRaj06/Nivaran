import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoSpinner from '../components/ui/LogoSpinner';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LogoSpinner size="lg" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-nature-gradient-light flex">
      <div className="hidden lg:flex lg:w-1/2 bg-nature-gradient-dark items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 text-center max-w-lg">
          <h1 className="font-display text-5xl text-white mb-6">Nivaran</h1>
          <p className="text-sage-200 text-xl leading-relaxed italic">
            "The greatest threat to our planet is the belief that someone else will save it."
          </p>
          <p className="text-sage-300 mt-4">— Robert Swan</p>
          <div className="mt-12 space-y-4">
            {[
              'Report civic issues in your neighborhood',
              'Track resolution progress in real-time',
              'Earn badges and build community impact',
            ].map((point, i) => (
              <div key={i} className="flex items-center gap-3 text-white">
                <div className="w-2 h-2 rounded-full bg-sage-400" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
