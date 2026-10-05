import { useEffect, useState } from "react";
import "./App.css";
import {
  API_URL,
  getLeads,
  addLead,
  markLeadAsContacted,
} from "./services/api";

const initialLeads = [
  {
    id: 1,
    name: "Priya Reddy",
    company: "Reddy Interiors",
    source: "Website",
    score: 78,
    status: "Warm",
  },
  {
    id: 2,
    name: "Arjun Kumar",
    company: "AK Electronics",
    source: "WhatsApp",
    score: 68,
    status: "Warm",
  },
  {
    id: 3,
    name: "Sneha Rao",
    company: "Rao Boutique",
    source: "Instagram",
    score: 45,
    status: "Cold",
  },
  {
    id: 4,
    name: "Rahul Sharma",
    company: "Sharma Traders",
    source: "Referral",
    score: 92,
    status: "Hot",
  },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [leads, setLeads] = useState(initialLeads);
  const [showAddLead, setShowAddLead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [contactingLeadIds, setContactingLeadIds] = useState([]);

  useEffect(() => {
    let isActive = true;

    getLeads()
      .then((data) => {
        if (isActive && Array.isArray(data) && data.length > 0) {
          setLeads(data);
        }
      })
      .catch((error) => {
        if (isActive) {
          console.error("Error loading leads:", error);
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const totalLeads = leads.length;

  const hotLeads = leads.filter(
    (lead) => lead.status === "Hot"
  ).length;

  const converted = leads.filter(
    (lead) => lead.status === "Converted"
  ).length;
  const followUpsDue = leads.filter(
    (lead) => lead.status !== "Converted" && !lead.contacted
  ).length;
  const urgentFollowUps = leads.filter(
    (lead) => lead.status === "Hot" && !lead.contacted
  ).length;

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredLeads = normalizedSearch
    ? leads.filter((lead) =>
        [lead.name, lead.company, lead.source, lead.status, lead.category]
          .some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch))
      )
    : leads;

  async function handleAddLead(newLead) {
    try {
      const savedLead = await addLead(newLead);

      setLeads((currentLeads) => [...currentLeads, savedLead]);
      setShowAddLead(false);
      setActivePage("Leads");
    } catch (error) {
      console.error("Error adding lead:", error);

      alert(
        "Could not save the lead. Please make sure the backend is running."
      );
    }
  }
  const handleMarkAsContacted = async (leadId) => {
    const lead = leads.find((currentLead) => currentLead.id === leadId);
    if (!lead || contactingLeadIds.includes(leadId)) {
      return;
    }

    setContactingLeadIds((currentIds) => [...currentIds, leadId]);
    try {
      const result = await markLeadAsContacted(leadId, !lead.contacted);
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) =>
          currentLead.id === leadId ? result.lead : currentLead
        )
      );
    } catch (error) {
      console.error("Failed to update lead contact status:", error);
      alert("Could not update the lead. Please make sure the backend is running.");
    } finally {
      setContactingLeadIds((currentIds) =>
        currentIds.filter((id) => id !== leadId)
      );
    }
  };
  const analyzeLeadWithAI = async (lead) => {
    try {
      setAiLoading(true);
      setAiError("");
      setAiAnalysis(null);

      const response = await fetch(
        `${API_URL}/leads/ai/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lead),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI analysis failed");
      }

      setAiAnalysis(data.analysis);
    } catch (error) {
      console.error("AI analysis error:", error);
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
  };
  function renderPage() {
    switch (activePage) {
      case "Leads":
        return (
          <LeadsPage
            leads={filteredLeads}
            onAdd={() => setShowAddLead(true)}
            onView={setSelectedLead}
          />
        );

      case "AI Agent":
        return (
          <AIAgentPage
            leads={leads}
            analyzeLeadWithAI={analyzeLeadWithAI}
            aiAnalysis={aiAnalysis}
            aiLoading={aiLoading}
            aiError={aiError}
            contactingLeadIds={contactingLeadIds}
            onToggleContacted={handleMarkAsContacted}
          />
        );

      case "Analytics":
        return <AnalyticsPage leads={leads} />;

      case "Settings":
        return <SettingsPage />;

      default:
        return (
          <Dashboard
            totalLeads={totalLeads}
            hotLeads={hotLeads}
            converted={converted}
            followUpsDue={followUpsDue}
            urgentFollowUps={urgentFollowUps}
            recentLeads={filteredLeads}
            onAdd={() => setShowAddLead(true)}
            onNavigate={setActivePage}
            onView={setSelectedLead}
          />
        );
    }
  }

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-logo">V</div>

          <div>
            <h2>VyapaarAI</h2>
            <p>Smart Lead Management</p>
          </div>
        </div>

        <div className="menu-section">

          <p className="menu-title">
            WORKSPACE
          </p>

          <button
            className={`menu-item ${
              activePage === "Dashboard" ? "active" : ""
            }`}
            onClick={() => setActivePage("Dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className={`menu-item ${
              activePage === "Leads" ? "active" : ""
            }`}
            onClick={() => setActivePage("Leads")}
          >
            <span>♙</span>
            Leads
          </button>

          <button
            className={`menu-item ${
              activePage === "AI Agent" ? "active" : ""
            }`}
            onClick={() => setActivePage("AI Agent")}
          >
            <span>✦</span>
            AI Agent
          </button>

          <button
            className={`menu-item ${
              activePage === "Analytics" ? "active" : ""
            }`}
            onClick={() => setActivePage("Analytics")}
          >
            <span>▥</span>
            Analytics
          </button>

        </div>

        <div className="menu-section system">

          <p className="menu-title">
            SYSTEM
          </p>

          <button
            className={`menu-item ${
              activePage === "Settings" ? "active" : ""
            }`}
            onClick={() => setActivePage("Settings")}
          >
            <span>⚙</span>
            Settings
          </button>

        </div>

        <div className="profile">

          <div className="avatar">
            M
          </div>

          <div>
            <strong>Mercy</strong>
            <small>Business Owner</small>
          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        <header className="topbar">

          <div className="search">
            🔍
            <input
              placeholder="Search leads..."
              aria-label="Search leads"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="top-right">

            <span className="notification">
              🔔
            </span>

            <div className="user">

              <div className="avatar small">
                M
              </div>

              <div>
                <strong>Mercy</strong>
                <small>Business Owner</small>
              </div>

            </div>

          </div>

        </header>

        {loading && (
          <div
            style={{
              padding: "10px 30px",
              fontSize: "14px",
            }}
          >
            Loading leads...
          </div>
        )}

        {renderPage()}

      </main>

      {/* ADD LEAD MODAL */}

      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onAdd={handleAddLead}
        />
      )}

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}

    </div>
  );
}


/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({
  totalLeads,
  hotLeads,
  converted,
  followUpsDue,
  urgentFollowUps,
  recentLeads,
  onAdd,
  onNavigate,
  onView,
}) {
  return (
    <section className="dashboard">

      <div className="welcome-row">

        <div>

          <p className="date">
            Monday, October 5, 2026
          </p>

          <h1>
            Good evening, Mercy 👋
          </h1>

          <p className="subtitle">
            Here's what's happening with your business today.
          </p>

        </div>

        <button
          className="add-button"
          onClick={onAdd}
        >
          + Add New Lead
        </button>

      </div>


      {/* STATISTICS */}

      <div className="stats">

        <StatCard
          title="Total Leads"
          value={totalLeads}
          change="+12.5%"
          icon="♙"
        />

        <StatCard
          title="Hot Leads"
          value={hotLeads}
          change="+8.2%"
          icon="♨"
        />

        <StatCard
          title="Follow-ups Due"
          value={followUpsDue}
          change={`${urgentFollowUps} urgent`}
          icon="◷"
          urgent
        />

        <StatCard
          title="Converted"
          value={converted}
          change="+18.4%"
          icon="✓"
        />

      </div>


      {/* CHART + AI */}

      <div className="content-grid">

        <section className="card performance">

          <div className="card-header">

            <div>

              <h2>
                Lead Performance
              </h2>

              <p>
                Leads generated this week
              </p>

            </div>

            <button className="dots">
              •••
            </button>

          </div>


          <div className="chart">

            <div className="chart-labels">
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>

            <div className="bars">

              <ChartBar
                height="45%"
                day="Mon"
              />

              <ChartBar
                height="65%"
                day="Tue"
              />

              <ChartBar
                height="50%"
                day="Wed"
              />

              <ChartBar
                height="80%"
                day="Thu"
              />

              <ChartBar
                height="70%"
                day="Fri"
              />

              <ChartBar
                height="90%"
                day="Sat"
              />

              <ChartBar
                height="60%"
                day="Sun"
              />

            </div>

          </div>

        </section>


        {/* AI INSIGHT */}

        <section className="ai-card">

          <div className="ai-icon">
            ✦
          </div>

          <p className="ai-label">
            AI INSIGHT
          </p>

          <h2>
            Follow up with your hot leads
          </h2>

          <p>
            Your AI Agent found{" "}
            {hotLeads} high-potential leads
            that haven't been contacted recently.
          </p>

          <button
            className="ai-button"
            onClick={() => onNavigate("AI Agent")}
          >
            View AI Recommendations →
          </button>

        </section>

      </div>


      {/* RECENT LEADS */}

      <section className="card leads-card">

        <div className="card-header">

          <div>

            <h2>
              Recent Leads
            </h2>

            <p>
              Your latest customer prospects
            </p>

          </div>

          <button
            className="view-all"
            onClick={() => onNavigate("Leads")}
          >
            View All →
          </button>

        </div>


        <div className="lead-table">

          <div className="table-head">

            <span>NAME</span>
            <span>SOURCE</span>
            <span>SCORE</span>
            <span>STATUS</span>
            <span>ACTION</span>

          </div>

          {recentLeads.slice(0, 4).map((lead) => (
            <Lead
              key={lead.id}
              {...lead}
              onView={() => onView(lead)}
            />
          ))}

          {recentLeads.length === 0 && (
            <p className="lead-empty-state">No leads match your search.</p>
          )}

        </div>

      </section>

    </section>
  );
}


/* =====================================================
   LEADS PAGE
===================================================== */

function LeadsPage({ leads, onAdd, onView }) {
  return (
    <section className="dashboard">

      <div className="welcome-row">

        <div>

          <p className="date">
            Customer Management
          </p>

          <h1>
            All Leads
          </h1>

          <p className="subtitle">
            Manage and track your customer prospects.
          </p>

        </div>

        <button
          className="add-button"
          onClick={onAdd}
        >
          + Add New Lead
        </button>

      </div>


      <section className="card leads-card">

        <div className="lead-table">

          <div className="table-head">

            <span>NAME</span>
            <span>SOURCE</span>
            <span>SCORE</span>
            <span>STATUS</span>
            <span>ACTION</span>

          </div>

          {leads.map((lead) => (
            <Lead
              key={lead.id}
              {...lead}
              onView={() => onView(lead)}
            />
          ))}

          {leads.length === 0 && (
            <p className="lead-empty-state">No leads match your search.</p>
          )}

        </div>

      </section>

    </section>
  );
}


/* =====================================================
   AI AGENT
===================================================== */

function AIAgentPage({
  leads,
  analyzeLeadWithAI,
  aiAnalysis,
  aiLoading,
  aiError,
  contactingLeadIds,
  onToggleContacted,
}) {
  const hotLeads = leads.filter(
    (lead) => lead.status === "Hot"
  );

  const warmLeads = leads.filter(
    (lead) => lead.status === "Warm"
  );

  const priorityLeads = [...leads]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  function getRecommendation(lead) {
    if (lead.score >= 80) {
      return "High priority. Contact this lead immediately.";
    }

    if (lead.score >= 60) {
      return "Good potential. Follow up within 1–2 days.";
    }

    return "Low priority. Continue nurturing this lead.";
  }

  return (
    <section className="dashboard">

      {/* Header */}
      <div className="welcome-row">
        <div>
          <p className="date">Artificial Intelligence</p>

          <h1>AI Agent ✦</h1>

          <p className="subtitle">
            Your intelligent assistant for lead management.
          </p>
        </div>
      </div>

      {/* AI Summary */}
      <div className="content-grid">

        <section className="ai-card">
          <div className="ai-icon">✦</div>

          <p className="ai-label">
            AI ANALYSIS
          </p>

          <h2>
            {hotLeads.length} high-priority leads detected
          </h2>

          <p>
            Based on your current lead scores and statuses,
            these customers should receive the most attention.
          </p>
        </section>

        <section className="card performance">

          <div className="card-header">
            <div>
              <h2>Lead Overview</h2>

              <p>
                AI analyzed your current pipeline
              </p>
            </div>
          </div>

          <div style={{ padding: "20px 0" }}>

            <p>
              🔥 Hot Leads: <strong>{hotLeads.length}</strong>
            </p>

            <p>
              🟡 Warm Leads: <strong>{warmLeads.length}</strong>
            </p>

            <p>
              👥 Total Leads: <strong>{leads.length}</strong>
            </p>

          </div>

        </section>

      </div>

      {/* Recommendations */}
      <section className="card leads-card">

        <div className="card-header">

          <div>
            <h2>AI Recommendations</h2>

            <p>
              Leads that deserve your attention
            </p>
          </div>

        </div>

        <div>

          {priorityLeads.length === 0 ? (

            <p>
              No leads available for analysis.
            </p>

          ) : (

            priorityLeads.map((lead) => (

              <div
                key={lead.id}
                style={{
                  padding: "20px 0",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                }}
              >

                <div>

                  <strong>
                    {lead.name}
                  </strong>

                  <p style={{ margin: "6px 0" }}>
                    {lead.company}
                  </p>

                  <small>
                    Source: {lead.source}
                  </small>

                </div>

                <div
                  style={{
                    minWidth: "250px",
                  }}
                >

                  <strong>
                    Score: {lead.score}/100
                  </strong>

                  <p>
                    {getRecommendation(lead)}
                  </p>

                </div>

                <span
                  className={`status ${lead.status?.toLowerCase()}`}
                >
                  {lead.status}
                </span>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    className="add-button"
                    type="button"
                    onClick={() => analyzeLeadWithAI(lead)}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Analyzing..." : "Analyze"}
                  </button>

                  <button
                    className="add-button"
                    type="button"
                    onClick={() => onToggleContacted(lead.id)}
                    disabled={contactingLeadIds.includes(lead.id)}
                    style={{
                      background: lead.contacted ? "#16a34a" : "#eef4ff",
                      color: lead.contacted ? "#ffffff" : "#2563eb",
                      border: lead.contacted
                        ? "1px solid #16a34a"
                        : "1px solid #2563eb",
                    }}
                  >
                    {contactingLeadIds.includes(lead.id)
                      ? "Updating..."
                      : lead.contacted
                        ? "✓ Contacted"
                        : "Mark as Contacted"}
                  </button>
                </div>

              </div>

            ))

          )}

        </div>

        {aiError && (
          <p role="alert" style={{ color: "#c62828", marginTop: "20px" }}>
            {aiError}
          </p>
        )}

        {aiAnalysis && (
          <div
            aria-live="polite"
            style={{
              marginTop: "24px",
              padding: "20px",
              background: "#f7f9fc",
              borderRadius: "10px",
            }}
          >
            <h3>AI Lead Analysis</h3>
            <p><strong>Purchase intent:</strong> {aiAnalysis.intent}</p>
            <p><strong>AI lead score:</strong> {aiAnalysis.leadScore}/100</p>
            <p><strong>Category:</strong> {aiAnalysis.category}</p>
            <p><strong>Urgency:</strong> {aiAnalysis.urgency}</p>
            <p>
              <strong>Requirements:</strong>{" "}
              {Array.isArray(aiAnalysis.requirements)
                ? aiAnalysis.requirements.join(", ")
                : aiAnalysis.requirements}
            </p>
            <p><strong>Recommended action:</strong> {aiAnalysis.recommendedAction}</p>
            <p><strong>Personalized follow-up:</strong> {aiAnalysis.followUpMessage}</p>
          </div>
        )}

      </section>

    </section>
  );
}


/* =====================================================
   ANALYTICS
===================================================== */

function AnalyticsPage({ leads }) {

  const hot = leads.filter(
    (lead) => lead.status === "Hot"
  ).length;

  const warm = leads.filter(
    (lead) => lead.status === "Warm"
  ).length;

  const cold = leads.filter(
    (lead) => lead.status === "Cold"
  ).length;

  return (
    <section className="dashboard">

      <div className="welcome-row">

        <div>

          <p className="date">
            Business Intelligence
          </p>

          <h1>
            Analytics
          </h1>

          <p className="subtitle">
            Understand your lead pipeline.
          </p>

        </div>

      </div>


      <div className="stats">

        <StatCard
          title="Total Leads"
          value={leads.length}
          change="Current"
          icon="♙"
        />

        <StatCard
          title="Hot"
          value={hot}
          change="High priority"
          icon="♨"
        />

        <StatCard
          title="Warm"
          value={warm}
          change="Needs nurturing"
          icon="◷"
        />

        <StatCard
          title="Cold"
          value={cold}
          change="Low priority"
          icon="○"
        />

      </div>


      <section className="card performance">

        <div className="card-header">

          <div>

            <h2>
              Lead Distribution
            </h2>

            <p>
              Current pipeline status
            </p>

          </div>

        </div>


        <div style={{ padding: "30px 0" }}>

          <p>
            🔥 Hot Leads: {hot}
          </p>

          <p>
            🟡 Warm Leads: {warm}
          </p>

          <p>
            ⚪ Cold Leads: {cold}
          </p>

        </div>

      </section>

    </section>
  );
}


/* =====================================================
   SETTINGS
===================================================== */

function SettingsPage() {

  return (
    <section className="dashboard">

      <div className="welcome-row">

        <div>

          <p className="date">
            System
          </p>

          <h1>
            Settings
          </h1>

          <p className="subtitle">
            Manage your VyapaarAI preferences.
          </p>

        </div>

      </div>


      <section className="card performance">

        <h2>
          Business Profile
        </h2>

        <p>
          Business Owner: Mercy
        </p>

        <p>
          Application: VyapaarAI
        </p>

        <p>
          Version: 1.0
        </p>

      </section>

    </section>
  );
}


/* =====================================================
   ADD LEAD MODAL
===================================================== */

function AddLeadModal({ onClose, onAdd }) {

  const [form, setForm] = useState({
    name: "",
    company: "",
    source: "Website",
    score: 50,
    status: "Warm",
  });


  function handleSubmit(e) {

    e.preventDefault();

    if (!form.name.trim() || !form.company.trim()) {

      alert(
        "Please enter name and company."
      );

      return;
    }

    onAdd({
      ...form,
      name: form.name.trim(),
      company: form.company.trim(),
      score: Number(form.score),
    });
  }


  function updateField(field, value) {

    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }


  return (
    <div className="modal-overlay">

      <div className="modal">

        <h2>
          Add New Lead
        </h2>

        <p>
          Enter customer information below.
        </p>


        <form onSubmit={handleSubmit}>

          <label>
            Customer Name

            <input
              value={form.name}
              onChange={(e) =>
                updateField(
                  "name",
                  e.target.value
                )
              }
              placeholder="Example: Ananya Reddy"
            />

          </label>


          <label>
            Company

            <input
              value={form.company}
              onChange={(e) =>
                updateField(
                  "company",
                  e.target.value
                )
              }
              placeholder="Example: Reddy Fashion"
            />

          </label>


          <label>
            Lead Source

            <select
              value={form.source}
              onChange={(e) =>
                updateField(
                  "source",
                  e.target.value
                )
              }
            >

              <option>Website</option>
              <option>WhatsApp</option>
              <option>Instagram</option>
              <option>Referral</option>
              <option>Facebook</option>

            </select>

          </label>


          <label>
            Lead Score

            <input
              type="number"
              min="0"
              max="100"
              value={form.score}
              onChange={(e) =>
                updateField(
                  "score",
                  e.target.value
                )
              }
            />

          </label>


          <label>
            Status

            <select
              value={form.status}
              onChange={(e) =>
                updateField(
                  "status",
                  e.target.value
                )
              }
            >

              <option>Hot</option>
              <option>Warm</option>
              <option>Cold</option>
              <option>Converted</option>

            </select>

          </label>


          <div className="modal-buttons">

            <button
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit">
              Add Lead
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  change,
  icon,
  urgent,
}) {

  return (
    <div className="stat-card">

      <div className="stat-top">

        <div>

          <p>
            {title}
          </p>

          <h2>
            {value}
          </h2>

        </div>

        <div className="stat-icon">
          {icon}
        </div>

      </div>

      <span
        className={
          urgent
            ? "change urgent"
            : "change"
        }
      >
        ↗ {change}
      </span>

    </div>
  );
}


/* =====================================================
   CHART BAR
===================================================== */

function ChartBar({ height, day }) {

  return (
    <div
      className="bar"
      style={{ height }}
    >
      <span>
        {day}
      </span>
    </div>
  );
}


/* =====================================================
   LEAD ROW
===================================================== */

function Lead({
  name,
  company,
  source,
  score,
  status,
  onView,
}) {

  return (
    <div className="lead-row">

      <div className="lead-name">

        <div className="lead-avatar">
          {name?.charAt(0)}
        </div>

        <div>

          <strong>
            {name}
          </strong>

          <small>
            {company}
          </small>

        </div>

      </div>


      <span>
        {source}
      </span>


      <div className="score">

        <div className="score-bar">

          <div
            style={{
              width: `${score}%`,
            }}
          />

        </div>

        <strong>
          {score}
        </strong>

      </div>


      <span
        className={`status ${
          status?.toLowerCase()
        }`}
      >
        {status}
      </span>


      <button className="view-button" type="button" onClick={onView}>
        View
      </button>

    </div>
  );
}

function LeadDetailsModal({ lead, onClose }) {
  const standardFields = new Set([
    "name",
    "company",
    "source",
    "score",
    "status",
  ]);
  const additionalFields = Object.entries(lead).filter(
    ([key, value]) => !standardFields.has(key) && value != null && value !== ""
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function formatValue(value) {
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }

    return String(value);
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="modal lead-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-details-title"
      >
        <h2 id="lead-details-title">Lead Details</h2>
        <p>Customer and lead information</p>

        <dl className="lead-details-list">
          <div><dt>Customer name</dt><dd>{lead.name || "Unknown"}</dd></div>
          <div><dt>Company</dt><dd>{lead.company || "Unknown"}</dd></div>
          <div><dt>Source</dt><dd>{lead.source || "Unknown"}</dd></div>
          <div><dt>Current score</dt><dd>{lead.score ?? "Unknown"}</dd></div>
          <div><dt>Current status</dt><dd>{lead.status || lead.category || "Unknown"}</dd></div>
          {additionalFields.map(([key, value]) => (
            <div key={key}>
              <dt>{key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</dt>
              <dd>{formatValue(value)}</dd>
            </div>
          ))}
        </dl>

        <div className="modal-buttons">
          <button type="button" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>
  );
}


export default App;