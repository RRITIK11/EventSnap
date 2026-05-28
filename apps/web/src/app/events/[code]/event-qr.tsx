import QRCode from "qrcode";

export async function EventQR({ url }: { url: string }) {
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 180,
    color: { dark: "#fafafa", light: "#0a0a0a" },
  });

  return (
    <div
      aria-label={`QR code linking to ${url}`}
      className="overflow-hidden rounded-lg bg-neutral-950 p-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
