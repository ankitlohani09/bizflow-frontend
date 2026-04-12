export default function Card({ title, value, description, tone = "default" }) {
  const toneClasses = {
    default: "text-slate-900",
    success: "text-emerald-600",
    danger: "text-rose-600",
    warning: "text-amber-600",
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {/* Keep cards generic so the same component can be reused across pages. */}
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className={`mt-2 text-2xl font-semibold ${toneClasses[tone]}`}>
        {value}
      </h3>
      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
    </article>
  );
}
