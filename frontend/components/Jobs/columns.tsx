import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { BsThreeDotsVertical } from "react-icons/bs";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MdCancel } from "react-icons/md";
import { ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import { useState } from "react";
import JobLogViewer from "../job-log-viewer";
import JobDetailsViewer from "../job-details-viewer";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ||"http://localhost:5000"

const cancelJob = async (id:string)=>{
  await axios.delete(BASE_URL + "/jobs/"+id)
  window.location.reload()
}

// Component for the actions cell
const ActionsCell = ({ row }: { row: any }) => {
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const [isDetailsViewerOpen, setIsDetailsViewerOpen] = useState(false);

  const handleLogsClick = () => {
    setIsLogViewerOpen(true);
  };

  const handleDetailsClick = () => {
    setIsDetailsViewerOpen(true);
  };

  return (
    <>
      <div className="">
        {row.original.status === "waiting" ? (
          <span onClick={()=> cancelJob(row.original.id)} className="text-sm cursor-pointer bg-transparent flex items-center gap-1.5 text-muted-foreground ">
            cancel <MdCancel />
          </span>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <BsThreeDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={handleLogsClick}>Logs</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDetailsClick}>Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <JobLogViewer 
        jobId={row.original.id}
        isOpen={isLogViewerOpen}
        onClose={() => setIsLogViewerOpen(false)}
      />

      <JobDetailsViewer
        job={row.original}
        isOpen={isDetailsViewerOpen}
        onClose={() => setIsDetailsViewerOpen(false)}
      />
    </>
  );
};

export interface JobMetaData {
  id: string,
  status: "waiting" | "active" | "completed" | "failed" | "canceled";
  startedAt?: Date;
  finishedAt?: Date; 
  priority: number;
  createdAt: Date;
  payload: any;
  name: string;
  timeout?: number | undefined;
  logs?: string[];
}

export const columns = [
  {
    accessorKey: "id",
    enableHiding: false,
    enableSorting: false,
    header: () => <div>Job ID</div>,
    cell: ({ row }) => <div className="font-mono text-xs">{row.original.id}</div>,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="truncate">{row.original.name}</div>,
  },
  {
    accessorKey: "payload",
    header: "Payload",

    cell: ({ row }) => <div >
      <Tooltip>
        <TooltipTrigger className="truncate w-[140px] bg-muted px-2.5 font-mono text-[11px] py-1 rounded-xl">{row.original.payload.data}</TooltipTrigger>
        <TooltipContent className="bg-background border">
          <p className="text-foreground">{row.original.payload.data}</p>
        </TooltipContent>
      </Tooltip>
    </div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.original.status;

      return <Badge>
        {status}</Badge>
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => <span className="text-sm">{row.original.priority}</span>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting()}>
        <div className="flex items-center gap-2">
          Created at
          <span className="w-[15px] h-[15px] flex items-center justify-center">
            {column.getIsSorted() === "asc" ? (
              <ChevronUp size={15} />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown size={15} />
            ) : (
              <span className="invisible">
                <ChevronDown size={15} />
              </span>
            )}
          </span>
        </div>
      </button>
    ),
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
] as ColumnDef<JobMetaData>[]