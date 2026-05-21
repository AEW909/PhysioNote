import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 120,
          background:
            "radial-gradient(circle at 18% 18%, rgba(0,245,212,0.35), transparent 24%), radial-gradient(circle at 82% 18%, rgba(255,77,202,0.35), transparent 24%), radial-gradient(circle at 50% 84%, rgba(149,255,74,0.28), transparent 28%), linear-gradient(180deg, #04040c 0%, #090816 55%, #10051d 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: 9999,
            border: "22px solid #00f5d4",
            boxShadow: "0 0 40px rgba(0,245,212,0.45)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 224,
            height: 224,
            borderRadius: 9999,
            border: "18px solid #ff4dca",
            boxShadow: "0 0 40px rgba(255,77,202,0.35)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 170,
            height: 170,
            borderRadius: 9999,
            background: "#fff7ff",
            color: "#111111",
            fontSize: 96,
            fontWeight: 900,
            boxShadow: "0 0 60px rgba(255,255,255,0.18)",
          }}
        >
          GO
        </div>
        <div
          style={{
            position: "absolute",
            top: 88,
            left: 74,
            width: 54,
            height: 54,
            borderRadius: 9999,
            background: "#ffd84d",
            border: "10px solid #111111",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 88,
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "#95ff4a",
            border: "10px solid #111111",
            transform: "rotate(18deg)",
          }}
        />
      </div>
    ),
    size,
  );
}
