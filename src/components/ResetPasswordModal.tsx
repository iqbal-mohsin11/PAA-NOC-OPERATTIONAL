import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Mail,
  ShieldAlert,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Send,
  ExternalLink,
  AlertTriangle,
  X,
  Lock,
  Unlock,
  CheckCircle2,
  LogIn,
  UserCheck,
  Timer,
  Info,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { UserAccount } from '../types/inventory';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserAccount | null;
  onSuccessNotification?: (msg: string) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccessNotification,
}) => {
  const {
    triggerPasswordResetEmail,
    generateTemporaryBypassCode,
    revokeTemporaryBypassCode,
    resetUserPasswordWithToken,
    login,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'email' | 'bypass'>('bypass');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Direct manual reset fields (inside email/token tab)
  const [showDirectReset, setShowDirectReset] = useState(false);
  const [newDirectPassword, setNewDirectPassword] = useState('');
  const [confirmDirectPassword, setConfirmDirectPassword] = useState('');

  // Email simulation state
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentData, setEmailSentData] = useState<{
    token: string;
    email: string;
    sentAt: string;
  } | null>(null);

  useEffect(() => {
    if (targetUser) {
      if (targetUser.lastPasswordResetToken) {
        setEmailSentData({
          token: targetUser.lastPasswordResetToken,
          email: targetUser.email || `${targetUser.username.toLowerCase()}@paa.gov.pk`,
          sentAt: targetUser.lastPasswordResetEmailSentAt || new Date().toISOString(),
        });
      } else {
        setEmailSentData(null);
      }
      setShowDirectReset(false);
      setNewDirectPassword('');
      setConfirmDirectPassword('');
      setFeedback(null);
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const targetEmail = targetUser.email || `${targetUser.username.toLowerCase()}@paa.gov.pk`;
  const isBypassActive = Boolean(
    targetUser.temporaryBypassCode &&
      (!targetUser.temporaryBypassCodeExpiresAt ||
        new Date(targetUser.temporaryBypassCodeExpiresAt).getTime() > Date.now())
  );

  const formatExpiryTime = (isoString?: string) => {
    if (!isoString) return 'No expiry';
    const expiryDate = new Date(isoString);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min remaining`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m remaining (${expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendResetEmail = () => {
    setEmailSending(true);
    setTimeout(() => {
      const res = triggerPasswordResetEmail(targetUser.id);
      setEmailSending(false);
      if (res.success) {
        setEmailSentData({
          token: res.resetToken,
          email: res.email,
          sentAt: new Date().toISOString(),
        });
        setFeedback({ text: `Reset instructions email triggered to ${res.email}`, type: 'success' });
        if (onSuccessNotification) onSuccessNotification(`Reset email sent to ${res.email}`);
      } else {
        setFeedback({ text: res.message, type: 'error' });
      }
    }, 600);
  };

  const handleGenerateBypassCode = () => {
    const res = generateTemporaryBypassCode(targetUser.id, durationMinutes);
    if (res.success) {
      setFeedback({ text: `Bypass code ${res.code} created for ${targetUser.displayName}`, type: 'success' });
      if (onSuccessNotification) onSuccessNotification(`Bypass code ${res.code} generated for ${targetUser.username}`);
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  const handleRevokeBypassCode = () => {
    const res = revokeTemporaryBypassCode(targetUser.id);
    if (res.success) {
      setFeedback({ text: res.message, type: 'success' });
      if (onSuccessNotification) onSuccessNotification(`Bypass code for ${targetUser.username} revoked`);
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  const handleApplyDirectPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirectPassword.trim()) {
      setFeedback({ text: 'Please enter a valid password.', type: 'error' });
      return;
    }
    if (newDirectPassword !== confirmDirectPassword) {
      setFeedback({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    const res = resetUserPasswordWithToken(
      targetUser.id,
      emailSentData?.token || 'ADMIN_OVERRIDE',
      newDirectPassword.trim()
    );

    if (res.success) {
      setFeedback({ text: `Password for @${targetUser.username} updated successfully!`, type: 'success' });
      if (onSuccessNotification) onSuccessNotification(`Password reset for ${targetUser.username}`);
      setShowDirectReset(false);
      setNewDirectPassword('');
      setConfirmDirectPassword('');
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  const handleLoginWithBypass = () => {
    if (!targetUser.temporaryBypassCode) return;
    const res = login(targetUser.username, targetUser.temporaryBypassCode);
    if (res.success) {
      if (onSuccessNotification) onSuccessNotification(`Logged in as ${targetUser.displayName} using bypass code`);
      onClose();
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  const resetLink = `https://paa.sentinel.aero/auth/reset?user=${targetUser.username}&token=${emailSentData?.token || 'RST-SAMPLE'}`;
  const mailtoSubject = encodeURIComponent(`[PAA Sentinel NOC] Password Reset Notification for ${targetUser.displayName}`);
  const mailtoBody = encodeURIComponent(
    `Dear ${targetUser.displayName},\n\nAn administrator has authorized a password reset for your account (${targetUser.username}).\n\nReset Link: ${resetLink}\nToken: ${emailSentData?.token || ''}\n\nThis authorization expires in 24 hours.\n\nRegards,\nPAA IT Operations & Sentinel NOC Security`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-md">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Security Credential & Password Reset
                </h3>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {targetUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target: <strong className="text-slate-700 dark:text-slate-200">{targetUser.displayName}</strong> (@{targetUser.username}) • {targetEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 flex items-center justify-between gap-2 rounded-xl p-3 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Tabs: Temporary Bypass Code vs Password Reset Email */}
        <div className="px-6 pt-4">
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('bypass')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                activeTab === 'bypass'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Unlock className="h-4 w-4 text-amber-500" />
              <span>Temporary Bypass Code</span>
              {isBypassActive && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                activeTab === 'email'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Mail className="h-4 w-4 text-indigo-500" />
              <span>Password Reset Email</span>
              {emailSentData && (
                <span className="rounded-md bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Sent
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Temporary Bypass Code */}
        {activeTab === 'bypass' && (
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Emergency Operational Bypass:</span> Generates a time-limited 6-digit access code for technician <strong className="font-mono">@{targetUser.username}</strong>. The technician can enter this code in the password field to gain immediate operational access without knowing their permanent password.
              </div>
            </div>

            {/* Active Code Status Card */}
            {isBypassActive && targetUser.temporaryBypassCode ? (
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/30 p-5 dark:border-emerald-500/30 dark:bg-emerald-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Active Bypass Code Authorized
                    </span>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <Timer className="h-3 w-3" />
                    {formatExpiryTime(targetUser.temporaryBypassCodeExpiresAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-emerald-200 shadow-inner dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Temporary OTP Code</div>
                      <div className="font-mono text-2xl font-black tracking-widest text-slate-900 dark:text-white">
                        {targetUser.temporaryBypassCode}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(targetUser.temporaryBypassCode!, 'active-bypass')}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm transition"
                    >
                      {copiedKey === 'active-bypass' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedKey === 'active-bypass' ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleLoginWithBypass}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition shadow-sm"
                  >
                    <LogIn className="h-4 w-4 text-emerald-400" />
                    <span>Test & Log In As @{targetUser.username} Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRevokeBypassCode}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300 transition"
                  >
                    Revoke Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/30">
                <Clock className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No active temporary bypass code. Generate one below for technician shift override.
                </p>
              </div>
            )}

            {/* Duration Selector & Generate Action */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Authorized Bypass Code Validity Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '15 Minutes', minutes: 15 },
                  { label: '1 Hour (Shift)', minutes: 60 },
                  { label: '4 Hours', minutes: 240 },
                  { label: '24 Hours', minutes: 1440 },
                ].map((item) => (
                  <button
                    key={item.minutes}
                    type="button"
                    onClick={() => setDurationMinutes(item.minutes)}
                    className={`rounded-xl border py-2 px-1 text-center text-xs font-bold transition ${
                      durationMinutes === item.minutes
                        ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerateBypassCode}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-2.5 text-xs font-bold text-white shadow-md hover:from-amber-500 hover:to-amber-400 transition"
              >
                <Unlock className="h-4 w-4" />
                <span>
                  {isBypassActive ? 'Regenerate / Extend Bypass Code' : 'Generate New Emergency Bypass Code'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Password Reset Email */}
        {activeTab === 'email' && (
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200 flex items-start gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
              <div>
                <span className="font-bold">Automated Email Notification:</span> Dispatches an official PAA IT Services password reset link to the technician's registered address at <strong className="font-mono text-indigo-950 dark:text-indigo-100">{targetEmail}</strong>. The link contains a one-time cryptographic token valid for 24 hours.
              </div>
            </div>

            {/* Email Action & Status */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Recipient Address
                  </div>
                  <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {targetEmail}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={emailSending}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition shadow-sm"
                >
                  {emailSending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{emailSending ? 'Dispatching...' : 'Send Password Reset Email'}</span>
                </button>
              </div>

              {emailSentData && (
                <div className="rounded-xl border border-indigo-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Reset Token Dispatched
                    </span>
                    <span>Sent: {new Date(emailSentData.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 font-mono text-[11px] text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                    <span className="truncate max-w-[280px]">{resetLink}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(resetLink, 'reset-link')}
                      className="ml-2 flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-sans font-bold text-[10px]"
                    >
                      {copiedKey === 'reset-link' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedKey === 'reset-link' ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <a
                      href={`mailto:${targetEmail}?subject=${mailtoSubject}&body=${mailtoBody}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open in Mail Client</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Admin Password Override Accordion */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setShowDirectReset(!showDirectReset)}
                className="flex w-full items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-rose-500" />
                  <span>Immediate Admin Password Override (Field Phone/Radio)</span>
                </span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                  {showDirectReset ? 'Hide' : 'Set New Password Directly'}
                </span>
              </button>

              {showDirectReset && (
                <form onSubmit={handleApplyDirectPasswordReset} className="mt-3 space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newDirectPassword}
                        onChange={(e) => setNewDirectPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmDirectPassword}
                        onChange={(e) => setConfirmDirectPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-sm"
                    >
                      Apply Password Immediately
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/50">
          <span className="text-[11px] text-slate-400">
            PAA Sentinel Security Audit: All reset actions logged to system audit trail.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
