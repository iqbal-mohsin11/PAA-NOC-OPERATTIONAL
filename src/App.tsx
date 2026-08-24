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
import { IssueManagementView } from './components/IssueManagementView';
import { MaintenanceView } from './components/MaintenanceView';
import { RemovedItemsView, SoftRemoveModal } from './components/RemovedItemsView';
import { ReportsView } from './components/ReportsView';
import { ADSyncView } from './components/ADSyncView';
import { NotificationCenter } from './components/NotificationCenter';
import { BarcodeModal } from './components/BarcodeModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { SettingsModal } from './components/SettingsModal';
import { GatePassModal } from './components/GatePassModal';
import { TonerIssueModal } from './components/TonerIssueModal';
import { Settings, ShieldCheck, Plus } from 'lucide-react';
import { AssetItem } from './types/inventory';

const AppContent: React.FC = () => {
  const { assets } = useInventory();

  // Navigation View Tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<AssetItem | null>(null);
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
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddModal={() => {
            setEditingAsset(null);
            setShowAddModal(true);
          }}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* Main Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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

            {activeTab === 'issues' && <IssueManagementView initialAssetForTicket={ticketTargetAsset} />}

            {activeTab === 'maintenance' && (
              <MaintenanceView
                onOpenGatePass={(asset) => {
                  setGatePassAsset(asset || null);
                  setShowGatePassModal(true);
                }}
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

            {activeTab === 'adsync' && <ADSyncView />}

            {activeTab === 'settings' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
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
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Open Settings Configuration</span>
                  </button>
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
        <BarcodeModal initialAsset={selectedAssetDetail} onClose={() => setShowBarcodeModal(false)} />
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
