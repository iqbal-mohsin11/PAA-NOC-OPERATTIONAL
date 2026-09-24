import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AssetList } from './components/AssetList';
import { AssetFormModal } from './components/AssetFormModal';
import { AssetDetailModal } from './components/AssetDetailModal';
import { PrintersScannersView } from './components/PrintersScannersView';
import { NetworkInfrastructureView } from './components/NetworkInfrastructureView';
import { UPSView } from './components/UPSView';
import { IssueManagementView } from './components/IssueManagementView';
import { MaintenanceView } from './components/MaintenanceView';
import { RemovedItemsView, SoftRemoveModal } from './components/RemovedItemsView';
import { ReportsView } from './components/ReportsView';
import { ADSyncView } from './components/ADSyncView';
import { NotificationCenter } from './components/NotificationCenter';
import { AirportMapOverlay } from './components/AirportMapOverlay';
import { BarcodeModal } from './components/BarcodeModal';
import { BarcodeLabelsView } from './components/BarcodeLabelsView';
import { ExcelImportModal } from './components/ExcelImportModal';
import { SettingsModal } from './components/SettingsModal';
import { UserAccountsManagement } from './components/UserAccountsManagement';
import { LoginHistorySection } from './components/LoginHistorySection';
import { LDAPConfigurationForm } from './components/LDAPConfigurationForm';
import { GatePassModal } from './components/GatePassModal';
import { TonerIssueModal } from './components/TonerIssueModal';
import { MobileDrawer } from './components/MobileDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileConnectModal } from './components/MobileConnectModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OfflineManagerModal } from './components/OfflineManagerModal';
import { CrashRecoveryBanner } from './components/CrashRecoveryBanner';
import { Settings, ShieldCheck, Plus } from 'lucide-react';
import { AssetItem } from './types/inventory';

