export default function Topbar({ title = "Dashboard", userName = "Admin" }) {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">BizFlow</p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>

      {/* This placeholder can later be replaced with profile or notification actions. */}
      <div className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">
        Welcome, {userName}
      </div>
    </header>
  );
}
