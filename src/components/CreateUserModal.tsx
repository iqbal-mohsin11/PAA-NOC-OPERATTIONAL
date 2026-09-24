import React, { useState, useMemo } from 'react';
import {
  X,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Mail,
  Building2,
  Briefcase,
  Phone,
  Terminal,
  Sparkles,
  Lock,
  User,
  Check,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { UserAccount, UserRole } from '../types/inventory';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: (user: UserAccount) => void;
  initialRole?: UserRole;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
  initialRole = 'Technician',
}) => {
  const {
    userAccounts,
    addUserAccount,
    allDepartments,
    login,
    currentUser,
    userRole: activeRole,
  } = useInventory();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Hardware & Network Support');
  const [customDepartment, setCustomDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [terminal, setTerminal] = useState('PAA Workshop Terminal 01');
  const [switchNow, setSwitchNow] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-generate email when username changes if not manually modified
  const handleUsernameChange = (val: string) => {
    const cleanUsername = val.replace(/\s+/g, '_');
    setUsername(cleanUsername);
    if (!email || email.endsWith('@paa.gov.pk')) {
      setEmail(cleanUsername ? `${cleanUsername.toLowerCase()}@paa.gov.pk` : '');
    }
  };

  // Check username duplicate in real-time
  const isUsernameTaken = useMemo(() => {
    if (!username.trim()) return false;
    return userAccounts.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
  }, [username, userAccounts]);

  const passwordsMatch = password === confirmPassword;

  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setPassword(pin);
    setConfirmPassword(pin);
  };

  const setDefaultPassword = () => {
    setPassword('123');
    setConfirmPassword('123');
  };

  const resetForm = () => {
    setUsername('');
    setDisplayName('');
    setRole(initialRole);
    setPassword('');
    setConfirmPassword('');
    setDepartment('Hardware & Network Support');
    setCustomDepartment('');
    setDesignation('');
    setEmail('');
    setPhone('');
    setSwitchNow(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage('Username is required.');
      return;
    }

    if (isUsernameTaken) {
      setErrorMessage(`Username "${trimmedUsername}" is already in use by another account.`);
      return;
    }

    if (!password) {
      setErrorMessage('Security password is required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    const finalDepartment = department === 'custom' ? customDepartment.trim() || 'IT Directorate' : department;
    const finalDisplayName = displayName.trim() || trimmedUsername;
    const finalEmail = email.trim() || `${trimmedUsername.toLowerCase()}@paa.gov.pk`;

    const result = addUserAccount({
      username: trimmedUsername,
      displayName: finalDisplayName,
      role,
      password: password.trim(),
      department: finalDepartment,
      designation: designation.trim() || (role === 'Administrator' ? 'System Administrator' : role === 'Technician' ? 'IT Support Technician' : 'Audit Officer'),
      email: finalEmail,
      phone: phone.trim(),
    });

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    setSuccessMessage(result.message);

    if (switchNow) {
      setTimeout(() => {
        login(trimmedUsername, password.trim());
      }, 300);
    }

    if (onUserCreated) {
      const createdUser: UserAccount = {
        id: `USR-${Date.now()}`,
        username: trimmedUsername,
        displayName: finalDisplayName,
        role,
        password: password.trim(),
        department: finalDepartment,
        designation: designation.trim(),
        email: finalEmail,
        phone: phone.trim(),
      };
      onUserCreated(createdUser);
    }

    setTimeout(() => {
      handleClose();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div
      id="create-user-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Create New User / Administrator
                </h3>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                  PAA Security
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provision new airport IT credentials with role-based operational permissions
              </p>
            </div>
          </div>
          <button
            id="close-create-user-modal-btn"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Select Role */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Account Role & Access Level <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Administrator */}
              <button
                type="button"
                id="select-role-admin"
                onClick={() => setRole('Administrator')}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition ${
                  role === 'Administrator'
                    ? 'border-rose-500 bg-rose-50/70 dark:border-rose-500 dark:bg-rose-950/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-300">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                    <span>Administrator</span>
                  </div>
                  {role === 'Administrator' && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white text-[10px]">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                  Write & View (Admin)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Full control: system settings, passwords, create users, database backup & restore.
                </span>
              </button>

              {/* Technician */}
              <button
                type="button"
                id="select-role-tech"
                onClick={() => setRole('Technician')}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition ${
                  role === 'Technician'
                    ? 'border-amber-500 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 dark:text-amber-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                    <span>Technician</span>
                  </div>
                  {role === 'Technician' && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px]">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                  Write & View Data
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Operational duties: add/edit assets, issue tickets, repair gate passes, maintenance.
                </span>
              </button>

              {/* Viewer */}
              <button
                type="button"
                id="select-role-viewer"
                onClick={() => setRole('Viewer')}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition ${
                  role === 'Viewer'
                    ? 'border-sky-500 bg-sky-50/70 dark:border-sky-500 dark:bg-sky-950/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-sky-700 dark:text-sky-300">
                    <Eye className="h-3.5 w-3.5 text-sky-500" />
                    <span>Viewer</span>
                  </div>
                  {role === 'Viewer' && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-white text-[10px]">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                  Read-Only Access
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Auditor scope: browse inventory, search tags, view reports, zero write permissions.
                </span>
              </button>
            </div>
          </div>

          {/* Step 2: Account Identity Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30 space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-500" />
              Account Identification & Credentials
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Username */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Username / Login Handle <span className="text-rose-500">*</span>
                  </label>
                  {isUsernameTaken && (
                    <span className="text-[10px] font-bold text-rose-600">Already taken</span>
                  )}
                  {username && !isUsernameTaken && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                      <Check className="h-2.5 w-2.5" /> Available
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    @
                  </span>
                  <input
                    id="new-user-username-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="e.g. tariq_paa"
                    className={`w-full rounded-xl border bg-white pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-white ${
                      isUsernameTaken
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-200 focus:border-emerald-500 dark:border-slate-700'
                    }`}
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Used for account sign-in authentication
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Display Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="new-user-displayname-input"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Engr. Muhammad Tariq"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Shown in gate passes, audit logs & inventory signatures
                </p>
              </div>
            </div>

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Security Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={setDefaultPassword}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      Use "123"
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-0.5"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      PIN
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    id="new-user-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security password"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-3 pr-9 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  {confirmPassword && (
                    <span
                      className={`text-[10px] font-bold ${
                        passwordsMatch ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {passwordsMatch ? 'Passwords match' : 'Mismatch'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="new-user-confirmpassword-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm security password"
                    className={`w-full rounded-xl border bg-white pl-3 pr-9 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-white ${
                      confirmPassword && !passwordsMatch
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-200 focus:border-emerald-500 dark:border-slate-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Organization & Station Context */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30 space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              Department & Workstation Context
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Department */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Directorate
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {allDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="custom">+ Other / Custom Department...</option>
                </select>

                {department === 'custom' && (
                  <input
                    type="text"
                    required
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    placeholder="Enter department name"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                )}
              </div>

              {/* Designation */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Designation / Post
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder={role === 'Administrator' ? 'e.g. Senior System Engineer' : 'e.g. Hardware Technician'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@paa.gov.pk"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Workstation / Terminal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Workstation / Terminal
                </label>
                <div className="relative">
                  <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={terminal}
                    onChange={(e) => setTerminal(e.target.value)}
                    placeholder="PAA Workshop Terminal 01"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Option: Switch now */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
            <input
              id="switch-now-checkbox"
              type="checkbox"
              checked={switchNow}
              onChange={(e) => setSwitchNow(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <label htmlFor="switch-now-checkbox" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Log in as this new user immediately upon creation
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              id="submit-create-user-btn"
              type="submit"
              disabled={isUsernameTaken || !username.trim() || !password || password !== confirmPassword}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create User & Authorize</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
