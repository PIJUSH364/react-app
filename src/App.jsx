import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
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
      // 1. Get presigned URL from BE
      const res = await fetch(
        `${API}/presign?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`,
      );
      const { url } = await res.json();

      // 2. Upload directly to S3
      await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // 3. Refresh gallery
      await fetchPhotos();
    } finally {
      setUploading(false);
      inputRef.current.value = "";
    }
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {photos.map((p) => (
          <img
            key={p.key}
            src={p.url}
            alt={p.key}
            style={{
              width: "100%",
              aspectRatio: "1",
              objectFit: "cover",
              borderRadius: 8,
              background: "#eee",
            }}
          />
        ))}
      </div>
    </div>
  );
}
