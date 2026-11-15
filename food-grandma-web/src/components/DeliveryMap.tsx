export type Coordinates = { lat: number; lng: number };
export function parseCoordinates(value: string): Coordinates | null {
  const parts = value.split(",").map((part) => part.trim());
  if (
    parts.length !== 2 ||
    parts.some((part) => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(part))
  )
    return null;
  const [lat, lng] = parts.map(Number);
  return Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
    ? { lat, lng }
    : null;
}
export default function DeliveryMap({
  coordinates,
}: {
  coordinates: Coordinates | null;
}) {
  const { lat, lng } = coordinates ?? { lat: 25.033, lng: 121.5654 };
  const params = new URLSearchParams({
    bbox: `${Math.max(-180, lng - 0.015)},${Math.max(-85, lat - 0.01)},${Math.min(180, lng + 0.015)},${Math.min(85, lat + 0.01)}`,
    layer: "mapnik",
  });
  if (coordinates) params.set("marker", `${lat},${lng}`);
  const mapLink = `https://www.openstreetmap.org/?${coordinates ? `mlat=${lat}&mlon=${lng}` : ""}#map=15/${lat}/${lng}`;
  return (
    <section className="delivery-map-panel" aria-label="配送位置地圖">
      <div className="map-heading">
        <div>
          <h2>配送地圖</h2>
          <p>
            {coordinates
              ? "本次更新的外送員位置"
              : "台北市概覽 · 尚未設定外送員位置"}
          </p>
        </div>
        <a href={mapLink} target="_blank" rel="noreferrer">
          開啟大地圖 ↗
        </a>
      </div>
      <iframe
        title="外送員位置地圖（OpenStreetMap）"
        data-testid="delivery-map"
        src={`https://www.openstreetmap.org/export/embed.html?${params}`}
        referrerPolicy="no-referrer"
      />
      <p className="map-note">
        {coordinates
          ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          : "使用下方定位按鈕或輸入經緯度，即可在地圖標記位置。"}{" "}
        · 地圖無法載入時可使用「開啟大地圖」。
      </p>
    </section>
  );
}
