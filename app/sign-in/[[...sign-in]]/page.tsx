import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <SignIn
        appearance={{
          variables: { colorPrimary: "#0f766e" },
        }}
        path="/sign-in"
        routing="path"
      />
    </main>
  );
}

