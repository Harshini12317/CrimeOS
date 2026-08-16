"use client";

import ComplaintWizard from "@/components/complaint/ComplaintWizard";
import SHOLayout from "../../dashboard/sho/layout";

export default function RegisterComplaintPage() {
  return (
    <SHOLayout>
      <div className="min-h-screen bg-ivory">
        <main className="mx-auto w-full max-w-7xl p-8">
          <ComplaintWizard />
        </main>
      </div>
    </SHOLayout>
  );
}