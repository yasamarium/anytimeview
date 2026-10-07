export const ADMIN_PASSKEY = '123as';
export const ADMIN_COOKIE_NAME = 'anytimeview_admin_session';
export const ADMIN_COOKIE_VALUE = 'av_authenticated_node_master';

export interface ClusterNode {
  id: string;
  name: string;
  location: string;
  region: string;
  lat: number;
  lng: number;
  status: 'active' | 'syncing' | 'healthy';
  pingMs: number;
  role: string;
  uptime: string;
  storageProtocol: string;
  description: string;
}

export const CLUSTER_NODES: ClusterNode[] = [
  {
    id: 'node-kolkata',
    name: 'Kolkata Edge Cluster',
    location: 'Kolkata, India',
    region: 'South Asia / APAC',
    lat: 22.5726,
    lng: 88.3639,
    status: 'active',
    pingMs: 14,
    role: 'Primary Ingestion Hub & Edge CDN Sync',
    uptime: '99.99%',
    storageProtocol: 'High-Throughput Geo-Replication Protocol (v4.2)',
    description: 'Handles lightning-fast media buffering, low-latency streaming across Asia and direct byte distribution.',
  },
  {
    id: 'node-israel',
    name: 'Israel Security Gateway',
    location: 'Tel Aviv, Israel',
    region: 'Middle East / EMEA',
    lat: 31.7683,
    lng: 35.2137,
    status: 'active',
    pingMs: 24,
    role: 'Cryptographic Ledger & Object Vault',
    uptime: '100.00%',
    storageProtocol: 'Zero-Knowledge Distributed Blob Storage (ZK-DS)',
    description: 'Enforces payload immutability, access-token verification, and high-security file replication across Europe and the Middle East.',
  },
  {
    id: 'node-us',
    name: 'US Central Enterprise Node',
    location: 'Virginia, United States',
    region: 'North America / Atlantic Core',
    lat: 38.0307,
    lng: -78.4769,
    status: 'active',
    pingMs: 36,
    role: 'Global Failover & High-Bandwidth Media Edge',
    uptime: '99.98%',
    storageProtocol: 'Multi-Region Distributed Object Ledger',
    description: 'Provides long-term distributed durability, transatlantic backbone bandwidth, and redundant global failover snapshots.',
  },
];
