import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import {
  PROGRESS_INTERVAL_MS,
  PROGRESS_STEP,
  REDIRECT_DELAY_MS,
} from "../lib/constants";

type UploadProps = {
  onComplete?: (base64DataUrl: string) => void;
};

const Upload = ({ onComplete }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const { isSignedIn } = useOutletContext<AuthContext>();

  const progressIntervalRef = useRef<number | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current !== null) window.clearInterval(progressIntervalRef.current);
      if (redirectTimeoutRef.current !== null) window.clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  const processFile = (nextFile: File) => {
    if (!isSignedIn) return;

    // reset any previous run
    if (progressIntervalRef.current !== null) window.clearInterval(progressIntervalRef.current);
    if (redirectTimeoutRef.current !== null) window.clearTimeout(redirectTimeoutRef.current);

    setFile(nextFile);
    setProgress(0);

    const reader = new FileReader();

    reader.onload = () => {
      const base64DataUrl = String(reader.result ?? "");

      progressIntervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          const next = Math.min(100, prev + PROGRESS_STEP);

          if (next >= 100) {
            if (progressIntervalRef.current !== null) {
              window.clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }

            redirectTimeoutRef.current = window.setTimeout(() => {
              onComplete?.(base64DataUrl);
            }, REDIRECT_DELAY_MS);
          }

          return next;
        });
      }, PROGRESS_INTERVAL_MS);
    };

    reader.onerror = () => {
      // keep it simple: reset UI on read failure
      setFile(null);
      setProgress(0);
    };

    reader.readAsDataURL(nextFile);
  };

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!isSignedIn) return;

    const selected = e.target.files?.[0];
    if (!selected) return;

    processFile(selected);

    // allow selecting the same file again later
    e.target.value = "";
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!isSignedIn) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!isSignedIn) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!isSignedIn) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!isSignedIn) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);

    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    processFile(dropped);
  };

  return (
    <div className="upload">
      {!file ? (
        <div
          className={`dropzone ${isDragging ? "is-dragging" : ""} ${!isSignedIn ? "is-disabled" : ""}`}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            type="file"
            className="drop-input"
            accept=".jpg,.jpeg,.png"
            disabled={!isSignedIn}
            onChange={onChange}
          />

          <div className="drop-content">
            <div className="drop-icon">
              <UploadIcon size={20} />
            </div>
            <p>{isSignedIn ? "Click to upload or just drag and drop" : "Sign in or sign up with Puter to upload"}</p>
            <p className="help">Maximum file size 50 MB.</p>
          </div>
        </div>
      ) : (
        <div className="upload-status">
          <div className="status-content">
            <div className="status-icon">
              {progress === 100 ? <CheckCircle2 className="checked" /> : <ImageIcon className="image" />}
            </div>

            <h3>{file.name}</h3>

            <div className="progress">
              <div className="bar" style={{ width: `${progress}%` }}>
                <p className="status-text">{progress < 100 ? "Analyzing Floor Plan..." : "Redirecting..."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
