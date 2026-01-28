"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CldUploadWidget } from "next-cloudinary";
import { IUser } from "@/models/User";

// Icons
const CameraIcon = () => (
  <svg className="w-8 h-8 text-muted-foreground mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface UserFormProps {
  action: (prevState: any, formData: FormData) => Promise<any>;
  initialData?: IUser;
  onSuccess?: () => void;
  submitLabel?: string;
}

export default function UserForm({ action, initialData, onSuccess, submitLabel = "Save" }: UserFormProps) {
  const [state, formAction] = useActionState(action, null);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
        // If we have an onSuccess callback (like closing a modal), call it.
        if (onSuccess) {
            onSuccess();
        }
        
        // If this is a generic Add form (no initial data), we should clear it.
        if (!initialData) {
            formRef.current?.reset();
            setImageUrl("");
        }
    }
  }, [state, onSuccess, initialData]);

  // Format dates for input[type="date"] (YYYY-MM-DD)
  const formatDate = (dateString?: Date) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <form ref={formRef} action={formAction} className="p-6 md:p-8 space-y-6">
        {/* Hidden ID for updates */}
        {initialData?._id && <input type="hidden" name="id" value={initialData._id} />}
        
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Photo Upload */}
          <div className="w-full md:w-auto flex flex-col items-center gap-3">
            <span className="text-sm font-medium leading-none text-muted-foreground">Profile Photo</span>
            <CldUploadWidget
              uploadPreset="sevak_preset"
              options={{
                multiple: false,
                maxImageWidth: 800,
                maxImageHeight: 800,
                cropping: true,
                croppingAspectRatio: 1.0,
                showSkipCropButton: false,
                sources: ['local', 'camera'],
              }}
              onSuccess={(result: any) => {
                const info = result.info;
                let url = info.secure_url;

                // The widget returns coordinates.custom[0] which can be an array [x, y, w, h] or object
                if (info.coordinates?.custom?.[0]) {
                    const coords = info.coordinates.custom[0];
                    let x, y, width, height;

                    if (Array.isArray(coords)) {
                        [x, y, width, height] = coords;
                    } else {
                        ({ x, y, width, height } = coords);
                    }

                    // Validate we have numbers
                    if (typeof x === 'number' && typeof y === 'number' && typeof width === 'number' && typeof height === 'number') {
                         // Construct transformation string: crop first, then resize to target 800x800
                        const transformation = `c_crop,x_${x},y_${y},w_${width},h_${height}/w_800,h_800,c_fit`;
                        
                        // Inject into URL after /upload/
                        const parts = url.split('/upload/');
                        if (parts.length === 2) {
                            url = `${parts[0]}/upload/${transformation}/${parts[1]}`;
                        }
                    }
                }
                setImageUrl(url);
              }}
            >
              {({ open }) => (
                <div
                  onClick={() => open()}
                  className={`relative w-24 h-24 rounded-lg border-2 cursor-pointer overflow-hidden transition-all group shrink-0 ${
                    imageUrl ? "border-primary" : "border-dashed border-input hover:border-ring bg-muted/50"
                  }`}
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider">CHANGE</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-primary transition-colors">
                      <CameraIcon />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
                    </div>
                  )}
                </div>
              )}
            </CldUploadWidget>
            <input type="hidden" name="imageUrl" value={imageUrl} />
          </div>

          {/* Basic Info */}
          <div className="w-full space-y-4">
            <InputField label="Full Name" name="name" defaultValue={initialData?.name} placeholder="e.g. Ramesh Bhai Patel" />
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-muted-foreground">Mobile Number</label>
                <input
                    name="mobileNumber"
                    type="tel"
                    defaultValue={initialData?.mobileNumber}
                    placeholder="e.g. 9876543210"
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        // Strictly remove any non-numeric characters
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                    }}
                    title="Please enter exactly 10 digits"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </div>
          </div>
        </div>

        <div className="h-px bg-border my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField label="Seva Type" name="seva" defaultValue={initialData?.seva} placeholder="e.g. Kitchen Duty" />
          <InputField label="Gaam (City)" name="gaam" defaultValue={initialData?.gaam} placeholder="e.g. Ahmedabad" />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium leading-none text-muted-foreground">Seva Duration</span>
          <div className="grid grid-cols-2 gap-4">
            <input
              name="startDate"
              type="date"
              required
              defaultValue={formatDate(initialData?.sevaDuration?.startDate)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <input
              name="endDate"
              type="date"
              required
              defaultValue={formatDate(initialData?.sevaDuration?.endDate)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>

        {state?.message && (
          <div
            className={`p-3 rounded-md text-sm font-medium ${
              state.success
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {state.message}
          </div>
        )}

        <div className="pt-2">
          <SubmitButton label={submitLabel} />
        </div>
      </form>
    </div>
  );
}

function InputField({ label, name, type = "text", placeholder, defaultValue }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none text-muted-foreground">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full ${
        pending ? "opacity-70 cursor-not-allowed" : ""
      }`}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}
