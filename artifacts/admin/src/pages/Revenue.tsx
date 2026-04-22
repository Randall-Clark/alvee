import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { MOCK_REVENUE, MOCK_EVENTS } from "@/data/mockData";
import { DollarSign, TrendingUp, Percent, CreditCard } from "lucide-react";

const GOLD = "#C9A84C";
const GREEN = "#50C878";
const BLUE = "#6AAFD8";

function Card({ icon: Icon, label, value, sub, color = GOLD }: { icon: any; label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-black text-foreground mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </div>
    </div>
  );
}

const payoutsData = MOCK_EVENTS
  .filter(e => e.revenue > 0)
  .map(e => ({
    title: e.title.length > 22 ? e.title.slice(0, 22) + "…" : e.title,
    brut: e.revenue,
    frais: parseFloat((e.revenue * 0.0488 + 0.30 * e.currentParticipants).toFixed(2)),
    net: parseFloat((e.revenue * (1 - 0.0488) - 0.30 * e.currentParticipants).toFixed(2)),
    statut: e.payoutSent ? "Viré" : "En attente",
  }));

export function Revenue() {
  const totalBrut = MOCK_REVENUE.reduce((s, r) => s + r.revenus, 0);
  const totalNet = MOCK_REVENUE.reduce((s, r) => s + r.net, 0);
  const totalFrais = MOCK_REVENUE.reduce((s, r) => s + r.frais, 0);
  const marginPct = ((totalNet / totalBrut) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Revenus</h1>
        <p className="text-muted-foreground text-sm mt-1">Analyse financière de la plateforme Alvee</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card icon={DollarSign} label="Revenus bruts (6 mois)" value={`${totalBrut.toLocaleString("fr-FR")} $`} sub="Tous événements confondus" />
        <Card icon={TrendingUp} label="Revenus nets (6 mois)" value={`${totalNet.toLocaleString("fr-FR")} $`} sub="Après frais plateforme + Stripe" color={GREEN} />
        <Card icon={Percent} label="Frais totaux (6 mois)" value={`${totalFrais.toLocaleString("fr-FR")} $`} sub={`Marge nette : ${marginPct}%`} color={BLUE} />
        <Card icon={CreditCard} label="Revenu moyen / événement" value={`${Math.round(totalBrut / MOCK_EVENTS.filter(e => e.revenue > 0).length).toLocaleString("fr-FR")} $`} sub={`${MOCK_EVENTS.filter(e => e.revenue > 0).length} événements payants`} color="#FF9F40" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Revenus bruts vs nets (6 mois)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_REVENUE} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}$`} />
              <Tooltip
                contentStyle={{ background: "hsl(220,14%,12%)", border: "1px solid hsl(220,13%,20%)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v.toLocaleString("fr-FR")} $`, ""]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenus" name="Brut" fill={GOLD} radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" name="Net" fill={GREEN} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Évolution des frais mensuels</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_REVENUE} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,18%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}$`} />
              <Tooltip
                contentStyle={{ background: "hsl(220,14%,12%)", border: "1px solid hsl(220,13%,20%)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v.toLocaleString("fr-FR")} $`, ""]}
              />
              <Line type="monotone" dataKey="frais" stroke={BLUE} strokeWidth={2} dot={{ fill: BLUE, r: 4 }} name="Frais" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Détail par événement</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Événement", "Revenu brut", "Frais estimés", "Revenu net", "Statut virement"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payoutsData.map((row, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{row.title}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: GOLD }}>{row.brut.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $</td>
                  <td className="px-5 py-3 text-sm text-red-400">− {row.frais.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $</td>
                  <td className="px-5 py-3 text-sm font-semibold" style={{ color: GREEN }}>{row.net.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.statut === "Viré" ? "bg-green-500/15 text-green-500" : "bg-yellow-500/15 text-yellow-500"}`}>
                      {row.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
