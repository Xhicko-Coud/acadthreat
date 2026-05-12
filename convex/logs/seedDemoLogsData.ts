// ---------------------------------------------------------------------------
// Simulated Log Seed Data for Module 04 V1
// ---------------------------------------------------------------------------
//
// Contains exactly 40 static simulated log records:
// - 24 authentication logs
// - 16 firewall logs
//
// All records use:
// - Documentation-safe IP ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24)
// - Demo-safe usernames (student.demo, staff.demo, admin.demo, library.demo, finance.demo)
// - .test domains only
// - No real personal data, passwords, tokens, or secrets
// - isSimulated: true on every record
//
// Payloads match the field names expected by the existing normalizers:
// - Authentication: eventType, timestamp, username, srcIp, userAgent, outcome, message
// - Firewall: eventType, timestamp, srcIp, destIp, srcPort, destPort, protocol, action, outcome, message
// ---------------------------------------------------------------------------

export type SimulatedLogSeed = {
  sourceType: "authentication" | "firewall";
  sourceName: string;
  eventTimestamp: number;
  payload: string;
  clientId: string;
  isSimulated: true;
};

const DEMO_CLIENT_ID = "acadthreat-seed-v1";
const DEMO_USER_AGENT = "AcadThreatDemoBrowser/1.0";

// Base timestamp: 2026-05-10T08:00:00.000Z
const BASE_TS = 1778515200000;

function ts(offsetMinutes: number): number {
  return BASE_TS + offsetMinutes * 60_000;
}

// ---------------------------------------------------------------------------
// Authentication Seeds (24 records)
// ---------------------------------------------------------------------------

