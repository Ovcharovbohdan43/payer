import { ImageResponse } from "next/og";

export const alt = "Puyer — Invoice in 15 seconds. Get paid faster.";
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
          background: "#0B0F14",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            Puyer
          </div>
          <div
            style={{
              fontSize: 36,
              color: "#3B82F6",
              fontWeight: 600,
            }}
          >
            Invoice in 15 seconds. Get paid faster.
          </div>
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 600,
              textAlign: "center",
            }}
          >
            Create invoices, send payment links, track payments — no hassle
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
