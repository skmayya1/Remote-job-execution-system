import DisplayTable from '@/components/Jobs'
import React from 'react'
import { Input } from "@/components/ui/input"
import AddJob from '@/components/add-job';
import LogViewer from '@/components/log-viewer';
import { TableProvider } from '@/context/TableContext';


const page = () => {
  return (
    <TableProvider>
    <div className='h-screen w-full flex items-center justify-center '>
      <div className="h-[50%] w-[70%] flex flex-col gap-5">
        <div className="flex w-full  px-2 justify-between items-center">
          <Input placeholder='Search job' className='w-[30%] ' />
          <div className="flex items-center gap-3">
            <LogViewer/>
            <AddJob />
          </div>
        </div>
        <DisplayTable />
      </div>
    </div>
    </TableProvider>
  )
}

export default page