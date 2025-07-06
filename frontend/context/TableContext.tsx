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

interface TableContextType {
  table: Table<JobMetaData>;
  logs: LogEntry[];
  jobLogs: LogEntry[];
  showAllRows: boolean;
  toggleShowAllRows: () => void;
  getJobLogs: (jobId: string) => Promise<void>;
  clearJobLogs: () => void;
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
    newSocket.on('logger', (logData: LogEntry) => {
      console.log('Received log:', logData);
      
      setLogs(prevLogs => {
        const updatedLogs = [...prevLogs, logData];
      
        
        return updatedLogs;
      });
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