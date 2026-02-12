import { ImportWizardProvider } from "@/hooks/useImportWizard";

export default function ImportTypeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ImportWizardProvider>{children}</ImportWizardProvider>;
}
