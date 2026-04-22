import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import { MOCK_USERS, MOCK_EVENTS, CATEGORY_ICONS } from "@/data/mockData";

const GOLD = "#C9A84C";

export function Stats() {
  const byCategory = Object.entries(
    MOCK_EVENTS.reduce((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([cat, count]) => ({ cat, count })).sort((a, b) => b.count - a.count);

  const topUsers = [...MOCK_USERS].sort((a, b) => b.points - a.points).slice(0, 5);

  const radarData = [
    { metric: "Points moy.", val: Math.round(MOCK_USERS.reduce((s, u) => s + u.points, 0) / MOCK_USERS.length) / 100 * 10 },
    { metric: "Participations", val: Math.round(MOCK_USERS.reduce((s, u) => s + u.eventsAttended, 0) / MOCK_USERS.length * 10) },
    { metric: "Parrainages", val: Math.round(MOCK_USERS.reduce((s, u) => s + u.referralCount, 0) / MOCK_USERS.length * 20) },
    { metric: "Taux NFC", val: Math.round(MOCK_USERS.filter(u => u.nfcCardTier !== "none").length / MOCK_USERS.length * 100) },
    { metric: "Créateurs", val: Math.round(MOCK_USERS.filter(u => u.eventsCreated > 0).length / MOCK_USERS.length * 100) },
  ];

  const COLORS = [GOLD, "#6AAFD8", "#50C878", "#FF9F40", "#D0D0D0", "#A78BFA", "#F472B6"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Statistiques</h1>
        <p className="text-muted-foreground text-sm mt-1">Métriques d'engagement et de performance</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Profil d'engagement moyen</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(220,13%,20%)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#888" }} />
              <Radar name="Engagement" dataKey="val" stroke={GOLD} fill={GOLD} fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Événements par catégorie</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="cat" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} width={90}
                tickFormatter={cat => `${CATEGORY_ICONS[cat] ?? "🎪"} ${cat}`} />
              <Tooltip
                contentStyle={{ background: "hsl(220,14%,12%)", border: "1px solid hsl(220,13%,20%)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Top 5 membres (points)</h2>
          <div className="space-y-3">
            {topUsers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3">
                <span className="text-lg font-black w-5 shrink-0 text-center" style={{ color: i === 0 ? GOLD : "#888" }}>
                  {i + 1}
                </span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: `${GOLD}30`, color: GOLD }}>
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(u.points / topUsers[0].points) * 100}%`, background: GOLD }} />
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: GOLD }}>{u.points.toLocaleString("fr-FR")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Abonnements NFC — Distribution</h2>
          <div className="space-y-4">
            {(["platinum", "prime", "standard", "none"] as const).map(tier => {
              const count = MOCK_USERS.filter(u => u.nfcCardTier === tier).length;
              const pct = (count / MOCK_USERS.length) * 100;
              const TIER_LABELS: Record<string, string> = { none: "Sans carte", standard: "Standard (12$/an)", prime: "Prime (60$/an)", platinum: "Platinum (100$/an)" };
              const TIER_COLORS: Record<string, string> = { none: "#555", standard: "#6AAFD8", prime: "#C9A84C", platinum: "#D0D0D0" };
              return (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="font-medium" style={{ color: TIER_COLORS[tier] }}>{TIER_LABELS[tier]}</span>
                    <span className="text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: TIER_COLORS[tier] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Métriques clés</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Taux de remplissage moyen", val: `${Math.round(MOCK_EVENTS.reduce((s, e) => s + e.currentParticipants / e.maxParticipants, 0) / MOCK_EVENTS.length * 100)}%`, color: GOLD },
              { label: "Utilisateurs avec carte NFC", val: `${MOCK_USERS.filter(u => u.nfcCardTier !== "none").length}/${MOCK_USERS.length}`, color: "#6AAFD8" },
              { label: "Pts moyens / utilisateur", val: `${Math.round(MOCK_USERS.reduce((s, u) => s + u.points, 0) / MOCK_USERS.length)}`, color: "#50C878" },
              { label: "Événements avec entrée NFC", val: `${MOCK_EVENTS.filter(e => e.nfcOnlyEntry).length}/${MOCK_EVENTS.length}`, color: "#D0D0D0" },
              { label: "Parrainages totaux", val: `${MOCK_USERS.reduce((s, u) => s + u.referralCount, 0)}`, color: "#FF9F40" },
              { label: "Comptes suspendus", val: `${MOCK_USERS.filter(u => u.banned).length}`, color: "#FF4444" },
            ].map(m => (
              <div key={m.label} className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-xl font-black mt-1" style={{ color: m.color }}>{m.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