const AppContent: React.FC = () => {
  const { assets, isOnline, refreshDbData } = useInventory();

  // Navigation View Tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Mobile navigation and connect states
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showMobileConnectModal, setShowMobileConnectModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineModalTab, setOfflineModalTab] = useState<'sync' | 'backups'>('sync');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<AssetItem | null>(null);
  const [barcodeModalAsset, setBarcodeModalAsset] = useState<AssetItem | null>(null);
  const [softRemoveTarget, setSoftRemoveTarget] = useState<AssetItem | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [gatePassAsset, setGatePassAsset] = useState<AssetItem | null>(null);
  const [ticketTargetAsset, setTicketTargetAsset] = useState<AssetItem | null>(null);

  const [showTonerModal, setShowTonerModal] = useState(false);
  const [tonerModalAsset, setTonerModalAsset] = useState<AssetItem | null>(null);
  const [tonerModalMode, setTonerModalMode] = useState<'new' | 'refill'>('new');

  const handleSelectAsset = (asset: AssetItem) => {
    setSelectedAssetDetail(asset);
  };

  const handleOpenIssueForAsset = (asset: AssetItem) => {
    setTicketTargetAsset(asset);
    setActiveTab('issues');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      {/* Top Application Header Bar */}
      <Header
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenImportExcel={() => setShowExcelImportModal(true)}
        onSelectAsset={handleSelectAsset}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        onOpenMobileConnect={() => setShowMobileConnectModal(true)}
      />

      {/* Emergency Crash Recovery Banner (Shown if unexpected crash/power loss occurred while working offline) */}
      <CrashRecoveryBanner
        onOpenBackupManager={() => {
          setOfflineModalTab('backups');
          setShowOfflineModal(true);
        }}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar (Desktop) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddModal={() => {
            setEditingAsset(null);
            setShowAddModal(true);
          }}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* Mobile Slide-Over Navigation Drawer */}
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileDrawerOpen(false);
          }}
          onOpenAddModal={() => {
            setEditingAsset(null);
            setShowAddModal(true);
          }}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenMobileConnect={() => setShowMobileConnectModal(true)}
          onOpenBarcodeModal={() => setShowBarcodeModal(true)}
        />

        {/* Main Content View Container with mobile bottom padding */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === 'dashboard' && (
              <Dashboard
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenAddModal={() => {
                  setEditingAsset(null);
                  setShowAddModal(true);
                }}
                onOpenImportModal={() => setShowExcelImportModal(true)}
                onSelectAsset={handleSelectAsset}
              />
            )}

            {activeTab === 'airport_map' && (
              <div className="space-y-4">
                <AirportMapOverlay
                  onSelectAsset={handleSelectAsset}
                  isOverlayDefaultOpen={false}
                />
              </div>
            )}

            {activeTab === 'noc_alerts' && (
              <NotificationCenter
                onSelectAsset={handleSelectAsset}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {(activeTab === 'assets' || activeTab === 'inventory') && (
              <AssetList
                onSelectAsset={handleSelectAsset}
                onEditAsset={(asset) => {
                  setEditingAsset(asset);
                  setShowAddModal(true);
                }}
                onSoftRemove={(asset) => setSoftRemoveTarget(asset)}
                onOpenAddModal={() => {
                  setEditingAsset(null);
                  setShowAddModal(true);
                }}
                onOpenImportModal={() => setShowExcelImportModal(true)}
                onOpenLabelModal={(asset) => {
                  setBarcodeModalAsset(asset || null);
                  setShowBarcodeModal(true);
                }}
                onOpenIssueModal={handleOpenIssueForAsset}
              />
            )}

            {activeTab === 'printers' && (
              <PrintersScannersView
                onSelectAsset={handleSelectAsset}
                onOpenIssueModal={handleOpenIssueForAsset}
                onOpenAddModal={() => {
                  setEditingAsset(null);
                  setShowAddModal(true);
                }}
                onOpenEditModal={(asset) => {
                  setEditingAsset(asset);
                  setShowAddModal(true);
                }}
              />
            )}

            {activeTab === 'network' && (
              <NetworkInfrastructureView
                onSelectAsset={handleSelectAsset}
                onOpenAddModal={() => {
                  setEditingAsset(null);
                  setShowAddModal(true);
                }}
              />
            )}

            {activeTab === 'ups' && (
              <UPSView
                onSelectAsset={handleSelectAsset}
                onOpenGatePass={(asset) => {
                  setGatePassAsset(asset);
                  setShowGatePassModal(true);
                }}
              />
            )}

            {activeTab === 'issues' && <IssueManagementView initialAssetForTicket={ticketTargetAsset} />}

            {activeTab === 'maintenance' && (
              <MaintenanceView
                onOpenGatePass={(asset) => {
                  setGatePassAsset(asset || null);
                  setShowGatePassModal(true);
                }}
                onSelectAsset={handleSelectAsset}
              />
            )}

            {activeTab === 'gatepass' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-indigo-500" />
                      Equipment Market Repair Gate Pass System
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Manage official returnable & non-returnable market repair gate passes for hardware dispatches out of airport premises.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setGatePassAsset(null);
                      setShowGatePassModal(true);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Make Market Repair Gate Pass</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'removed' && <RemovedItemsView onSelectAsset={handleSelectAsset} />}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'labels' && <BarcodeLabelsView onSelectAsset={handleSelectAsset} />}

            {activeTab === 'adsync' && <ADSyncView />}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings className="h-5 w-5 text-emerald-500" />
                        PAA System Settings & Role Security Management
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Configure Airport Identity, LDAPS Domain Integration, Role Access Security Passwords, Directories, and Database Backups.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition shrink-0"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Open Configuration Modal</span>
                    </button>
                  </div>
                </div>

                {/* Active Directory LDAP Configuration Form */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <LDAPConfigurationForm onNavigateTab={(tab) => setActiveTab(tab)} />
                </div>

                {/* User Accounts Management & Add User / Admin */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <UserAccountsManagement />
                </div>

                {/* Login Attempt History Audit Section in Settings Tab */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <LoginHistorySection />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Multi-step Asset Modal */}
      {showAddModal && (
        <AssetFormModal
          assetToEdit={editingAsset}
          onClose={() => {
            setShowAddModal(false);
            setEditingAsset(null);
          }}
        />
      )}

      {/* Asset Full Inspection Modal */}
      {selectedAssetDetail && (
        <AssetDetailModal
          asset={selectedAssetDetail}
          onClose={() => setSelectedAssetDetail(null)}
          onEdit={(asset) => {
            setSelectedAssetDetail(null);
            setEditingAsset(asset);
            setShowAddModal(true);
          }}
          onSoftRemove={(asset) => {
            setSelectedAssetDetail(null);
            setSoftRemoveTarget(asset);
          }}
          onOpenLabelModal={(asset) => {
            setBarcodeModalAsset(asset || selectedAssetDetail);
            setShowBarcodeModal(true);
          }}
          onOpenIssueModal={(asset) => {
            setSelectedAssetDetail(null);
            handleOpenIssueForAsset(asset);
          }}
          onOpenGatePass={(asset) => {
            setSelectedAssetDetail(null);
            setGatePassAsset(asset);
            setShowGatePassModal(true);
          }}
          onOpenTonerIssue={(asset, mode) => {
            setSelectedAssetDetail(null);
            setTonerModalAsset(asset);
            setTonerModalMode(mode || 'new');
            setShowTonerModal(true);
          }}
        />
      )}

      {/* Toner Cartridge Refill & Issue Modal */}
      {showTonerModal && (
        <TonerIssueModal
          isOpen={true}
          onClose={() => {
            setShowTonerModal(false);
            setTonerModalAsset(null);
          }}
          preselectedAsset={tonerModalAsset}
          initialMode={tonerModalMode}
        />
      )}

      {/* Soft Remove Confirmation Modal */}
      {softRemoveTarget && (
        <SoftRemoveModal asset={softRemoveTarget} onClose={() => setSoftRemoveTarget(null)} />
      )}

      {/* QR & Barcode Asset Tag Modal */}
      {showBarcodeModal && (
        <BarcodeModal
          initialAsset={barcodeModalAsset || selectedAssetDetail}
          onClose={() => {
            setShowBarcodeModal(false);
            setBarcodeModalAsset(null);
          }}
        />
      )}

      {/* Excel Batch Import Modal */}
      {showExcelImportModal && <ExcelImportModal onClose={() => setShowExcelImportModal(false)} />}

      {/* System Settings & Backup Modal */}
      {(showSettingsModal || activeTab === 'settings') && (
        <SettingsModal
          onNavigateTab={(tab) => {
            setShowSettingsModal(false);
            setActiveTab(tab);
          }}
          onClose={() => {
            setShowSettingsModal(false);
            if (activeTab === 'settings') {
              setActiveTab('dashboard');
            }
          }}
        />
      )}

      {/* Market Repair Gate Pass Modal */}
      {(showGatePassModal || activeTab === 'gatepass') && (
        <GatePassModal
          isOpen={true}
          preselectedAsset={gatePassAsset}
          onClose={() => {
            setShowGatePassModal(false);
            setGatePassAsset(null);
            if (activeTab === 'gatepass') {
              setActiveTab('maintenance');
            }
          }}
        />
      )}

      {/* Mobile Bottom Thumb Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onToggleDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      {/* Mobile Connect & QR Modal */}
      <MobileConnectModal
        isOpen={showMobileConnectModal}
        onClose={() => setShowMobileConnectModal(false)}
      />

      {/* Offline Status Floating Toast & Auto-Sync Notification */}
      <OfflineIndicator
        onOpenOfflineManager={() => setShowOfflineModal(true)}
        onRefreshDb={refreshDbData}
      />

      {/* Offline Working & Data Sync Manager Modal */}
      <OfflineManagerModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        isOnline={isOnline}
        initialTab={offlineModalTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
