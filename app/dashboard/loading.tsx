import { PageLoader } from "@/components/ui/PageLoader";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <PageLoader fullScreen={false} message="Loading Dashboard..." />
    </div>
  );
}
