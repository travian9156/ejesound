"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Barcode,
  Check,
  ClipboardList,
  FileText,
  Home,
  PackageCheck,
  Plus,
  QrCode,
  RefreshCw,
  Scissors,
  Search,
  ShieldAlert,
  Truck,
  Warehouse,
} from "lucide-react";

type Roll = {
  code: string;
  supplier: string;
  invoice: string;
  fabric: string;
  color: string;
  tone: string;
  kg: number;
  expectedYield: number;
  expectedMeters: number;
  balance: number;
  cost: number;
  policyMin: number;
  status: string;
};

type Discard = {
  code: string;
  rollCode: string;
  supplier: string;
  fabric: string;
  color: string;
  defect: string;
  defectiveMeters: number;
  sacrificedMeters: number;
  totalMeters: number;
  status: string;
};

const initialRolls: Roll[] = [
  {
    code: "TEL-0009",
    supplier: "TEKS",
    invoice: "54451451254",
    fabric: "Jabon",
    color: "Azul",
    tone: "1125",
    kg: 10,
    expectedYield: 3.5,
    expectedMeters: 35,
    balance: 10,
    cost: 1000000,
    policyMin: 20,
    status: "Remanente",
  },
  {
    code: "TEL-0021",
    supplier: "TEKS",
    invoice: "54451451254",
    fabric: "Jabon",
    color: "Azul",
    tone: "1125",
    kg: 90,
    expectedYield: 3.33,
    expectedMeters: 300,
    balance: 300,
    cost: 7800000,
    policyMin: 20,
    status: "Disponible",
  },
  {
    code: "TEL-0044",
    supplier: "YOYO",
    invoice: "88990022",
    fabric: "Bengalina",
    color: "Cafe",
    tone: "1126",
    kg: 25,
    expectedYield: 3.2,
    expectedMeters: 80,
    balance: 42,
    cost: 2100000,
    policyMin: 10,
    status: "Disponible",
  },
];

const defects = [
  "Mancha",
  "Raya",
  "Linea",
  "Tejido corrido",
  "Ruptura",
  "Tono",
  "Sucio",
  "Otro",
];

const supplierPolicies: Record<string, number> = {
  TEKS: 20,
  YOYO: 10,
  GENERICO: 15,
};

