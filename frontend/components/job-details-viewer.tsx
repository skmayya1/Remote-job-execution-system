"use client"
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { JobMetaData } from './Jobs/columns';
import axios from 'axios';

interface JobDetailsViewerProps {
  job: JobMetaData | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Metrics {
  [key: string]: string;
}

const JobDetailsViewer: React.FC<JobDetailsViewerProps> = ({ job, isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Calculate execution time
  const getExecutionTime = () => {
    if (!job?.startedAt) return "Not started";
    if (!job?.finishedAt) return "Still running";
    const startTime = new Date(job.startedAt).getTime();
    const endTime = new Date(job.finishedAt).getTime();
    const duration = endTime - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes % 60}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds % 60}s`);

    return parts.join(' ');
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Not set";
    try {
      return new Date(date).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour format
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  useEffect(() => {
    if (isOpen && job?.id) {
      setLoadingMetrics(true);
      setMetricsError(null);
      axios.get(`http://localhost:5000/jobs/${job.id}/metrics`)
        .then(res => {
          setMetrics(res.data.metrics || {});
        })
        .catch(() => {
          setMetricsError("Failed to load metrics. Please try again.");
        })
        .finally(() => setLoadingMetrics(false));
    } else {
      setMetrics(null);
    }
  }, [isOpen, job?.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Increased dialog width slightly and enabled vertical scroll */}
      <DialogContent className="max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          {/* Truncate long job IDs and add some right padding */}
          <DialogTitle className='text-2xl font-bold truncate pr-8'>Job Details - {job?.id}</DialogTitle>
        </DialogHeader>
        <DropdownMenuSeparator className="my-2" />

        <div className="space-y-6">
          <section>
            <h3 className="font-semibold text-sm mb-2 uppercase tracking-wide">Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <p>Created At:</p>
                <p className="font-medium">{formatDate(job?.createdAt)}</p>
              </div>
              <div>
                <p>Started At:</p>
                <p className="font-medium">{formatDate(job?.startedAt)}</p>
              </div>
              <div>
                <p>Finished At:</p>
                <p className="font-medium">{formatDate(job?.finishedAt)}</p>
              </div>
              <div>
                <p>Execution Time:</p>
                <p className="font-semibold">{getExecutionTime()}</p>
              </div>
            </div>
          </section>

          {/* Metrics Section */}
          <section>
            <h3 className="font-semibold text-sm mb-2 uppercase tracking-wide">System Metrics</h3>
            {loadingMetrics && <div className="text-xs italic">Loading metrics...</div>}
            {metricsError && <div className="text-xs text-red-500 font-medium">{metricsError}</div>}
            {metrics && Object.keys(metrics).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(metrics).map(([key, value]) => (
                  <div key={key} className="p-3 rounded-lg border bg-muted"> {/* Reverted to default border/background */}
                    <div className="font-semibold text-xs mb-2">{key}</div>
                    {/* Ensure pre tag handles overflow and preserves formatting */}
                    <pre className="whitespace-pre-wrap break-words text-xs  font-mono overflow-x-auto">
                      {value}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (!loadingMetrics && !metricsError) ? (
              <div className="text-xs italic">No system metrics available for this job.</div>
            ) : null}
          </section>

          {/* Configuration Section */}
          <section>
            <h3 className="font-semibold text-sm mb-2 uppercase tracking-wide">Configuration</h3>
            <div className="text-sm">
              <p>Timeout:</p>
              <p className="font-medium">{job?.timeout ? `${job.timeout}ms` : 'Not set'}</p>
            </div>
          </section>

          {/* Payload Section */}
          <section>
            <h3 className="font-semibold text-sm mb-2 uppercase tracking-wide">Payload</h3>
            <div className="p-3 rounded-lg border bg-muted"> {/* Reverted to default border/background */}
              {/* Ensure pre tag handles overflow and preserves formatting */}
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(job?.payload, null, 2)}
              </pre>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsViewer;