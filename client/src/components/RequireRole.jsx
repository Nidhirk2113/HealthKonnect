import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './Notice.jsx';

export default function RequireRole({ roles, children }) {
  const { user, loading, openAuth } = useAuth();
  if (loading) return <Spinner />;
  if (!user) {
    return (
      <div className="panel mx-auto mt-16 max-w-md p-8 text-center">
        <h2 className="text-xl font-bold">Sign in to continue</h2>
        <p className="mt-2 text-slate-500">This page is only available to signed-in users.</p>
        <button className="btn mt-5" onClick={openAuth}>Sign in with Google</button>
      </div>
    );
  }
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
