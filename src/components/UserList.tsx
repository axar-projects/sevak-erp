"use client";

import { useState } from "react";
import { IUser } from "@/models/User";
import { deleteUser, updateUser } from "@/actions/user-actions";
import Modal from "./ui/Modal";
import UserForm from "./forms/UserForm";

import { useIdCardGenerator } from "@/hooks/useIdCardGenerator";
import { getThumbnailUrl } from "@/lib/utils";

// Icons 
const PhoneIcon = () => (<svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>);
const MapIcon = () => (<svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const EditIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>);
const TrashIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const IdCardIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>);

export default function UserList({ users }: { users: IUser[] }) {
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<IUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { generateIdCard, isGenerating } = useIdCardGenerator();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeva, setFilterSeva] = useState("All");
  const [filterGaam, setFilterGaam] = useState("All");

  // Derive unique options
  const uniqueSevas = ["All", ...Array.from(new Set(
    users.flatMap(u => {
      const sevas = (u.seva || "").split(",").map(s => s.trim()).filter(Boolean);
      return sevas.length > 0 ? sevas : ["N/A"];
    })
  ))];
  const uniqueGaams = ["All", ...Array.from(new Set(users.map(u => u.gaam)))];

  // Filter Logic
  const filteredUsers = users.filter(user => {
    const parsedSevas = (user.seva || "").split(",").map(s => s.trim()).filter(Boolean);
    const userSevas = parsedSevas.length > 0 ? parsedSevas : ["N/A"];
    
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.uniqueId && user.uniqueId.toString().includes(searchTerm)) ||
                          userSevas.some(s => s !== "N/A" && s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSeva = filterSeva === "All" || userSevas.includes(filterSeva);
    const matchesGaam = filterGaam === "All" || user.gaam === filterGaam;
    
    return matchesSearch && matchesSeva && matchesGaam;
  });

  const handleDelete = async () => {
    if (!deletingUser?._id) return;
    setIsDeleting(true);
    await deleteUser(deletingUser._id, deletingUser.imageUrl);
    setIsDeleting(false);
    setDeletingUser(null);
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-background rounded-lg border border-dashed border-muted-foreground/25">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground">No sevaks found</h3>
        <p className="text-sm text-muted-foreground mt-1">Get started by adding a new sevak to the directory.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Registered Sevaks</h1>
        <span className="inline-flex items-center rounded-md border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80">
            Total: {filteredUsers.length}
        </span>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or id number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={filterSeva}
            onChange={(e) => setFilterSeva(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {uniqueSevas.map(seva => (
              <option key={seva} value={seva}>{seva === "All" ? "Filter by Seva" : (seva || "N/A")}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-48">
          <select
            value={filterGaam}
            onChange={(e) => setFilterGaam(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {uniqueGaams.map(gaam => (
              <option key={gaam} value={gaam}>{gaam === "All" ? "Filter by Gaam" : gaam}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No sevaks found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="group relative flex flex-col rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
            >
              {/* Action Buttons (Visible on Mobile, Hover on Desktop) */}
              <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-10">
                <button
                  onClick={() => generateIdCard(user)}
                  disabled={isGenerating}
                  className="p-2 rounded-full bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  title="Download ID Card"
                >
                  <IdCardIcon />
                </button>
                <button
                  onClick={() => setEditingUser(user)}
                  className="p-2 rounded-full bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors shadow-sm cursor-pointer"
                  title="Edit"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => setDeletingUser(user)}
                  className="p-2 rounded-full bg-background border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors shadow-sm cursor-pointer"
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              </div>

              <div className="p-6 flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.imageUrl ? (
                      <img
                        src={getThumbnailUrl(user.imageUrl)}
                        alt={user.name}
                        className="w-12 h-12 rounded-lg object-cover border border-border"
                      />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center border border-transparent text-secondary-foreground font-semibold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold leading-normal tracking-tight text-foreground truncate pr-16 py-0.5">
                    {user.name}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-md border border-transparent bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80">
                      {user.seva || "N/A"}
                    </span>
                    {user.uniqueId && (
                      <span className="inline-flex items-center rounded-md border border-transparent bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary transition-colors">
                        ID: {user.uniqueId}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PhoneIcon />
                      <span>{user.mobileNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapIcon />
                      <span className="truncate">{user.gaam}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer - Duration */}
              <div className="mt-auto flex items-center justify-between border-t border-border bg-muted/50 px-6 py-3 text-xs font-medium text-muted-foreground">
                <span>{new Date(user.sevaDuration.startDate).toLocaleDateString()}</span>
                <span className="text-muted-foreground/50 mx-2">&mdash;</span>
                <span>{new Date(user.sevaDuration.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit Sevak"
      >
        <UserForm
            action={updateUser}
            initialData={editingUser || undefined}
            onSuccess={() => setEditingUser(null)}
            submitLabel="Update Sevak"
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
            <p className="text-muted-foreground">
                Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This action cannot be undone and will remove all their data.
            </p>
            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={() => setDeletingUser(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 flex items-center gap-2"
                >
                    {isDeleting ? "Deleting..." : "Delete Sevak"}
                </button>
            </div>
        </div>
      </Modal>
    </>
  );
}


