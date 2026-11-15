import { Link } from "react-router-dom";
import { Restaurant } from "../../types";

export default function RestaurantCard({
  restaurant: r,
  index,
}: {
  restaurant: Restaurant;
  index: number;
}) {
  return (
    <li className="restaurant-card" data-testid="restaurant-card">
      <Link to={`/customer/restaurants/${r.id}/meals`} className="card-link">
        <div className={`restaurant-cover cover-${index % 3}`}>
          {r.logo ? (
            <img
              loading="lazy"
              decoding="async"
              src={r.logo}
              alt={`${r.name} 料理示意照片`}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <span className="photo-placeholder">料理照片準備中</span>
        </div>
        <div className="restaurant-info">
          <div className="restaurant-title">
            <h3>{r.name}</h3>
            <span aria-hidden="true">↗</span>
          </div>
          <p>⌖ {r.address}</p>
          <div className="restaurant-bottom">
            <span>料理照片僅供示意</span>
            <strong>查看餐點 →</strong>
          </div>
        </div>
      </Link>
    </li>
  );
}
