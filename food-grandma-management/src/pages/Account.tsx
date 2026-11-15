import PageHeader from "../components/PageHeader";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";

const empty = {
  first_name: "",
  last_name: "",
  email: "",
  name: "",
  phone: "",
  address: "",
  logo: "",
};

export default function Account() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getMe()
      .then(({ restaurant, user }) => {
        setForm({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          name: restaurant.name,
          phone: restaurant.phone,
          address: restaurant.address,
          logo: restaurant.logo,
        });
      })
      .catch(() => setError("無法載入餐廳設定，請重新整理頁面。"));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateMe(form);
      setSaved(true);
    } catch {
      setError("設定儲存失敗，請稍後重試。");
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof typeof empty) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [key]: e.target.value }),
    };
  }

  return (
    <div>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      <PageHeader
        title="餐廳設定"
        description="維護餐廳資訊，讓顧客與外送員順利找到你。"
      />
      {saved && <div className="alert-success">已儲存設定</div>}
      <form onSubmit={handleSubmit} data-testid="account-form">
        <h4>聯絡人資料</h4>
        <label htmlFor="first_name">名字</label>
        <input
          id="first_name"
          data-testid="account-first-name"
          {...field("first_name")}
        />
        <label htmlFor="last_name">姓氏</label>
        <input
          id="last_name"
          data-testid="account-last-name"
          {...field("last_name")}
        />
        <label htmlFor="email">電子郵件</label>
        <input
          id="email"
          type="email"
          data-testid="account-email"
          required
          {...field("email")}
        />

        <h4>餐廳資料</h4>
        <label htmlFor="name">餐廳名稱</label>
        <input
          id="name"
          data-testid="account-restaurant-name"
          required
          {...field("name")}
        />
        <label htmlFor="phone">電話</label>
        <input
          id="phone"
          data-testid="account-phone"
          required
          {...field("phone")}
        />
        <label htmlFor="address">地址</label>
        <input
          id="address"
          data-testid="account-address"
          required
          {...field("address")}
        />
        <label htmlFor="logo">餐廳圖片網址</label>
        <input id="logo" data-testid="account-logo" {...field("logo")} />

        <button type="submit" disabled={saving} data-testid="account-save">
          儲存設定
        </button>
      </form>
    </div>
  );
}
