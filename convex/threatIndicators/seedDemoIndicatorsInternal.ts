import {
  internalMutation,
} from "@convex/_generated/server";
import {
  THREAT_INDICATOR_STATUSES,
  getThreatIndicatorDuplicateByTypeAndNormalizedValue,
  type ThreatIndicatorSeverity,
  type ThreatIndicatorType,
  validateThreatIndicatorPayload,
} from "@convex/threatIndicators/helpers";

type SimulatedThreatIndicatorSeed = {
  confidence: number;
  description: string | null;
  severity: ThreatIndicatorSeverity;
  source: string | null;
  type: ThreatIndicatorType;
  value: string;
};

const SYSTEM_SEED_USER_ID = "system-seed";
const SYSTEM_SEED_EMAIL = "system@acadthreat.local";

const SIMULATED_SOURCE_LABELS = {
  ipReputation: "Simulated Feed - IP Reputation",
  communityThreatIntel: "Simulated Feed - Community Threat Intel",
  malwareUrlIntelligence: "Simulated Feed - Malware URL Intelligence",
  phishingIntelligence: "Simulated Feed - Phishing Intelligence",
  structuredIocRepository: "Simulated Feed - Structured IoC Repository",
} as const;

const SIMULATED_INDICATOR_SEEDS: SimulatedThreatIndicatorSeed[] = [
  {
    value: "192.0.2.12",
    type: "ip",
    severity: "medium",
    confidence: 71,
    source: SIMULATED_SOURCE_LABELS.ipReputation,
    description:
      "Simulated demo indicator for repeated credential stuffing attempts against a campus portal.",
  },
  {
    value: "192.0.2.45",
    type: "ip",
    severity: "high",
    confidence: 86,
    source: SIMULATED_SOURCE_LABELS.ipReputation,
    description:
      "Simulated demo indicator associated with aggressive password spray behavior in an academic network segment.",
  },
  {
    value: "198.51.100.8",
    type: "ip",
    severity: "low",
    confidence: 42,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo community-reported source with low-confidence reconnaissance activity.",
  },
  {
    value: "198.51.100.27",
    type: "ip",
    severity: "critical",
    confidence: 95,
    source: SIMULATED_SOURCE_LABELS.ipReputation,
    description:
      "Simulated demo high-risk address linked to repeated malicious access attempts against remote services.",
  },
  {
    value: "198.51.100.61",
    type: "ip",
    severity: "medium",
    confidence: 64,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo indicator for suspicious traffic pivoting across student-facing application endpoints.",
  },
  {
    value: "198.51.100.143",
    type: "ip",
    severity: "high",
    confidence: 83,
    source: SIMULATED_SOURCE_LABELS.structuredIocRepository,
    description:
      "Simulated demo structured IoC entry for an address observed in malicious infrastructure clustering.",
  },
  {
    value: "203.0.113.17",
    type: "ip",
    severity: "low",
    confidence: 35,
    source: SIMULATED_SOURCE_LABELS.ipReputation,
    description:
      "Simulated demo low-confidence IP reputation record retained for analyst review exercises.",
  },
  {
    value: "203.0.113.45",
    type: "ip",
    severity: "high",
    confidence: 86,
    source: SIMULATED_SOURCE_LABELS.ipReputation,
    description:
      "Simulated demo indicator for repeated brute-force login attempts against an academic portal.",
  },
  {
    value: "203.0.113.92",
    type: "ip",
    severity: "critical",
    confidence: 97,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo community CTI record for a source tied to coordinated hostile scanning activity.",
  },
  {
    value: "203.0.113.188",
    type: "ip",
    severity: "medium",
    confidence: 58,
    source: SIMULATED_SOURCE_LABELS.structuredIocRepository,
    description:
      "Simulated demo repository indicator for suspicious repeated connections to restricted admin surfaces.",
  },
  {
    value: "credential-reset-campus.test",
    type: "domain",
    severity: "critical",
    confidence: 91,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo phishing domain targeting academic account recovery workflows.",
  },
  {
    value: "campus-library-auth.test",
    type: "domain",
    severity: "high",
    confidence: 84,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo domain crafted to imitate a campus library authentication portal.",
  },
  {
    value: "student-mail-security.test",
    type: "domain",
    severity: "medium",
    confidence: 66,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo mixed-source domain indicator for phishing lure infrastructure.",
  },
  {
    value: "malware-hosting-node.test",
    type: "domain",
    severity: "critical",
    confidence: 94,
    source: SIMULATED_SOURCE_LABELS.malwareUrlIntelligence,
    description:
      "Simulated demo domain associated with staged malware download pages.",
  },
  {
    value: "exam-results-verify.test",
    type: "domain",
    severity: "medium",
    confidence: 62,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo lure domain themed around student grade verification.",
  },
  {
    value: "vpn-access-update.test",
    type: "domain",
    severity: "high",
    confidence: 79,
    source: SIMULATED_SOURCE_LABELS.structuredIocRepository,
    description:
      "Simulated demo repository domain linked to credential collection campaigns.",
  },
  {
    value: "research-share-sync.test",
    type: "domain",
    severity: "low",
    confidence: 33,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo low-confidence domain retained for enrichment and analyst triage practice.",
  },
  {
    value: "faculty-portal-notice.test",
    type: "domain",
    severity: "high",
    confidence: 81,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo phishing domain themed around faculty administrative notices.",
  },
  {
    value: "https://malware-download-campus.test/payload.exe",
    type: "url",
    severity: "critical",
    confidence: 94,
    source: SIMULATED_SOURCE_LABELS.malwareUrlIntelligence,
    description:
      "Simulated demo malware delivery URL used for dashboard testing.",
  },
  {
    value: "https://credential-reset-campus.test/login",
    type: "url",
    severity: "critical",
    confidence: 92,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo phishing landing URL for credential harvesting exercises.",
  },
  {
    value: "https://student-mail-security.test/webmail",
    type: "url",
    severity: "high",
    confidence: 80,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo impersonation URL themed around student email access.",
  },
  {
    value: "https://malware-hosting-node.test/update.bin",
    type: "url",
    severity: "high",
    confidence: 88,
    source: SIMULATED_SOURCE_LABELS.malwareUrlIntelligence,
    description:
      "Simulated demo binary staging URL representing hosted malware artifacts.",
  },
  {
    value: "https://vpn-access-update.test/secure-check",
    type: "url",
    severity: "medium",
    confidence: 69,
    source: SIMULATED_SOURCE_LABELS.structuredIocRepository,
    description:
      "Simulated demo URL linked to suspicious remote-access verification prompts.",
  },
  {
    value: "https://faculty-portal-notice.test/review",
    type: "url",
    severity: "medium",
    confidence: 63,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo URL collected from mixed CTI reports for review workflow testing.",
  },
  {
    value: "https://exam-results-verify.test/results.pdf",
    type: "url",
    severity: "low",
    confidence: 41,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo low-confidence lure URL themed around student exam result delivery.",
  },
  {
    value: "https://research-share-sync.test/connector",
    type: "url",
    severity: "medium",
    confidence: 57,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo collaboration-themed URL retained for future correlation testing.",
  },
  {
    value: "4d967df3f0a6c42b37e4d1c8a5e9f012",
    type: "hash",
    severity: "medium",
    confidence: 72,
    source: SIMULATED_SOURCE_LABELS.structuredIocRepository,
    description:
      "Simulated demo malware hash indicator for structured IoC testing.",
  },
  {
    value: "9b1c0f4a8d7e6b3c2a1f0e9d8c7b6a5f",
    type: "hash",
    severity: "low",
    confidence: 38,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo low-confidence hash collected from community malware chatter.",
  },
  {
    value: "1f3e5d7c9b0a2c4e6f8a1b3d5f7a9c0e1d2f3a4b",
    type: "hash",
    severity: "high",
    confidence: 85,
    source: SIMULATED_SOURCE_LABELS.malwareUrlIntelligence,
    description:
      "Simulated demo file hash associated with staged downloader infrastructure.",
  },
  {
    value: "abcdef0123456789fedcba9876543210abcdef01",
    type: "hash",
    severity: "medium",
    confidence: 67,
    source: SIMULATED_SOURCE_LABELS.structuredIocRepository,
    description:
      "Simulated demo structured-repository hash used in academic malware scenario testing.",
  },
  {
    value: "7f6e5d4c3b2a1908ffeeddccbbaa99887766554433221100ffeeddccbbaa9988",
    type: "hash",
    severity: "critical",
    confidence: 96,
    source: SIMULATED_SOURCE_LABELS.malwareUrlIntelligence,
    description:
      "Simulated demo high-confidence malware sample hash for analyst workflow exercises.",
  },
  {
    value: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
    type: "hash",
    severity: "high",
    confidence: 82,
    source: SIMULATED_SOURCE_LABELS.structuredIocRepository,
    description:
      "Simulated demo repository hash mapped to suspicious payload exchange patterns.",
  },
  {
    value: "89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567",
    type: "hash",
    severity: "medium",
    confidence: 61,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo shared hash for mixed CTI enrichment and matching workflows.",
  },
  {
    value: "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
    type: "hash",
    severity: "low",
    confidence: 29,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo low-confidence hash retained to exercise analyst review behavior.",
  },
  {
    value: "alerts@phishing-university.test",
    type: "email",
    severity: "medium",
    confidence: 68,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo sender address used in credential phishing awareness testing.",
  },
  {
    value: "accounts@credential-reset-campus.test",
    type: "email",
    severity: "critical",
    confidence: 93,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo email sender tied to high-confidence account recovery phishing scenarios.",
  },
  {
    value: "support@student-mail-security.test",
    type: "email",
    severity: "high",
    confidence: 81,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo sender crafted to imitate student email support operations.",
  },
  {
    value: "notice@faculty-portal-notice.test",
    type: "email",
    severity: "medium",
    confidence: 64,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo faculty notice sender retained for mixed-source phishing analysis drills.",
  },
  {
    value: "sync@research-share-sync.test",
    type: "email",
    severity: "low",
    confidence: 37,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo low-confidence sender themed around research collaboration syncing.",
  },
  {
    value: "deliveries@malware-hosting-node.test",
    type: "email",
    severity: "high",
    confidence: 77,
    source: SIMULATED_SOURCE_LABELS.malwareUrlIntelligence,
    description:
      "Simulated demo sender address linked to malware delivery lure messaging.",
  },
  {
    value: "alerts@vpn-access-update.test",
    type: "email",
    severity: "medium",
    confidence: 59,
    source: SIMULATED_SOURCE_LABELS.structuredIocRepository,
    description:
      "Simulated demo sender retained for remote-access themed IoC repository testing.",
  },
  {
    value: "registrar@exam-results-verify.test",
    type: "email",
    severity: "critical",
    confidence: 90,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo sender spoofing registrar-style messaging to lure academic users.",
  },
  {
    value: "multiple failed login attempts from same source",
    type: "keyword",
    severity: "high",
    confidence: 82,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo behavioral keyword used for later correlation with authentication logs.",
  },
  {
    value: "unexpected powershell encoded command execution",
    type: "keyword",
    severity: "critical",
    confidence: 89,
    source: SIMULATED_SOURCE_LABELS.structuredIocRepository,
    description:
      "Simulated demo behavior phrase for suspicious script execution telemetry matching.",
  },
  {
    value: "repeated vpn login from unfamiliar academic geography",
    type: "keyword",
    severity: "medium",
    confidence: 63,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo user-behavior phrase for remote access anomaly review exercises.",
  },
  {
    value: "suspicious attachment delivery with password-protected archive",
    type: "keyword",
    severity: "high",
    confidence: 78,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo phishing behavior signature associated with protected archive delivery.",
  },
  {
    value: "new outbound connection to recently observed malware host",
    type: "keyword",
    severity: "critical",
    confidence: 92,
    source: SIMULATED_SOURCE_LABELS.malwareUrlIntelligence,
    description:
      "Simulated demo network behavior phrase for malware-host communication scenarios.",
  },
  {
    value: "credential harvesting theme in student portal messages",
    type: "keyword",
    severity: "medium",
    confidence: 69,
    source: SIMULATED_SOURCE_LABELS.phishingIntelligence,
    description:
      "Simulated demo phishing narrative indicator for themed email and portal impersonation.",
  },
  {
    value: "unexpected compressed executable in shared research workspace",
    type: "keyword",
    severity: "high",
    confidence: 76,
    source: SIMULATED_SOURCE_LABELS.structuredIocRepository,
    description:
      "Simulated demo collaboration-platform behavior phrase for file-sharing detection scenarios.",
  },
  {
    value: "low-volume reconnaissance against exposed academic service",
    type: "keyword",
    severity: "low",
    confidence: 31,
    source: SIMULATED_SOURCE_LABELS.communityThreatIntel,
    description:
      "Simulated demo low-confidence reconnaissance phrase for analyst triage training.",
  },
];

