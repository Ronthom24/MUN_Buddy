import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
        MB
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">MUN Buddy</h1>
        <p className="max-w-md text-muted-foreground">
          Manage, organize, and experience Model United Nations conferences from one platform.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button render={<Link href="/register" />} nativeButton={false} size="lg">
          Create an organization
        </Button>
        <Button render={<Link href="/login" />} nativeButton={false} size="lg" variant="outline">
          Organizer sign in
        </Button>
      </div>
      <Link href="/delegate/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        I'm a delegate — sign in to my workspace
      </Link>
    </div>
  );
}
