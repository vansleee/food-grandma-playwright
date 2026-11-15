import Brand from "../components/Brand";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { setToken } from "../auth";

export default function SignUp() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors([]);
    const form = new FormData(e.currentTarget);
    const payload = {
      username: String(form.get("username")),
      password: String(form.get("password")),
      first_name: String(form.get("first_name") || ""),
      last_name: String(form.get("last_name") || ""),
      email: String(form.get("email")),
      name: String(form.get("name")),
      phone: String(form.get("phone")),
      address: String(form.get("address")),
      logo: String(form.get("logo") || ""),
    };

    try {
      const result = await api.signUp(payload);
      if (result.status === "failed" || !result.access_token) {
        setErrors([result.error || "註冊失敗，請稍後重試。"]);
        return;
      }
      setToken(result.access_token);
      navigate("/orders");
    } catch (err) {
      setErrors([
        err instanceof Error ? err.message : "註冊失敗，請稍後重試。",
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <Brand />
      </div>
      <div className="auth-card">
        <h2>加入 Food Grandma</h2>
        <p>讓更多人，吃到你的拿手好菜。</p>
        {errors.length > 0 && (
          <div className="alert" data-testid="sign-up-errors">
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <form onSubmit={handleSubmit} data-testid="sign-up-form">
          <h4>帳號設定</h4>
          <label htmlFor="username">帳號</label>
          <input
            id="username"
            name="username"
            data-testid="sign-up-username"
            required
          />
          <label htmlFor="password">密碼</label>
          <input
            id="password"
            name="password"
            type="password"
            data-testid="sign-up-password"
            required
          />
          <label htmlFor="first_name">名字</label>
          <input
            id="first_name"
            name="first_name"
            data-testid="sign-up-first-name"
          />
          <label htmlFor="last_name">姓氏</label>
          <input
            id="last_name"
            name="last_name"
            data-testid="sign-up-last-name"
          />
          <label htmlFor="email">電子郵件</label>
          <input
            id="email"
            name="email"
            type="email"
            data-testid="sign-up-email"
            required
          />

          <h4>餐廳資料</h4>
          <label htmlFor="name">餐廳名稱</label>
          <input
            id="name"
            name="name"
            data-testid="sign-up-restaurant-name"
            required
          />
          <label htmlFor="phone">電話</label>
          <input id="phone" name="phone" data-testid="sign-up-phone" required />
          <label htmlFor="address">地址</label>
          <input
            id="address"
            name="address"
            data-testid="sign-up-address"
            required
          />
          <label htmlFor="logo">餐廳圖片網址</label>
          <input id="logo" name="logo" data-testid="sign-up-logo" />

          <button
            type="submit"
            disabled={submitting}
            data-testid="sign-up-submit"
          >
            建立餐廳帳號
          </button>
        </form>
        <p>
          <Link to="/sign-in" data-testid="sign-in-link">
            已有帳號？返回登入
          </Link>
        </p>
      </div>
    </div>
  );
}
