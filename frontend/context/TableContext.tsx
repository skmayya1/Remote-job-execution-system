"use client";

import { columns, JobMetaData } from "@/components/Jobs/columns";
import {
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  Table,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface LogEntry {
  jobId: string;
  message: string;
  timestamp: string;
}

interface Resp extends LogEntry {
  job: JobMetaData;
}

interface TableContextType {
  table: Table<JobMetaData>;
  logs: LogEntry[];
  jobLogs: LogEntry[];
  showAllRows: boolean;
  toggleShowAllRows: () => void;
  getJobLogs: (jobId: string) => Promise<void>;
  clearJobLogs: () => void;
  addJob: (jobData: JobMetaData) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

const BASE_URL = "http://localhost:5000"

interface TableProviderProps {
  children: ReactNode;
  defaultRowCount?: number;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
  const [showAllRows, setShowAllRows] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'createdAt',
      desc: true
    }
  ]);
  const [data, setData] = useState<JobMetaData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [jobLogs, setJobLogs] = useState<LogEntry[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(BASE_URL);
    setSocket(newSocket);
    
    newSocket.on('logger', (res: Resp) => {
      const logData: LogEntry = {
        jobId: res.jobId,
        message: res.message,
        timestamp: res.timestamp
      };

      console.log(res.job);
      
      
      setLogs(prevLogs => {
        const updatedLogs = [...prevLogs, logData];
        return updatedLogs;
      });      
      
      // Update job data based on jobId
      if (res.job && res.job.id) {
        setData(prevData => {
          const updatedData = prevData.map(job => {
            if (job.id === res.job.id) {
              return { ...job, ...res.job };
            }
            return job;
          });
          
          const jobExists = prevData.some(job => job.id === res.job.id);
          if (!jobExists) {
            return [...updatedData, res.job];
          }
          
          return updatedData;
        });
      }
    });
    
    return () => {
      newSocket.close();
    };
  }, []);

  const table = useReactTable({
    data: data,
    columns: columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const toggleShowAllRows = () => {
    setShowAllRows((prev) => !prev);
  };

  const getJobLogs = useCallback(async (jobId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/jobs/${jobId}/logs`);
      const logsData = response.data.logs;
      
      // Transform the logs to match LogEntry interface
      const transformedLogs: LogEntry[] = logsData.map((log: string, index: number) => ({
        jobId: jobId,
        message: log,
        timestamp: new Date().toISOString() // Since we don't have timestamp from server logs
      }));
      
      setJobLogs(transformedLogs);
    } catch (error) {
      console.error('Failed to fetch job logs:', error);
      setJobLogs([]);
    }
  }, []);

  const clearJobLogs = useCallback(() => {
    setJobLogs([]);
  }, []);

  const addJob = (_job:JobMetaData)=> {
    try {
      setData(prevData => {
        const jobExists = prevData.some(job => job.id === _job.id);
        if (!jobExists) {
          return [...prevData, _job];
        }
        return prevData;
      });
      
      return _job;
    } catch (error) {
      console.error('Failed to add job:', error);
      return null;
    }
  }

  const getData = async () => {
    try {
      const res = await axios.get(BASE_URL + '/jobs');
      const data = await res.data;
      console.log(data.jobs);
      setData(data.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const value = {
    showAllRows,
    toggleShowAllRows,
    table,
    logs,
    jobLogs,
    getJobLogs,
    clearJobLogs,
    addJob,
  };

  return (
    <TableContext.Provider value={value}>{children}</TableContext.Provider>
  );
};
export const useTableContext = () => {
  const context = useContext(TableContext);

  if (context === undefined) {
    throw new Error("useTableContext must be used within a TableProvider");
  }

  return context;
};