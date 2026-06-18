import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Final 450 DSA Tracker";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #000000, #111111)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "24px",
            padding: "60px",
            background: "rgba(255, 255, 255, 0.05)",
          }}
        >
          <h1
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-0.05em",
              margin: 0,
              textAlign: "center",
            }}
          >
            Final 450
          </h1>
          <p
            style={{
              fontSize: 40,
              color: "#a1a1aa", // zinc-400
              marginTop: 20,
              textAlign: "center",
            }}
          >
            DSA Tracker
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
