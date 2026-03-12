import { ProjectDetailLoader } from "@/components/project-detail-loader";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-10">
      <ProjectDetailLoader projectId={Number(id)} />
    </section>
  );
}