function money(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function nextCode(prefix: string, total: number) {
  return `${prefix}-${String(total + 1).padStart(4, "0")}`;
}

export default function Page() {
  const [rolls, setRolls] = useState<Roll[]>(initialRolls);
  const [discards, setDiscards] = useState<Discard[]>([]);
  const [activeTab, setActiveTab] = useState("corte");
  const [activeRollCode, setActiveRollCode] = useState("TEL-0009");
  const [selectedDefect, setSelectedDefect] = useState("Raya");
  const [defectiveMeters, setDefectiveMeters] = useState(4);
  const [activeLayer, setActiveLayer] = useState(1);
  const [layers, setLayers] = useState(() =>
    Array.from({ length: 10 }, (_, index) => ({
      number: index + 1,
      status: index < 2 ? "ok" : "pending",
      roll: index < 2 ? "TEL-0009" : "TEL-0021",
    })),
  );

  const [receipt, setReceipt] = useState({
    supplier: "TEKS",
    invoice: "FC-2026-001",
    fabric: "Jabon",
    color: "Rojo",
    tone: "1128",
    kg: 10,
    expectedYield: 3.5,
    cost: 1000000,
  });

  const trace = {
    code: "TRAZO-341",
    op: "OP-1050",
    product: "Body Barbie",
    color: "Azul",
    fabric: "Jabon",
    length: 5,
    plannedLayers: 10,
  };

  const activeRoll =
    rolls.find((roll) => roll.code === activeRollCode) || rolls[0];
  const checkedLayers = layers.filter((layer) => layer.status === "ok").length;
  const consumedMeters = checkedLayers * trace.length;
  const totalRequired = trace.length * trace.plannedLayers;
  const goodMetersToSacrifice = Math.max(
    activeRoll.policyMin - defectiveMeters,
    0,
  );
  const totalIsolation = defectiveMeters + goodMetersToSacrifice;
  const expectedCostPerMeter = activeRoll.cost / activeRoll.expectedMeters;
  const totalBalance = rolls.reduce((sum, roll) => sum + roll.balance, 0);
  const totalDiscardMeters = discards.reduce(
    (sum, item) => sum + item.totalMeters,
    0,
  );
  const remnantCount = rolls.filter(
    (roll) => roll.balance > 0 && roll.balance < 12,
  ).length;

  const recommendations = useMemo(() => {
    let remaining = totalRequired;
    return rolls
      .filter(
        (roll) =>
          roll.fabric === trace.fabric &&
          roll.color === trace.color &&
          roll.balance > 0,
      )
      .sort((a, b) => a.balance - b.balance)
      .map((roll) => {
        const possibleLayers = Math.floor(roll.balance / trace.length);
        const metersToUse = Math.min(remaining, possibleLayers * trace.length);
        remaining -= metersToUse;
        return {
          ...roll,
          possibleLayers,
          metersToUse,
          remainingAfter: roll.balance - metersToUse,
        };
      });
  }, [rolls, totalRequired]);

  function updateReceipt(field: string, value: string | number) {
    setReceipt((prev) => ({ ...prev, [field]: value }));
  }

  function createRoll() {
    const expectedMeters = Number(receipt.kg) * Number(receipt.expectedYield);
    const supplier = String(receipt.supplier || "GENERICO").toUpperCase();
    const newRoll: Roll = {
      code: nextCode("TEL", rolls.length),
      supplier,
      invoice: String(receipt.invoice),
      fabric: String(receipt.fabric),
      color: String(receipt.color),
      tone: String(receipt.tone),
      kg: Number(receipt.kg),
      expectedYield: Number(receipt.expectedYield),
      expectedMeters,
      balance: expectedMeters,
      cost: Number(receipt.cost),
      policyMin: supplierPolicies[supplier] || 15,
      status: "Disponible",
    };

    setRolls((prev) => [newRoll, ...prev]);
    setActiveRollCode(newRoll.code);
    setActiveTab("inventario");
  }

  function markLayer(number: number, status: string) {
    setActiveLayer(number);
    setLayers((prev) =>
      prev.map((layer) =>
        layer.number === number
          ? { ...layer, status, roll: activeRollCode }
          : layer,
      ),
    );
  }

  function generateDiscard() {
    const discard: Discard = {
      code: nextCode("DES", discards.length),
      rollCode: activeRoll.code,
      supplier: activeRoll.supplier,
      fabric: activeRoll.fabric,
      color: activeRoll.color,
      defect: selectedDefect,
      defectiveMeters,
      sacrificedMeters: goodMetersToSacrifice,
      totalMeters: totalIsolation,
      status: "Pendiente cambio",
    };

    setDiscards((prev) => [discard, ...prev]);
    setRolls((prev) =>
      prev.map((roll) =>
        roll.code === activeRoll.code
          ? {
              ...roll,
              balance: Math.max(roll.balance - totalIsolation, 0),
              status:
                Math.max(roll.balance - totalIsolation, 0) <= 0
                  ? "Agotado"
                  : roll.status,
            }
          : roll,
      ),
    );
    setActiveTab("cambios");
  }

  return (
    <div className="min-h-screen bg-[#f3f7fb] text-[#071333]">
      <aside className="fixed left-0 top-0 hidden h-screen w-[290px] border-r border-slate-200 bg-white lg:block">
        <div className="flex h-[140px] items-center border-b border-slate-200 px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#ff3f9d] text-2xl font-black text-white">
              D
            </div>
            <div>
              <p className="text-3xl font-black leading-6 text-[#ff3f9d]">
                Delice
              </p>
              <p className="text-3xl font-black leading-6 text-[#ff3f9d]">
                Boutique
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-5 py-7 text-[15px] font-medium text-[#102052]">
          <MenuItem
            icon={Home}
            label="Escritorio"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <MenuItem
            icon={Plus}
            label="Recepcion de tela"
            active={activeTab === "recepcion"}
            onClick={() => setActiveTab("recepcion")}
          />
          <MenuItem
            icon={Warehouse}
            label="Inventario"
            active={activeTab === "inventario"}
            onClick={() => setActiveTab("inventario")}
          />
          <MenuItem
            icon={Scissors}
            label="Corte"
            active={activeTab === "corte"}
            onClick={() => setActiveTab("corte")}
          />
          <MenuItem
            icon={Truck}
            label="Cambios proveedor"
            active={activeTab === "cambios"}
            onClick={() => setActiveTab("cambios")}
          />
          <MenuItem
            icon={FileText}
            label="Reportes"
            active={activeTab === "reportes"}
            onClick={() => setActiveTab("reportes")}
          />
        </nav>
      </aside>

      <main className="lg:pl-[290px]">
        <header className="sticky top-0 z-10 flex h-[102px] items-center justify-between bg-[#f7fbff]/90 px-8 backdrop-blur">
          <div>
            <p className="text-sm text-slate-500">Pages / Control de tela</p>
            <h1 className="text-2xl font-bold text-[#102052]">
              Modulo de Control de Tela
            </h1>
          </div>
          <div className="flex items-center gap-4 rounded-full bg-white px-5 py-3 shadow-lg shadow-slate-200">
            <button className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
              <QrCode size={18} />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
              <AlertTriangle size={18} />
            </button>
            <div className="relative">
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-xs text-white">
                {discards.length}
              </span>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                <ShieldAlert size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1380px] space-y-6 px-8 pb-10">
          <Hero />

          <section className="grid gap-4 md:grid-cols-4">
            <Kpi
              title="Rollos activos"
              value={`${rolls.filter((r) => r.balance > 0).length}`}
              icon={Barcode}
            />
            <Kpi
              title="Saldo estimado"
              value={`${totalBalance.toFixed(1)} m`}
              icon={PackageCheck}
            />
            <Kpi title="Cunchos" value={`${remnantCount}`} icon={RefreshCw} />
            <Kpi
              title="Pendiente cambio"
              value={`${totalDiscardMeters} m`}
              icon={Truck}
            />
          </section>

          {activeTab === "recepcion" && (
            <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <Card
                title="Recepcion de tela"
                icon={Plus}
                badge="Factura proveedor"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Proveedor"
                    value={receipt.supplier}
                    onChange={(v) =>
                      updateReceipt("supplier", String(v).toUpperCase())
                    }
                  />
                  <Input
                    label="Factura"
                    value={receipt.invoice}
                    onChange={(v) => updateReceipt("invoice", v)}
                  />
                  <Input
                    label="Tela"
                    value={receipt.fabric}
                    onChange={(v) => updateReceipt("fabric", v)}
                  />
                  <Input
                    label="Color"
                    value={receipt.color}
                    onChange={(v) => updateReceipt("color", v)}
                  />
                  <Input
                    label="Tono / referencia"
                    value={receipt.tone}
                    onChange={(v) => updateReceipt("tone", v)}
                  />
                  <Input
                    label="Kilos"
                    type="number"
                    value={receipt.kg}
                    onChange={(v) => updateReceipt("kg", Number(v))}
                  />
                  <Input
                    label="Rendimiento m/kg"
                    type="number"
                    value={receipt.expectedYield}
                    onChange={(v) => updateReceipt("expectedYield", Number(v))}
                  />
                  <Input
                    label="Valor rollo"
                    type="number"
                    value={receipt.cost}
                    onChange={(v) => updateReceipt("cost", Number(v))}
                  />
                </div>
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <Info
                    label="Metros esperados"
                    value={`${(Number(receipt.kg) * Number(receipt.expectedYield)).toFixed(1)} m`}
                  />
                  <Info
                    label="Politica proveedor"
                    value={`${supplierPolicies[String(receipt.supplier).toUpperCase()] || 15} m minimo cambio`}
                  />
                  <Info
                    label="Costo esperado/m"
                    value={money(
                      Number(receipt.cost) /
                        (Number(receipt.kg) * Number(receipt.expectedYield)),
                    )}
                  />
                </div>
                <button
                  onClick={createRoll}
                  className="mt-5 w-full rounded-2xl bg-[#ff3f9d] py-4 text-sm font-black text-white"
                >
                  Generar codigo TEL e ingresar a inventario
                </button>
              </Card>

              <Card
                title="Vista previa adhesivo"
                icon={QrCode}
                badge="Rollo nuevo"
              >
                <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
                  <div className="mx-auto grid h-28 w-28 place-items-center rounded-2xl bg-slate-100 text-[#102052]">
                    <QrCode size={64} />
                  </div>
                  <p className="mt-5 text-2xl font-black text-[#102052]">
                    {nextCode("TEL", rolls.length)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {receipt.fabric} · {receipt.color} · tono {receipt.tone}
                  </p>
                  <div className="mt-5 text-left">
                    <Info
                      label="Proveedor"
                      value={String(receipt.supplier).toUpperCase()}
                    />
                    <Info label="Factura" value={String(receipt.invoice)} />
                    <Info label="Kg" value={`${receipt.kg}`} />
                    <Info
                      label="Rendimiento"
                      value={`${receipt.expectedYield} m/kg`}
                    />
                  </div>
                </div>
              </Card>
            </section>
          )}

          {activeTab === "inventario" && (
            <Card
              title="Inventario de rollos"
              icon={Warehouse}
              badge="Datos simulados"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs font-black tracking-[0.2em] text-slate-400">
                      <th className="py-3">Codigo</th>
                      <th>Proveedor</th>
                      <th>Factura</th>
                      <th>Tela</th>
                      <th>Color</th>
                      <th>Tono</th>
                      <th>Saldo</th>
                      <th>Estado</th>
                      <th>QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolls.map((roll) => (
                      <tr key={roll.code} className="border-b border-slate-100">
                        <td className="py-4 font-black text-[#102052]">
                          {roll.code}
                        </td>
                        <td>{roll.supplier}</td>
                        <td>{roll.invoice}</td>
                        <td>{roll.fabric}</td>
                        <td>{roll.color}</td>
                        <td>{roll.tone}</td>
                        <td className="font-bold">
                          {roll.balance.toFixed(1)} m
                        </td>
                        <td>
                          <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-[#ff3f9d]">
                            {roll.status}
                          </span>
                        </td>
                        <td>
                          <QrCode size={20} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === "corte" && (
            <section className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
              <div className="space-y-6">
                <Card
                  title="Trazo activo"
                  icon={ClipboardList}
                  badge="Operacion de corte"
                >
                  <Info label="OP" value={trace.op} />
                  <Info label="Producto" value={trace.product} />
                  <Info label="Trazo" value={trace.code} />
                  <Info
                    label="Tela / color"
                    value={`${trace.fabric} / ${trace.color}`}
                  />
                  <Info label="Largo" value={`${trace.length} m`} />
                  <Info
                    label="Capas planeadas"
                    value={`${trace.plannedLayers}`}
                  />
                  <Info
                    label="Consumo requerido"
                    value={`${totalRequired} m`}
                  />
                </Card>

                <Card title="Rollo montado" icon={Warehouse} badge="QR activo">
                  <select
                    value={activeRollCode}
                    onChange={(e) => setActiveRollCode(e.target.value)}
                    className="mb-4 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#ff3f9d]"
                  >
                    {rolls.map((roll) => (
                      <option key={roll.code} value={roll.code}>
                        {roll.code} · {roll.color} · {roll.balance.toFixed(1)} m
                      </option>
                    ))}
                  </select>
                  <Info label="Proveedor" value={activeRoll.supplier} />
                  <Info label="Factura" value={activeRoll.invoice} />
                  <Info label="Tono" value={activeRoll.tone} />
                  <Info
                    label="Saldo"
                    value={`${activeRoll.balance.toFixed(1)} m`}
                  />
                  <Info
                    label="Politica cambio"
                    value={`${activeRoll.policyMin} m minimo`}
                  />
                  <Info
                    label="Costo esperado/m"
                    value={money(expectedCostPerMeter)}
                  />
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    <b>Alerta:</b> {activeRoll.supplier} cambia tela solo desde{" "}
                    {activeRoll.policyMin} metros.
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card
                  title="Cuadricula tactil de extendido"
                  icon={Scissors}
                  badge={`${checkedLayers}/${trace.plannedLayers} capas · ${consumedMeters} m`}
                >
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {layers.map((layer) => (
                      <button
                        key={layer.number}
                        onClick={() =>
                          markLayer(
                            layer.number,
                            layer.status === "ok" ? "warning" : "ok",
                          )
                        }
                        className={`min-h-[105px] rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${layer.status === "ok" ? "border-emerald-200 bg-emerald-50" : layer.status === "warning" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black">
                            Capa {layer.number}
                          </span>
                          {layer.status === "ok" ? (
                            <Check className="text-emerald-500" size={19} />
                          ) : layer.status === "warning" ? (
                            <AlertTriangle
                              className="text-amber-500"
                              size={19}
                            />
                          ) : null}
                        </div>
                        <p className="mt-5 text-xs font-semibold text-slate-400">
                          Rollo
                        </p>
                        <p className="font-bold text-[#102052]">{layer.roll}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <button
                      onClick={() => markLayer(activeLayer, "ok")}
                      className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-700"
                    >
                      Marcar OK
                    </button>
                    <button
                      onClick={() => markLayer(activeLayer, "warning")}
                      className="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-black text-amber-700"
                    >
                      Registrar novedad
                    </button>
                    <button className="rounded-2xl bg-[#ff3f9d] px-4 py-3 text-sm font-black text-white">
                      Cambiar rollo
                    </button>
                  </div>
                </Card>

                <section className="grid gap-6 lg:grid-cols-2">
                  <Card
                    title="Defectos rapidos"
                    icon={ShieldAlert}
                    badge="Grid operario"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {defects.map((defect) => (
                        <button
                          key={defect}
                          onClick={() => setSelectedDefect(defect)}
                          className={`rounded-2xl border px-3 py-3 text-sm font-bold ${selectedDefect === defect ? "border-[#ff3f9d] bg-pink-50 text-[#ff3f9d]" : "border-slate-200 bg-white text-slate-600"}`}
                        >
                          {defect}
                        </button>
                      ))}
                    </div>
                    <label className="mt-4 block text-sm font-bold text-slate-500">
                      Metros defectuosos reales
                    </label>
                    <input
                      type="number"
                      value={defectiveMeters}
                      onChange={(e) =>
                        setDefectiveMeters(Number(e.target.value))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-[#ff3f9d]"
                    />
                    <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm">
                      <Info
                        label="Defecto real"
                        value={`${defectiveMeters} m`}
                      />
                      <Info
                        label="Tela buena sacrificada"
                        value={`${goodMetersToSacrifice} m`}
                      />
                      <Info
                        label="Total aislado"
                        value={`${totalIsolation} m`}
                      />
                    </div>
                    <button
                      onClick={generateDiscard}
                      className="mt-4 w-full rounded-2xl bg-[#071333] py-3 text-sm font-black text-white"
                    >
                      Generar DES
                    </button>
                  </Card>

                  <Card
                    title="Sugerencia de rollos"
                    icon={Search}
                    badge="Cunchos primero"
                  >
                    <div className="space-y-3">
                      {recommendations.map((roll) => (
                        <div
                          key={roll.code}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-black text-[#102052]">
                                {roll.code}
                              </p>
                              <p className="text-xs text-slate-500">
                                {roll.fabric} · {roll.color} · tono {roll.tone}
                              </p>
                            </div>
                            <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-[#ff3f9d]">
                              {roll.possibleLayers} capas
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-slate-600">
                            Usar {roll.metersToUse} m · Queda{" "}
                            {roll.remainingAfter.toFixed(1)} m
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>
              </div>
            </section>
          )}

          {activeTab === "cambios" && (
            <Card
              title="Pendientes por cambio a proveedor"
              icon={Truck}
              badge={`${discards.length} descartes`}
            >
              {discards.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                  Aun no hay descartes generados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs font-black tracking-[0.2em] text-slate-400">
                        <th className="py-3">Codigo</th>
                        <th>Rollo</th>
                        <th>Proveedor</th>
                        <th>Tela</th>
                        <th>Color</th>
                        <th>Defecto</th>
                        <th>Real</th>
                        <th>Sacrificio</th>
                        <th>Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discards.map((item) => (
                        <tr
                          key={item.code}
                          className="border-b border-slate-100"
                        >
                          <td className="py-4 font-black text-[#102052]">
                            {item.code}
                          </td>
                          <td>{item.rollCode}</td>
                          <td>{item.supplier}</td>
                          <td>{item.fabric}</td>
                          <td>{item.color}</td>
                          <td>{item.defect}</td>
                          <td>{item.defectiveMeters} m</td>
                          <td>{item.sacrificedMeters} m</td>
                          <td className="font-black">{item.totalMeters} m</td>
                          <td>
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {activeTab === "dashboard" && (
            <DashboardSummary rolls={rolls} discards={discards} />
          )}
          {activeTab === "reportes" && (
            <DashboardSummary rolls={rolls} discards={discards} />
          )}
        </div>
      </main>
    </div>
  );
}

function Hero() {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <span className="mb-3 inline-flex rounded-full bg-slate-100 px-4 py-1 text-xs font-bold tracking-[0.35em] text-slate-500">
            DASHBOARD TEXTIL
          </span>
          <h2 className="text-2xl font-black text-[#071333]">
            Trazabilidad, rendimiento y alertas de tela en una sola vista
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Recepcion de rollos, extendido, cunchos, descartes y cambio con
            proveedor.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 px-5 py-3">
            <p className="text-xs font-bold tracking-[0.3em] text-slate-400">
              PERIODO
            </p>
            <p className="text-sm font-semibold">2026-04-27 al 2026-05-26</p>
          </div>
          <button className="rounded-2xl bg-[#071333] px-5 py-4 text-sm font-bold text-white">
            <RefreshCw className="mr-2 inline" size={15} />
            Actualizar
          </button>
        </div>
      </div>
    </section>
  );
}

function DashboardSummary({
  rolls,
  discards,
}: {
  rolls: Roll[];
  discards: Discard[];
}) {
  const bySupplier = discards.reduce<Record<string, number>>((acc, item) => {
    acc[item.supplier] = (acc[item.supplier] || 0) + item.totalMeters;
    return acc;
  }, {});

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <Card title="Resumen gerencial" icon={FileText} badge="KPIs">
        <Info label="Rollos registrados" value={`${rolls.length}`} />
        <Info
          label="Metros disponibles"
          value={`${rolls.reduce((s, r) => s + r.balance, 0).toFixed(1)} m`}
        />
        <Info label="Descartes generados" value={`${discards.length}`} />
        <Info
          label="Metros pendientes cambio"
          value={`${discards.reduce((s, d) => s + d.totalMeters, 0)} m`}
        />
      </Card>
      <Card
        title="Ranking proveedor por descartes"
        icon={Truck}
        badge="Calidad"
      >
        {Object.keys(bySupplier).length === 0 ? (
          <p className="text-sm text-slate-500">Sin descartes todavia.</p>
        ) : (
          Object.entries(bySupplier).map(([supplier, meters]) => (
            <Info key={supplier} label={supplier} value={`${meters} m`} />
          ))
        )}
      </Card>
    </section>
  );
}

function MenuItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left ${active ? "bg-pink-50 text-[#ff3f9d]" : "hover:bg-slate-50"}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

function Kpi({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-pink-50 text-[#ff3f9d]">
        <Icon size={21} />
      </div>
      <p className="text-xs font-black tracking-[0.25em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-black text-[#071333]">{value}</p>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  icon: any;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-pink-50 text-[#ff3f9d]">
            <Icon size={20} />
          </div>
          <h3 className="text-lg font-black text-[#071333]">{title}</h3>
        </div>
        {badge && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-[#102052]">{value}</span>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-[#ff3f9d]"
      />
    </label>
  );
}
