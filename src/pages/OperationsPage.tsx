import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { getOpsAnomalies, getOpsAudit, getOpsStatus } from '../services/api';

export default function OperationsPage() {
  const [status, setStatus] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [severity, setSeverity] = useState('');
  const [resource, setResource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [statusResponse, anomalyResponse, auditResponse] = await Promise.all([
        getOpsStatus(),
        getOpsAnomalies({ severity: severity || undefined, resource_id: resource || undefined, limit: 50 }),
        getOpsAudit({ resource_id: resource || undefined, limit: 25 }),
      ]);
      setStatus(statusResponse.data);
      setAnomalies(anomalyResponse.data.anomalies || []);
      setAudit(auditResponse.data.audit_events || []);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Operations data could not be loaded');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const checks = status?.configuration || [];
  const requiredFailures = checks.filter((check: any) => check.required && !check.ready);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Service operations</p><h1 className="text-2xl font-bold text-slate-950 mt-1">Operations readiness</h1><p className="text-sm text-slate-500 mt-1">Read-only diagnostics. No repair action is performed from this page.</p></div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Production configuration" value={requiredFailures.length === 0 ? 'Ready' : `${requiredFailures.length} remaining`} healthy={requiredFailures.length === 0} />
        <SummaryCard title="Critical anomalies" value={String(status?.active_anomalies?.critical || 0)} healthy={!status?.active_anomalies?.critical} />
        <SummaryCard title="High anomalies" value={String(status?.active_anomalies?.high || 0)} healthy={!status?.active_anomalies?.high} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950">Dependency configuration</h2></div>
        <div className="divide-y divide-slate-100">
          {checks.map((check: any) => <div key={check.name} className="flex items-start gap-3 px-5 py-3"><span className="mt-0.5">{check.ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className={`h-4 w-4 ${check.required ? 'text-red-600' : 'text-amber-600'}`} />}</span><div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{check.name.replaceAll('_', ' ')}</p><p className="text-xs text-slate-500">{check.detail}</p></div><span className="ml-auto text-xs font-semibold uppercase text-slate-400">{check.required ? 'Required' : 'Optional'}</span></div>)}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-slate-950">Active anomalies</h2><p className="text-xs text-slate-500">Verify provider and database state before changing anything.</p></div><div className="flex gap-2"><select aria-label="Severity" value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">All severities</option><option value="critical">Critical</option><option value="high">High</option></select><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input aria-label="Resource ID" value={resource} onChange={(event) => setResource(event.target.value)} placeholder="Order or resource ID" className="rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" /></div><button onClick={load} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filter</button></div></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Severity</th><th className="px-5 py-3">Event</th><th className="px-5 py-3">Resource</th><th className="px-5 py-3">Age</th><th className="px-5 py-3">Investigation</th></tr></thead><tbody className="divide-y divide-slate-100">{anomalies.map((item) => <tr key={item.key}><td className="px-5 py-3 font-semibold text-red-700">{item.severity}</td><td className="px-5 py-3"><p className="font-mono text-xs text-slate-700">{item.event_code}</p><p className="mt-1 text-slate-600">{item.summary}</p></td><td className="px-5 py-3"><p>{item.resource_type}</p><p className="font-mono text-xs text-slate-500">{item.resource_id}</p></td><td className="px-5 py-3">{formatAge(item.age_seconds)}</td><td className="max-w-sm px-5 py-3 text-slate-600">{item.recommendation}</td></tr>)}{!loading && anomalies.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No active anomalies match the filter.</td></tr>}</tbody></table></div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950">Recent admin audit events</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Time</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Resource</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Result</th><th className="px-5 py-3">Request ID</th></tr></thead><tbody className="divide-y divide-slate-100">{audit.map((item) => <tr key={item.id}><td className="px-5 py-3 whitespace-nowrap">{new Date(item.timestamp).toLocaleString()}</td><td className="px-5 py-3 font-medium">{item.action}</td><td className="px-5 py-3 font-mono text-xs">{item.resource_id || item.resource_type}</td><td className="px-5 py-3">{item.actor_email}</td><td className="px-5 py-3">{item.outcome}</td><td className="px-5 py-3 font-mono text-xs">{item.request_id}</td></tr>)}{!loading && audit.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No audit events recorded yet.</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}

function SummaryCard({ title, value, healthy }: { title: string; value: string; healthy: boolean }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center gap-2">{healthy ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <ShieldAlert className="h-5 w-5 text-red-600" />}<p className="text-sm font-medium text-slate-500">{title}</p></div><p className="mt-3 text-2xl font-bold text-slate-950">{value}</p></div>;
}

function formatAge(seconds: number) { if (seconds < 3600) return `${Math.max(0, Math.floor(seconds / 60))}m`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`; return `${Math.floor(seconds / 86400)}d`; }
