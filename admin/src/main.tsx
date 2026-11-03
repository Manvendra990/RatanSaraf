import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const API =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3004/api";
async function api(path: string, method = "GET", body?: any) {
  const res = await fetch(API + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Request failed",
    );
  return data;
}
const tabs = [
  "Overview",
  "Products",
  "Categories",
  "Rates",
  "Customers",
  "KYC",
  "Gold Buys",
  "Sales",
  "Ledger",
  "Enquiries",
  "Settings",
  "Audit",
];
const endpoint = (tab: string) =>
  (({ Customers: "users", KYC: "kyc", "Gold Buys": "purchases" }) as Record<string, string>)[tab] ||
  tab.toLowerCase();
const kycVersion = (value: unknown) => {
  const version = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(version) || version < 1)
    throw new Error("Unable to read the KYC submission version. Reload and try again.");
  return version;
};
type Field = { key: string; label: string; type?: string; options?: string[] };
const forms: Record<string, Field[]> = {
  Settings: [
    { key: "name", label: "Store name" },
    { key: "ownerName", label: "Owner name" },
    { key: "tagline", label: "Tagline" },
    { key: "descriptor", label: "Descriptor" },
    { key: "addressLine1", label: "Street address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "pincode", label: "Pincode" },
    { key: "mapQuery", label: "Maps search query" },
    { key: "latitude", label: "Latitude", type: "number" },
    { key: "longitude", label: "Longitude", type: "number" },
    { key: "whatsapp", label: "WhatsApp digits with country code" },
    { key: "phone", label: "Phone with country code" },
  ],
  Products: [
    { key: "productCode", label: "Product code (customer-facing)" },
    { key: "brand", label: "Brand" },
    { key: "colour", label: "Colour" },
    { key: "availability", label: "Availability message" },
    { key: "certifiedBy", label: "Certification (only if applicable)" },
    { key: "featured", label: "Featured on homepage (Gold jewellery)", type: "checkbox" },
    { key: "name", label: "Product name" },
    { key: "metal", label: "Metal", options: ["Gold", "Silver"] },
    { key: "categoryId", label: "Category", type: "category" },
    { key: "price", label: "Internal estimate / coin price (₹)", type: "number" },
    { key: "weight", label: "Weight (e.g. 1 gram)" },
    { key: "purity", label: "Purity" },
    { key: "image", label: "Image URL", type: "url" },
    { key: "description", label: "Description", type: "textarea" },
    {
      key: "coinWeight",
      label: "Coin weight in grams (coins only)",
      type: "number",
    },
    { key: "stock", label: "Stock quantity", type: "number" },
    { key: "active", label: "Visible in app", type: "checkbox" },
  ],
  Categories: [
    { key: "name", label: "Category name" },
    { key: "metal", label: "Metal", options: ["Gold", "Silver"] },
    { key: "active", label: "Visible in app", type: "checkbox" },
  ],
  Rates: [
    { key: "metal", label: "Metal", options: ["Gold", "Silver"] },
    { key: "buy", label: "Current store rate ₹ / gram (buy & sell)", type: "number" },
    { key: "source", label: "Rate source / store reference" },
  ],

};
const defaultForm = (tab: string) =>
  Object.fromEntries(
    (forms[tab] || []).map((f) => [
      f.key,
      f.type === "checkbox" ? true : f.options?.[0] || "",
    ]),
  );
function App() {
  const requestNumber = useRef(0);
  const [user, setUser] = useState<any>(null),
    [ready, setReady] = useState(false),
    [login, setLogin] = useState(""),
    [password, setPassword] = useState("");
  const [metalFilter,setMetalFilter]=useState("Gold");
  const [tab, setTab] = useState("Overview"),
    [data, setData] = useState<any>(null),
    [categories, setCategories] = useState<any[]>([]),
    [form, setForm] = useState<any>({}),
    [editing, setEditing] = useState<string | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [kycDetail, setKycDetail] = useState<any>(null),
    [kycDocument, setKycDocument] = useState<{
      url: string;
      type: string;
    } | null>(null);
  useEffect(
    () => () => {
      if (kycDocument) URL.revokeObjectURL(kycDocument.url);
    },
    [kycDocument],
  );
  const [decision, setDecision] = useState<any>(null),
    [reference, setReference] = useState(""),
    [note, setNote] = useState("");
  useEffect(() => {
    api("/auth/me")
      .then((u) => {
        if (u.role === "ADMIN") setUser(u);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  async function load() {
    const request = ++requestNumber.current;
    setError("");
    try {
      const [loaded, cats] = await Promise.all([
        api(
          tab === "Rates"
            ? "/sip/rates"
            : tab === "KYC"
              ? "/manual-kyc/admin"
              : "/admin/" + endpoint(tab) + (tab === "Overview" ? "?metal="+metalFilter : ""),
        ),
        api("/admin/categories"),
      ]);
      if (request !== requestNumber.current) return;
      setData(loaded);
      setCategories(cats);
      if (tab === "Settings") setForm(loaded);
    } catch (e: any) {
      if (request === requestNumber.current) setError(e.message);
    }
  }

  useEffect(() => {
    setData(null);
    setForm(defaultForm(tab));
    setEditing(null);
    setNotice("");
    if (user) void load();
  }, [tab, user, metalFilter]);
  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const b = { ...form };
      if (tab === "Products") {
        b.stock = Number(b.stock);
        if (!b.coinWeight) delete b.coinWeight;
      }
      if (tab === "Settings") {
        b.latitude = Number(b.latitude);
        b.longitude = Number(b.longitude);
      }
      await api(
        "/admin/" + endpoint(tab) + (editing ? "/" + editing : ""),
        editing || tab === "Settings" ? "PUT" : "POST",
        b,
      );
      setEditing(null);
      setForm(defaultForm(tab));
      setNotice("Saved. Store rates refresh in the active mobile app within 10 seconds, or immediately with Refresh.");
      await load();
    });
  }
  function edit(row: any) {
    const b = defaultForm(tab);
    for (const f of forms[tab]) {
      b[f.key] = f.type === "checkbox" ? [true, 1, '1'].includes(row[f.key]) : (row[f.key] ?? "");
    }
    if (tab === "Products") b.price = String(row.price);
    setEditing(row.id);
    setForm(b);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (!ready)
    return (
      <div className="login">
        <p>Loading…</p>
      </div>
    );
  if (!user)
    return (
      <main className="login">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const r = await api("/auth/admin-login", "POST", {
                login,
                password,
              });
              setUser(r.user);
              setPassword("");
            });
          }}
        >
          <img src="/logo.png" />
          <small>STORE MANAGEMENT</small>
          <h1>Ratan Lal Saraf</h1>
          <p>Sign in to your admin workspace</p>
          <label>
            Email
            <input
              type="email"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </main>
    );
  const cell = (key: string, value: any) =>
    key === 'status' ? <span className={'status-badge status-' + String(value).toLowerCase()}>{value === 'APPROVED' && tab === 'Sales' ? 'APPROVED · Awaiting payout' : String(value)}</span> : key.endsWith("Paise")
      ? `₹${(Number(value) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      : key === "grams"
        ? `${(Number(value) / 1000000).toFixed(6)} g`
        : ["active", "featured"].includes(key)
          ? [true, 1, '1'].includes(value)
            ? "Yes"
            : "No"
          : String(value ?? "—").replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "Internal reference");
  const hasKycVersion = Number.isSafeInteger(Number(kycDetail?.version)) && Number(kycDetail?.version) >= 1;
  const visibleData=Array.isArray(data)?data.filter((r:any)=>!["Gold Buys","Sales","Ledger"].includes(tab)||(r.metal||"Gold")===metalFilter):[];
  const columns =
    Array.isArray(data) && data.length
      ? Object.keys(data[0]).filter(
          (k) =>
            !/^(id|actor|version|reviewedBy)$/i.test(k) && !/Id$/.test(k) && !["password", "description", "image", "payoutDetails", "pricingPolicy"].includes(k) && !(tab === "Rates" && k === "sellPaise") && !(tab === "Gold Buys" && k === "reference"),
        )
      : [];
  return (
    <div className="layout">
      <aside>
        <div className="brand">
          <img src="/logo.png" />
          <h2>Ratan Lal Saraf</h2>
          <small>ADMIN WORKSPACE</small>
        </div>
        <nav>
          {tabs.map((t) => (
            <button
              className={t === tab ? "selected" : ""}
              key={t}
              disabled={busy}
              onClick={() => setTab(t)}
            >
              {t === 'Rates' ? 'Current Store Rates' : t === 'Gold Buys' ? 'Metal Buys' : t}
            </button>
          ))}
        </nav>
        <button
          onClick={() =>
            void run(async () => {
              try {
                await api("/auth/logout", "POST");
              } finally {
                setUser(null);
              }
            })
          }
        >
          Sign out
        </button>
      </aside>
      <main>
        <header>
          <div>
            <small>RATAN LAL SARAF / {tab.toUpperCase()}</small>
            <h1>{tab}</h1>
          </div>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void load()}
          >
            Refresh
          </button>
        </header>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {tab === "Overview" && data && (
          <>
            <section className="stats">
              {Object.entries(data).map(([k, v]) => (
                <article key={k}>
                  <small>{k.replace(/([A-Z])/g, " $1")}</small>
                  <strong>{String(v)}</strong>
                </article>
              ))}
            </section>
            <section className="panel">
              <h2>Gold / Silver buy & sell requests</h2>
              <p>
                Verify merchant bank records before approving a payment. Record
                a real metal allocation reference before crediting grams.
              </p>
              <p>
                Metal sale requests reserve customer grams. Confirm the bank
                payout reference before marking a sale paid.
              </p>
              <p>
                Buy, sell and valuation use the same current store rate per metal. No monthly/yearly plans. The live market feed is a separate reference; it cannot change store transaction amounts. Publish fresh store rates before accepting
                new trades.
              </p>
            </section>
          </>
        )}
        {forms[tab] && (
          <form className="panel" onSubmit={save}>
            <h2>
              {tab === "Settings" ? "Store" : editing ? "Edit" : "Add"}{" "}
              {tab === "Rates" ? "trade quote" : tab.slice(0, -1).toLowerCase()}
            </h2>
            {tab === "Rates" && (
              <p>
                Publish one current rate for the selected metal. The same rate is used for new buy requests, sell requests and current holding value. Home and the trading screen refresh within 10 seconds while active. Existing transactions keep their accepted amounts.
              </p>
            )}
            <div className="fields">
              {forms[tab].map((f) => (
                <label key={f.key}>
                  {f.label}
                  {f.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={!!form[f.key]}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.checked })
                      }
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      value={form[f.key] || ""}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                    />
                  ) : f.options || f.type === "category" ? (
                    <select
                      required
                      value={form[f.key] || ""}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                    >
                      {f.type === "category" ? (
                        <>
                          <option value="">Choose category</option>
                          {categories
                            .filter((c) => c.metal === form.metal)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                                {!c.active ? " (hidden)" : ""}
                              </option>
                            ))}
                        </>
                      ) : (
                        f.options?.map((v) => (
                          <option key={v} value={v}>
                            {f.key === "months" ? `${v} month(s)` : v}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <input
                      type={f.type || "text"}
                      step={f.key === "coinWeight" ? "0.001" : "0.01"}
                      min={
                        ["latitude", "longitude"].includes(f.key) ? "-180" : "0"
                      }
                      required={
                        ![
                          "image",
                          "coinWeight",
                          "description",
                          "whatsapp",
                          "phone",
                          "productCode", "brand", "colour", "availability", "certifiedBy",
                        ].includes(f.key)
                      }
                      value={form[f.key] ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
            {tab === "Products" && (
              <label>
                Upload image (PNG/JPEG/WebP, max 5 MB)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void run(async () => {
                      const fd = new FormData();
                      fd.append("file", file);
                      const res = await fetch(API + "/admin/images", {
                        method: "POST",
                        credentials: "include",
                        body: fd,
                      });
                      const result = await res.json();
                      if (!res.ok)
                        throw new Error(result.message || "Upload failed");
                      setForm((f: any) => ({ ...f, image: result.url }));
                    });
                  }}
                />
              </label>
            )}
            <button disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditing(null);
                  setForm(defaultForm(tab));
                }}
              >
                Cancel edit
              </button>
            )}
          </form>
        )}
        {tab === "Products" && <p className="notice">Jewellery prices are internal only and hidden in the mobile catalogue, cart and enquiries. Coins retain their indicative prices. Empty specifications stay hidden.</p>}
        {tab === "KYC" && (
          <p className="notice">
            Review customer details and their private PAN document, then approve
            or reject with a reason. Manual review does not certify Aadhaar or
            PAN through an external API.
          </p>
        )}
        {["Overview","Gold Buys","Sales","Ledger"].includes(tab) && <label>Metal <select aria-label="Metal" value={metalFilter} onChange={e=>setMetalFilter(e.target.value)}><option>Gold</option><option>Silver</option></select></label>}
        {Array.isArray(data) && (
          <section className="panel table">
            <h2>{visibleData.length} record(s)</h2>
            {!visibleData.length ? (
              <p>No records yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    {tab === "Products" && <th>Photo</th>}
                    {columns.map((c) => (
                      <th key={c}>
                        {(
                          {
                            amountPaise: "Amount",
                            pricePaise: "Price",
                            minPaise: "Minimum",
                            buyPaise: tab === "Rates" ? "Current rate ₹/g" : "Accepted rate ₹/g",
                            sellPaise: "Sell ₹/g",
                            createdAt: "Date",
                            anchorAt: "Started",
                            nextDue: "Next Due",
                            paidCount: "Paid Instalments",
                          } as Record<string, string>
                        )[c] || c.replace(/([A-Z])/g, " $1")}
                      </th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleData.map((row: any) => (
                    <tr key={row.id}>
                      {tab === "Products" && (
                        <td>
                          {row.image ? (
                            <img
                              className="thumb"
                              src={row.image}
                              alt={row.name}
                            />
                          ) : (
                            <span>Coin / no photo</span>
                          )}
                        </td>
                      )}
                      {columns.map((c) => (
                        <td key={c}>{cell(c, row[c])}</td>
                      ))}
                      <td>
                        {tab === "KYC" && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                setKycDocument(null);
                                setKycDetail(
                                  await api("/manual-kyc/admin/" + row.id),
                                );
                              })
                            }
                          >
                            Review details
                          </button>
                        )}
                        {forms[tab] && tab !== "Rates" && (
                          <button
                            className="secondary"
                            onClick={() => edit(row)}
                          >
                            Edit
                          </button>
                        )}
                        {(tab === "Gold Buys" || tab === "Sales") && (
                          <>
                            {row.status === "PENDING" &&
                              ["APPROVE", "REJECT"].map((a) => (
                                <button
                                  key={a}
                                  onClick={() => {
                                    setDecision({ tab, id: row.id, action: a, legacy: row.requestType === 'LEGACY', customerName: row.name, metal: row.metal||"Gold", grams: row.grams, amountPaise: row.amountPaise });
                                    setNote("");
                                    setReference("");
                                  }}
                                >
                                  {a === 'APPROVE' ? 'Approve' : 'Reject'}
                                </button>
                              ))}
                            {tab === "Sales" && row.status === "APPROVED" && (
                              <button
                                onClick={() => {
                                  setDecision({
                                    tab,
                                    id: row.id,
                                    action: "PAID",
                                  });
                                  setNote("");
                                  setReference("");
                                }}
                              >
                                Mark paid
                              </button>
                            )}
                            {tab === "Sales" && (
                              <details>
                                <summary>Payout details</summary>
                                {row.payoutDetails}
                              </details>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
        {decision && (
          <div className="modal" role="dialog" aria-modal="true">
            <form
              className="panel"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  if (decision.tab === "KYC" && (!Number.isSafeInteger(Number(decision.version)) || Number(decision.version) < 1)) throw new Error("Reopen the latest KYC details before reviewing; submission version is missing.");
                  await api(
                    decision.tab === "KYC"
                      ? `/manual-kyc/admin/${decision.id}/decision`
                      : `/admin/${decision.tab === "Gold Buys" ? (decision.legacy ? "payments" : "purchases") : decision.tab.toLowerCase()}/${decision.id}/decision`,
                    "POST",
                    {
                      action: decision.action,
                      note,
                      ...(decision.tab === "KYC"
                        ? { version: kycVersion(decision.version) }
                        : {}),
                      ...(reference ? { reference } : {}),
                    },
                  );
                  setDecision(null);
                  await load();
                });
              }}
            >
              <h2>
                {decision.action}{" "}
                {decision.tab === "Gold Buys"
                  ? "metal purchase"
                  : decision.tab === "KYC"
                    ? "manual KYC review"
                    : "sale"}
              </h2>
              {decision.tab === "Gold Buys" && <p><strong>{decision.customerName}</strong> · {decision.metal} · {(Number(decision.grams)/1000000).toFixed(6)} g · ₹{(Number(decision.amountPaise)/100).toLocaleString('en-IN',{minimumFractionDigits:2})}{decision.legacy ? ' · Earlier SIP payment' : ''}</p>}
              <p>
                {decision.tab === "Gold Buys" && decision.action === "APPROVE"
                  ? "Confirm bank receipt AND actual metal allocation before approving."
                  : decision.action === "PAID"
                    ? "Confirm money has reached the customer before continuing."
                    : "This action changes the customer record."}
              </p>
              {((decision.tab === "Gold Buys" &&
                decision.action === "APPROVE") ||
                decision.action === "PAID") && (
                <label>
                  {decision.action === "PAID"
                    ? "Bank payout reference"
                    : "Metal allocation reference"}
                  <input
                    required
                    minLength={3}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </label>
              )}
              <label>
                Verification / rejection note
                <textarea
                  required
                  minLength={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <button disabled={busy}>Confirm</button>
              <button
                type="button"
                className="secondary"
                onClick={() => setDecision(null)}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {kycDetail && (
          <div className="modal" role="dialog" aria-modal="true">
            <section
              className="panel"
              style={{
                width: "min(760px,95vw)",
                maxHeight: "90vh",
                overflow: "auto",
              }}
            >
              <h2>Personal Details — Manual Review</h2>
              <p>
                Status: {kycDetail.status} · Submitted{" "}
                {new Date(kycDetail.submittedAt).toLocaleString()}
              </p>
              <dl className="fields">
                {Object.entries(kycDetail.profile).map(([key, value]) => (
                  <div key={key}>
                    <dt style={{ color: "#7a6a66", fontSize: 12 }}>
                      {key.toUpperCase()}
                    </dt>
                    <dd
                      style={{ margin: "4px 0 12px", overflowWrap: "anywhere" }}
                    >
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const res = await fetch(
                      API + `/manual-kyc/${kycDetail.id}/document`,
                      { credentials: "include" },
                    );
                    if (!res.ok) throw new Error("Unable to access document");
                    const blob = await res.blob();
                    setKycDocument({
                      url: URL.createObjectURL(blob),
                      type: blob.type,
                    });
                  })
                }
              >
                Open private PAN document
              </button>
              {kycDocument &&
                (kycDocument.type === "application/pdf" ? (
                  <iframe
                    title="Private PAN document"
                    src={kycDocument.url}
                    style={{ width: "100%", height: 450, border: 0 }}
                  />
                ) : (
                  <img
                    alt="Customer PAN document for manual review"
                    src={kycDocument.url}
                    style={{
                      display: "block",
                      maxWidth: "100%",
                      maxHeight: 450,
                      objectFit: "contain",
                      marginTop: 16,
                    }}
                  />
                ))}
              {kycDetail.status === "PENDING" && (
                <div>
                  <button
                    disabled={!kycDocument || busy || !hasKycVersion}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Have you reviewed the customer details and PAN document? This records a manual approval, not API verification.",
                        )
                      )
                        return;
                      setDecision({
                        tab: "KYC",
                        id: kycDetail.id,
                        version: kycVersion(kycDetail.version),
                        action: "APPROVE",
                      });
                      setNote("");
                      setReference("");
                      setKycDetail(null);
                      setKycDocument(null);
                    }}
                  >
                    Approve manual review
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setDecision({
                        tab: "KYC",
                        id: kycDetail.id,
                        version: kycVersion(kycDetail.version),
                        action: "REJECT",
                      });
                      setNote("");
                      setReference("");
                      setKycDetail(null);
                      setKycDocument(null);
                    }}
                  >
                    Reject with reason
                  </button>
                </div>
              )}
              <button
                className="secondary"
                onClick={() => {
                  setKycDetail(null);
                  setKycDocument(null);
                }}
              >
                Close
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
