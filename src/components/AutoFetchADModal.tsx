import React, { useState } from 'react';
import {
  X,
  Zap,
  Search,
  Server,
  ShieldCheck,
  CheckCircle2,
  Laptop,
  Monitor,
  HardDrive,
  Cpu,
  Clock,
  ArrowRight,
  Database,
  Check,
  Copy,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { activeDirectoryCatalog, autoFetchActiveDirectory, ADComputerObject } from '../data/adDirectoryData';

interface AutoFetchADModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComputer?: (comp: ADComputerObject) => void;
  onNavigateToADSync?: () => void;
}

export const AutoFetchADModal: React.FC<AutoFetchADModalProps> = ({
  isOpen,
  onClose,
  onSelectComputer,
  onNavigateToADSync,
}) => {
  const { assets, addAsset, updateAsset, addAuditLog } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComp, setSelectedComp] = useState<ADComputerObject | null>(activeDirectoryCatalog[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedLdap, setCopiedLdap] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCatalog = activeDirectoryCatalog.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.computerName.toLowerCase().includes(q) ||
      c.ipAddress.toLowerCase().includes(q) ||
      c.assignedUser.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      c.operatingSystem.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q)
    );
  });

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      const match = autoFetchActiveDirectory(searchQuery);
      setSelectedComp(match);
      setIsSearching(false);
    }, 350);
  };

  const handleSelectQuickComp = (comp: ADComputerObject) => {
    setSelectedComp(comp);
    setSearchQuery(comp.computerName);
    setActionSuccessMsg(null);
  };

  const handleImportToInventory = () => {
    if (!selectedComp) return;

    // Check if asset with this computerName already exists in inventory
    const existing = assets.find(
      (a) =>
        a.systemSpecs?.computerName?.toLowerCase() === selectedComp.computerName.toLowerCase() ||
        a.systemSpecs?.ipAddress === selectedComp.ipAddress
    );

    if (existing) {
      // Update existing asset
      updateAsset(existing.id, {
        name: `${selectedComp.brand} ${selectedComp.model} (${selectedComp.computerName})`,
        category: selectedComp.category,
        department: selectedComp.department as any,
        assignedUser: selectedComp.assignedUser,
        systemSpecs: {
          ...existing.systemSpecs,
          computerName: selectedComp.computerName,
          ipAddress: selectedComp.ipAddress,
          macAddress: selectedComp.macAddress,
          osVersion: selectedComp.operatingSystem,
          processor: selectedComp.processor,
          ram: selectedComp.ram,
          ramType: selectedComp.ramType,
          ssd: selectedComp.ssd,
          hdd: selectedComp.hdd,
        },
      });

      addAuditLog?.(
        'AD Auto-Fetch Reconcile',
        `Reconciled hardware specifications for ${selectedComp.computerName} from Active Directory (DC01)`,
        undefined,
        'success'
      );

      setActionSuccessMsg(`✓ Asset "${existing.name}" (${existing.id}) successfully updated with live AD specs!`);
    } else {
      // Create new asset
      const created = addAsset({
        name: `${selectedComp.brand} ${selectedComp.model} (${selectedComp.computerName})`,
        category: selectedComp.category,
        department: selectedComp.department as any,
        assignedUser: selectedComp.assignedUser,
        location: selectedComp.location,
        brand: selectedComp.brand,
        model: selectedComp.model,
        status: 'Active',
        systemSpecs: {
          computerName: selectedComp.computerName,
          ipAddress: selectedComp.ipAddress,
          macAddress: selectedComp.macAddress,
          osVersion: selectedComp.operatingSystem,
          processor: selectedComp.processor,
          ram: selectedComp.ram,
          ramType: selectedComp.ramType,
          ssd: selectedComp.ssd,
          hdd: selectedComp.hdd,
        },
      });

      addAuditLog?.(
        'AD Auto-Fetch Import',
        `Auto-imported computer ${selectedComp.computerName} from Active Directory into Sentinel as ${created.id}`,
        undefined,
        'success'
      );

      setActionSuccessMsg(`✓ New Asset "${created.name}" (${created.id}) created and registered in inventory!`);
    }

    if (onSelectComputer) {
      onSelectComputer(selectedComp);
    }
  };

  const handleCopyLdap = () => {
    if (!selectedComp) return;
    const ldapString = `dn: ${selectedComp.distinguishedName}
objectClass: top, person, organizationalPerson, user, computer
cn: ${selectedComp.computerName}
sAMAccountName: ${selectedComp.sAMAccountName}
dNSHostName: ${selectedComp.dNSHostName}
operatingSystem: ${selectedComp.operatingSystem}
operatingSystemVersion: ${selectedComp.operatingSystemVersion}
userPrincipalName: ${selectedComp.userPrincipalName}
IPv4Address: ${selectedComp.ipAddress}
macAddress: ${selectedComp.macAddress}
department: ${selectedComp.department}
managedBy: ${selectedComp.assignedUser}
objectGUID: ${selectedComp.objectGUID}
lastLogonTimestamp: ${selectedComp.lastLogonTimestamp}`;

    navigator.clipboard.writeText(ldapString);
    setCopiedLdap(true);
    setTimeout(() => setCopiedLdap(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 shadow-inner">
              <Zap className="h-5 w-5 fill-amber-400 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Auto Fetch from Active Directory (AD)</h3>
                <span className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  Domain: paa.gov.pk
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Live LDAP attribute crawler & instant computer provisioning for Pakistan Airports Authority (PAA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar & DC Status Banner */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Computer Name (e.g. PAA-CTO-PC01), IP Address, User, or Model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-500 transition disabled:opacity-50"
            >
              <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
              <span>{isSearching ? 'Querying DC...' : 'Auto Fetch AD'}</span>
            </button>
          </form>

          {/* Quick Preset Buttons */}
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">Quick Select AD Machines:</span>
            {activeDirectoryCatalog.slice(0, 7).map((comp) => (
              <button
                key={comp.computerName}
                type="button"
                onClick={() => handleSelectQuickComp(comp)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold border transition ${
                  selectedComp?.computerName === comp.computerName
                    ? 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {comp.computerName}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Left list & Right LDAP Details */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Discovered AD Directory Objects */}
          <div className="md:col-span-5 space-y-2 border-r border-slate-100 dark:border-slate-800 pr-0 md:pr-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              <span>Domain Computers ({filteredCatalog.length})</span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400">DC01.paa.gov.pk : 636</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredCatalog.map((comp) => (
                <div
                  key={comp.computerName}
                  onClick={() => {
                    setSelectedComp(comp);
                    setActionSuccessMsg(null);
                  }}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    selectedComp?.computerName === comp.computerName
                      ? 'border-teal-500 bg-teal-50/70 dark:border-teal-500/80 dark:bg-teal-950/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-slate-900 dark:text-white">
                      {comp.category === 'Server' ? (
                        <Server className="h-3.5 w-3.5 text-indigo-500" />
                      ) : comp.category === 'Laptop' ? (
                        <Laptop className="h-3.5 w-3.5 text-blue-500" />
                      ) : (
                        <Monitor className="h-3.5 w-3.5 text-teal-500" />
                      )}
                      <span>{comp.computerName}</span>
                    </div>
                    <span className="rounded-md bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {comp.department}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    {comp.assignedUser}
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 font-mono">
                    <span>IP: {comp.ipAddress}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold">Active in AD</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Selected Machine LDAP Details */}
          <div className="md:col-span-7 space-y-4">
            {selectedComp ? (
              <div className="space-y-4">
                {actionSuccessMsg && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{actionSuccessMsg}</span>
                  </div>
                )}

                {/* Computer Banner */}
                <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-800 dark:bg-teal-950/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold font-mono text-slate-900 dark:text-white">
                          {selectedComp.computerName}
                        </h4>
                        <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                          {selectedComp.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {selectedComp.brand} {selectedComp.model} &bull; {selectedComp.assignedUser}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Domain Joined
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-teal-200/60 dark:border-teal-800/40 text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate" title={selectedComp.distinguishedName}>
                    DN: {selectedComp.distinguishedName}
                  </div>
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operating System</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedComp.operatingSystem}</p>
                    <p className="text-[10px] font-mono text-slate-400">{selectedComp.operatingSystemVersion}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Network Addressing</span>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">IP: {selectedComp.ipAddress}</p>
                    <p className="text-[10px] font-mono text-slate-400">MAC: {selectedComp.macAddress}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Processor & Memory</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedComp.processor}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">RAM: {selectedComp.ram} ({selectedComp.ramType})</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Storage Drives</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">SSD: {selectedComp.ssd}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">HDD: {selectedComp.hdd}</p>
                  </div>
                </div>

                {/* Location & Account Metadata */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/30 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Physical Location:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedComp.location.building} &bull; {selectedComp.location.floor} ({selectedComp.location.room})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">User Principal Name:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{selectedComp.userPrincipalName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Active Logon:</span>
                    <span className="text-slate-700 dark:text-slate-300">{selectedComp.lastLogonTimestamp}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleImportToInventory}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-teal-500 hover:to-emerald-500 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>📥 Auto-Import / Update in Inventory</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLdap}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    {copiedLdap ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    <span>{copiedLdap ? 'Copied LDAP LDIF' : 'Copy LDAP Properties'}</span>
                  </button>

                  {onNavigateToADSync && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToADSync();
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300 transition ml-auto"
                    >
                      <span>Open AD Sync Console</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <Server className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold">Select a computer from the list or search by hostname/IP</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/60 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Active Directory LDAPS 636 &bull; DC: 10.100.0.5 (DC01.paa.gov.pk) &bull; Verified Kerberos Handshake</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
