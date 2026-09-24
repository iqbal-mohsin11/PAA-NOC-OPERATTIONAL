import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Server,
  ShieldCheck,
  Key,
  Database,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  FolderTree,
  Clock,
  Save,
  RotateCcw,
  Zap,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Check,
  HelpCircle,
} from 'lucide-react';

export interface LDAPConfigurationFormProps {
  onNavigateTab?: (tab: string) => void;
  className?: string;
  isCompact?: boolean;
}

export const LDAPConfigurationForm: React.FC<LDAPConfigurationFormProps> = ({
  onNavigateTab,
  className = '',
  isCompact = false,
}) => {
  const { userRole, addAuditLog } = useInventory();
  const isAdmin = userRole === 'Administrator';

  // AD LDAP Server & Credentials State
  const [host, setHost] = useState('10.100.0.5');
  const [port, setPort] = useState<number>(636);
  const [useTls, setUseTls] = useState<boolean>(true);
  const [baseDn, setBaseDn] = useState('DC=paa,DC=gov,DC=pk');
  const [bindDn, setBindDn] = useState('CN=SentinelSyncService,OU=ServiceAccounts,DC=paa,DC=gov,DC=pk');
  const [bindPassword, setBindPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchFilter, setSearchFilter] = useState('(&(objectCategory=computer)(objectClass=user))');
  const [timeoutMs, setTimeoutMs] = useState<number>(4000);
  const [syncInterval, setSyncInterval] = useState('Every 15 Minutes');

  // Target OUs State
  const [targetOus, setTargetOus] = useState<string[]>([
    'OU=Workstations,DC=paa,DC=gov,DC=pk',
    'OU=Servers,DC=paa,DC=gov,DC=pk',
    'OU=Laptops,DC=paa,DC=gov,DC=pk',
    'OU=Domain Users,DC=paa,DC=gov,DC=pk',
  ]);
  const [newOuInput, setNewOuInput] = useState('');

  // Status & Feedback State
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Connection Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    connectedToLiveServer?: boolean;
    message: string;
    pingMs: number;
    protocol?: string;
    sslCertificate?: string;
  } | null>(null);

  // Trigger Immediate Sync State
  const [isTriggeringSync, setIsTriggeringSync] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Load current configuration from backend on mount
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const res = await fetch('/api/ad/config');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.config) {
            const cfg = data.config;
            if (cfg.host) setHost(cfg.host);
            if (cfg.port) setPort(cfg.port);
            if (typeof cfg.useTls === 'boolean') setUseTls(cfg.useTls);
            if (cfg.baseDn) setBaseDn(cfg.baseDn);
            if (cfg.bindDn) setBindDn(cfg.bindDn);
            if (cfg.bindPassword) setBindPassword(cfg.bindPassword);
            if (Array.isArray(cfg.targetOus) && cfg.targetOus.length > 0) {
              setTargetOus(cfg.targetOus);
            }
            if (cfg.searchFilter) setSearchFilter(cfg.searchFilter);
            if (cfg.timeoutMs) setTimeoutMs(cfg.timeoutMs);
          }
        }
      } catch (err) {
        console.warn('Could not fetch AD config from API, using default enterprise settings', err);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchConfig();
  }, []);

  // Handle Testing LDAP Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSaveFeedback(null);

    try {
      const res = await fetch('/api/ad/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port,
          useTls,
          baseDn,
          bindDn,
          bindPassword,
        }),
      });

      const data = await res.json();
      setIsTesting(false);
      setTestResult(data);

      if (data.success) {
        addAuditLog?.(
          'LDAP Connection Tested',
          `AD Domain Controller at ${host}:${port} responded in ${data.pingMs}ms. Handshake verified.`,
          undefined,
          'success'
        );
      }
    } catch (err: any) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: `Network request failed: ${err.message}`,
        pingMs: 0,
      });
    }
  };

  // Handle Saving Configuration
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) {
      setSaveFeedback({
        type: 'error',
        message: 'Administrative privileges required to modify Active Directory LDAP configuration.',
      });
      return;
    }

    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const payload = {
        host: host.trim(),
        port: Number(port),
        useTls,
        baseDn: baseDn.trim(),
        bindDn: bindDn.trim(),
        bindPassword: bindPassword.trim(),
        targetOus,
        searchFilter: searchFilter.trim(),
        timeoutMs: Number(timeoutMs),
      };

      const res = await fetch('/api/ad/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setIsSaving(false);

      if (data.success) {
        setSaveFeedback({
          type: 'success',
          message: 'Active Directory LDAP configuration saved and active for synchronization.',
        });
        addAuditLog?.(
          'LDAP Config Updated',
          `Active Directory server configured: ${host}:${port} (${baseDn})`,
          undefined,
          'success'
        );
        setTimeout(() => setSaveFeedback(null), 5000);
      } else {
        throw new Error(data.error || 'Failed to update configuration');
      }
    } catch (err: any) {
      setIsSaving(false);
      setSaveFeedback({
        type: 'error',
        message: `Failed to save configuration: ${err.message}`,
      });
    }
  };

  // Handle Triggering Immediate Synchronization
  const handleTriggerSync = async () => {
    setIsTriggeringSync(true);
    setSyncFeedback(null);

    try {
      const res = await fetch('/api/ad/fetch-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port,
          useTls,
          baseDn,
          bindDn,
          bindPassword,
          targetOus,
        }),
      });

      const data = await res.json();
      setIsTriggeringSync(false);

      if (data.success) {
        setSyncFeedback(`✓ Sync triggered! Fetched ${data.totalDiscovered || 0} objects from AD server.`);
        setTimeout(() => setSyncFeedback(null), 5000);
      } else {
        setSyncFeedback(`Sync completed with warning: ${data.error || 'Check LDAP logs'}`);
      }
    } catch (err: any) {
      setIsTriggeringSync(false);
      setSyncFeedback(`Sync trigger error: ${err.message}`);
    }
  };

  // Reset to default enterprise values
  const handleResetDefaults = () => {
    setHost('10.100.0.5');
    setPort(636);
    setUseTls(true);
    setBaseDn('DC=paa,DC=gov,DC=pk');
    setBindDn('CN=SentinelSyncService,OU=ServiceAccounts,DC=paa,DC=gov,DC=pk');
    setBindPassword('');
    setSearchFilter('(&(objectCategory=computer)(objectClass=user))');
    setTimeoutMs(4000);
    setTargetOus([
      'OU=Workstations,DC=paa,DC=gov,DC=pk',
      'OU=Servers,DC=paa,DC=gov,DC=pk',
      'OU=Laptops,DC=paa,DC=gov,DC=pk',
      'OU=Domain Users,DC=paa,DC=gov,DC=pk',
    ]);
    setSaveFeedback({
      type: 'success',
      message: 'Defaults restored. Click "Save Configuration" to commit.',
    });
  };

  // Add custom target OU
  const handleAddOu = () => {
    if (!newOuInput.trim()) return;
    const formatted = newOuInput.trim();
    if (!targetOus.includes(formatted)) {
      setTargetOus([...targetOus, formatted]);
    }
    setNewOuInput('');
  };

  // Remove target OU
  const handleRemoveOu = (ouToRemove: string) => {
    setTargetOus(targetOus.filter((ou) => ou !== ouToRemove));
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header & Role Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base dark:text-white">
                Active Directory (AD) LDAP Configuration
              </h3>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30">
                LDAPS 636
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure Domain Controller endpoint, base search DN, and synchronization credentials for automated asset reconciliation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border flex items-center gap-1.5 ${
              isAdmin
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
            <span>{isAdmin ? 'Administrator Mode' : 'View Only (Admin Required)'}</span>
          </span>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('adsync')}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
              title="Open full AD Sync view"
            >
              <span>AD Sync View</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Save / Error Feedback Alert */}
      {saveFeedback && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            saveFeedback.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
          }`}
        >
          {saveFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{saveFeedback.message}</span>
        </div>
      )}

      {/* Sync Trigger Feedback Alert */}
      {syncFeedback && (
        <div className="rounded-xl border border-teal-300 bg-teal-50 p-3 text-xs font-bold text-teal-900 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 flex items-center gap-2">
          <Zap className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="space-y-4 text-xs">
        {/* Section 1: Server Connection Details */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-500" />
              <span>Active Directory Server Address & Protocol</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              {useTls ? 'ldaps://' : 'ldap://'}{host}:{port}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Host / Server Address */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                AD Server Address (FQDN or IP)
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={!isAdmin}
                placeholder="10.100.0.5 or dc01.paa.gov.pk"
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Primary Domain Controller running Active Directory Domain Services (AD DS).
              </span>
            </div>

            {/* Port */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                LDAP Port
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                disabled={!isAdmin}
                placeholder="636"
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard: 636 (LDAPS) or 389 (LDAP).
              </span>
            </div>
          </div>

          {/* LDAPS TLS Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                Use LDAPS (SSL / TLS 1.3 Encryption)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Encrypts Active Directory queries and credentials using TLS over port 636
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useTls}
                onChange={(e) => {
                  if (!isAdmin) return;
                  const checked = e.target.checked;
                  setUseTls(checked);
                  setPort(checked ? 636 : 389);
                }}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Section 2: Base DN & Synchronization Credentials */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-500" />
            <span>Active Directory Base DN & Synchronization Credentials</span>
          </h4>

          {/* Base DN */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Active Directory Base DN
            </label>
            <input
              type="text"
              value={baseDn}
              onChange={(e) => setBaseDn(e.target.value)}
              disabled={!isAdmin}
              placeholder="DC=paa,DC=gov,DC=pk"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              The root Distinguished Name in the directory hierarchy from which computer searches commence.
            </span>
          </div>

          {/* Service Account Bind DN / Username */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Service Account Bind DN / Username
            </label>
            <input
              type="text"
              value={bindDn}
              onChange={(e) => setBindDn(e.target.value)}
              disabled={!isAdmin}
              placeholder="CN=SentinelSyncService,OU=ServiceAccounts,DC=paa,DC=gov,DC=pk or DOMAIN\username"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Dedicated read-only AD service account used by Sentinel to perform LDAP search operations.
            </span>
          </div>

          {/* Service Account Password */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Service Account Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={bindPassword}
                onChange={(e) => setBindPassword(e.target.value)}
                disabled={!isAdmin}
                placeholder="Enter domain service account password"
                className="w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 py-2.5 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Password credentials are securely transmitted and verified during the LDAP bind phase.
            </span>
          </div>
        </div>

        {/* Section 3: Target OUs & Sync Schedule */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-emerald-500" />
              <span>Target Organizational Units (OUs) for Synchronization</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-semibold">{targetOus.length} Target OUs</span>
          </div>

          {/* OU List Chips */}
          <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            {targetOus.map((ou) => (
              <div
                key={ou}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
              >
                <span className="truncate mr-2 font-bold">{ou}</span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOu(ou)}
                    className="text-slate-400 hover:text-rose-500 transition px-1"
                    title="Remove OU from sync"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}

            {/* Add custom OU */}
            {isAdmin && (
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  value={newOuInput}
                  onChange={(e) => setNewOuInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOu();
                    }
                  }}
                  placeholder="e.g. OU=FinanceComputers,DC=paa,DC=gov,DC=pk"
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleAddOu}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shrink-0"
                >
                  Add OU
                </button>
              </div>
            )}
          </div>

          {/* Sync Schedule & Search Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Background Sync Interval
              </label>
              <select
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                disabled={!isAdmin}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="Every 15 Seconds">Every 15 Seconds (Rapid Testing)</option>
                <option value="Every 1 Minute">Every 1 Minute</option>
                <option value="Every 15 Minutes">Every 15 Minutes (Recommended)</option>
                <option value="Every 1 Hour">Every 1 Hour</option>
                <option value="Daily at Midnight">Daily at Midnight</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                LDAP Computer Search Filter
              </label>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                disabled={!isAdmin}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Live Diagnostics Card (Test Result) */}
        {testResult && (
          <div
            className={`rounded-2xl border p-4 text-xs font-medium space-y-2 animate-in fade-in ${
              testResult.success
                ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-amber-300 bg-amber-50/90 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                )}
                <span>
                  {testResult.success
                    ? `LDAP Handshake Succeeded (${testResult.pingMs}ms latency)`
                    : 'LDAP Diagnostic Notice'}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/60 dark:bg-slate-900/60">
                {useTls ? 'LDAPS 636' : 'LDAP 389'}
              </span>
            </div>

            <p className="text-[11px] text-slate-700 dark:text-slate-300">{testResult.message}</p>

            {testResult.sslCertificate && (
              <div className="rounded-lg bg-white/80 p-2 font-mono text-[10px] text-emerald-800 dark:bg-slate-900/80 dark:text-emerald-300">
                <span className="font-bold">SSL Certificate:</span> {testResult.sslCertificate}
              </div>
            )}
          </div>
        )}

        {/* Action Button Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
          <div className="flex items-center gap-2">
            {/* Test LDAP Connection Button */}
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition disabled:opacity-50"
            >
              <Wifi className={`h-4 w-4 ${isTesting ? 'animate-ping text-emerald-500' : 'text-slate-500'}`} />
              <span>{isTesting ? 'Testing LDAP...' : 'Test Connection'}</span>
            </button>

            {/* Trigger Sync Button */}
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isTriggeringSync}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 font-bold text-teal-800 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300 transition disabled:opacity-50"
              title="Query directory immediately"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTriggeringSync ? 'animate-spin' : ''}`} />
              <span>{isTriggeringSync ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            {/* Reset Defaults */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 rounded-xl border border-transparent p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title="Restore default domain configuration"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden md:inline text-[11px]">Reset</span>
              </button>
            )}
          </div>

          {/* Primary Save Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleSaveConfig()}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
            >
              <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Saving...' : 'Save LDAP Configuration'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
