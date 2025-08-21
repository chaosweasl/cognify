import React, { useState, useEffect } from "react";
import { User, FileText, Save, X, Eye } from "lucide-react";
import Image from "next/image";

export interface ProfileSettingsFormProps {
  userProfile?: {
    username?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  };
  isLoading: boolean;
  onSave: (data: {
    username: string;
    displayName: string;
    bio: string;
    profilePicture: File | null;
  }) => void;
}

const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = React.memo(
  ({ userProfile, isLoading, onSave }) => {
    // Local state for form fields
    const [username, setUsername] = useState(userProfile?.username || "");
    const [displayName, setDisplayName] = useState(
      userProfile?.displayName || ""
    );
    const [bio, setBio] = useState(userProfile?.bio || "");
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
      setUsername(userProfile?.username || "");
      setDisplayName(userProfile?.displayName || "");
      setBio(userProfile?.bio || "");
    }, [userProfile]);

    useEffect(() => {
      if (profilePicture) {
        const url = URL.createObjectURL(profilePicture);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setPreviewUrl(null);
      }
    }, [profilePicture]);

    const handleFileSelect = (file: File | null) => {
      setProfilePicture(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({ username, displayName, bio, profilePicture });
    };

    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-base-content mb-6 flex items-center gap-2">
            <User className="text-primary" size={24} />
            Profile Information
          </h2>
          {/* File Upload Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-medium">Profile Picture</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                className="file-input file-input-bordered file-input-primary w-full"
              />
              {profilePicture && (
                <div className="mt-4 p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-success">✓</span>
                      <span className="text-sm font-medium">
                        {profilePicture.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {previewUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowPreview(true)}
                            className="btn btn-sm btn-outline btn-primary"
                          >
                            <Eye size={14} />
                            Preview
                          </button>
                          {/* DaisyUI Modal for Image Preview */}
                          <div
                            className={`modal ${
                              showPreview ? "modal-open" : ""
                            }`}
                          >
                            <div className="modal-box">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg">
                                  Image Preview
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => setShowPreview(false)}
                                  className="btn btn-sm btn-circle btn-ghost"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              <div className="flex flex-col items-center space-y-4">
                                <div className="avatar">
                                  <div className="w-48 h-48 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4">
                                    <Image
                                      src={previewUrl}
                                      alt="Preview"
                                      width={192}
                                      height={192}
                                      className="object-cover rounded-full"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="modal-action">
                                <button
                                  type="button"
                                  onClick={() => setShowPreview(false)}
                                  className="btn btn-primary"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                            <div
                              className="modal-backdrop"
                              onClick={() => setShowPreview(false)}
                            ></div>
                          </div>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleFileSelect(null)}
                        className="btn btn-sm btn-outline btn-error"
                      >
                        <X size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="divider"></div>
            {/* Username Input */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-medium">Username</span>
                <span className="label-text-alt text-base-content/60">
                  3-30 characters, letters, numbers, - and _ only
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="input input-bordered w-full pl-10"
                  pattern="^[a-zA-Z0-9_\-]+$"
                  minLength={3}
                  maxLength={30}
                />
                <User
                  className="absolute left-3 top-3.5 text-base-content/40"
                  size={18}
                />
              </div>
            </div>
            {/* Display Name Input */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-medium">Display Name</span>
                <span className="label-text-alt text-base-content/60">
                  Optional - shown to other users
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="input input-bordered w-full pl-10"
                />
                <User
                  className="absolute left-3 top-3.5 text-base-content/40"
                  size={18}
                />
              </div>
            </div>
            {/* Bio Textarea */}
            <div className="form-control mb-8">
              <label className="label">
                <span className="label-text font-medium">Bio</span>
              </label>
              <div className="relative">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="textarea textarea-bordered w-full pl-10"
                />
                <FileText
                  className="absolute left-3 top-3.5 text-base-content/40"
                  size={18}
                />
              </div>
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  {bio.length}/500 characters
                </span>
              </label>
            </div>
            {/* Save Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`btn btn-primary btn-lg w-full ${
                isLoading ? "loading" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }
);

ProfileSettingsForm.displayName = "ProfileSettingsForm";

export default ProfileSettingsForm;
export { ProfileSettingsForm };
