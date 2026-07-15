"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Download, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import type { Resource } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  background_guide: "Background Guide",
  research_paper: "Research Paper",
  rules_of_procedure: "Rules of Procedure",
  conference_handbook: "Conference Handbook",
  position_paper_guide: "Position Paper Guide",
  other: "Other",
};

export default function DelegateResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: true; resources: Resource[] }>("/delegates/me/resources")
      .then((res) => setResources(res.resources))
      .catch((err) => toast.error(err instanceof ApiRequestError ? err.message : "Failed to load resources"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">Background guides, handbooks, and reference material for your conference.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No resources have been published yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardContent className="flex items-start gap-3 p-5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{resource.title}</p>
                  <Badge variant="outline" className="mt-1">
                    {CATEGORY_LABEL[resource.category] ?? resource.category}
                  </Badge>
                  {resource.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{resource.description}</p>
                  )}
                </div>
                {resource.file_path && (
                  <Button size="icon-sm" variant="ghost" render={<a href={resource.file_path} target="_blank" rel="noopener noreferrer" />}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
