import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  Layers,
  Search,
  Building,
  Server,
  HardDrive,
  Printer,
  Zap,
  Radio,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  X,
  BatteryCharging,
  Network,
  Laptop,
  Database,
  Plane,
  Shield,
  Activity,
  SlidersHorizontal,
  RefreshCw,
  Barcode,
  Tag,
  Check,
  Sparkles,
  CornerDownLeft,
  Plus,
  Minus,
} from 'lucide-react';
import { AssetItem, DeviceCategory } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';

export interface AirportMapOverlayProps {
  onSelectAsset: (asset: AssetItem) => void;
  isOverlayDefaultOpen?: boolean;
}

export type EquipmentClusterType =
  | 'all'
  | 'workstations'
  | 'network'
  | 'printers'
  | 'ups'
  | 'servers'
  | 'radar';

export type SearchScopeField = 'all' | 'name' | 'serial' | 'cluster';

export interface AirportZoneDef {
  id: string;
  name: string;
  shortCode: string;
  category: 'terminal' | 'airside' | 'critical' | 'landside' | 'hangar';
  description: string;
  accentColor: string;
  bgFill: string;
  borderStroke: string;
  svgPos: {
    x: number;
    y: number;
    width: number;
    height: number;
    labelX: number;
    labelY: number;
  };
  matchesAsset: (asset: AssetItem) => boolean;
}

// 8 Primary Operational Airport Zones
export const AIRPORT_ZONES: AirportZoneDef[] = [
  {
    id: 'ptb',
    name: 'Passenger Terminal Building (PTB)',
    shortCode: 'PTB-01',
    category: 'terminal',
    description: 'Check-in Concourses A/B, Departure Lounges, Boarding Gates 1-12 & Arrival Halls',
    accentColor: '#3B82F6', // Blue
    bgFill: 'rgba(59, 130, 246, 0.12)',
    borderStroke: '#3B82F6',
    svgPos: { x: 260, y: 190, width: 380, height: 160, labelX: 450, labelY: 215 },
    matchesAsset: (asset) => {
      const bldg = (asset.location?.building || '').toLowerCase();
      const room = (asset.location?.room || '').toLowerCase();
      const dept = asset.department || '';
      return (
        bldg.includes('terminal') ||
        room.includes('concourse') ||
        room.includes('gate') ||
        room.includes('departure') ||
        room.includes('arrival') ||
        ['Flight Inquiry', 'Commercial', 'Estate', 'APM', 'DYAPM', 'Security'].includes(dept)
      );
    },
  },
  {
    id: 'atc',
    name: 'ATC Tower & Primary Radar Complex',
    shortCode: 'ATC-RDR',
    category: 'critical',
    description: 'Air Traffic Control Cab, Radar Ops Room, Approach Control & NavAid Consoles',
    accentColor: '#10B981', // Emerald
    bgFill: 'rgba(16, 185, 129, 0.14)',
    borderStroke: '#10B981',
    svgPos: { x: 670, y: 130, width: 180, height: 130, labelX: 760, labelY: 155 },
    matchesAsset: (asset) => {
      const bldg = (asset.location?.building || '').toLowerCase();
      const room = (asset.location?.room || '').toLowerCase();
      const dept = asset.department || '';
      return (
        bldg.includes('atc') ||
        bldg.includes('control tower') ||
        bldg.includes('radar') ||
        room.includes('radar') ||
        ['Radar', 'NavAid'].includes(dept)
      );
    },
  },
  {
    id: 'datacenter',
    name: 'Main Tier-3 Data Center & Central NOC',
    shortCode: 'PAA-DC1',
    category: 'critical',
    description: 'Core Switch Infrastructure, High-Density Blade Racks, SAN Storage & Central UPS Banks',
    accentColor: '#8B5CF6', // Purple
    bgFill: 'rgba(139, 92, 246, 0.14)',
    borderStroke: '#8B5CF6',
    svgPos: { x: 380, y: 380, width: 230, height: 140, labelX: 495, labelY: 405 },
    matchesAsset: (asset) => {
      const bldg = (asset.location?.building || '').toLowerCase();
      const room = (asset.location?.room || '').toLowerCase();
      const dept = asset.department || '';
      return (
        bldg.includes('data center') ||
        room.includes('data center') ||
        room.includes('4102') ||
        room.includes('server room') ||
        dept === 'Data Center'
      );
    },
  },
  {
    id: 'cargo',
    name: 'Cargo & Freight Logistics Complex',
    shortCode: 'CRG-LHR',
    category: 'airside',
    description: 'Import/Export Warehouses, Manifest Printing, Customs Clearing & Air Cargo Weighing',
    accentColor: '#F59E0B', // Amber
    bgFill: 'rgba(245, 158, 11, 0.12)',
    borderStroke: '#F59E0B',
    svgPos: { x: 70, y: 220, width: 160, height: 160, labelX: 150, labelY: 245 },
    matchesAsset: (asset) => {
      const bldg = (asset.location?.building || '').toLowerCase();
      const room = (asset.location?.room || '').toLowerCase();
      const dept = asset.department || '';
      return (
        bldg.includes('cargo') ||
        room.includes('cargo') ||
        ['Cargo', 'Supply'].includes(dept)
      );
    },
  },
  {
    id: 'fire',
    name: 'Crash Fire & Rescue Station (CFRS)',
    shortCode: 'FRS-01',
    category: 'airside',
    description: 'Rapid Runway Fire Station, Emergency Dispatch Desk & Vehicle Communications',
    accentColor: '#EF4444', // Red
    bgFill: 'rgba(239, 68, 68, 0.12)',
    borderStroke: '#EF4444',
    svgPos: { x: 670, y: 310, width: 170, height: 130, labelX: 755, labelY: 335 },
    matchesAsset: (asset) => {
      const bldg = (asset.location?.building || '').toLowerCase();
      const room = (asset.location?.room || '').toLowerCase();
      const dept = asset.department || '';
      return (
        bldg.includes('fire') ||
        room.includes('fire') ||
        dept === 'Fire'
      );
    },
  },
  {
    id: 'cns',
    name: 'CNS & Avionics Engineering Hangar',
    shortCode: 'CNS-HGR',
    category: 'hangar',
    description: 'Communication Navigation Surveillance Workshops, Calibration Labs & Flight Calibration',
    accentColor: '#06B6D4', // Cyan
    bgFill: 'rgba(6, 182, 212, 0.12)',
    borderStroke: '#06B6D4',
    svgPos: { x: 70, y: 410, width: 160, height: 140, labelX: 150, labelY: 435 },
    matchesAsset: (asset) => {
      const bldg = (asset.location?.building || '').toLowerCase();
      const room = (asset.location?.room || '').toLowerCase();
      const dept = asset.department || '';
      return (
        bldg.includes('cns') ||
        bldg.includes('avionics') ||
        bldg.includes('engineering') ||
        ['CNS', 'Engineering', 'Works'].includes(dept)
      );
    },
  },
  {
    id: 'nav_runway',
    name: 'Runway 36R NavAids & ILS Shelter',
    shortCode: 'ILS-36R',
    category: 'airside',
    description: 'Instrument Landing System (ILS) Localizer, Glide Path Transmitter & Surface Movement Radar',
    accentColor: '#EAB308', // Yellow
    bgFill: 'rgba(234, 179, 8, 0.12)',
    borderStroke: '#EAB308',
    svgPos: { x: 420, y: 40, width: 220, height: 90, labelX: 530, labelY: 65 },
    matchesAsset: (asset) => {
      const bldg = (asset.location?.building || '').toLowerCase();
      const room = (asset.location?.room || '').toLowerCase();
      const dept = asset.department || '';
      return (
        bldg.includes('ils') ||
        bldg.includes('localizer') ||
        bldg.includes('runway') ||
        room.includes('ils') ||
        room.includes('runway') ||
        dept === 'NavAid'
      );
    },
  },
  {
    id: 'admin_hq',
    name: 'Civil Aviation & PAA HQ Complex',
    shortCode: 'PAA-HQ',
    category: 'landside',
    description: 'Civil Aviation Authority HQ Block A, CTO Office, Finance, HR & Airport Management',
    accentColor: '#6366F1', // Indigo
    bgFill: 'rgba(99, 102, 241, 0.12)',
    borderStroke: '#6366F1',
    svgPos: { x: 230, y: 550, width: 440, height: 120, labelX: 450, labelY: 575 },
    matchesAsset: (asset) => {
      const bldg = (asset.location?.building || '').toLowerCase();
      const dept = asset.department || '';
      return (
        bldg.includes('hq') ||
        bldg.includes('admin') ||
        bldg.includes('executive') ||
        ['CTO', 'HR', 'Accounts', 'Finance', 'Administration', 'Medical', 'IT'].includes(dept)
      );
    },
  },
];

