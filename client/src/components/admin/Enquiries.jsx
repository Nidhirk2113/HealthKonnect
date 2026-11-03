import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { fmtDateTime } from '../../lib/format.js';
import { Empty, ErrorNotice, Spinner } from '../Notice.jsx';

export default function Enquiries() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.get('/admin/contact-messages');
      setRows(response.messages);
    } catch (e) {
      setError(e.message || 'Unable to load enquiries.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handled = async (id) => {
    setError('');
    setBusyId(id);

    try {
      await api.patch(`/admin/contact-messages/${id}/handled`);
      await load();
    } catch (e) {
      setError(e.message || 'Unable to update enquiry.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Enquiries</h2>
        <button
          className="btn-secondary btn-sm"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <ErrorNotice>{error}</ErrorNotice>

      {loading ? (
        <Spinner />
      ) : error ? null : rows.length === 0 ? (
        <Empty>No enquiries yet.</Empty>
      ) : (
        rows.map((m) => (
          <div key={m._id} className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">
                {m.name}
                <span className="font-normal text-slate-500">
                  {' · '}{m.email}
                  {m.phone ? ` · ${m.phone}` : ''}
                </span>
              </p>

              <p className="text-xs text-slate-500">
                {fmtDateTime(m.createdAt)}
              </p>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {m.message}
            </p>

            <div className="mt-3">
              {m.status === 'new' ? (
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => handled(m._id)}
                  disabled={busyId === m._id}
                >
                  {busyId === m._id ? 'Updating...' : 'Mark as handled'}
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-700">
                  Handled
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}