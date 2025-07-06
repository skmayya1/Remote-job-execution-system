"use client"
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "./ui/badge";
import { JobMetaData } from './Jobs/columns';

interface JobDetailsViewerProps {
  job: JobMetaData | null;
  isOpen: boolean;
  onClose: () => void;
}

const JobDetailsViewer: React.FC<JobDetailsViewerProps> = ({ job, isOpen, onClose }) => {
  if (!job) return null;

  // Calculate execution time
  const getExecutionTime = () => {
    if (!job.startedAt) return "Not started";
    if (!job.finishedAt) return "Still running";
    
    const startTime = new Date(job.startedAt).getTime();
    const endTime = new Date(job.finishedAt).getTime();
    const duration = endTime - startTime;
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Job Details - {job.id}</DialogTitle>
        </DialogHeader>
        <div className="w-full space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Job ID</h3>
              <p className="font-mono text-sm">{job.id}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Name</h3>
              <p className="text-sm">{job.name}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Status</h3>
              <Badge variant={job.status === 'completed' ? 'default' : 
                           job.status === 'failed' ? 'destructive' : 
                           job.status === 'active' ? 'secondary' : 'outline'}>
                {job.status}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Priority</h3>
              <p className="text-sm">{job.priority}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Timeline</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p>{formatDate(job.createdAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Started:</span>
                <p>{formatDate(job.startedAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Finished:</span>
                <p>{formatDate(job.finishedAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Execution Time:</span>
                <p className="font-semibold">{getExecutionTime()}</p>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Configuration</h3>
            <div className="text-sm">
              <span className="text-muted-foreground">Timeout:</span>
              <p>{job.timeout ? `${job.timeout}ms` : 'Not set'}</p>
            </div>
          </div>

          {/* Payload */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Payload</h3>
            <div className="bg-muted p-3 rounded-lg">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(job.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsViewer; 