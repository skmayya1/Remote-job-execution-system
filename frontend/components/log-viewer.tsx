"use client"
import React, { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from './ui/button';
import { TbLogs } from "react-icons/tb";
import { useTableContext } from '@/context/TableContext';


const LogViewer: React.FC = () => {

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const { logs } = useTableContext()

    const showDot = logs.length > 0

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className='relative' variant="secondary">
                    <TbLogs /> Logs
                    {showDot && <div className="absolute h-2 w-2 bg-red-600 rounded-full top-0 left-1"></div>
                    }
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Logs</DialogTitle>
                </DialogHeader>
                <div className="w-full h-[400px] flex flex-col gap-2 overflow-auto">
                    {
                        showDot ? logs.map((log, idx) => (
                            <div  key={idx}>
                                <span className='text-xs text-zinc-500'>{log.jobId}</span>

                                <div className="px-2 py-2 bg-muted rounded-2xl">{log.message}</div>
                            </div>
                        )):
                        <div className="text-xs text-zinc-500 mx-auto">No real time logs</div>
                    }
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LogViewer;