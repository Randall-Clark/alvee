import { Users, Calendar, DollarSign, TrendingUp, Star, Wifi, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MOCK_USERS, MOCK_EVENTS, MOCK_REVENUE, TIER_COLORS, TIER_LABELS } from "@/data/mockData";

const GOLD = "#C9A84C";

function StatCard({ icon: Icon, label, value, sub, color = GOLD }: { icon: any; label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-black text-foreground mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </div>
    </div>
  );
}

const TIER_PIE = ["none", "standard", "prime", "platinum"].map(t => ({
  name: TIER_LABELS[t],
  value: MOCK_USERS.filter(u => u.nfcCardTier === t).length,
  color: TIER_COLORS[t],
}));

export function Dashboard() {
  const totalRevenue = MOCK_EVENTS.reduce((s, e) => s + e.revenue, 0);
  const pendingPayouts = MOCK_EVENTS.filter(e => !e.payoutSent && e.revenue > 0);
  const pendingAmount = pendingPayouts.reduce((s, e) => s + e.revenue, 0);

  const recentActivity = [
    { icon: Users, text: "Marie Dupont a réservé un billet — Soirée Jazz", time: "Il y a 5 min", color: GOLD },
    { icon: Calendar, text: "Nouvel événement créé : Speed Dating", time: "Il y a 23 min", color: "#6AAFD8" },
    { icon: DollarSign, text: "Virement reçu — Conférence Tech 4 297,50 $", time: "Il y a 1h", color: "#50C878" },
    { icon: Star, text: "Antoine M. a laissé 5 ★ sur le Gala Alvee", time: "Il y a 2h", color: GOLD },
    { icon: Wifi, text: "Badge NFC scanné — Hugo L. à l'entrée du Gala", time: "Il y a 3h", color: "#D0D0D0" },
    { icon: AlertCircle, text: "Compte Hugo Laurent signalé et suspendu", time: "Il y a 5h", color: "#FF4444" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Vue d'ensemble</h1>
        <p className="text-muted-foreground text-sm mt-1">Tableau de bord Alvee — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Utilisateurs" value={MOCK_USERS.length.toString()} sub={`${MOCK_USERS.filter(u => u.nfcCardTier !== "none").length} cartes NFC actives`} />
        <StatCard icon={Calendar} label="Événements" value={MOCK_EVENTS.length.toString()} sub={`${MOCK_EVENTS.filter(e => e.status === "upcoming").length} à venir`} color="#6AAFD8" />
        <StatCard icon={DollarSign} label="Revenus totaux" value={`${totalRevenue.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} $`} sub={`${pendingPayouts.length} virements en attente`} color="#50C878" />
        <StatCard icon={TrendingUp} label="Virements en attente" value={`${pendingAmount.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} $`} sub={`${pendingPayouts.length} événements concernés`} color="#FF9F40" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Revenus mensuels (6 derniers mois)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_REVENUE} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}$`} />
              <Tooltip
                contentStyle={{ background: "hsl(220,14%,12%)", border: "1px solid hsl(220,13%,20%)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v.toLocaleString("fr-FR")} $`, ""]}
              />
              <Area type="monotone" dataKey="revenus" stroke={GOLD} fill="url(#revGrad)" strokeWidth={2} name="Brut" />
              <Area type="monotone" dataKey="net" stroke="#50C878" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name="Net" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Répartition cartes NFC</h2>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={TIER_PIE} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {TIER_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(220,14%,12%)", border: "1px solid hsl(220,13%,20%)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} utilisateurs`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {TIER_PIE.map(t => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  <span className="text-muted-foreground">{t.name}</span>
                </div>
                <span className="font-semibold text-foreground">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-4">Activité récente</h2>
        <div className="space-y-3">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${a.color}20` }}>
                <a.icon size={13} style={{ color: a.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{a.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
