import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { currentConfig, testSupabaseConnection } from '../lib/supabase';
import { ConnectionStatus } from '../types';

/**
 * Card showing Supabase connection status with interactive testing.
 */
export const SupabaseCard: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(() => ({
    state: currentConfig.isConfigured ? 'idle' : 'error',
    message: currentConfig.isConfigured
      ? 'Environment variables detected. Click below to verify database reachability.'
      : `Missing required variables: ${currentConfig.missingVars.join(', ')}`,
  }));

  const handleTestConnection = async () => {
    setStatus({
      state: 'checking',
      message: 'Testing connection to Supabase...',
    });

    const result = await testSupabaseConnection();
    setStatus({
      state: result.success ? 'connected' : 'error',
      message: result.message,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-zinc-950">
              Supabase Connection
            </h2>
            <p className="text-xs text-zinc-500">
              Database, Authentication & Storage
            </p>
          </div>
        </div>

        {currentConfig.isConfigured ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true" />
            Configured
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
            <span className="w-2 h-2 rounded-full bg-amber-600" aria-hidden="true" />
            Keys Pending
          </span>
        )}
      </div>

      {/* Status banner */}
      <div
        className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
          status.state === 'connected'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : status.state === 'error'
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-stone-50 border-stone-200 text-zinc-700'
        }`}
      >
        {status.state === 'connected' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="flex-1">
          <p className="font-medium">{status.message}</p>
          {status.timestamp && (
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Last tested at {status.timestamp}
            </p>
          )}
        </div>
      </div>

      {/* Variables check list */}
      <div className="space-y-2 pt-1 border-t border-stone-100 text-xs">
        <div className="flex items-center justify-between text-zinc-600 py-1">
          <span className="font-mono text-[11px]">SUPABASE_URL</span>
          <span className="font-mono text-[11px] truncate max-w-[200px]">
            {currentConfig.supabaseUrl ? (
              <span className="text-emerald-700 font-semibold">
                {currentConfig.supabaseUrl.replace(/https:\/\//, '').slice(0, 22)}...
              </span>
            ) : (
              <span className="text-zinc-400">Not set</span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-zinc-600 py-1">
          <span className="font-mono text-[11px]">SUPABASE_ANON_KEY</span>
          <span className="font-mono text-[11px]">
            {currentConfig.supabaseAnonKey ? (
              <span className="text-emerald-700 font-semibold">
                {currentConfig.supabaseAnonKey.slice(0, 12)}••••••••
              </span>
            ) : (
              <span className="text-zinc-400">Not set</span>
            )}
          </span>
        </div>
      </div>

      {/* Action button */}
      <button
        type="button"
        disabled={status.state === 'checking'}
        onClick={handleTestConnection}
        className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${status.state === 'checking' ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <span>
          {status.state === 'checking' ? 'Testing Connection...' : 'Test Connection'}
        </span>
      </button>
    </div>
  );
};
