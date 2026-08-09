import { Field, Select } from "../admin/FormFields.jsx";

export const ALL = "All";

export default function StudentFilterBar({
  filters,
  onChange,
  teams,
  categories,
  genderChoices,
}) {
  const handleFieldChange = (field) => (e) => onChange(field, e.target.value);

  return (
    <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626] p-4 sm:grid-cols-3">
      <Field label="Team">
        <Select value={filters.team} onChange={handleFieldChange("team")}>
          <option value={ALL}>All teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Category">
        <Select
          value={filters.category}
          onChange={handleFieldChange("category")}
        >
          <option value={ALL}>All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Gender">
        <Select value={filters.gender} onChange={handleFieldChange("gender")}>
          <option value={ALL}>All genders</option>
          {genderChoices.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
