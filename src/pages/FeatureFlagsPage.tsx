import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createFeatureFlag, getFeatureFlags, updateFeatureFlag } from '../services/api';

export default function FeatureFlagsPage() {
  const [flags,setFlags]=useState<Record<string,boolean>>({});
  const [key,setKey]=useState('');
  const load=()=>getFeatureFlags().then(r=>setFlags(r.data.flags||{})).catch(()=>toast.error('Failed to load feature flags'));
  useEffect(()=>{load();},[]);
  const toggle=async(flag:string,value:boolean)=>{try{await updateFeatureFlag(flag,value);setFlags({...flags,[flag]:value});toast.success(`${flag} ${value?'enabled':'disabled'}`);}catch(e:any){toast.error(e.response?.data?.error||'Update failed');}};
  const create=async()=>{const normalized=key.trim().toLowerCase();if(!normalized)return;try{await createFeatureFlag(normalized);setKey('');load();toast.success('Feature flag created');}catch(e:any){toast.error(e.response?.data?.error||'Create failed');}};
  return <div><h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1><p className="mt-1 text-sm text-gray-500">Boolean switches used by application code. Turning website_maintenance on hides the storefront and blocks new orders and payments.</p><div className="mt-6 flex gap-2 max-w-xl"><input value={key} onChange={e=>setKey(e.target.value)} placeholder="feature_flag_key" className="flex-1 border rounded-lg px-3 py-2 text-sm"/><button onClick={create} className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-semibold">Create flag</button></div><div className="mt-6 bg-white border rounded-xl overflow-hidden"><table className="w-full"><thead className="bg-gray-50"><tr><th className="text-left p-4 text-xs uppercase text-gray-500">Key</th><th className="text-right p-4 text-xs uppercase text-gray-500">State</th></tr></thead><tbody>{Object.entries(flags).map(([flag,enabled])=><tr key={flag} className="border-t"><td className="p-4 font-mono text-sm">{flag}</td><td className="p-4 text-right"><button role="switch" aria-checked={enabled} aria-label={`Toggle ${flag}`} onClick={()=>toggle(flag,!enabled)} className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${enabled?'bg-emerald-500':'bg-gray-300'}`}><span className={`inline-block h-5 w-5 bg-white rounded-full mt-1 transition-transform ${enabled?'translate-x-6':'translate-x-1'}`}/></button><span className="ml-3 text-sm font-semibold">{enabled?'ON':'OFF'}</span></td></tr>)}</tbody></table></div></div>;
}
