import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <SignUp
        appearance={{
          variables: { colorPrimary: "#0f766e" },
        }}
        path="/sign-up"
        routing="path"
      />
    </main>
  );
}

