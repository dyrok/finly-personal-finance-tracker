export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12 px-4">
      {Icon ? (
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <Icon className="w-7 h-7 text-slate-400" />
        </div>
      ) : null}
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description ? <p className="text-sm text-slate-500 mt-1">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
