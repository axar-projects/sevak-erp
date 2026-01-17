"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    } else {
      dialogRef.current?.close();
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Use createPortal to render outside the main DOM hierarchy (optional but good practice)
  // For simplicity in Next.js App Router without complex setup, simple conditional rendering often works,
  // but <dialog> with .showModal() puts it in the top layer anyway.
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleBackdropClick}>
       <div 
        className="w-full max-w-lg scale-100 transform overflow-hidden rounded-xl bg-background border border-border p-6 text-foreground shadow-2xl transition-all sm:max-w-xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-semibold leading-none tracking-tight text-foreground">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        {children}
      </div>
    </div>
  );
}
