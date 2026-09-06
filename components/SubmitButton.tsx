"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  formAction,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      formAction={formAction}
      disabled={pending}
      className={`${className} disabled:opacity-40 disabled:pointer-events-none`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
