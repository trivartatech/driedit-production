import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (location.state?.user) {
      setIsChecking(false);
      return;
    }

    if (!loading) {
      setIsChecking(false);
    }
  }, [loading, location.state]);

  if (isChecking || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E10600] mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check admin role for admin routes
  if (adminOnly && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[#E10600] mb-4">ACCESS DENIED</h1>
          <p className="text-gray-400 mb-8">You don't have permission to access this page.</p>
          <a href="/" className="bg-[#E10600] text-white px-6 py-3 font-bold hover:bg-white hover:text-black transition-colors">
            GO HOME
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
