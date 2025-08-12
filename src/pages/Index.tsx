import UploadInterface from "@/components/UploadInterface";
import "@/utils/webhook-test"; // Test webhook connectivity on load

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="container mx-auto flex flex-col items-center justify-center gap-6 p-6">
        <UploadInterface />
      </main>
    </div>
  );
};

export default Index;
