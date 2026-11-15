import { brand } from "../../config/brand";

export default function StorefrontHero() {
  return (
    <section className="market-banner" aria-label="Food Grandma 品牌介紹">
      <div>
        <svg className="banner-grandma-outline" viewBox="0 0 160 190" fill="none" aria-hidden="true" focusable="false">
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M64 30C47 10 94 0 100 24M35 88C13 20 133 11 130 86" />
            <path d="M40 66c1 42 6 66 42 68 36-2 42-31 41-67M36 67c19-3 34-16 45-32 9 17 24 26 45 30" />
            <circle cx="62" cy="82" r="17" /><circle cx="105" cy="82" r="17" />
            <path d="M79 80h9M45 78l-9-4m86 4 7-4M80 92l-3 13h8M68 114q15 13 29-1M59 82h3m40 0h3" />
            <path d="M17 185c1-31 21-43 46-48l18 17 19-17c28 6 44 18 46 48M57 140l4 44h42l4-43M70 166h22" />
          </g>
        </svg>
        <span>Food Grandma · 阿嬤的好食光</span><h2>阿嬤不怕你餓，<br />就怕你吃不飽。</h2><p>從日常午餐到晚餐，找到今天想吃的料理。</p><a href="#restaurants">瀏覽所有餐廳 →</a></div>
      <img src={brand.heroImage} alt="新鮮蔬菜與配料組成的沙拉碗，料理示意照片" fetchPriority="high" />
    </section>
  );
}