// Determine equipment sub-cluster category
function categorizeAsset(asset: AssetItem): EquipmentClusterType {
  const cat = (asset.category || '').toLowerCase();
  if (cat.includes('pc') || cat.includes('laptop') || cat.includes('desktop') || cat.includes('monitor')) {
    return 'workstations';
  }
  if (
    cat.includes('switch') ||
    cat.includes('router') ||
    cat.includes('firewall') ||
    cat.includes('access point') ||
    cat.includes('patch') ||
    cat.includes('cable') ||
    cat.includes('network')
  ) {
    return 'network';
  }
  if (cat.includes('printer') || cat.includes('scanner') || cat.includes('toner')) {
    return 'printers';
  }
  if (cat.includes('ups') || asset.upsSpecs !== undefined) {
    return 'ups';
  }
  if (cat.includes('server') || cat.includes('storage') || cat.includes('rack')) {
    return 'servers';
  }
  if (cat.includes('radar') || cat.includes('radio') || cat.includes('phone') || asset.department === 'Radar') {
    return 'radar';
  }
  return 'workstations';
}

// Quick cluster icons definitions
export const CLUSTER_CONFIG: {
  key: EquipmentClusterType;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  keywords: string[];
}[] = [
  {
    key: 'workstations',
    label: 'Workstations',
    shortLabel: 'PC/LPT',
    icon: Laptop,
    color: '#3B82F6',
    keywords: ['workstation', 'pc', 'laptop', 'desktop', 'computer', 'monitor'],
  },
  {
    key: 'network',
    label: 'Switches / Net',
    shortLabel: 'NET/SW',
    icon: Network,
    color: '#10B981',
    keywords: ['network', 'switch', 'router', 'firewall', 'cisco', 'catalyst', 'vlan', 'ethernet'],
  },
  {
    key: 'printers',
    label: 'Printers & Scanners',
    shortLabel: 'PRN/SCN',
    icon: Printer,
    color: '#F59E0B',
    keywords: ['printer', 'scanner', 'laserjet', 'zebra', 'thermal', 'barcode', 'toner', 'hp'],
  },
  {
    key: 'ups',
    label: 'UPS & Power',
    shortLabel: 'UPS/KVA',
    icon: Zap,
    color: '#EC4899',
    keywords: ['ups', 'battery', 'power', 'apc', 'kva', 'inverter', 'backup'],
  },
  {
    key: 'servers',
    label: 'Servers & Storage',
    shortLabel: 'SRV/SAN',
    icon: Database,
    color: '#8B5CF6',
    keywords: ['server', 'blade', 'rack', 'storage', 'san', 'nas', 'dell', 'poweredge'],
  },
  {
    key: 'radar',
    label: 'Radar & Comms',
    shortLabel: 'RDR/RAD',
    icon: Radio,
    color: '#06B6D4',
    keywords: ['radar', 'radio', 'atc', 'ils', 'navaid', 'transceiver', 'vhf', 'avionic'],
  },
];

