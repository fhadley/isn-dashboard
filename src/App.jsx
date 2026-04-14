import React, { useMemo, useState, useEffect, useRef } from "react";

const people = [
  {
    id: "emil-michael",
    name: "Emil Michael",
    office: "Under Secretary of Defense for Research and Engineering",
    org: "OUSD(R&E)",
    lane: "DoD S&T Direction",
    highlight: true,
    importance: "High",
    why: "Sets top-level DoD research and engineering direction.",
    hook: "ISN as an integrated RDT&E model linking MIT and MIT Lincoln Laboratory.",
    bio: "Senior DoD research and engineering leader shaping the strategic environment for UARCs.",
    status: "Current",
  },
  {
    id: "chris-manning",
    name: "Chris Manning",
    office: "DASA(R&T)",
    org: "Army",
    lane: "Army S&T Leadership",
    highlight: true,
    importance: "High",
    why: "Senior Army S&T leadership with direct relevance to ISN.",
    hook: "Concrete Army outcomes and sponsor alignment.",
    bio: "Senior Army science and technology official relevant for ISN positioning.",
    status: "Current",
  },
  {
    id: "petrock",
    name: "Anne Marie Petrock",
    office: "Director (A), ARO",
    org: "DEVCOM ARL / ARO",
    lane: "Direct Sponsor",
    highlight: true,
    importance: "Highest",
    why: "Direct extramural sponsor of ISN.",
    hook: "ISN performance, stewardship, and responsiveness.",
    bio: "Acting leader of the Army Research Office.",
    status: "Acting",
  },
  {
    id: "denomy",
    name: "Troy Denomy",
    office: "CPE Ground",
    org: "Army",
    lane: "Transition",
    highlight: true,
    importance: "Highest",
    why: "Primary ground capability integration authority.",
    hook: "ISN → ground capability relevance.",
    bio: "Leads Capability Portfolio Executive Ground.",
    status: "Current",
  },
];

const styles = {
  container: {
    fontFamily: "system-ui",
    padding: "24px",
    background: "#f3f4f6",
  },
  card: {
    background: "white",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "12px",
    border: "1px solid #ddd",
    cursor: "pointer",
  },
  highlight: {
    background: "#fff3cd",
    border: "1px solid #f5c518",
  },
};

function Person({ p, onClick }) {
  return (
    <div
      style={{
        ...styles.card,
        ...(p.highlight ? styles.highlight : {}),
      }}
      onClick={() => onClick(p)}
    >
      <strong>{p.name}</strong>
      <div>{p.office}</div>
      <div style={{ fontSize: "12px", color: "#555" }}>{p.org}</div>
    </div>
  );
}
export default function App() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(people[0]);
  const containerRef = useRef(null);

  const reportFrameHeight = () => {
    const height = containerRef.current?.getBoundingClientRect().height;
    if (!height || window.parent === window) return;
    window.parent.postMessage(
      { source: "isn-dashboard", type: "frame-height", height },
      "*"
    );
  };

  useEffect(() => {
    reportFrameHeight();

    const handleMessage = (event) => {
      if (!event?.data || event.data.type !== "get-frame-height") return;
      reportFrameHeight();
    };

    window.addEventListener("message", handleMessage);
    const observer = new ResizeObserver(reportFrameHeight);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener("message", handleMessage);
      observer.disconnect();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return people;
    return people.filter((p) =>
      [p.name, p.office, p.org, p.lane, p.why, p.hook, p.bio]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  return (
    <div ref={containerRef} style={styles.container}>
      <h1 style={{ marginTop: 0 }}>ISN External Stakeholder Dashboard</h1>
      <p style={{ color: "#555", maxWidth: "900px" }}>
        Snapshot reference dashboard for current offices and officeholders most
        relevant to ISN. Highlighted cards indicate priority outreach targets.
      </p>

      <div style={{ margin: "20px 0" }}>
        <input
          type="text"
          placeholder="Search by name, office, organization, or role"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div>
          <h2 style={{ marginTop: 0 }}>People</h2>
          {filtered.map((p) => (
            <Person key={p.id} p={p} onClick={setSelected} />
          ))}
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{selected.name}</h2>
          <div style={{ fontWeight: "600", marginBottom: "6px" }}>
            {selected.office}
          </div>
          <div style={{ color: "#555", marginBottom: "16px" }}>
            {selected.org} · {selected.status}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <strong>Why they matter</strong>
            <div style={{ marginTop: "6px", color: "#444", lineHeight: 1.6 }}>
              {selected.why}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <strong>Suggested hook</strong>
            <div style={{ marginTop: "6px", color: "#444", lineHeight: 1.6 }}>
              {selected.hook}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <strong>Biographical note</strong>
            <div style={{ marginTop: "6px", color: "#444", lineHeight: 1.6 }}>
              {selected.bio}
            </div>
          </div>

          <div>
            <strong>Lane</strong>
            <div style={{ marginTop: "6px", color: "#444" }}>{selected.lane}</div>
          </div>
        </div>
      </div>
    </div>
  );
}