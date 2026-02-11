import Link from "next/link";
import { Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome to the Acumatica Import Wizard
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/import">
          <Card className="group cursor-pointer border-border bg-card transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-medium text-foreground">Start New Import</h2>
                <p className="text-sm text-muted-foreground">
                  Import stock items, customers, or vendors
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/logs">
          <Card className="group cursor-pointer border-border bg-card transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-accent">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-medium text-foreground">Import History</h2>
                <p className="text-sm text-muted-foreground">
                  View past imports and audit logs
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Empty state for recent imports */}
      <div className="mt-10">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Recent Imports
        </h2>
        <Card className="border-dashed border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No imports yet. Start your first import to see history here.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/import">Start Import</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
