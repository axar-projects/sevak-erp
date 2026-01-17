"use client";

import { addUser } from "@/actions/user-actions";
import UserForm from "./UserForm";
import { useFormStatus } from "react-dom";

export default function AddUserForm() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Register Volunteer
        </h2>
        <p className="text-muted-foreground">
          Enter the details below to add a new sevak to the directory.
        </p>
      </div>

      <UserForm action={addUser} submitLabel="Register Volunteer" />
    </div>
  );
}

// Helper: Reusable Input Component with Shadcn styling
function InputField({ label, name, type = "text", placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        suppressHydrationWarning
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

// Helper: Submit Button with Loading State
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      suppressHydrationWarning
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
        bg-primary text-primary-foreground hover:bg-primary/90
        h-10 px-4 py-2 w-full
        ${pending ? "opacity-70 cursor-not-allowed" : ""}
      `}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Saving...
        </span>
      ) : (
        "Register Volunteer"
      )}
    </button>
  );
}
