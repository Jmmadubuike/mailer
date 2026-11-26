import { TemplatesIcon } from "@/components/ui/icons";

export function TemplatesManager({
  templates,
}: {
  templates: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    subject: string;
  }>;
}) {
  return (
    <div>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <TemplatesIcon className="h-5 w-5 text-slate-400" />
          Templates
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Reusable emails with personalization variables, managed in code.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.length === 0 ? (
          <div className="col-span-full rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
            No templates defined yet.
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="card-hover rounded-lg border border-slate-200 bg-white p-5"
            >
              <p className="font-medium text-slate-900">{template.name}</p>
              <p className="text-xs text-slate-500">
                {template.category ?? "Uncategorized"}
              </p>
              <p className="mt-2 truncate text-sm text-slate-600">
                {template.subject}
              </p>
            </div>
          ))
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        To add or change a template, edit src/modules/templates/catalog.ts in
        the codebase.
      </p>
    </div>
  );
}
