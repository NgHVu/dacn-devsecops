import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OrderTableSkeleton() {
  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[80px]"><Skeleton className="h-4 w-12" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index} className="h-16">
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
              <TableCell className="text-center flex justify-center">
                <Skeleton className="h-6 w-24 rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}