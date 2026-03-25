/**
 * @module components/EvidenceUploader
 *
 * Drag-and-drop evidence upload component. Accepts multiple
 * file types (PDF, images, text, email exports) and displays
 * upload progress with automatic format detection.
 */

import React from 'react';

export interface EvidenceUploaderProps {
  /** Callback when files are uploaded successfully */
  onUpload?: (files: File[]) => void;
  /** Accepted file types */
  acceptedTypes?: string[];
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ onUpload, acceptedTypes }) => {
  // TODO: Implement drag-and-drop file upload with format detection
  return (
    <div data-testid="evidence-uploader">
      <p>Drop evidence files here to upload</p>
    </div>
  );
};

export default EvidenceUploader;
