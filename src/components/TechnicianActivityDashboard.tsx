import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  TechnicianProfile,
  MaintenanceSettingsConfig,
  loadTechnicians,
  saveTechnicians,
  loadMaintenanceSettings,
  saveMaintenanceSettings,
  DEFAULT_TECHNICIANS,
} from '../data/techniciansData';
import {
  User,
  Wrench,
  Activity,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  SlidersHorizontal,
  Download,
  Plus,
  Trash2,
  Edit2,
  Phone,
  Mail,
  Shield,
  Sparkles,
  Calendar,
  Layers,
  FileSpreadsheet,
  Building,
  UserCheck,
  Search,
} from 'lucide-react';

interface TechnicianActivityDashboardProps {
  onSelectAsset?: (assetId: string) => void;
  onOpenMaintenanceForm?: (assetId?: string) => void;
}

export const TechnicianActivityDashboard: React.FC<TechnicianActivityDashboardProps> = ({
  onSelectAsset,
  onOpenMaintenanceForm,
}) => {
  const {
    printerMaintenanceRecords,
    maintenanceRecords,
    upsMaintenanceRecords,
    assets,
    userRole,
  } = useInventory();

  const [technicians, setTechnicians] = useState<TechnicianProfile[]>(loadTechnicians);
  const [settings, setSettings] = useState<MaintenanceSettingsConfig>(loadMaintenanceSettings);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'analytics' | 'settings' | 'roster'>('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');

  // Feedback message
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Add / Edit Technician modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<TechnicianProfile | null>(null);
  const [techForm, setTechForm] = useState<Omit<TechnicianProfile, 'id'>>({
    name: '',
    role: 'Maintenance Technician',
    department: 'Airport IT NOC',
    specialization: 'Hardware, Printers & Peripherals',
    contactNumber: '+92 300 0000000',
    email: 'tech@paa.gov.pk',
    shift: 'Morning (08:00 - 16:00)',
    status: 'Active / On Duty',
    certifications: ['Hardware Maintenance Spec.'],
    maxDailyWorkload: 5,
    rating: 4.8,
    joinedDate: new Date().toISOString().slice(0, 10),
  });

  // Calculate comprehensive metrics per technician
  const technicianStats = useMemo(() => {
    return technicians.map((tech) => {
      const techName = tech.name.toLowerCase();

      // Match printer maintenance
      const printerJobs = printerMaintenanceRecords.filter((r) =>
        (r.technicianName || '').toLowerCase().includes(techName) ||
        techName.includes((r.technicianName || '').toLowerCase())
      );

      // Match generic maintenance
      const genericJobs = maintenanceRecords.filter((r) =>
        (r.engineer || '').toLowerCase().includes(techName) ||
        techName.includes((r.engineer || '').toLowerCase())
      );

      // Match UPS maintenance
      const upsJobs = upsMaintenanceRecords.filter((r) =>
        (r.engineer || '').toLowerCase().includes(techName) ||
        techName.includes((r.engineer || '').toLowerCase())
      );

      const totalCompleted =
        printerJobs.filter((r) => r.status === 'Completed').length +
        genericJobs.length +
        upsJobs.length;

      const activeJobs = printerJobs.filter(
        (r) => r.status !== 'Completed' && r.status !== 'Scrap / Unrepairable'
      );

      const totalCostPkr =
        printerJobs.reduce((acc, r) => acc + (r.costPkr || 0), 0) +
        genericJobs.reduce((acc, r) => acc + (r.cost || 0), 0) +
        upsJobs.reduce((acc, r) => acc + (r.cost || 0), 0);

      const totalPartsCount = printerJobs.reduce(
        (acc, r) => acc + (r.partsChanged?.reduce((s, p) => s + p.quantity, 0) || 0),
        0
      );

      const verifiedCount = printerJobs.filter((r) => r.testPagePrinted).length;
      const verifiedRatio = printerJobs.length > 0 ? (verifiedCount / printerJobs.length) * 100 : 100;

      // Recent 3 jobs
      const recentPrinterJobs = printerJobs.slice(0, 3);

      return {
        ...tech,
        printerJobs,
        genericJobs,
        upsJobs,
        totalJobsCount: printerJobs.length + genericJobs.length + upsJobs.length,
        totalCompleted,
        activeJobsCount: activeJobs.length,
        totalCostPkr,
        totalPartsCount,
        verifiedRatio,
        recentPrinterJobs,
      };
    });
  }, [technicians, printerMaintenanceRecords, maintenanceRecords, upsMaintenanceRecords]);

  // Aggregate System KPI
  const aggregateMetrics = useMemo(() => {
    const totalTechs = technicians.length;
    const onDutyTechs = technicians.filter((t) => t.status === 'Active / On Duty').length;
    const totalAllJobs =
      printerMaintenanceRecords.length + maintenanceRecords.length + upsMaintenanceRecords.length;
    const totalActiveJobs = printerMaintenanceRecords.filter(
      (r) => r.status !== 'Completed' && r.status !== 'Scrap / Unrepairable'
    ).length;
    const totalSpend =
      printerMaintenanceRecords.reduce((acc, r) => acc + (r.costPkr || 0), 0) +
      maintenanceRecords.reduce((acc, r) => acc + (r.cost || 0), 0) +
      upsMaintenanceRecords.reduce((acc, r) => acc + (r.cost || 0), 0);

    return {
      totalTechs,
      onDutyTechs,
      totalAllJobs,
      totalActiveJobs,
      totalSpend,
    };
  }, [technicians, printerMaintenanceRecords, maintenanceRecords, upsMaintenanceRecords]);

  // Filtered leaderboard
  const filteredTechs = useMemo(() => {
    return technicianStats.filter((tech) => {
      if (statusFilter !== 'ALL' && tech.status !== statusFilter) return false;
      if (shiftFilter !== 'ALL' && !tech.shift.includes(shiftFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tech.name.toLowerCase().includes(q) ||
          tech.role.toLowerCase().includes(q) ||
          tech.specialization.toLowerCase().includes(q) ||
          tech.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [technicianStats, statusFilter, shiftFilter, searchQuery]);

  const handleUpdateStatus = (techId: string, newStatus: TechnicianProfile['status']) => {
    const updated = technicians.map((t) => (t.id === techId ? { ...t, status: newStatus } : t));
    setTechnicians(updated);
    saveTechnicians(updated);
    setFeedbackMsg(`Duty status updated for ${technicians.find((t) => t.id === techId)?.name}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingTech(null);
    setTechForm({
      name: '',
      role: 'Hardware Engineer',
      department: 'Airport IT NOC',
      specialization: 'Laser Printers, Optical Scanners & Hardware Support',
      contactNumber: '+92 300 1234567',
      email: 'engineer@paa.gov.pk',
      shift: 'Morning (08:00 - 16:00)',
      status: 'Active / On Duty',
      certifications: ['Hardware Level II Certified'],
      maxDailyWorkload: 5,
      rating: 4.8,
      joinedDate: new Date().toISOString().slice(0, 10),
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (tech: TechnicianProfile) => {
    setEditingTech(tech);
    setTechForm({
      name: tech.name,
      role: tech.role,
      department: tech.department,
      specialization: tech.specialization,
      contactNumber: tech.contactNumber,
      email: tech.email,
      shift: tech.shift,
      status: tech.status,
      certifications: tech.certifications || [],
      maxDailyWorkload: tech.maxDailyWorkload,
      rating: tech.rating,
      joinedDate: tech.joinedDate,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteTech = (techId: string, name: string) => {
    if (confirm(`Remove technician "${name}" from the airport maintenance roster?`)) {
      const updated = technicians.filter((t) => t.id !== techId);
      setTechnicians(updated);
      saveTechnicians(updated);
      setFeedbackMsg(`Technician ${name} removed.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleSaveTechForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techForm.name.trim()) return;

    let updated: TechnicianProfile[];
    if (editingTech) {
      updated = technicians.map((t) =>
        t.id === editingTech.id ? { ...t, ...techForm } : t
      );
      setFeedbackMsg(`Technician ${techForm.name} updated successfully.`);
    } else {
      const newTech: TechnicianProfile = {
        id: `TECH-${String(technicians.length + 1).padStart(3, '0')}`,
        ...techForm,
      };
      updated = [...technicians, newTech];
      setFeedbackMsg(`New technician ${techForm.name} added to roster.`);
    }

    setTechnicians(updated);
    saveTechnicians(updated);
    setIsEditModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveMaintenanceSettings(settings);
    setFeedbackMsg('Maintenance Operational Settings saved successfully!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleExportCsv = () => {
    const headers = [
      'Technician ID',
      'Name',
      'Role',
      'Department',
      'Specialization',
      'Shift',
      'Duty Status',
      'Contact',
      'Completed Repairs',
      'Active Jobs',
      'Budget Managed (PKR)',
      'Parts Replaced',
      'Verification Score (%)',
    ];

    const rows = technicianStats.map((t) => [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.role.replace(/"/g, '""')}"`,
      `"${t.department.replace(/"/g, '""')}"`,
      `"${t.specialization.replace(/"/g, '""')}"`,
      `"${t.shift.replace(/"/g, '""')}"`,
      t.status,
      `"${t.contactNumber.replace(/"/g, '""')}"`,
      t.totalCompleted,
      t.activeJobsCount,
      t.totalCostPkr,
      t.totalPartsCount,
      Math.round(t.verifiedRatio),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PAA_Technician_Activity_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Technician Activity & Maintenance Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Duty Roster, Workload Balances, Repair Logs & Workshop Maintenance Policies
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-indigo-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Technician</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 animate-fadeIn">
          ✓ {feedbackMsg}
        </div>
      )}

      {/* Aggregate Metric KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Roster Techs</span>
            <UserCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">
            {aggregateMetrics.totalTechs}
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            🟢 {aggregateMetrics.onDutyTechs} On Duty Right Now
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Repairs Handled</span>
            <Wrench className="h-4 w-4 text-teal-500" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">
            {aggregateMetrics.totalAllJobs}
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Printers, Scanners & UPS
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Active Work Orders</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-black text-amber-600 dark:text-amber-400">
            {aggregateMetrics.totalActiveJobs}
          </div>
          <span className="text-[10px] font-bold text-amber-600">
            In Field or Workshop
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Maintenance Spend</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white truncate">
            PKR {(aggregateMetrics.totalSpend / 1000).toFixed(0)}k
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            PKR {aggregateMetrics.totalSpend.toLocaleString()} Total
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">SLA Verified</span>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-black text-blue-600 dark:text-blue-400">
            98.4%
          </div>
          <span className="text-[10px] font-bold text-emerald-600">
            ✓ Test Page Pass Rate
          </span>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeTab === 'leaderboard'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            👥 Technician Activity Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeTab === 'analytics'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            📊 Workload & Analytics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeTab === 'settings'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            ⚙️ Maintenance Operational Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeTab === 'roster'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            📋 Manage Roster ({technicians.length})
          </button>
        </div>

        {/* Filters */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search technician..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active / On Duty">Active / On Duty</option>
              <option value="In Field Repair">In Field Repair</option>
              <option value="On Call">On Call</option>
              <option value="Off Duty">Off Duty</option>
            </select>

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Shifts</option>
              <option value="Morning">Morning Shift</option>
              <option value="Evening">Evening Shift</option>
              <option value="Night">Night Shift</option>
              <option value="General">General Duty</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: LEADERBOARD & ACTIVITY BREAKDOWN */}
      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredTechs.map((tech) => {
            const workloadPct = Math.min(100, Math.round((tech.activeJobsCount / tech.maxDailyWorkload) * 100));

            return (
              <div
                key={tech.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Avatar, Name, Status, Shift */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-black text-white shadow-xs">
                        {tech.name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {tech.name}
                          </h3>
                          <span className="font-mono text-[10px] text-slate-400 font-bold">
                            {tech.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {tech.role} • <span className="text-indigo-600 dark:text-indigo-400 font-bold">{tech.department}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <select
                        value={tech.status}
                        onChange={(e) => handleUpdateStatus(tech.id, e.target.value as any)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer border ${
                          tech.status === 'Active / On Duty'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : tech.status === 'In Field Repair'
                            ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <option value="Active / On Duty">🟢 On Duty</option>
                        <option value="In Field Repair">🔧 In Field</option>
                        <option value="On Call">📞 On Call</option>
                        <option value="Off Duty">⚪ Off Duty</option>
                      </select>

                      <span className="text-[10px] font-bold text-slate-400">
                        {tech.shift}
                      </span>
                    </div>
                  </div>

                  {/* Specialization & Contact */}
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[320px]">
                        🎯 <strong>Focus:</strong> {tech.specialization}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400">
                        <Phone className="h-3 w-3 text-indigo-500" />
                        <span>{tech.contactNumber}</span>
                      </span>
                    </div>
                  </div>

                  {/* Workload Capacity Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-600 dark:text-slate-300">
                        Active Workload Capacity ({tech.activeJobsCount} / {tech.maxDailyWorkload} concurrent jobs)
                      </span>
                      <span className={workloadPct > 80 ? 'text-rose-600 font-black' : 'text-indigo-600'}>
                        {workloadPct}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          workloadPct > 80
                            ? 'bg-rose-500'
                            : workloadPct > 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(5, workloadPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Cumulative Performance Stats Grid */}
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Completed</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {tech.totalCompleted}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Active</span>
                      <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                        {tech.activeJobsCount}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Spend</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white truncate block">
                        PKR {(tech.totalCostPkr / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Parts Used</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {tech.totalPartsCount}
                      </span>
                    </div>
                  </div>

                  {/* Recent Repair Work Log */}
                  {tech.recentPrinterJobs.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Recent Repair Log Entries:
                      </span>
                      {tech.recentPrinterJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between rounded-lg bg-slate-50/90 dark:bg-slate-800/60 p-2 text-xs"
                        >
                          <div className="truncate max-w-[240px]">
                            <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mr-1.5">
                              {job.id}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {job.printerName}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {job.serviceType} • {job.date}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                              {job.status}
                            </span>
                            <span className="block text-[10px] font-mono text-slate-500">
                              PKR {job.costPkr?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Rating: <strong className="text-amber-500">★ {tech.rating.toFixed(2)}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tech)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit Profile</span>
                    </button>

                    {onOpenMaintenanceForm && (
                      <button
                        type="button"
                        onClick={() => onOpenMaintenanceForm()}
                        className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-500 transition"
                      >
                        <Wrench className="h-3 w-3" />
                        <span>Assign Repair</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: WORKLOAD & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Service Type Distribution */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span>Printer & Scanner Repair Category Distribution</span>
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Part Replacement / Overhaul', count: 18, color: 'bg-indigo-500' },
                  { name: 'Paper Jam & Roller Service', count: 14, color: 'bg-teal-500' },
                  { name: 'Fuser Assembly Repair', count: 9, color: 'bg-amber-500' },
                  { name: 'Laser Scanner Optics Service', count: 6, color: 'bg-blue-500' },
                  { name: 'Formatter / Logic Board Repair', count: 4, color: 'bg-rose-500' },
                  { name: 'General Maintenance & Cleaning', count: 22, color: 'bg-emerald-500' },
                ].map((item) => {
                  const total = 73;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                        <span className="text-slate-500">{item.count} jobs ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technician Workload Balance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span>Technician Repair Volume Share</span>
              </h3>
              <div className="space-y-3">
                {technicianStats.map((tech) => {
                  const totalAll = aggregateMetrics.totalAllJobs || 1;
                  const pct = Math.round((tech.totalCompleted / totalAll) * 100);
                  return (
                    <div key={tech.id}>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">{tech.name}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                          {tech.totalCompleted} Completed ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.max(5, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MAINTENANCE OPERATIONAL SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
                <span>Maintenance Operational Settings & Standards</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define airport maintenance intervals, financial thresholds, spare parts deduction rules, and default duty assignments.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Default Preventive Maintenance Interval (Days)
                </label>
                <select
                  value={settings.preventiveMaintenanceIntervalDays}
                  onChange={(e) =>
                    setSettings({ ...settings, preventiveMaintenanceIntervalDays: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value={30}>30 Days (Monthly High-Duty Cycle)</option>
                  <option value={60}>60 Days (Bi-Monthly Review)</option>
                  <option value={90}>90 Days (Quarterly Standard — Recommended)</option>
                  <option value={180}>180 Days (Semi-Annual Overhaul)</option>
                  <option value={365}>365 Days (Annual Overhaul)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Triggers automated preventive maintenance alerts in calendar view.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Supervisor Financial Approval Threshold (PKR)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={settings.approvalCostThresholdPkr}
                  onChange={(e) =>
                    setSettings({ ...settings, approvalCostThresholdPkr: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Repairs exceeding this amount require supervisor countersignature.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Default Assigned Duty Lead Technician
                </label>
                <select
                  value={settings.defaultAssignedTechnician}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultAssignedTechnician: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  {technicians.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Preselected in new maintenance and repair tickets.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Warranty Expiry Reminder Horizon (Days)
                </label>
                <input
                  type="number"
                  value={settings.warrantyReminderDays}
                  onChange={(e) =>
                    setSettings({ ...settings, warrantyReminderDays: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Central Hardware Workshop Location
                </label>
                <input
                  type="text"
                  value={settings.workshopLocation}
                  onChange={(e) => setSettings({ ...settings, workshopLocation: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400">
                Automated Quality & Inventory Controls
              </h4>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Automatic Spare Parts Inventory Stock Deduction
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Instantly decrements pickup rollers, fusers, and logic boards from warehouse stock upon saving repair form.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoDeductPartsStock}
                  onChange={(e) => setSettings({ ...settings, autoDeductPartsStock: e.target.checked })}
                  className="h-4 w-4 rounded-md accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Mandatory Quality Test Print Verification
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Requires duty technician to print and examine a sample diagnostic test page before closing maintenance ticket.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireTestPrintVerification}
                  onChange={(e) => setSettings({ ...settings, requireTestPrintVerification: e.target.checked })}
                  className="h-4 w-4 rounded-md accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Automated High-Cost Alert to Directorate
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dispatches alert to Audit & Procurement log when repair costs exceed the threshold.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoNotifySupervisorOnHighCost}
                  onChange={(e) => setSettings({ ...settings, autoNotifySupervisorOnHighCost: e.target.checked })}
                  className="h-4 w-4 rounded-md accent-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition"
              >
                Save Maintenance Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: ROSTER MANAGEMENT TABLE */}
      {activeTab === 'roster' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Airport Hardware Engineering Roster Directory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official list of registered technicians eligible for repair assignments
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Tech</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Technician ID</th>
                  <th className="py-3 px-4">Name & Role</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {technicians.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {t.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">{t.name}</span>
                      <span className="text-[10px] text-slate-500">{t.role}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {t.specialization}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {t.shift}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                          t.status === 'Active / On Duty'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : t.status === 'In Field Repair'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {t.contactNumber}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(t)}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTech(t.id, t.name)}
                        className="text-rose-600 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Technician Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 text-sm dark:text-white">
                {editingTech ? `Edit Profile: ${editingTech.name}` : 'Add Technician to Roster'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTechForm} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name & Credentials
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engr. Arshad Khan (Hardware Spec)"
                  value={techForm.name}
                  onChange={(e) => setTechForm({ ...techForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    required
                    value={techForm.role}
                    onChange={(e) => setTechForm({ ...techForm, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={techForm.department}
                    onChange={(e) => setTechForm({ ...techForm, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Technical Specialization
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fusers, Pickup Rollers, Laser Optics & Scanners"
                  value={techForm.specialization}
                  onChange={(e) => setTechForm({ ...techForm, specialization: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Shift
                  </label>
                  <select
                    value={techForm.shift}
                    onChange={(e) => setTechForm({ ...techForm, shift: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                    <option value="Evening (16:00 - 00:00)">Evening (16:00 - 00:00)</option>
                    <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
                    <option value="General Duty">General Duty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duty Status
                  </label>
                  <select
                    value={techForm.status}
                    onChange={(e) => setTechForm({ ...techForm, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="Active / On Duty">Active / On Duty</option>
                    <option value="In Field Repair">In Field Repair</option>
                    <option value="On Call">On Call</option>
                    <option value="Off Duty">Off Duty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / Extension
                  </label>
                  <input
                    type="text"
                    required
                    value={techForm.contactNumber}
                    onChange={(e) => setTechForm({ ...techForm, contactNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Concurrent Repairs
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={techForm.maxDailyWorkload}
                    onChange={(e) => setTechForm({ ...techForm, maxDailyWorkload: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  {editingTech ? 'Save Changes' : 'Add to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
