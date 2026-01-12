<<<<<<< HEAD

import { signIn } from "@/auth";
import { Github } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0B] text-[#FAFAFA] overflow-hidden relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-[#0F0F0F] to-[#0B0B0B]" />
      
      {/* Minimal accent glow */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#6366F1] rounded-full mix-blend-screen filter blur-[120px] opacity-[0.03] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#6366F1] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.02] pointer-events-none" />

      <div className="z-10 flex flex-col items-center gap-12 text-center p-8 max-w-2xl mx-auto">
        <div className="flex flex-col gap-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-[#FAFAFA] leading-[1.1]">
            GitHub
            <br />
            <span className="text-[#6366F1]">Wrapped</span>
          </h1>
          <p className="text-lg md:text-xl text-[#A3A3A3] font-light leading-relaxed max-w-xl mx-auto">
            Discover your code story. The bugs, the commits, and the late-night pushes.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/wrapped" });
          }}
          className="mt-4"
        >
          <button 
            type="submit"
            className="group relative px-8 py-4 bg-[#6366F1] text-white font-medium text-base rounded-xl overflow-hidden 
                     hover:bg-[#4F46E5] hover:shadow-glow hover:shadow-[#6366F1]/20
                     active:scale-[0.98] transition-all duration-300 ease-out
                     border border-[#6366F1]/20"
          >
            <span className="relative z-10 flex items-center gap-3 justify-center">
              <Github className="w-5 h-5" />
              Sign in with GitHub
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#6366F1] to-[#818CF8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </form>
      </div>
    </main>
=======
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
>>>>>>> ff61ad0 (Initial commit from Create Next App)
  );
}
