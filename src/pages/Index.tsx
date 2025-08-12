import UploadDialog from "@/components/UploadDialog";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
        <header>
          <h1 className="text-4xl font-bold tracking-tight">Modern File Upload Dialog</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Drag-and-drop uploads, URL import, smooth progress, and elegant micro-interactions.
          </p>
        </header>
        <UploadDialog />
      </main>
    </div>
  );
};

export default Index;
