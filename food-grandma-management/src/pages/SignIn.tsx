import Brand from "../components/Brand";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { setToken } from "../auth";

export default function SignIn() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [demoEnabled, setDemoEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/test/config")
      .then((response) => (response.ok ? response.json() : { enabled: false }))
      .then((data) => {
        if (active) setDemoEnabled(data.enabled === true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const { access_token } = await api.login(
        String(form.get("username")),
        String(form.get("password")),
      );
      setToken(access_token);
      navigate("/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗，請稍後重試。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell sign-in-shell">
      <header className="sign-in-banner">
        <a href="/" className="sign-in-brand" aria-label="Food Grandma 首頁"><Brand /></a>
        <p>阿嬤不怕你餓，就怕你吃不飽。</p>
        <a className="sign-in-home" href="/">返回訂餐網站 ↗</a>
      </header>
      <main className="sign-in-content">
      <div className="auth-card">
        <h1>餐廳管理登入</h1>
        <p>登入以管理餐點、處理訂單與查看營運報表。</p>
        {error && (
          <div className="alert" data-testid="sign-in-error">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} data-testid="sign-in-form">
          <label htmlFor="username">帳號</label>
          <input
            id="username"
            name="username"
            data-testid="sign-in-username"
            required
          />

          <label htmlFor="password">密碼</label>
          <input
            id="password"
            name="password"
            type="password"
            data-testid="sign-in-password"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            data-testid="sign-in-submit"
          >
            登入
          </button>
        </form>
        {demoEnabled && (
          <section
            className="demo-credentials"
            aria-labelledby="demo-credentials-title"
            data-testid="demo-credentials"
          >
            <h3 id="demo-credentials-title">測試帳號</h3>
            <dl>
              <div>
                <dt>帳號</dt>
                <dd>
                  <code>admin</code>
                </dd>
              </div>
              <div>
                <dt>密碼</dt>
                <dd>
                  <code>password@321</code>
                </dd>
              </div>
            </dl>
            <p>僅供示範測試使用，可登入查看餐點與訂單。</p>
          </section>
        )}
        <p>
          <Link to="/sign-up" data-testid="sign-up-link">
            還沒有帳號？註冊餐廳
          </Link>
        </p>
      </div>
      </main>
    </div>
  );
}