// Highlight text substring helper
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={index}
            className="bg-amber-400 text-slate-950 font-bold px-0.5 rounded-xs"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export const AirportMapOverlay: React.FC<AirportMapOverlayProps> = ({
  onSelectAsset,
  isOverlayDefaultOpen = false,
}) => {
  const { assets, tickets } = useInventory();

  // View & Filter States
  const [isFullscreen, setIsFullscreen] = useState<boolean>(isOverlayDefaultOpen);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<EquipmentClusterType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'attention'>('all');

  // Text-based Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchScope, setSearchScope] = useState<SearchScopeField>('all');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const [inspectedClusterType, setInspectedClusterType] = useState<EquipmentClusterType | null>(null);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [pngExportSuccess, setPngExportSuccess] = useState<boolean>(false);

  // Overcrowding & Capacity Warning System State
  const [warningThreshold, setWarningThreshold] = useState<number>(4);
  const [isWarningActive, setIsWarningActive] = useState<boolean>(true);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeAssets = useMemo(() => assets.filter((a) => !a.isRemoved), [assets]);

  // Aggregate assets by airport zones
  const zoneStats = useMemo(() => {
    const map = new Map<
      string,
      {
        zone: AirportZoneDef;
        totalAssets: number;
        activeAssets: number;
        onlineAssets: number;
        warningAssets: number;
        offlineAssets: number;
        openTicketsCount: number;
        clusters: {
          workstations: AssetItem[];
          network: AssetItem[];
          printers: AssetItem[];
          ups: AssetItem[];
          servers: AssetItem[];
          radar: AssetItem[];
        };
        allAssets: AssetItem[];
      }
    >();

    AIRPORT_ZONES.forEach((zone) => {
      map.set(zone.id, {
        zone,
        totalAssets: 0,
        activeAssets: 0,
        onlineAssets: 0,
        warningAssets: 0,
        offlineAssets: 0,
        openTicketsCount: 0,
        clusters: {
          workstations: [],
          network: [],
          printers: [],
          ups: [],
          servers: [],
          radar: [],
        },
        allAssets: [],
      });
    });

    // Distribute each active asset into a zone
    activeAssets.forEach((asset) => {
      let matchedZone = AIRPORT_ZONES.find((z) => z.matchesAsset(asset));
      if (!matchedZone) {
        matchedZone = AIRPORT_ZONES.find((z) => z.id === 'ptb') || AIRPORT_ZONES[0];
      }

      const stat = map.get(matchedZone.id);
      if (stat) {
        stat.totalAssets += 1;
        if (asset.status === 'Active') stat.activeAssets += 1;
        if (asset.pingStatus === 'Online') stat.onlineAssets += 1;
        else if (asset.pingStatus === 'Warning') stat.warningAssets += 1;
        else stat.offlineAssets += 1;

        const assetTickets = tickets.filter(
          (t) => t.assetId === asset.id && t.status !== 'Closed'
        );
        stat.openTicketsCount += assetTickets.length;

        stat.allAssets.push(asset);
        const clusterType = categorizeAsset(asset);
        if (clusterType !== 'all') {
          stat.clusters[clusterType].push(asset);
        }
      }
    });

    return map;
  }, [activeAssets, tickets]);

  // Asset Matching Function based on text query, scope, and cluster
  const testAssetMatch = useMemo(() => {
    return (
      asset: AssetItem,
      rawQuery: string,
      scope: SearchScopeField,
      clusterType: EquipmentClusterType
    ): { matched: boolean; matchField?: 'name' | 'serial' | 'cluster' | 'tag' | 'ip' | 'dept' } => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return { matched: true };

      // 1. Serial Number Match Check
      const serialNum = (asset.serialNumber || '').toLowerCase();
      const serialMatched = serialNum.includes(q);

      // 2. Name / Model / Brand Match Check
      const nameMatched =
        asset.name.toLowerCase().includes(q) ||
        asset.brand.toLowerCase().includes(q) ||
        asset.model.toLowerCase().includes(q);

      // 3. Cluster Match Check (by cluster key, label, or related keywords)
      const clusterDef = CLUSTER_CONFIG.find((c) => c.key === clusterType);
      const clusterMatched =
        clusterType.toLowerCase().includes(q) ||
        (clusterDef ? clusterDef.label.toLowerCase().includes(q) : false) ||
        (clusterDef ? clusterDef.keywords.some((kw) => kw.includes(q) || q.includes(kw)) : false);

      // 4. Asset Tag & Technical IDs Match Check
      const tagMatched =
        asset.assetTag.toLowerCase().includes(q) || asset.id.toLowerCase().includes(q);

      // 5. IP Address Match Check
      const ipMatched = asset.systemSpecs?.ipAddress
        ? asset.systemSpecs.ipAddress.toLowerCase().includes(q)
        : false;

      // 6. Department / Location Match Check
      const deptMatched =
        asset.department.toLowerCase().includes(q) ||
        (asset.location?.building || '').toLowerCase().includes(q) ||
        (asset.location?.room || '').toLowerCase().includes(q);

      if (scope === 'serial') {
        return { matched: serialMatched, matchField: serialMatched ? 'serial' : undefined };
      }
      if (scope === 'name') {
        return { matched: nameMatched, matchField: nameMatched ? 'name' : undefined };
      }
      if (scope === 'cluster') {
        return { matched: clusterMatched, matchField: clusterMatched ? 'cluster' : undefined };
      }

      // 'all' scope matches
      if (serialMatched) return { matched: true, matchField: 'serial' };
      if (nameMatched) return { matched: true, matchField: 'name' };
      if (clusterMatched) return { matched: true, matchField: 'cluster' };
      if (tagMatched) return { matched: true, matchField: 'tag' };
      if (ipMatched) return { matched: true, matchField: 'ip' };
      if (deptMatched) return { matched: true, matchField: 'dept' };

      return { matched: false };
    };
  }, []);

  // Global Airport-Wide Search Results Computation
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        isSearching: false,
        totalMatches: activeAssets.length,
        matchingAssets: [] as {
          asset: AssetItem;
          zone: AirportZoneDef;
          clusterType: EquipmentClusterType;
          matchField?: string;
        }[],
        zoneMatchCounts: new Map<
          string,
          {
            count: number;
            matchingAssets: AssetItem[];
            clusterCounts: Record<EquipmentClusterType, number>;
          }
        >(),
        matchingClusters: new Set<EquipmentClusterType>(),
      };
    }

    const matchingList: {
      asset: AssetItem;
      zone: AirportZoneDef;
      clusterType: EquipmentClusterType;
      matchField?: string;
    }[] = [];

    const zoneMap = new Map<
      string,
      {
        count: number;
        matchingAssets: AssetItem[];
        clusterCounts: Record<EquipmentClusterType, number>;
      }
    >();

    AIRPORT_ZONES.forEach((z) => {
      zoneMap.set(z.id, {
        count: 0,
        matchingAssets: [],
        clusterCounts: {
          all: 0,
          workstations: 0,
          network: 0,
          printers: 0,
          ups: 0,
          servers: 0,
          radar: 0,
        },
      });
    });

    const matchedClusters = new Set<EquipmentClusterType>();

    activeAssets.forEach((asset) => {
      let matchedZone = AIRPORT_ZONES.find((z) => z.matchesAsset(asset)) || AIRPORT_ZONES[0];
      const clusterType = categorizeAsset(asset);
      const res = testAssetMatch(asset, q, searchScope, clusterType);

      if (res.matched) {
        matchingList.push({
          asset,
          zone: matchedZone,
          clusterType,
          matchField: res.matchField,
        });
        matchedClusters.add(clusterType);

        const zEntry = zoneMap.get(matchedZone.id);
        if (zEntry) {
          zEntry.count += 1;
          zEntry.matchingAssets.push(asset);
          zEntry.clusterCounts[clusterType] = (zEntry.clusterCounts[clusterType] || 0) + 1;
        }
      }
    });

    return {
      isSearching: true,
      totalMatches: matchingList.length,
      matchingAssets: matchingList,
      zoneMatchCounts: zoneMap,
      matchingClusters: matchedClusters,
    };
  }, [activeAssets, searchQuery, searchScope, testAssetMatch]);

  // Selected Zone Object
  const currentSelectedZone = useMemo(() => {
    if (!selectedZoneId) return null;
    return zoneStats.get(selectedZoneId) || null;
  }, [selectedZoneId, zoneStats]);

  // Compute overcrowded zones based on user-defined threshold
  const overcrowdedZones = useMemo(() => {
    if (!isWarningActive || warningThreshold <= 0) return [];
    const list: {
      zoneId: string;
      zone: AirportZoneDef;
      assetCount: number;
      excess: number;
    }[] = [];

    AIRPORT_ZONES.forEach((zone) => {
      const stat = zoneStats.get(zone.id);
      const count = stat?.totalAssets || 0;
      if (count > warningThreshold) {
        list.push({
          zoneId: zone.id,
          zone,
          assetCount: count,
          excess: count - warningThreshold,
        });
      }
    });

    return list;
  }, [isWarningActive, warningThreshold, zoneStats]);

  // Filtered Assets for the active inspect drawer
  const inspectedAssets = useMemo(() => {
    if (!currentSelectedZone) return [];
    let list = currentSelectedZone.allAssets;

    if (inspectedClusterType && inspectedClusterType !== 'all') {
      list = currentSelectedZone.clusters[inspectedClusterType] || [];
    }

    if (statusFilter === 'online') {
      list = list.filter((a) => a.pingStatus === 'Online');
    } else if (statusFilter === 'attention') {
      list = list.filter(
        (a) =>
          a.pingStatus === 'Offline' ||
          a.pingStatus === 'Warning' ||
          a.status === 'Under Repair' ||
          a.status === 'Faulty'
      );
    }

    // Apply text search filtering within the active zone
    if (searchQuery.trim()) {
      list = list.filter((asset) => {
        const clusterType = categorizeAsset(asset);
        return testAssetMatch(asset, searchQuery, searchScope, clusterType).matched;
      });
    }

    return list;
  }, [
    currentSelectedZone,
    inspectedClusterType,
    statusFilter,
    searchQuery,
    searchScope,
    testAssetMatch,
  ]);

  // Handle selecting an asset from search results
  const handleSelectSearchResult = (
    asset: AssetItem,
    zoneId: string,
    clusterType: EquipmentClusterType
  ) => {
    setSelectedZoneId(zoneId);
    setInspectedClusterType(clusterType);
    setIsSearchDropdownOpen(false);
    onSelectAsset(asset);
  };

  // Focus a specific zone from search results without necessarily opening an asset modal
  const handleFocusZone = (zoneId: string, clusterType?: EquipmentClusterType) => {
    setSelectedZoneId(zoneId);
    if (clusterType) {
      setInspectedClusterType(clusterType);
    } else {
      setInspectedClusterType(null);
    }
    setIsSearchDropdownOpen(false);
  };

  // Export Airport Map Data with Search Info
  const handleExportMapJson = () => {
    const exportData = {
      airportName: 'Allama Iqbal International Airport (AIIAP)',
      generatedAt: new Date().toISOString(),
      warningSystem: {
        active: isWarningActive,
        threshold: warningThreshold,
        overcrowdedZonesCount: overcrowdedZones.length,
      },
      activeSearchFilter: searchQuery.trim()
        ? { query: searchQuery, scope: searchScope, matches: searchResults.totalMatches }
        : null,
      zones: AIRPORT_ZONES.map((z) => {
        const stat = zoneStats.get(z.id);
        const searchStat = searchResults.zoneMatchCounts.get(z.id);
        const isOvercrowded = isWarningActive && (stat?.totalAssets || 0) > warningThreshold;
        return {
          zoneId: z.id,
          name: z.name,
          shortCode: z.shortCode,
          category: z.category,
          totalAssets: stat?.totalAssets || 0,
          activeAssets: stat?.activeAssets || 0,
          onlineAssets: stat?.onlineAssets || 0,
          offlineAssets: stat?.offlineAssets || 0,
          openTickets: stat?.openTicketsCount || 0,
          searchMatches: searchStat ? searchStat.count : 0,
          isOvercrowded,
          excessAssets: isOvercrowded ? (stat?.totalAssets || 0) - warningThreshold : 0,
          equipmentBreakdown: {
            workstations: stat?.clusters.workstations.length || 0,
            network: stat?.clusters.network.length || 0,
            printers: stat?.clusters.printers.length || 0,
            ups: stat?.clusters.ups.length || 0,
            servers: stat?.clusters.servers.length || 0,
            radar: stat?.clusters.radar.length || 0,
          },
        };
      }),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AIIAP_Airport_Map_Asset_Distribution_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Capture current SVG visualization as PNG file for offline reporting / situational awareness
  const handleDownloadMapPng = async () => {
    const svg = svgRef.current;
    if (!svg) return;

    setIsExportingPng(true);
    setPngExportSuccess(false);

    try {
      // Base dimensions of the SVG viewBox (920 x 700)
      const baseWidth = 920;
      const baseHeight = 700;
      // 2x super-sampling scale factor for crisp rendering on high-DPI displays & offline reports
      const scale = 2;
      const targetWidth = baseWidth * scale;
      const targetHeight = baseHeight * scale;

      // Clone SVG element to ensure clean standalone attributes, namespaces, and dimensions
      const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', `${baseWidth}`);
      clonedSvg.setAttribute('height', `${baseHeight}`);
      clonedSvg.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

      // Ensure explicit dark background style on the root SVG clone
      clonedSvg.style.backgroundColor = '#090e17';
      clonedSvg.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';

      // Serialize SVG to XML string
      const serializer = new XMLSerializer();
      const svgXml = serializer.serializeToString(clonedSvg);

      // Create Blob & Data URL fallback
      const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);
      const dataUriFallback = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgXml)));

      // Render onto an HTML5 Canvas
      await new Promise<void>((resolve, reject) => {
        const img = new Image();

        const onImageLoaded = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas 2D context not available'));
              return;
            }

            // Fill solid dark airfield backdrop
            ctx.fillStyle = '#090e17';
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            // Draw SVG visualization image
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Add offline reporting situational awareness header banner on the PNG
            const reportDate = new Date();
            const timeString = reportDate.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

            ctx.fillStyle = 'rgba(10, 15, 26, 0.92)';
            ctx.fillRect(16 * scale, 12 * scale, 350 * scale, 26 * scale);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1 * scale;
            ctx.strokeRect(16 * scale, 12 * scale, 350 * scale, 26 * scale);

            ctx.fillStyle = '#38BDF8';
            ctx.font = `bold ${8.5 * scale}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
            ctx.fillText('AIIAP AIRFIELD SITUATIONAL AWARENESS REPORT', 24 * scale, 24 * scale);

            ctx.fillStyle = '#94A3B8';
            ctx.font = `${7 * scale}px monospace`;
            const searchSummary = searchQuery.trim() ? ` • FILTER: "${searchQuery}"` : '';
            const warningSummary =
              isWarningActive && overcrowdedZones.length > 0
                ? ` • ⚠️ OVERCROWDED: ${overcrowdedZones.length} ZONES (> ${warningThreshold})`
                : '';
            ctx.fillText(
              `CAPTURED: ${timeString} • ASSETS: ${activeAssets.length}${searchSummary}${warningSummary}`,
              24 * scale,
              33 * scale
            );

            // Export canvas as PNG blob
            canvas.toBlob((blob) => {
              const filenameDate = reportDate.toISOString().replace(/[:.]/g, '-').slice(0, 19);
              const filename = `AIIAP_Airport_Airfield_Map_${filenameDate}.png`;

              if (!blob) {
                // Fallback to dataURL
                const dataUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = dataUrl;
                downloadLink.download = filename;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                resolve();
                return;
              }

              const pngUrl = URL.createObjectURL(blob);
              const downloadLink = document.createElement('a');
              downloadLink.href = pngUrl;
              downloadLink.download = filename;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              setTimeout(() => URL.revokeObjectURL(pngUrl), 1500);
              resolve();
            }, 'image/png');
          } catch (err) {
            reject(err);
          }
        };

        img.onload = onImageLoaded;
        img.onerror = () => {
          // If blob URL fails in some sandbox environment, fallback to data URI
          if (img.src !== dataUriFallback) {
            img.src = dataUriFallback;
          } else {
            reject(new Error('Failed to load SVG into image'));
          }
        };

        img.src = blobUrl;
      });

      URL.revokeObjectURL(blobUrl);
      setPngExportSuccess(true);
      setTimeout(() => setPngExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to capture airport map as PNG:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 shadow-xl transition-all duration-300 dark:border-slate-800 ${
        isFullscreen
          ? 'fixed inset-0 z-50 overflow-hidden rounded-none p-3 sm:p-5 bg-slate-950/95 backdrop-blur-md'
          : 'relative overflow-hidden'
      }`}
    >
      {/* Top Header & Airfield Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <Compass className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                Airport Operational Map & Asset Distribution
              </h3>
              <span className="hidden sm:inline-block rounded-md bg-teal-950/80 border border-teal-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-teal-300">
                AIIAP Airfield Master
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{activeAssets.length} total monitored assets</span>
              <span aria-hidden="true">·</span>
              <span>8 operational zones</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium">Airfield Systems Nominal</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Search & Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Enhanced Text-Based Search Input & Dropdown */}
          <div ref={searchBoxRef} className="relative min-w-[240px] sm:min-w-[320px] md:min-w-[380px]">
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/90 shadow-inner focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition">
              {/* Scope Selector: All, Name, Serial, Cluster */}
              <div className="relative border-r border-slate-700/80">
                <select
                  value={searchScope}
                  onChange={(e) => setSearchScope(e.target.value as SearchScopeField)}
                  aria-label="Search filter field"
                  className="bg-transparent py-1.5 pl-2.5 pr-2 text-[11px] font-bold text-teal-300 focus:outline-hidden cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">
                    All Fields
                  </option>
                  <option value="name" className="bg-slate-900 text-white">
                    Name / Brand
                  </option>
                  <option value="serial" className="bg-slate-900 text-white">
                    Serial #
                  </option>
                  <option value="cluster" className="bg-slate-900 text-white">
                    Cluster
                  </option>
                </select>
              </div>

              {/* Text Input */}
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchDropdownOpen(false);
                    }
                  }}
                  placeholder={
                    searchScope === 'serial'
                      ? 'Search serial # (e.g. SN-CSC, 7G2K9)...'
                      : searchScope === 'name'
                      ? 'Search asset name, Dell, Cisco...'
                      : searchScope === 'cluster'
                      ? 'Search cluster (printer, switch, ups)...'
                      : 'Search asset name, serial #, tag, cluster...'
                  }
                  className="w-full bg-transparent py-1.5 pl-8 pr-7 text-xs text-white placeholder-slate-400 focus:outline-hidden"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchDropdownOpen(false);
                    }}
                    className="absolute right-2 text-slate-400 hover:text-white transition"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Live Match Badge indicator */}
              {searchResults.isSearching && (
                <div className="px-2 py-0.5 mr-1.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                  {searchResults.totalMatches} match{searchResults.totalMatches !== 1 ? 'es' : ''}
                </div>
              )}
            </div>

            {/* Instant Search Results Dropdown Flyout */}
            {isSearchDropdownOpen && searchResults.isSearching && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-[380px] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/98 p-2.5 shadow-2xl backdrop-blur-md animate-in fade-in-50">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>
                      Found <strong className="text-amber-400">{searchResults.totalMatches}</strong> assets matching &ldquo;{searchQuery}&rdquo;
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSearchDropdownOpen(false)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Close (Esc)
                  </button>
                </div>

                {/* No Matches State */}
                {searchResults.totalMatches === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <p className="font-semibold text-slate-300">No assets or clusters match your search</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Try searching by serial number (e.g. &apos;SN-&apos;), model (e.g. &apos;LaserJet&apos;, &apos;OptiPlex&apos;), or cluster keyword.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {/* Top Matching Items List */}
                    {searchResults.matchingAssets.slice(0, 10).map(({ asset, zone, clusterType, matchField }) => (
                      <div
                        key={asset.id}
                        onClick={() => handleSelectSearchResult(asset, zone.id, clusterType)}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-2 text-xs hover:border-teal-500/60 hover:bg-slate-800 transition cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                asset.pingStatus === 'Online'
                                  ? 'bg-emerald-500'
                                  : asset.pingStatus === 'Warning'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span className="font-bold text-white group-hover:text-teal-300 truncate">
                              <HighlightedText text={asset.name} query={searchQuery} />
                            </span>
                            {/* Match Type Pill */}
                            {matchField === 'serial' && (
                              <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                                S/N Match
                              </span>
                            )}
                            {matchField === 'cluster' && (
                              <span className="rounded bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.2 text-[9px] font-bold text-purple-300">
                                Cluster Match
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                            {/* Serial Number */}
                            <span className="flex items-center gap-1 font-mono text-slate-300">
                              <Barcode className="h-3 w-3 text-slate-400" />
                              <span>SN: </span>
                              <strong className="text-teal-300 font-bold">
                                <HighlightedText
                                  text={asset.serialNumber || 'N/A'}
                                  query={searchQuery}
                                />
                              </strong>
                            </span>

                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-400">{asset.assetTag}</span>

                            <span aria-hidden="true">·</span>
                            <span className="rounded px-1 py-0.2 text-[9px] font-mono bg-slate-700 text-slate-200">
                              {zone.shortCode}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFocusZone(zone.id, clusterType);
                            }}
                            className="rounded-md bg-slate-700/80 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-teal-600 hover:text-white transition"
                            title="Focus zone on map"
                          >
                            Focus Zone
                          </button>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition" />
                        </div>
                      </div>
                    ))}

                    {searchResults.matchingAssets.length > 10 && (
                      <div className="pt-1 text-center text-[11px] text-slate-400">
                        + {searchResults.matchingAssets.length - 10} more matches across the airfield.
                        Click any zone on the map to inspect all matches in that zone.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Download Map Button (SVG -> PNG for offline reporting & situational awareness) */}
          <button
            type="button"
            onClick={handleDownloadMapPng}
            disabled={isExportingPng}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
              pngExportSuccess
                ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                : 'border-teal-500/50 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 hover:border-teal-400 hover:text-white'
            } disabled:opacity-50`}
            title="Download Map as PNG file for offline reporting or situational awareness"
          >
            {isExportingPng ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-teal-300 animate-spin" />
                <span>Capturing Map...</span>
              </>
            ) : pngExportSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Map Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-teal-300" />
                <span>Download Map</span>
                <span className="hidden sm:inline rounded bg-teal-950/80 border border-teal-500/40 px-1 py-0.2 text-[9px] font-mono text-teal-300">
                  PNG
                </span>
              </>
            )}
          </button>

          {/* Export JSON Data button */}
          <button
            type="button"
            onClick={handleExportMapJson}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Download Airport Distribution JSON"
          >
            <Database className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          {/* Fullscreen Overlay Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/20 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/30 transition shadow-xs"
            title={isFullscreen ? 'Exit Fullscreen Overlay' : 'Expand Fullscreen Map Overlay'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Expand Overlay</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cluster Type Filters Bar & Quick Search Suggestions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/60 px-4 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3 text-slate-400" />
            <span>Equipment Layer:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedClusterFilter('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              selectedClusterFilter === 'all'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            All Clusters
          </button>
          {CLUSTER_CONFIG.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedClusterFilter === c.key;
            const isMatchedInSearch =
              searchResults.isSearching && searchResults.matchingClusters.has(c.key);

            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedClusterFilter(c.key)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  isSelected
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : isMatchedInSearch
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{c.label}</span>
                {isMatchedInSearch && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Search Chips / Shortcuts & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick preset search filter chip */}
          <div className="hidden md:flex items-center gap-1 text-[11px]">
            <span className="text-slate-500">Quick:</span>
            <button
              type="button"
              onClick={() => {
                setSearchScope('serial');
                setSearchQuery('SN-');
                setIsSearchDropdownOpen(true);
              }}
              className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-300 border border-slate-700/60 font-mono text-[10px]"
              title="Search by Serial Numbers"
            >
              # Serial No
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchScope('cluster');
                setSearchQuery('switch');
              }}
              className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-300 border border-slate-700/60 text-[10px]"
            >
              Switches
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchScope('cluster');
                setSearchQuery('printer');
              }}
              className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-300 border border-slate-700/60 text-[10px]"
            >
              Printers
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchScope('cluster');
                setSearchQuery('ups');
              }}
              className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-300 border border-slate-700/60 text-[10px]"
            >
              UPS
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-[11px] border-l border-slate-800 pl-2">
            <span className="text-slate-400 mr-1">Status:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded px-2 py-0.5 transition ${
                statusFilter === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('online')}
              className={`rounded px-2 py-0.5 transition ${
                statusFilter === 'online'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Online
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('attention')}
              className={`rounded px-2 py-0.5 transition ${
                statusFilter === 'attention'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Attention
            </button>
          </div>
        </div>
      </div>

      {/* Overcrowding Warning & Capacity Threshold System Controls */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2.5 border-b px-4 py-2 text-xs transition-colors ${
          isWarningActive && overcrowdedZones.length > 0
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : 'bg-slate-950/70 border-slate-800/90 text-slate-300'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Warning System Toggle Button */}
          <button
            type="button"
            onClick={() => setIsWarningActive(!isWarningActive)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-xs cursor-pointer ${
              isWarningActive
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
            }`}
            title="Toggle zone overcrowding warning system"
          >
            <AlertTriangle
              className={`h-3.5 w-3.5 ${isWarningActive ? 'text-white' : 'text-slate-400'}`}
            />
            <span>Overcrowding Warning: {isWarningActive ? 'Active' : 'Off'}</span>
          </button>

          {/* User-defined threshold controls */}
          {isWarningActive && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-800/90 border border-slate-700 px-2.5 py-1 shadow-inner">
              <span className="text-[11px] font-medium text-slate-300">
                Warn when zone exceeds:
              </span>

              {/* Threshold Stepper */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWarningThreshold(Math.max(1, warningThreshold - 1))}
                  className="h-5 w-5 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-xs transition cursor-pointer"
                  title="Decrease capacity threshold"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={warningThreshold}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) setWarningThreshold(val);
                  }}
                  className="w-10 bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-center font-mono font-bold text-rose-400 text-xs focus:outline-hidden focus:border-rose-500"
                  aria-label="Zone asset overcrowding threshold"
                />
                <button
                  type="button"
                  onClick={() => setWarningThreshold(warningThreshold + 1)}
                  className="h-5 w-5 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-xs transition cursor-pointer"
                  title="Increase capacity threshold"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <span className="text-[11px] font-semibold text-slate-400 ml-0.5">assets</span>
              </div>

              {/* Threshold Quick Presets */}
              <div className="hidden sm:flex items-center gap-1 ml-1 border-l border-slate-700 pl-2">
                <span className="text-[10px] text-slate-500">Presets:</span>
                {[3, 4, 5, 8].map((presetVal) => (
                  <button
                    key={presetVal}
                    type="button"
                    onClick={() => setWarningThreshold(presetVal)}
                    className={`rounded px-1.5 py-0.2 text-[10px] font-mono transition cursor-pointer ${
                      warningThreshold === presetVal
                        ? 'bg-rose-500 text-white font-bold'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {presetVal}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Warning Indicator Status Badge */}
        {isWarningActive && (
          <div className="flex items-center gap-2">
            {overcrowdedZones.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 px-2.5 py-1">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                  <span className="font-bold text-rose-300 text-xs flex items-center gap-1">
                    <span>
                      {overcrowdedZones.length} Overcrowded Zone
                      {overcrowdedZones.length > 1 ? 's' : ''} (&gt; {warningThreshold} assets)
                    </span>
                    <span className="text-rose-200/70 font-normal hidden lg:inline">
                      [{overcrowdedZones.map((z) => z.zone.shortCode).join(', ')}]
                    </span>
                  </span>
                </div>
                {/* Focus First Overcrowded Zone Button */}
                <button
                  type="button"
                  onClick={() => {
                    const firstZone = overcrowdedZones[0];
                    if (firstZone) {
                      setSelectedZoneId(firstZone.zoneId);
                      setInspectedClusterType(null);
                    }
                  }}
                  className="rounded-lg bg-rose-900/80 hover:bg-rose-800 border border-rose-500/50 px-2 py-1 text-[11px] font-bold text-white transition cursor-pointer"
                  title="Focus first overcrowded zone on map"
                >
                  Inspect Overcrowded
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-emerald-400 text-xs font-semibold">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>All zones within capacity threshold (≤ {warningThreshold} assets)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Map Canvas and Side Inspector Container */}
      <div className={`grid grid-cols-1 ${selectedZoneId ? 'lg:grid-cols-12' : ''} gap-0 relative bg-slate-950`}>
        {/* Left / Main: Airfield Graphical SVG Blueprint */}
        <div className={`${selectedZoneId ? 'lg:col-span-8' : 'w-full'} p-2 sm:p-4 overflow-hidden relative`}>
          <div className="relative w-full rounded-xl border border-slate-800 bg-[#090e17] overflow-hidden shadow-inner">
            {/* Airfield Radar Grid Backing */}
            <svg
              ref={svgRef}
              viewBox="0 0 920 700"
              className="w-full h-auto select-none"
              style={{ minHeight: isFullscreen ? '70vh' : '480px' }}
            >
              <defs>
                {/* Airfield Grid Pattern */}
                <pattern id="airfieldGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#172236" strokeWidth="0.8" />
                </pattern>

                {/* Radar Pulse Radial Gradient */}
                <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#10B981" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </radialGradient>

                {/* Glowing filter for search matches */}
                <filter id="searchGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Vivid Red Glowing filter for overcrowded zones */}
                <filter id="overcrowdedGlow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feFlood floodColor="#EF4444" floodOpacity="0.85" result="redColor" />
                  <feComposite in="redColor" in2="blur" operator="in" result="redGlow" />
                  <feComposite in="SourceGraphic" in2="redGlow" operator="over" />
                </filter>

                {/* Diagonal hazard stripe pattern for overcrowded zones */}
                <pattern
                  id="overcrowdedHatch"
                  width="18"
                  height="18"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="18"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    opacity="0.16"
                  />
                </pattern>
              </defs>

              {/* Solid Airfield Background Base */}
              <rect width="920" height="700" fill="#090e17" />

              {/* Background Grid */}
              <rect width="920" height="700" fill="url(#airfieldGrid)" />

              {/* AIRFIELD RUNWAY & TAXIWAY VECTOR INFRASTRUCTURE */}
              {/* Main Runway 36R - 18L (Top to Bottom center-left) */}
              <g id="runway-36R-18L" opacity="0.85">
                <rect x="235" y="10" width="45" height="680" fill="#141d2b" stroke="#2a3b53" strokeWidth="1.5" />
                <line
                  x1="257.5"
                  y1="25"
                  x2="257.5"
                  y2="675"
                  stroke="#F1C40F"
                  strokeWidth="2.5"
                  strokeDasharray="20 14"
                />
                <line x1="240" y1="28" x2="275" y2="28" stroke="#FFFFFF" strokeWidth="4" />
                <text x="257.5" y="48" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  36R
                </text>
                <line x1="240" y1="672" x2="275" y2="672" stroke="#FFFFFF" strokeWidth="4" />
                <text x="257.5" y="662" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  18L
                </text>
              </g>

              {/* Parallel Taxiway Alpha */}
              <line x1="310" y1="40" x2="310" y2="660" stroke="#1f2c42" strokeWidth="16" />
              <line x1="310" y1="40" x2="310" y2="660" stroke="#F1C40F" strokeWidth="1" strokeDasharray="10 8" opacity="0.6" />

              {/* Taxiway Links Bravo, Charlie, Delta */}
              <line x1="257" y1="120" x2="310" y2="120" stroke="#1f2c42" strokeWidth="14" />
              <line x1="257" y1="360" x2="310" y2="360" stroke="#1f2c42" strokeWidth="14" />
              <line x1="257" y1="520" x2="310" y2="520" stroke="#1f2c42" strokeWidth="14" />

              {/* Main Terminal Apron Surface */}
              <path
                d="M 320 180 L 650 180 L 650 360 L 320 360 Z"
                fill="#121a27"
                stroke="#24334a"
                strokeWidth="1.2"
                opacity="0.9"
              />

              {/* Aircraft Gate Stands 1 to 6 */}
              {[1, 2, 3, 4, 5, 6].map((gateNum, idx) => {
                const gx = 345 + idx * 52;
                return (
                  <g key={`gate-${gateNum}`} opacity="0.5">
                    <circle cx={gx} cy="195" r="8" fill="none" stroke="#F1C40F" strokeWidth="1" />
                    <text x={gx} y="198" fill="#F1C40F" fontSize="8" textAnchor="middle" fontFamily="monospace">
                      G{gateNum}
                    </text>
                  </g>
                );
              })}

              {/* Radar Sweep Effect centered on ATC Tower */}
              <circle cx="760" cy="195" r="110" fill="url(#radarPulse)" />
              <circle cx="760" cy="195" r="70" fill="none" stroke="#10B981" strokeWidth="0.8" opacity="0.4" strokeDasharray="4 4" />
              <circle cx="760" cy="195" r="110" fill="none" stroke="#10B981" strokeWidth="0.8" opacity="0.2" />

              {/* Fiber Trunk Routes */}
              <path
                d="M 495 450 L 450 270 M 495 450 L 760 195 M 495 450 L 450 610 M 495 450 L 150 300 M 495 450 L 755 375"
                fill="none"
                stroke="#6366F1"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                opacity="0.35"
              />

              {/* INTERACTIVE AIRPORT OPERATIONAL ZONES */}
              {AIRPORT_ZONES.map((zone) => {
                const stat = zoneStats.get(zone.id);
                const isSelected = selectedZoneId === zone.id;
                const { x, y, width, height } = zone.svgPos;

                // Search match check for this specific zone
                const zoneSearchEntry = searchResults.zoneMatchCounts.get(zone.id);
                const searchMatchCount = zoneSearchEntry ? zoneSearchEntry.count : 0;
                const isSearchActive = searchResults.isSearching;
                const hasSearchMatches = isSearchActive && searchMatchCount > 0;
                const isDimmedBySearch = isSearchActive && searchMatchCount === 0;

                // Overcrowding capacity check
                const isOvercrowded =
                  isWarningActive && (stat?.totalAssets || 0) > warningThreshold;

                const hasOffline = (stat?.offlineAssets || 0) > 0;
                const hasWarning = (stat?.warningAssets || 0) > 0;
                const hasTickets = (stat?.openTicketsCount || 0) > 0;

                return (
                  <g
                    key={zone.id}
                    opacity={isDimmedBySearch ? 0.32 : 1}
                    onClick={() => {
                      setSelectedZoneId(zone.id);
                      setInspectedClusterType(
                        selectedClusterFilter !== 'all' ? selectedClusterFilter : null
                      );
                    }}
                    className="cursor-pointer transition-all duration-200 group"
                  >
                    {/* Zone Boundary Polygon / Rectangle with Overcrowded Highlighting */}
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx="14"
                      fill={
                        isOvercrowded
                          ? 'rgba(239, 68, 68, 0.22)'
                          : hasSearchMatches
                          ? 'rgba(245, 158, 11, 0.16)'
                          : isSelected
                          ? `${zone.accentColor}28`
                          : zone.bgFill
                      }
                      stroke={
                        isOvercrowded
                          ? '#EF4444'
                          : hasSearchMatches
                          ? '#F59E0B'
                          : isSelected
                          ? '#FFFFFF'
                          : zone.borderStroke
                      }
                      strokeWidth={isOvercrowded ? 3.5 : hasSearchMatches ? 3 : isSelected ? 3 : 1.5}
                      strokeDasharray={hasSearchMatches && !isOvercrowded ? '5 3' : 'none'}
                      filter={
                        isOvercrowded
                          ? 'url(#overcrowdedGlow)'
                          : hasSearchMatches
                          ? 'url(#searchGlow)'
                          : undefined
                      }
                      className="transition-all duration-200"
                    />

                    {/* Hazard Hatched Pattern Texture for Overcrowded Zones */}
                    {isOvercrowded && (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx="14"
                        fill="url(#overcrowdedHatch)"
                        pointerEvents="none"
                      />
                    )}

                    {/* Zone Header Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={32}
                      rx="14"
                      fill={
                        isOvercrowded
                          ? '#DC2626'
                          : hasSearchMatches
                          ? '#B45309'
                          : isSelected
                          ? zone.accentColor
                          : '#162235'
                      }
                      opacity={isOvercrowded || isSelected || hasSearchMatches ? 0.98 : 0.8}
                    />

                    {/* Zone Code Badge */}
                    <text
                      x={x + 12}
                      y={y + 20}
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                      letterSpacing="0.05em"
                    >
                      {zone.shortCode}
                    </text>

                    {/* Zone Name */}
                    <text
                      x={x + 72}
                      y={y + 20}
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="700"
                    >
                      {isOvercrowded
                        ? `⚠️ ${zone.name.length > 20 ? zone.name.slice(0, 18) + '…' : zone.name}`
                        : zone.name.length > 28
                        ? zone.name.slice(0, 26) + '…'
                        : zone.name}
                    </text>

                    {/* Overcrowded Warning Badge and Search Matches Tag */}
                    {isOvercrowded && hasSearchMatches ? (
                      <g>
                        {/* Red Overcrowded Tag */}
                        <g transform={`translate(${x + width - 188}, ${y + 6})`}>
                          <rect
                            width="92"
                            height="20"
                            rx="6"
                            fill="#7F1D1D"
                            stroke="#FCA5A5"
                            strokeWidth="1.2"
                          />
                          <text
                            x="46"
                            y="14"
                            fill="#FEE2E2"
                            fontSize="9"
                            fontWeight="900"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            ⚠️ OVERCROWDED
                          </text>
                        </g>
                        {/* Amber Match Tag */}
                        <g transform={`translate(${x + width - 92}, ${y + 6})`}>
                          <rect
                            width="86"
                            height="20"
                            rx="6"
                            fill="#F59E0B"
                            stroke="#FFFFFF"
                            strokeWidth="1"
                          />
                          <text
                            x="43"
                            y="14"
                            fill="#0F172A"
                            fontSize="9.5"
                            fontWeight="900"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            ★ {searchMatchCount} MATCH{searchMatchCount > 1 ? 'ES' : ''}
                          </text>
                        </g>
                      </g>
                    ) : isOvercrowded ? (
                      /* Overcrowded Warning Pill */
                      <g transform={`translate(${x + width - 134}, ${y + 6})`}>
                        <rect
                          width="126"
                          height="20"
                          rx="6"
                          fill="#991B1B"
                          stroke="#FCA5A5"
                          strokeWidth="1.2"
                        />
                        <text
                          x="63"
                          y="14"
                          fill="#FFFFFF"
                          fontSize="9"
                          fontWeight="900"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          ⚠️ OVERCROWDED ({stat?.totalAssets}/{warningThreshold})
                        </text>
                      </g>
                    ) : hasSearchMatches ? (
                      /* Search Matches Pill */
                      <g transform={`translate(${x + width - 96}, ${y + 6})`}>
                        <rect
                          width="86"
                          height="20"
                          rx="6"
                          fill="#F59E0B"
                          stroke="#FFFFFF"
                          strokeWidth="1"
                        />
                        <text
                          x="43"
                          y="14"
                          fill="#0F172A"
                          fontSize="9.5"
                          fontWeight="900"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          ★ {searchMatchCount} MATCH{searchMatchCount > 1 ? 'ES' : ''}
                        </text>
                      </g>
                    ) : (
                      /* Standard Asset Count Pill */
                      <g transform={`translate(${x + width - 68}, ${y + 6})`}>
                        <rect
                          width="58"
                          height="20"
                          rx="6"
                          fill={isSelected ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.6)'}
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="0.8"
                        />
                        <text
                          x="29"
                          y="14"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {stat?.totalAssets || 0} AST
                        </text>
                      </g>
                    )}

                    {/* EQUIPMENT CLUSTERS SVG ICONS EMBEDDED IN ZONE */}
                    <g transform={`translate(${x + 10}, ${y + 40})`}>
                      {/* Workstations Cluster */}
                      {(selectedClusterFilter === 'all' || selectedClusterFilter === 'workstations') && (
                        <g
                          transform="translate(0, 0)"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedZoneId(zone.id);
                            setInspectedClusterType('workstations');
                          }}
                          className="hover:opacity-100 opacity-90 transition"
                        >
                          {(() => {
                            const isClusterMatched =
                              hasSearchMatches && (zoneSearchEntry?.clusterCounts.workstations || 0) > 0;
                            return (
                              <>
                                <rect
                                  width="64"
                                  height="34"
                                  rx="6"
                                  fill="#1e293b"
                                  stroke={isClusterMatched ? '#F59E0B' : '#334155'}
                                  strokeWidth={isClusterMatched ? 2 : 1}
                                />
                                <rect x="4" y="5" width="22" height="24" rx="4" fill="#3B82F6" opacity="0.25" />
                                <path
                                  d="M 9 10 L 21 10 L 21 21 L 9 21 Z M 7 22 L 23 22"
                                  stroke={isClusterMatched ? '#FCD34D' : '#60A5FA'}
                                  strokeWidth="1.5"
                                  fill="none"
                                  strokeLinecap="round"
                                />
                                <text x="32" y="22" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace">
                                  {stat?.clusters.workstations.length || 0}
                                </text>
                                <text x="32" y="30" fill={isClusterMatched ? '#FCD34D' : '#94A3B8'} fontSize="7" fontWeight="500">
                                  {isClusterMatched ? 'MATCH' : 'PC/LPT'}
                                </text>
                              </>
                            );
                          })()}
                        </g>
                      )}

                      {/* Network Switches Cluster */}
                      {(selectedClusterFilter === 'all' || selectedClusterFilter === 'network') && (
                        <g
                          transform="translate(70, 0)"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedZoneId(zone.id);
                            setInspectedClusterType('network');
                          }}
                          className="hover:opacity-100 opacity-90 transition"
                        >
                          {(() => {
                            const isClusterMatched =
                              hasSearchMatches && (zoneSearchEntry?.clusterCounts.network || 0) > 0;
                            return (
                              <>
                                <rect
                                  width="64"
                                  height="34"
                                  rx="6"
                                  fill="#1e293b"
                                  stroke={isClusterMatched ? '#F59E0B' : '#334155'}
                                  strokeWidth={isClusterMatched ? 2 : 1}
                                />
                                <rect x="4" y="5" width="22" height="24" rx="4" fill="#10B981" opacity="0.25" />
                                <rect x="8" y="11" width="14" height="12" rx="2" stroke={isClusterMatched ? '#FCD34D' : '#34D399'} strokeWidth="1.4" fill="none" />
                                <line x1="11" y1="17" x2="19" y2="17" stroke={isClusterMatched ? '#FCD34D' : '#34D399'} strokeWidth="1.2" />
                                <text x="32" y="22" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace">
                                  {stat?.clusters.network.length || 0}
                                </text>
                                <text x="32" y="30" fill={isClusterMatched ? '#FCD34D' : '#94A3B8'} fontSize="7" fontWeight="500">
                                  {isClusterMatched ? 'MATCH' : 'NET/SW'}
                                </text>
                              </>
                            );
                          })()}
                        </g>
                      )}

                      {/* Printers & Scanners Cluster */}
                      {(selectedClusterFilter === 'all' || selectedClusterFilter === 'printers') && (
                        <g
                          transform={`translate(${width > 300 ? 140 : 0}, ${width > 300 ? 0 : 40})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedZoneId(zone.id);
                            setInspectedClusterType('printers');
                          }}
                          className="hover:opacity-100 opacity-90 transition"
                        >
                          {(() => {
                            const isClusterMatched =
                              hasSearchMatches && (zoneSearchEntry?.clusterCounts.printers || 0) > 0;
                            return (
                              <>
                                <rect
                                  width="64"
                                  height="34"
                                  rx="6"
                                  fill="#1e293b"
                                  stroke={isClusterMatched ? '#F59E0B' : '#334155'}
                                  strokeWidth={isClusterMatched ? 2 : 1}
                                />
                                <rect x="4" y="5" width="22" height="24" rx="4" fill="#F59E0B" opacity="0.25" />
                                <path
                                  d="M 10 12 L 20 12 L 20 16 L 10 16 Z M 9 16 L 21 16 L 21 21 L 9 21 Z M 11 21 L 19 21 L 19 24 L 11 24 Z"
                                  stroke={isClusterMatched ? '#FCD34D' : '#FBBF24'}
                                  strokeWidth="1.3"
                                  fill="none"
                                />
                                <text x="32" y="22" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace">
                                  {stat?.clusters.printers.length || 0}
                                </text>
                                <text x="32" y="30" fill={isClusterMatched ? '#FCD34D' : '#94A3B8'} fontSize="7" fontWeight="500">
                                  {isClusterMatched ? 'MATCH' : 'PRN/SCN'}
                                </text>
                              </>
                            );
                          })()}
                        </g>
                      )}

                      {/* UPS & Power Cluster */}
                      {(selectedClusterFilter === 'all' || selectedClusterFilter === 'ups') && (
                        <g
                          transform={`translate(${width > 300 ? 210 : 70}, ${width > 300 ? 0 : 40})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedZoneId(zone.id);
                            setInspectedClusterType('ups');
                          }}
                          className="hover:opacity-100 opacity-90 transition"
                        >
                          {(() => {
                            const isClusterMatched =
                              hasSearchMatches && (zoneSearchEntry?.clusterCounts.ups || 0) > 0;
                            return (
                              <>
                                <rect
                                  width="64"
                                  height="34"
                                  rx="6"
                                  fill="#1e293b"
                                  stroke={isClusterMatched ? '#F59E0B' : '#334155'}
                                  strokeWidth={isClusterMatched ? 2 : 1}
                                />
                                <rect x="4" y="5" width="22" height="24" rx="4" fill="#EC4899" opacity="0.25" />
                                <path
                                  d="M 16 9 L 10 17 L 15 17 L 14 24 L 20 16 L 15 16 Z"
                                  stroke={isClusterMatched ? '#FCD34D' : '#F472B6'}
                                  strokeWidth="1.3"
                                  fill="none"
                                />
                                <text x="32" y="22" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace">
                                  {stat?.clusters.ups.length || 0}
                                </text>
                                <text x="32" y="30" fill={isClusterMatched ? '#FCD34D' : '#94A3B8'} fontSize="7" fontWeight="500">
                                  {isClusterMatched ? 'MATCH' : 'UPS/KVA'}
                                </text>
                              </>
                            );
                          })()}
                        </g>
                      )}

                      {/* Servers Cluster */}
                      {width > 350 && (selectedClusterFilter === 'all' || selectedClusterFilter === 'servers') && (
                        <g
                          transform="translate(280, 0)"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedZoneId(zone.id);
                            setInspectedClusterType('servers');
                          }}
                          className="hover:opacity-100 opacity-90 transition"
                        >
                          {(() => {
                            const isClusterMatched =
                              hasSearchMatches && (zoneSearchEntry?.clusterCounts.servers || 0) > 0;
                            return (
                              <>
                                <rect
                                  width="64"
                                  height="34"
                                  rx="6"
                                  fill="#1e293b"
                                  stroke={isClusterMatched ? '#F59E0B' : '#334155'}
                                  strokeWidth={isClusterMatched ? 2 : 1}
                                />
                                <rect x="4" y="5" width="22" height="24" rx="4" fill="#8B5CF6" opacity="0.25" />
                                <rect x="8" y="10" width="14" height="4" rx="1" stroke={isClusterMatched ? '#FCD34D' : '#A78BFA'} strokeWidth="1.2" fill="none" />
                                <rect x="8" y="16" width="14" height="4" rx="1" stroke={isClusterMatched ? '#FCD34D' : '#A78BFA'} strokeWidth="1.2" fill="none" />
                                <text x="32" y="22" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace">
                                  {stat?.clusters.servers.length || 0}
                                </text>
                                <text x="32" y="30" fill={isClusterMatched ? '#FCD34D' : '#94A3B8'} fontSize="7" fontWeight="500">
                                  {isClusterMatched ? 'MATCH' : 'SRV/SAN'}
                                </text>
                              </>
                            );
                          })()}
                        </g>
                      )}
                    </g>

                    {/* Zone Footer Health Dots & Capacity Warnings */}
                    <g transform={`translate(${x + 12}, ${y + height - 16})`}>
                      <circle
                        cx="4"
                        cy="4"
                        r="3.5"
                        fill={isOvercrowded ? '#EF4444' : hasOffline ? '#EF4444' : hasWarning ? '#F59E0B' : '#10B981'}
                      />
                      <text
                        x="12"
                        y="7"
                        fill={isOvercrowded ? '#FCA5A5' : '#94A3B8'}
                        fontSize="8"
                        fontWeight={isOvercrowded ? '700' : '600'}
                      >
                        {isOvercrowded
                          ? `⚠️ Overcrowded: ${stat?.totalAssets} AST (> ${warningThreshold})`
                          : hasOffline
                          ? `${stat?.offlineAssets} Offline`
                          : hasWarning
                          ? `${stat?.warningAssets} Warning`
                          : '100% Online'}
                      </text>
                      {hasTickets && !isOvercrowded && (
                        <text x="80" y="7" fill="#F87171" fontSize="8" fontWeight="bold">
                          • {stat?.openTicketsCount} Open Ticket{stat?.openTicketsCount! > 1 ? 's' : ''}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* North Compass Rose */}
              <g transform="translate(860, 50)" opacity="0.7">
                <circle cx="0" cy="0" r="22" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <path d="M 0 -18 L 4 0 L -4 0 Z" fill="#EF4444" />
                <path d="M 0 18 L 4 0 L -4 0 Z" fill="#94A3B8" />
                <text x="0" y="-22" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                  N
                </text>
              </g>

              {/* Airfield Coordinates & Scale Metadata */}
              <g transform="translate(20, 680)" opacity="0.6">
                <text fill="#64748B" fontSize="9" fontFamily="monospace">
                  AIIAP • LAT: 31°31′17″N LON: 74°24′12″E • ELEV: 712 FT • RWY 36R/18L 3,360M
                </text>
              </g>
            </svg>

            {/* Quick Map Legend Overlay in Bottom Right */}
            <div className="absolute bottom-2 right-2 flex flex-wrap items-center gap-2 rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-1.5 text-[10px] text-slate-300 backdrop-blur-xs">
              <span className="font-bold text-slate-400">Map Legend:</span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Online</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Warning</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Offline</span>
              </span>
              {searchResults.isSearching && (
                <span className="flex items-center gap-1 text-amber-400 font-bold border-l border-slate-700 pl-2">
                  <span className="h-2 w-2 rounded-xs bg-amber-400" />
                  <span>Search Match</span>
                </span>
              )}
              {isWarningActive && (
                <span className="flex items-center gap-1 text-rose-400 font-bold border-l border-slate-700 pl-2">
                  <span className="h-2 w-2 rounded-xs bg-rose-500 animate-pulse" />
                  <span>Overcrowded (&gt; {warningThreshold})</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleDownloadMapPng}
                disabled={isExportingPng}
                className="flex items-center gap-1 border-l border-slate-700 pl-2 text-teal-400 hover:text-teal-200 font-bold transition disabled:opacity-50"
                title="Download Map PNG for Offline Reporting"
              >
                <Download className="h-3 w-3" />
                <span>Download PNG</span>
              </button>
            </div>

            {/* Offline Reporting PNG Download Confirmation Toast */}
            {pngExportSuccess && (
              <div className="absolute top-3 right-3 flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/90 px-3.5 py-2 text-xs font-semibold text-emerald-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Airfield map visualization downloaded as PNG for offline reporting</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Zone & Equipment Cluster Inspector Drawer */}
        {selectedZoneId && currentSelectedZone && (
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/95 p-4 flex flex-col justify-between max-h-[640px] overflow-hidden animate-in slide-in-from-right-4 duration-200">
            <div className="space-y-4 overflow-y-auto pr-1">
              {/* Header with Zone Info & Close */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-mono font-bold"
                      style={{
                        backgroundColor: `${currentSelectedZone.zone.accentColor}30`,
                        color: currentSelectedZone.zone.accentColor,
                        border: `1px solid ${currentSelectedZone.zone.accentColor}60`,
                      }}
                    >
                      {currentSelectedZone.zone.shortCode}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">
                      {currentSelectedZone.zone.category}
                    </span>
                  </div>
                  <h4 className="mt-1 font-bold text-sm text-white leading-tight">
                    {currentSelectedZone.zone.name}
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                    {currentSelectedZone.zone.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedZoneId(null);
                    setInspectedClusterType(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                  title="Close Inspector"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Active Search Filter Banner in Drawer if searching */}
              {searchResults.isSearching && (
                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  <div className="flex items-center gap-1.5 truncate">
                    <Search className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">
                      Filtering by <strong>&ldquo;{searchQuery}&rdquo;</strong> ({inspectedAssets.length} found)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="ml-2 font-bold text-amber-400 underline hover:text-white shrink-0 text-[11px]"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Overcrowding Warning Banner in Inspector Drawer */}
              {isWarningActive && currentSelectedZone.totalAssets > warningThreshold && (
                <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 p-3 text-rose-200 shadow-md animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-600/40 text-rose-300 border border-rose-500/50">
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-wide text-rose-300">
                        Overcrowded Zone Alert
                      </span>
                    </div>
                    <span className="rounded bg-rose-500/20 border border-rose-500/50 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-200">
                      +{currentSelectedZone.totalAssets - warningThreshold} Excess Assets
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-rose-200/90 leading-relaxed">
                    This zone houses <strong>{currentSelectedZone.totalAssets} monitored assets</strong>, exceeding your limit threshold of <strong>{warningThreshold} assets</strong>. Concentrated asset density in {currentSelectedZone.zone.shortCode} may create cooling bottlenecks, cabling congestion, or switch port saturation.
                  </p>

                  {/* Density Utilization Meter */}
                  <div className="mt-2.5 rounded-lg bg-slate-900/90 p-2 border border-rose-500/30">
                    <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-1">
                      <span>Density Utilization</span>
                      <span className="text-rose-400 font-bold">
                        {Math.round((currentSelectedZone.totalAssets / warningThreshold) * 100)}% ({currentSelectedZone.totalAssets} / {warningThreshold} limit)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((currentSelectedZone.totalAssets / warningThreshold) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Zone Metrics Bar */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold">Total Assets</span>
                  <p className="mt-0.5 text-base font-black text-white font-mono tabular-nums">
                    {currentSelectedZone.totalAssets}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-2.5 text-center">
                  <span className="text-[10px] text-emerald-400 font-semibold">Online Status</span>
                  <p className="mt-0.5 text-base font-black text-emerald-400 font-mono tabular-nums">
                    {Math.round(
                      (currentSelectedZone.onlineAssets / (currentSelectedZone.totalAssets || 1)) * 100
                    )}
                    %
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-2.5 text-center">
                  <span className="text-[10px] text-rose-400 font-semibold">Open Issues</span>
                  <p className="mt-0.5 text-base font-black text-rose-400 font-mono tabular-nums">
                    {currentSelectedZone.openTicketsCount}
                  </p>
                </div>
              </div>

              {/* Equipment Cluster Sub-Tabs */}
              <div>
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Equipment Clusters
                  </span>
                  {inspectedClusterType && (
                    <button
                      type="button"
                      onClick={() => setInspectedClusterType(null)}
                      className="text-[10px] text-teal-400 hover:underline"
                    >
                      Show All Clusters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {CLUSTER_CONFIG.map((c) => {
                    const Icon = c.icon;
                    const clusterCount = currentSelectedZone.clusters[c.key]?.length || 0;
                    const isSelected = inspectedClusterType === c.key;

                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() =>
                          setInspectedClusterType(isSelected ? null : c.key)
                        }
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                          isSelected
                            ? 'border-teal-400 bg-teal-500/20 text-white shadow-xs'
                            : 'border-slate-800 bg-slate-800/30 text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className="h-4 w-4 text-slate-300 mb-1" />
                        <span className="text-xs font-black font-mono tabular-nums text-white">
                          {clusterCount}
                        </span>
                        <span className="text-[9px] text-slate-400 truncate w-full mt-0.5">
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Equipment List in Zone */}
              <div>
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {inspectedClusterType
                      ? `${inspectedClusterType.toUpperCase()} (${inspectedAssets.length})`
                      : `Zone Assets (${inspectedAssets.length})`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {inspectedAssets.length} found
                  </span>
                </div>

                {inspectedAssets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                    <p className="font-semibold">No equipment found matching criteria.</p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-teal-400 hover:underline"
                      >
                        Clear search query
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {inspectedAssets.map((asset) => {
                      const sn = asset.serialNumber || '';
                      const isSerialMatched =
                        searchQuery.trim() &&
                        sn.toLowerCase().includes(searchQuery.trim().toLowerCase());

                      return (
                        <div
                          key={asset.id}
                          onClick={() => onSelectAsset(asset)}
                          className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition cursor-pointer group ${
                            isSerialMatched
                              ? 'border-amber-500/60 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-500/20'
                              : 'border-slate-800/80 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`h-2 w-2 rounded-full shrink-0 ${
                                  asset.pingStatus === 'Online'
                                    ? 'bg-emerald-500'
                                    : asset.pingStatus === 'Warning'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              <span className="font-bold text-white truncate group-hover:text-teal-300">
                                <HighlightedText text={asset.name} query={searchQuery} />
                              </span>
                            </div>

                            {/* Serial Number & Identifiers */}
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                              <span
                                className={`flex items-center gap-1 font-mono ${
                                  isSerialMatched ? 'text-amber-300 font-bold' : 'text-slate-300'
                                }`}
                              >
                                <Barcode className="h-3 w-3 text-slate-400" />
                                <span>SN: </span>
                                <span>
                                  <HighlightedText
                                    text={sn || 'N/A'}
                                    query={searchQuery}
                                  />
                                </span>
                              </span>

                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-slate-400">{asset.assetTag}</span>

                              <span aria-hidden="true">·</span>
                              <span>{asset.department}</span>

                              {asset.systemSpecs?.ipAddress && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono text-teal-400">
                                    {asset.systemSpecs.ipAddress}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                asset.status === 'Active'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : asset.status === 'Spare'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {asset.status}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Inspector Footer */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Click any asset to open full telemetry sheet
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedZoneId(null);
                  setInspectedClusterType(null);
                }}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                Close Panel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
