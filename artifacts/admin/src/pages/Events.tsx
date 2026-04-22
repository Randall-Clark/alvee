import { useState } from "react";
import { Search, CheckCircle, Clock, XCircle, Send } from "lucide-react";
import { MOCK_EVENTS, CATEGORY_ICONS, type AdminEvent } from "@/data/mockData";

const GOLD = "#C9A84C";

const STATUS_CONFIG = {
  upcoming: { label: "À venir", color: "#6AAFD8", bg: "#6AAFD820" },
  ongoing: { label: "En cours", color: "#50C878", bg: "#50C87820" },
  past: { label: "Terminé", color: "#888", bg: "#88888820" },
  cancelled: { label: "Annulé", color: "#FF4444", bg: "#FF444420" },
};

function StatusBadge({ status }: { status: AdminEvent["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export function Events() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = MOCK_EVENTS.filter(e =>
    (filterStatus === "all" || e.status === filterStatus) &&
    (e.title.toLowerCase().includes(search.toLowerCase()) || e.organizerName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = MOCK_EVENTS.reduce((s, e) => s + e.revenue, 0);
  const pendingPayout = MOCK_EVENTS.filter(e => !e.payoutSent && e.revenue > 0).reduce((s, e) => s + e.revenue, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-foreground">Événements</h1>
        <p className="text-muted-foreground text-sm mt-1">{MOCK_EVENTS.length} événements sur la plateforme</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total revenus", val: `${totalRevenue.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $`, color: GOLD },
          { label: "Virements en attente", val: `${pendingPayout.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $`, color: "#FF9F40" },
          { label: "Événements à venir", val: MOCK_EVENTS.filter(e => e.status === "upcoming").toString(), color: "#6AAFD8" },
          { label: "Taux de remplissage", val: `${Math.round(MOCK_EVENTS.reduce((s, e) => s + e.currentParticipants / e.maxParticipants, 0) / MOCK_EVENTS.length * 100)}%`, color: "#50C878" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className="text-xl font-black mt-1" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "upcoming", "ongoing", "past", "cancelled"] as const).map(s => {
          const count = s === "all" ? MOCK_EVENTS.length : MOCK_EVENTS.filter(e => e.status === s).length;
          const cfg = s === "all" ? { color: GOLD, label: "Tous" } : { color: STATUS_CONFIG[s].color, label: STATUS_CONFIG[s].label };
          return (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={filterStatus === s
                ? { background: cfg.color, color: "#0D0D0D" }
                : { background: "transparent", color: cfg.color, border: `1px solid ${cfg.color}40` }}>
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un événement ou organisateur…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} résultat(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Titre", "Catégorie", "Date", "Organisateur", "Participants", "Prix", "Revenus", "Statut", "Virement", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        {e.nfcOnlyEntry && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" title="Entrée NFC uniquement" />}
                        {e.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {CATEGORY_ICONS[e.category] ?? "🎪"} {e.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(e.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{e.organizerName}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(e.currentParticipants / e.maxParticipants) * 100}%`, background: GOLD }} />
                      </div>
                      <span className="text-muted-foreground text-xs whitespace-nowrap">{e.currentParticipants}/{e.maxParticipants}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {e.price === 0 ? <span className="text-green-500 font-semibold">Gratuit</span> : `${e.price} $`}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: GOLD }}>
                    {e.revenue > 0 ? `${e.revenue.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $` : "—"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3">
                    {e.payoutSent
                      ? <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle size={12} /> Envoyé</span>
                      : e.revenue > 0
                        ? <span className="flex items-center gap-1 text-xs text-yellow-500"><Clock size={12} /> En attente</span>
                        : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {!e.payoutSent && e.revenue > 0 && (
                      <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: `${GOLD}20`, color: GOLD }}>
                        <Send size={11} /> Virer
                      </button>
                    )}
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
