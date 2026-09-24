import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { loadTechnicians, TechnicianProfile } from '../data/techniciansData';
import { User, CheckCircle2, Clock, Phone, Mail, Wrench, Shield, Sparkles } from 'lucide-react';

interface TechnicianSelectDropdownProps {
  value: string;
  onChange: (technicianName: string) => void;
  label?: string;
  required?: boolean;
  showCardPreview?: boolean;
  className?: string;
}

export const TechnicianSelectDropdown: React.FC<TechnicianSelectDropdownProps> = ({
  value,
  onChange,
  label = 'Assigned Technician',
  required = true,
  showCardPreview = true,
  className = '',
}) => {
  const { userAccounts, printerMaintenanceRecords, maintenanceRecords } = useInventory();
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>(loadTechnicians);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');

  // Reload technicians if storage changed
  useEffect(() => {
    setTechnicians(loadTechnicians());
  }, []);

  // Determine if the incoming value matches one in the roster
  const matchedTech = technicians.find(
    (t) => t.name.toLowerCase() === (value || '').toLowerCase()
  );

  useEffect(() => {
    if (value && !matchedTech && !technicians.some((t) => t.name.includes(value))) {
      setIsCustomMode(true);
      setCustomName(value);
    }
  }, [value, matchedTech, technicians]);

  // Compute active in-progress repairs for selected tech
  const activeJobsCount = matchedTech
    ? printerMaintenanceRecords.filter(
        (r) =>
          r.technicianName?.toLowerCase() === matchedTech.name.toLowerCase() &&
          r.status !== 'Completed' &&
          r.status !== 'Scrap / Unrepairable'
      ).length
    : 0;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__CUSTOM__') {
      setIsCustomMode(true);
      setCustomName('');
    } else {
      setIsCustomMode(false);
      onChange(val);
    }
  };

  const handleCustomSubmit = (name: string) => {
    setCustomName(name);
    onChange(name);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-indigo-500" />
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>

        {isCustomMode ? (
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(false);
              if (technicians.length > 0) onChange(technicians[0].name);
            }}
            className="text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Switch to Roster Dropdown
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(true);
              setCustomName('');
            }}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            + Custom / External Tech
          </button>
        )}
      </div>

      {!isCustomMode ? (
        <div className="relative">
          <select
            value={matchedTech ? matchedTech.name : value}
            onChange={handleSelectChange}
            required={required}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <optgroup label="Active Duty Hardware Technicians">
              {technicians
                .filter((t) => t.status === 'Active / On Duty')
                .map((tech) => (
                  <option key={tech.id} value={tech.name}>
                    🟢 {tech.name} — {tech.specialization} ({tech.shift})
                  </option>
                ))}
            </optgroup>

            <optgroup label="Other Roster Technicians & On-Call">
              {technicians
                .filter((t) => t.status !== 'Active / On Duty')
                .map((tech) => (
                  <option key={tech.id} value={tech.name}>
                    {tech.status === 'In Field Repair' ? '🔧' : tech.status === 'On Call' ? '📞' : '⚪'}{' '}
                    {tech.name} — {tech.status} ({tech.shift})
                  </option>
                ))}
            </optgroup>

            {userAccounts && userAccounts.length > 0 && (
              <optgroup label="Registered User Accounts">
                {userAccounts
                  .filter((u) => !technicians.some((t) => t.name.toLowerCase() === u.displayName.toLowerCase()))
                  .map((u) => (
                    <option key={u.id} value={u.displayName}>
                      👤 {u.displayName} ({u.role})
                    </option>
                  ))}
              </optgroup>
            )}

            <option value="__CUSTOM__">✍️ + Type Custom / External Contractor Name...</option>
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            required={required}
            placeholder="Enter external technician or contractor name..."
            value={customName}
            onChange={(e) => handleCustomSubmit(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
      )}

      {/* Selected Technician Card Preview */}
      {showCardPreview && matchedTech && !isCustomMode && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-2.5 text-xs dark:border-indigo-950/60 dark:bg-indigo-950/20">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white text-xs">
                {matchedTech.name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('')}
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white leading-tight block">
                  {matchedTech.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  {matchedTech.role} • {matchedTech.department}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                  matchedTech.status === 'Active / On Duty'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : matchedTech.status === 'In Field Repair'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {matchedTech.status}
              </span>

              <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                {matchedTech.shift.split(' ')[0]} Shift
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between border-t border-indigo-100/80 dark:border-indigo-900/40 pt-1.5 text-[10px] text-slate-600 dark:text-slate-300 gap-1.5">
            <span className="truncate max-w-[280px]">
              <strong>Specialty:</strong> {matchedTech.specialization}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-2.5 w-2.5 text-indigo-500" />
              <span>{matchedTech.contactNumber}</span>
            </span>
            {activeJobsCount > 0 && (
              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 font-bold text-amber-700 dark:text-amber-400">
                ⚡ {activeJobsCount} Active Jobs
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
