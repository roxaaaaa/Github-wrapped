
import { auth } from "@/auth";
import { getGitHubData } from "@/lib/github";
import { Story } from "@/components/Story";
import { redirect } from "next/navigation";

export default async function WrappedPage() {
    const session = await auth();
    if (!session) {
        redirect("/");
    }

    try {
        const data = await getGitHubData();
        return <Story data={data} />;
    } catch (error) {
        console.error(error);
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] text-[#FAFAFA] p-6">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-semibold text-[#FAFAFA] mb-3">Failed to load your story.</h1>
                    <p className="text-[#A3A3A3] font-light">Make sure you are authenticated and have granted permissions.</p>
                </div>
            </div>
        );
    }
}
