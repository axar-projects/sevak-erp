import { getTemplateConfig } from "@/actions/settings-actions";
import TemplateEditor from "@/components/settings/TemplateEditor";
import Header from "@/components/layout/Header";

export default async function TemplateSettingsPage() {
  const config = await getTemplateConfig();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">ID Card Layout</h1>
            <p className="text-muted-foreground mt-2">
                Customize the position and style of the ID card elements. Drag elements on the preview to move them.
            </p>
        </div>
        <TemplateEditor initialConfig={config} />
      </main>
    </div>
  );
}