export const insertDemoThreatIndicators = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    let skipped = 0;

    for (const seedRecord of SIMULATED_INDICATOR_SEEDS) {
      const validation = validateThreatIndicatorPayload(seedRecord);

      if (!validation.isValid) {
        skipped += 1;
        continue;
      }

      const duplicate =
        await getThreatIndicatorDuplicateByTypeAndNormalizedValue(ctx, {
          normalizedValue: validation.data.normalizedValue,
          type: validation.data.type,
        });

      if (duplicate) {
        skipped += 1;
        continue;
      }

      const now = Date.now();

      await ctx.db.insert("threatIndicators", {
        confidence: validation.data.confidence,
        createdAt: now,
        createdByEmail: SYSTEM_SEED_EMAIL,
        createdByUserId: SYSTEM_SEED_USER_ID,
        description: validation.data.description,
        normalizedValue: validation.data.normalizedValue,
        severity: validation.data.severity,
        source: validation.data.source,
        status: THREAT_INDICATOR_STATUSES.active,
        type: validation.data.type,
        updatedAt: now,
        updatedByEmail: SYSTEM_SEED_EMAIL,
        updatedByUserId: SYSTEM_SEED_USER_ID,
        value: validation.data.value,
      });

      inserted += 1;
    }

    return {
      inserted,
      skipped,
      total: SIMULATED_INDICATOR_SEEDS.length,
    } as const;
  },
});
