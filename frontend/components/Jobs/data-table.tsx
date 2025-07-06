import React from 'react'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  flexRender,
} from "@tanstack/react-table"
import { columns } from "./columns"
import { useTableContext } from '@/context/TableContext'




const JobTable = () => {
  const { table } = useTableContext()

  return (
    <div className="rounded-md border overflow-hidden">
    <Table>
    <TableHeader className="bg-muted sticky top-0 z-10">
    {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id} className="px-4 py-3 text-[14px] tracking-wide font-semibold">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className="**:data-[slot=table-cell]:first:w-8 ">
      {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center px-4 py-3 font-semibold tracking-wider">
            No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
  )
}

export default JobTable