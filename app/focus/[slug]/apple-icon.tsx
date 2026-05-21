import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          borderRadius: 40,
          background:
            "radial-gradient(circle at 18% 18%, rgba(0,245,212,0.35), transparent 24%), radial-gradient(circle at 82% 18%, rgba(255,77,202,0.35), transparent 24%), radial-gradient(circle at 50% 84%, rgba(149,255,74,0.28), transparent 28%), linear-gradient(180deg, #04040c 0%, #090816 55%, #10051d 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 126,
            height: 126,
            borderRadius: 9999,
            border: "8px solid #00f5d4",
          }}
        />
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 9999,
            background: "#fff7ff",
            color: "#111111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 900,
          }}
        >
          GO
        </div>
      </div>
    ),
    size,
  );
}
