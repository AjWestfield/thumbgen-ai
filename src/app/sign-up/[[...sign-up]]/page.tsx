import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-zinc-950 border border-zinc-800",
            headerTitle: "text-white",
            headerSubtitle: "text-zinc-400",
            socialButtonsBlockButton: "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800",
            socialButtonsBlockButtonText: "text-white",
            dividerLine: "bg-zinc-700",
            dividerText: "text-zinc-400",
            formFieldLabel: "text-zinc-300",
            formFieldInput: "bg-zinc-900 border-zinc-700 text-white",
            footerActionLink: "text-[#FF0000] hover:text-[#FF0000]/80",
            formButtonPrimary: "bg-[#FF0000] hover:bg-[#FF0000]/90",
          },
        }}
      />
    </div>
  );
}
