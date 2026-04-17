import React, { useMemo, useState, useEffect, useRef } from "react";

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
    background: "#e6f2ff",
    border: "1px solid #66a3ff",
  },
    tier1: {
    borderLeft: "6px solid #2563eb",
  },
  tier2: {
    borderLeft: "6px solid #60a5fa",
  },
  tier3: {
    borderLeft: "6px solid #cbd5f5",
  },
};

const positionBlockStyle = (i) => ({
  marginTop: i === 0 ? 4 : 10,
});

const orgStyle = {
  fontSize: 12,
  color: "#555",
};


function primaryPosition(person) {
  return person.positions && person.positions.length > 0
    ? person.positions[0]
    : { title: "", org: "", parentOrg: "" };
}

function Person({ p, onClick }) {
  return (
    <div
      style={{
        ...styles.card,
        ...(p.highlight ? styles.highlight : {}),
        ...(p.tier === 1 ? styles.tier1 : {}),
        ...(p.tier === 2 ? styles.tier2 : {}),
        ...(p.tier === 3 ? styles.tier3 : {}),
      }}
      onClick={() => onClick(p)}
    >
      <strong>{p.name}</strong>

      {(p.positions || []).map((pos, i) => (
        <div key={i} style={positionBlockStyle(i)}>
          <div>{pos.title}</div>
          <div style={orgStyle}>{pos.org}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch("/data/people.json")
      .then((res) => res.json())
      .then((data) => setPeople(data))
      .catch((err) => console.error("Failed to load people:", err));
  }, []);



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
  }, [people, selected, query]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    return people
      .filter((p) => {
        if (!q) return true;

        return [
          p.name,
          ...(p.positions || []).flatMap((pos) => [pos.title, pos.org, pos.parentOrg]),
          ...(p.lane || []),
          p.why,
          p.hook,
          p.bio,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
        .sort((a, b) => {
          const tierA = a.tier ?? 99;
          const tierB = b.tier ?? 99;

          // First: sort by tier
          if (tierA !== tierB) return tierA - tierB;

          // Then: sort by last name
          const getLastName = (name) =>
            name.trim().split(/\s+/).slice(-1)[0].toLowerCase();

          const lastA = getLastName(a.name);
          const lastB = getLastName(b.name);

          const lastCompare = lastA.localeCompare(lastB);
          if (lastCompare !== 0) return lastCompare;

          // Final tie-breaker: full name
          return a.name.localeCompare(b.name);
        });
}, [people, query]);


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
        <div
          style={{
            maxHeight: "80vh",
            overflowY: "auto",
            paddingRight: "8px",
          }}
        >
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
            position: "sticky",
            top: "24px",
            alignSelf: "start",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          
          {!selected ? (
            <div style={{ color: "#555" }}>Select a person to view details.</div>          ) : (
            <>
              {selected?.photo && (
                <img
                  src={selected.photo}
                  alt={selected.name}
                  style={{
                    width: "160px",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    marginBottom: "16px",
                    border: "1px solid #ddd",
                  }}
                />
              )}

              <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
                {selected.name}
              </h2>

              <div style={{ marginBottom: "20px" }}>
                <strong>Title:</strong>

                {(selected?.positions || []).map((pos, i) => (
                  <div key={i} style={{ marginTop: i === 0 ? "6px" : "10px" }}>
                    <div>{pos.title}</div>
                    <div style={{ marginTop: "2px" }}>
                      {pos.org}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <strong>Status:</strong>
                <div style={{ marginTop: "6px", color: "#555" }}>
                  {selected?.status}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong>Engagement</strong>
                <div style={{ marginTop: "6px", color: "#444" }}>
                  {selected?.engagement || "—"}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong>Last Contact</strong>
                <div style={{ marginTop: "6px", color: "#444" }}>
                  {selected?.lastContact || "—"}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong>Introduced By</strong>
                <div style={{ marginTop: "6px", color: "#444" }}>
                  {selected?.introducedBy || "—"}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <strong>Why they matter</strong>
                <div style={{ marginTop: "6px", color: "#444", lineHeight: 1.6 }}>
                  {selected.why}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <strong>Suggested hook</strong>
                <div style={{ marginTop: "6px", color: "#444", lineHeight: 1.6 }}>
                  {selected.hook}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <strong>Biographical note</strong>
                <div style={{ marginTop: "6px", color: "#444", lineHeight: 1.6 }}>
                  {selected.bio}
                </div>
              </div>

              <div>
                <strong>Lane</strong>
                <div style={{ marginTop: "6px", color: "#444" }}>
                  {(selected.lane || []).join(", ")}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}