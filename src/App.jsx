import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loadTime, setLoadTime] = useState(null); // ← CDN time
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const fetchPhotos = async () => {
    const res = await fetch(`${API}/photos`);
    setPhotos(await res.json());
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch(
        `${API}/presign?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`,
      );
      const { url } = await res.json();
      await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      await fetchPhotos();
    } finally {
      setUploading(false);
      inputRef.current.value = "";
    }
  };

  // ← Fetch image as blob and measure time
  const handleView = async (p) => {
    setSelected(null);
    setLoadTime(null);
    setLoading(true);

    const start = performance.now();

    const res = await fetch(p.url, { cache: "no-store" }); // no-store = bypass cache = real CDN time
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const end = performance.now();
    const ms = Math.round(end - start);

    setLoadTime(ms);
    setSelected({ ...p, objectUrl });
    setLoading(false);
  };

  const handleClose = () => {
    if (selected?.objectUrl) URL.revokeObjectURL(selected.objectUrl);
    setSelected(null);
    setLoadTime(null);
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24,
        fontFamily: "sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>📷 Gallery</h1>
        <label
          style={{
            cursor: "pointer",
            background: "#0066ff",
            color: "#fff",
            padding: "8px 18px",
            borderRadius: 8,
          }}
        >
          {uploading ? "Uploading..." : "Upload Photo"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {photos.length === 0 && (
        <p style={{ color: "#888" }}>No photos yet. Upload one!</p>
      )}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {photos.map((p) => (
          <div
            key={p.key}
            style={{
              position: "relative",
              borderRadius: 8,
              overflow: "hidden",
              background: "#eee",
            }}
          >
            <img
              src={p.url}
              alt={p.key}
              style={{
                width: "100%",
                aspectRatio: "1",
                objectFit: "cover",
                display: "block",
                filter: "blur(2px)",
                transform: "scale(1.05)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              <button
                onClick={() => handleView(p)}
                disabled={loading}
                style={{
                  background: "#fff",
                  color: "#000",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {loading ? "Loading..." : "👁 View"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", textAlign: "center" }}
          >
            <img
              src={selected.objectUrl}
              alt={selected.key}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                borderRadius: 10,
                display: "block",
              }}
            />

            {/* CDN load time badge */}
            {loadTime && (
              <div
                style={{
                  marginTop: 12,
                  background:
                    loadTime < 300
                      ? "#22c55e"
                      : loadTime < 800
                        ? "#f59e0b"
                        : "#ef4444",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "6px 16px",
                  fontWeight: 600,
                  fontSize: 14,
                  display: "inline-block",
                }}
              >
                ⚡ CDN fetch: {loadTime}ms
                {loadTime < 300
                  ? " 🟢 Fast"
                  : loadTime < 800
                    ? " 🟡 OK"
                    : " 🔴 Slow"}
              </div>
            )}

            {/* Close */}
            <button
              onClick={handleClose}
              style={{
                position: "absolute",
                top: -16,
                right: -16,
                background: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
