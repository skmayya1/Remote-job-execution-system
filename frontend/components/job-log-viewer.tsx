"use client"
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTableContext } from '@/context/TableContext';

interface JobLogViewerProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

const JobLogViewer: React.FC<JobLogViewerProps> = ({ jobId, isOpen, onClose }) => {
  const { jobLogs, getJobLogs, clearJobLogs } = useTableContext();

  useEffect(() => {
    if (isOpen && jobId) {
      getJobLogs(jobId);
    }
  }, [isOpen, jobId]); 

  useEffect(() => {
    if (!isOpen) {
      clearJobLogs();
    }
  }, [isOpen]); 

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl ">
        <DialogHeader>
          <DialogTitle>Job Logs - {jobId}</DialogTitle>
        </DialogHeader>
        <div className="w-full h-[200px] flex flex-col gap-2 overflow-y-auto">
          {jobLogs.length > 0 ? (
            jobLogs.map((log, idx) => (
              <div key={idx} className="border-b pb-2 pt-2">
                <div className="px-2 py-2 bg-muted rounded-lg font-mono text-sm">
                  {log.message}
                </div>
                <div className="text-xs text-muted-foreground mt-1 pt-2">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No logs available for this job
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobLogViewer; 