export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-14 px-4">
      {Icon ? (
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 dark:bg-gray-700/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-gray-600/30">
          <Icon className="w-7 h-7 text-slate-300 dark:text-gray-500" />
        </div>
      ) : null}
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{title}</h3>
      {description ? <p className="text-sm text-slate-500 dark:text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
