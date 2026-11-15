import PageHeader from "../components/PageHeader";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

export default function MealForm() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mealId } = useParams();
  const isEdit = mealId !== undefined;
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    short_description: "",
    image: "",
    price: 0,
  });

  useEffect(() => {
    if (isEdit) {
      api
        .getMeal(Number(mealId))
        .then((res) => setForm(res.meal))
        .catch(() => setError("無法載入餐點，請重新整理頁面。"));
    }
  }, [mealId, isEdit]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) await api.updateMeal(Number(mealId), form);
      else await api.createMeal(form);
      navigate("/meals");
    } catch {
      setError("餐點儲存失敗，請稍後重試。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      <PageHeader
        title={isEdit ? "編輯餐點" : "新增餐點"}
        description="填寫餐點介紹與照片，讓好味道被看見。"
      />
      <form onSubmit={handleSubmit} data-testid="meal-form">
        <label htmlFor="name">餐點名稱</label>
        <input
          id="name"
          data-testid="meal-name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <label htmlFor="short_description">餐點描述</label>
        <textarea
          id="short_description"
          data-testid="meal-description"
          value={form.short_description}
          onChange={(e) =>
            setForm({ ...form, short_description: e.target.value })
          }
        />

        <label htmlFor="image">餐點圖片網址</label>
        <input
          id="image"
          data-testid="meal-image"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />

        <label htmlFor="price">價格</label>
        <input
          id="price"
          type="number"
          min="0"
          step="1"
          data-testid="meal-price"
          required
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />

        <button type="submit" disabled={saving} data-testid="meal-submit">
          {isEdit ? "儲存餐點" : "新增餐點"}
        </button>
      </form>
    </div>
  );
}
