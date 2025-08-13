import React from "react";
import { Edit3, CheckCircle2, AlertCircle } from "lucide-react";

interface ProjectInfoFormProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  isValid: boolean;
  saving: boolean;
}

export function ProjectInfoForm({
  name,
  setName,
  description,
  setDescription,
  isValid,
  saving,
}: ProjectInfoFormProps) {
  return (
    <div className="card bg-base-100/90 backdrop-blur shadow-lg border border-base-300/50">
      <div className="card-body p-6">
        <div className="flex items-center gap-2 mb-4">
          <Edit3 className="w-5 h-5 text-secondary" />
          <h2 className="card-title text-lg">Project Details</h2>
        </div>
        <div className="space-y-5">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-base-content/80">
                Project Name
              </span>
              <span className="label-text-alt text-error">
                {!name.trim() && "*Required"}
              </span>
            </label>
            <input
              className={`input input-bordered w-full transition-all duration-200 ${
                !name.trim() ? "input-error" : "focus:input-primary"
              }`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              disabled={saving}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-base-content/80">
                Description
              </span>
              <span className="label-text-alt text-base-content/50">
                Optional
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full h-28 resize-none focus:textarea-primary transition-all duration-200"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your flashcard set..."
              disabled={saving}
            />
          </div>
        </div>
        <div className="mt-6 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            {isValid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-success font-medium">Ready to save</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-warning" />
                <span className="text-warning font-medium">
                  Project name required
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