const authenticationSeeds: SimulatedLogSeed[] = [
  // --- login_success (6 records) ---
  {
    sourceType: "authentication",
    sourceName: "sshd-campus-gateway",
    eventTimestamp: ts(0),
    payload: JSON.stringify({
      eventType: "login_success",
      timestamp: ts(0),
      username: "student.demo",
      srcIp: "203.0.113.10",
      userAgent: DEMO_USER_AGENT,
      outcome: "success",
      message: "Simulated successful SSH login from campus workstation.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "portal-auth-service",
    eventTimestamp: ts(5),
    payload: JSON.stringify({
      eventType: "login_success",
      timestamp: ts(5),
      username: "staff.demo",
      srcIp: "203.0.113.22",
      userAgent: DEMO_USER_AGENT,
      outcome: "success",
      message: "Simulated successful portal login for staff account.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "webmail-auth",
    eventTimestamp: ts(12),
    payload: JSON.stringify({
      eventType: "login_success",
      timestamp: ts(12),
      username: "admin.demo",
      srcIp: "192.0.2.15",
      userAgent: DEMO_USER_AGENT,
      outcome: "success",
      message: "Simulated successful webmail authentication for admin user.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "library-catalog-auth",
    eventTimestamp: ts(18),
    payload: JSON.stringify({
      eventType: "login_success",
      timestamp: ts(18),
      username: "library.demo",
      srcIp: "198.51.100.33",
      userAgent: DEMO_USER_AGENT,
      outcome: "success",
      message: "Simulated successful library catalog login.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "vpn-auth-gateway",
    eventTimestamp: ts(25),
    payload: JSON.stringify({
      eventType: "login_success",
      timestamp: ts(25),
      username: "finance.demo",
      srcIp: "203.0.113.55",
      userAgent: DEMO_USER_AGENT,
      outcome: "success",
      message: "Simulated successful VPN login for finance department user.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "portal-auth-service",
    eventTimestamp: ts(30),
    payload: JSON.stringify({
      eventType: "login_success",
      timestamp: ts(30),
      username: "student.demo",
      srcIp: "192.0.2.42",
      userAgent: DEMO_USER_AGENT,
      outcome: "success",
      message: "Simulated successful second portal login from different workstation.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },

  // --- login_failed (8 records) ---
  {
    sourceType: "authentication",
    sourceName: "sshd-campus-gateway",
    eventTimestamp: ts(35),
    payload: JSON.stringify({
      eventType: "login_failed",
      timestamp: ts(35),
      username: "student.demo",
      srcIp: "203.0.113.45",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated failed SSH login attempt with incorrect credentials.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "portal-auth-service",
    eventTimestamp: ts(36),
    payload: JSON.stringify({
      eventType: "login_failed",
      timestamp: ts(36),
      username: "student.demo",
      srcIp: "203.0.113.45",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated repeated failed portal login from same source.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "portal-auth-service",
    eventTimestamp: ts(37),
    payload: JSON.stringify({
      eventType: "login_failed",
      timestamp: ts(37),
      username: "student.demo",
      srcIp: "203.0.113.45",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated third consecutive failed portal login attempt.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "webmail-auth",
    eventTimestamp: ts(40),
    payload: JSON.stringify({
      eventType: "login_failed",
      timestamp: ts(40),
      username: "staff.demo",
      srcIp: "198.51.100.88",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated failed webmail login from unfamiliar address.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "sshd-campus-gateway",
    eventTimestamp: ts(42),
    payload: JSON.stringify({
      eventType: "login_failed",
      timestamp: ts(42),
      username: "admin.demo",
      srcIp: "198.51.100.101",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated failed SSH login targeting admin account from external source.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "vpn-auth-gateway",
    eventTimestamp: ts(50),
    payload: JSON.stringify({
      eventType: "login_failed",
      timestamp: ts(50),
      username: "finance.demo",
      srcIp: "203.0.113.77",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated failed VPN login attempt for finance user.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "library-catalog-auth",
    eventTimestamp: ts(55),
    payload: JSON.stringify({
      eventType: "login_failed",
      timestamp: ts(55),
      username: "library.demo",
      srcIp: "192.0.2.200",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated failed library catalog login from shared terminal.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "portal-auth-service",
    eventTimestamp: ts(58),
    payload: JSON.stringify({
      eventType: "login_failed",
      timestamp: ts(58),
      username: "admin.demo",
      srcIp: "203.0.113.92",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated brute-force login attempt against admin portal.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },

  // --- account_lockout (5 records) ---
  {
    sourceType: "authentication",
    sourceName: "portal-auth-service",
    eventTimestamp: ts(38),
    payload: JSON.stringify({
      eventType: "account_lockout",
      timestamp: ts(38),
      username: "student.demo",
      srcIp: "203.0.113.45",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated account lockout after repeated failed login attempts.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "sshd-campus-gateway",
    eventTimestamp: ts(60),
    payload: JSON.stringify({
      eventType: "account_lockout",
      timestamp: ts(60),
      username: "admin.demo",
      srcIp: "203.0.113.92",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated admin account lockout due to suspicious login activity.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "webmail-auth",
    eventTimestamp: ts(65),
    payload: JSON.stringify({
      eventType: "account_lockout",
      timestamp: ts(65),
      username: "staff.demo",
      srcIp: "198.51.100.88",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated staff account lockout on webmail service.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "vpn-auth-gateway",
    eventTimestamp: ts(70),
    payload: JSON.stringify({
      eventType: "account_lockout",
      timestamp: ts(70),
      username: "finance.demo",
      srcIp: "203.0.113.77",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated finance user VPN account lockout.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "library-catalog-auth",
    eventTimestamp: ts(75),
    payload: JSON.stringify({
      eventType: "account_lockout",
      timestamp: ts(75),
      username: "library.demo",
      srcIp: "192.0.2.200",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated library service account lockout from shared terminal.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },

  // --- password_reset_attempt (5 records) ---
  {
    sourceType: "authentication",
    sourceName: "portal-auth-service",
    eventTimestamp: ts(39),
    payload: JSON.stringify({
      eventType: "password_reset_attempt",
      timestamp: ts(39),
      username: "student.demo",
      srcIp: "203.0.113.45",
      userAgent: DEMO_USER_AGENT,
      outcome: "success",
      message: "Simulated password reset after account lockout.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "portal-auth-service",
    eventTimestamp: ts(62),
    payload: JSON.stringify({
      eventType: "password_reset_attempt",
      timestamp: ts(62),
      username: "admin.demo",
      srcIp: "192.0.2.15",
      userAgent: DEMO_USER_AGENT,
      outcome: "success",
      message: "Simulated admin password reset from trusted workstation.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "webmail-auth",
    eventTimestamp: ts(67),
    payload: JSON.stringify({
      eventType: "password_reset_attempt",
      timestamp: ts(67),
      username: "staff.demo",
      srcIp: "198.51.100.88",
      userAgent: DEMO_USER_AGENT,
      outcome: "failure",
      message: "Simulated failed password reset attempt from unfamiliar source.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "vpn-auth-gateway",
    eventTimestamp: ts(72),
    payload: JSON.stringify({
      eventType: "password_reset_attempt",
      timestamp: ts(72),
      username: "finance.demo",
      srcIp: "203.0.113.55",
      userAgent: DEMO_USER_AGENT,
      outcome: "success",
      message: "Simulated VPN password reset for finance department user.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "authentication",
    sourceName: "library-catalog-auth",
    eventTimestamp: ts(78),
    payload: JSON.stringify({
      eventType: "password_reset_attempt",
      timestamp: ts(78),
      username: "library.demo",
      srcIp: "198.51.100.33",
      userAgent: DEMO_USER_AGENT,
      outcome: "success",
      message: "Simulated library account password reset from known terminal.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
];

// ---------------------------------------------------------------------------
// Firewall Seeds (16 records)
// ---------------------------------------------------------------------------

const firewallSeeds: SimulatedLogSeed[] = [
  // --- connection_allowed (4 records) ---
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-01",
    eventTimestamp: ts(1),
    payload: JSON.stringify({
      eventType: "connection_allowed",
      timestamp: ts(1),
      srcIp: "192.0.2.15",
      destIp: "198.51.100.80",
      srcPort: 52100,
      destPort: 443,
      protocol: "TCP",
      action: "allow",
      outcome: "allowed",
      message: "Simulated allowed HTTPS connection to campus web server.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-01",
    eventTimestamp: ts(8),
    payload: JSON.stringify({
      eventType: "connection_allowed",
      timestamp: ts(8),
      srcIp: "203.0.113.22",
      destIp: "192.0.2.50",
      srcPort: 48200,
      destPort: 80,
      protocol: "TCP",
      action: "allow",
      outcome: "allowed",
      message: "Simulated allowed HTTP connection from staff workstation.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-02",
    eventTimestamp: ts(20),
    payload: JSON.stringify({
      eventType: "connection_allowed",
      timestamp: ts(20),
      srcIp: "198.51.100.33",
      destIp: "192.0.2.100",
      srcPort: 55000,
      destPort: 8080,
      protocol: "TCP",
      action: "allow",
      outcome: "allowed",
      message: "Simulated allowed internal API connection from library system.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-01",
    eventTimestamp: ts(28),
    payload: JSON.stringify({
      eventType: "connection_allowed",
      timestamp: ts(28),
      srcIp: "203.0.113.55",
      destIp: "198.51.100.10",
      srcPort: 61200,
      destPort: 443,
      protocol: "TCP",
      action: "allow",
      outcome: "allowed",
      message: "Simulated allowed VPN tunnel to secure finance endpoint.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },

  // --- connection_blocked (5 records) ---
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-01",
    eventTimestamp: ts(33),
    payload: JSON.stringify({
      eventType: "connection_blocked",
      timestamp: ts(33),
      srcIp: "198.51.100.17",
      destIp: "192.0.2.25",
      srcPort: 49152,
      destPort: 22,
      protocol: "TCP",
      action: "block",
      outcome: "blocked",
      message: "Simulated blocked SSH connection from external source.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-02",
    eventTimestamp: ts(41),
    payload: JSON.stringify({
      eventType: "connection_blocked",
      timestamp: ts(41),
      srcIp: "203.0.113.92",
      destIp: "192.0.2.25",
      srcPort: 50100,
      destPort: 3389,
      protocol: "TCP",
      action: "block",
      outcome: "blocked",
      message: "Simulated blocked RDP connection from suspicious external address.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-01",
    eventTimestamp: ts(48),
    payload: JSON.stringify({
      eventType: "connection_blocked",
      timestamp: ts(48),
      srcIp: "198.51.100.143",
      destIp: "192.0.2.10",
      srcPort: 43200,
      destPort: 445,
      protocol: "TCP",
      action: "block",
      outcome: "blocked",
      message: "Simulated blocked SMB connection from known threat source.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-02",
    eventTimestamp: ts(53),
    payload: JSON.stringify({
      eventType: "connection_blocked",
      timestamp: ts(53),
      srcIp: "203.0.113.188",
      destIp: "198.51.100.80",
      srcPort: 47800,
      destPort: 1433,
      protocol: "TCP",
      action: "block",
      outcome: "blocked",
      message: "Simulated blocked SQL Server connection attempt from external address.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-01",
    eventTimestamp: ts(57),
    payload: JSON.stringify({
      eventType: "connection_blocked",
      timestamp: ts(57),
      srcIp: "198.51.100.61",
      destIp: "192.0.2.25",
      srcPort: 39000,
      destPort: 8443,
      protocol: "TCP",
      action: "block",
      outcome: "blocked",
      message: "Simulated blocked HTTPS management port connection.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },

  // --- connection_denied (3 records) ---
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-01",
    eventTimestamp: ts(63),
    payload: JSON.stringify({
      eventType: "connection_denied",
      timestamp: ts(63),
      srcIp: "203.0.113.45",
      destIp: "192.0.2.1",
      srcPort: 51000,
      destPort: 23,
      protocol: "TCP",
      action: "deny",
      outcome: "denied",
      message: "Simulated denied Telnet connection to gateway router.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-02",
    eventTimestamp: ts(68),
    payload: JSON.stringify({
      eventType: "connection_denied",
      timestamp: ts(68),
      srcIp: "198.51.100.27",
      destIp: "192.0.2.50",
      srcPort: 44500,
      destPort: 161,
      protocol: "UDP",
      action: "deny",
      outcome: "denied",
      message: "Simulated denied SNMP connection from high-risk external source.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-01",
    eventTimestamp: ts(73),
    payload: JSON.stringify({
      eventType: "connection_denied",
      timestamp: ts(73),
      srcIp: "203.0.113.77",
      destIp: "198.51.100.10",
      srcPort: 38700,
      destPort: 5432,
      protocol: "TCP",
      action: "deny",
      outcome: "denied",
      message: "Simulated denied PostgreSQL connection from unauthorized source.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },

  // --- suspicious_port_scan (4 records) ---
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-01",
    eventTimestamp: ts(44),
    payload: JSON.stringify({
      eventType: "suspicious_port_scan",
      timestamp: ts(44),
      srcIp: "203.0.113.92",
      destIp: "192.0.2.0",
      srcPort: 60000,
      destPort: 0,
      protocol: "TCP",
      action: "block",
      outcome: "blocked",
      message: "Simulated port scan detected across campus subnet from external address.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-02",
    eventTimestamp: ts(52),
    payload: JSON.stringify({
      eventType: "suspicious_port_scan",
      timestamp: ts(52),
      srcIp: "198.51.100.27",
      destIp: "192.0.2.0",
      srcPort: 59000,
      destPort: 0,
      protocol: "TCP",
      action: "block",
      outcome: "blocked",
      message: "Simulated aggressive port scan from high-risk source targeting campus network.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-01",
    eventTimestamp: ts(64),
    payload: JSON.stringify({
      eventType: "suspicious_port_scan",
      timestamp: ts(64),
      srcIp: "198.51.100.143",
      destIp: "198.51.100.0",
      srcPort: 57000,
      destPort: 0,
      protocol: "TCP",
      action: "block",
      outcome: "blocked",
      message: "Simulated slow port scan across academic service subnet.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
  {
    sourceType: "firewall",
    sourceName: "pfsense-fw-02",
    eventTimestamp: ts(76),
    payload: JSON.stringify({
      eventType: "suspicious_port_scan",
      timestamp: ts(76),
      srcIp: "203.0.113.188",
      destIp: "192.0.2.0",
      srcPort: 62000,
      destPort: 0,
      protocol: "TCP",
      action: "block",
      outcome: "blocked",
      message: "Simulated reconnaissance scan targeting campus infrastructure.",
    }),
    clientId: DEMO_CLIENT_ID,
    isSimulated: true,
  },
];

// ---------------------------------------------------------------------------
// Combined Dataset (40 records total)
// ---------------------------------------------------------------------------

export const SIMULATED_LOG_SEEDS: SimulatedLogSeed[] = [
  ...authenticationSeeds,
  ...firewallSeeds,
];
