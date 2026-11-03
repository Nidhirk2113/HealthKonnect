import { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api.js';
import { ErrorNotice, SuccessNotice } from './Notice.jsx';

export default function DoctorPasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 12) {
      setError('Your new password must contain at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('Choose a password different from your current password.');
      return;
    }
    setBusy(true);
    try {
      const result = await api.post('/auth/doctor/change-password', { currentPassword, newPassword });
      setSuccess(result.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const inputType = visible ? 'text' : 'password';
  return (
    <section className="panel max-w-2xl space-y-5 p-5 sm:p-7">
      <div>
        <p className="eyebrow">Account security</p>
        <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900"><KeyRound size={20} /> Change password</h2>
        <p className="mt-1 text-sm text-slate-500">Update your sign-in password. You’ll need to verify your current password first.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {[
          ['current-password', 'Current password', currentPassword, setCurrentPassword, 'current-password'],
          ['new-password', 'New password', newPassword, setNewPassword, 'new-password'],
          ['confirm-password', 'Confirm new password', confirmPassword, setConfirmPassword, 'new-password'],
        ].map(([id, label, value, setter, autocomplete]) => (
          <div key={id}>
            <label className="label" htmlFor={id}>{label}</label>
            <div className="relative">
              <input id={id} className="field pr-12" type={inputType} autoComplete={autocomplete} required minLength={id === 'current-password' ? 1 : 12} maxLength={200} value={value} onChange={(e) => setter(e.target.value)} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide passwords' : 'Show passwords'}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
        ))}
        <p className="text-xs text-slate-500">Use at least 12 characters. Avoid reusing a password from another account.</p>
        <ErrorNotice>{error}</ErrorNotice>
        <SuccessNotice>{success}</SuccessNotice>
        <button className="btn" type="submit" disabled={busy || !currentPassword || !newPassword || !confirmPassword}>{busy ? 'Updating…' : 'Update password'}</button>
      </form>
    </section>
  );
}
