import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, ChevronDown, Search, UploadCloud, Download, Loader2, Trash2, Settings } from "lucide-react";
import React from "react";
import type { CustomersToolbarProps } from "@/lib/props";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CustomersToolbarExtendedProps extends CustomersToolbarProps {
  allColumns: { key: string; label: string }[];
  selectedColumns: string[];
  onSelectColumn: (columnKey: string) => void;
}

export const CustomersToolbar: React.FC<CustomersToolbarExtendedProps> = ({
  searchTerm,
  statusFilter,
  selectedCount,
  isDeleting,
  isUploading,
  isExporting,
  onSearchChange,
  onStatusFilterChange,
  onDeleteClick,
  onUpload,
  onExport,
  allColumns,
  selectedColumns,
  onSelectColumn,
}) => (
  <>
    <div className="flex items-center justify-end mb-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 gap-2">
              <Settings className="w-4 h-4" />
              Columns
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allColumns.map(col => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={selectedColumns.includes(col.key)}
                onCheckedChange={() => onSelectColumn(col.key)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <div className="flex items-center justify-between mb-4 ">
      <div className="relative w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-8"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="h-8 gap-1"
            onClick={onDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete ({selectedCount})</span>
              </>
            )}
          </Button>
        )}
        <div className="relative">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="csv-upload"
            onChange={onUpload}
            disabled={isUploading}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 bg-[#1f89de] hover:bg-[#1f89de]/80 text-white hover:text-white"
            onClick={() => document.getElementById('csv-upload')?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                <span>Upload CSV</span>
              </>
            )}
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 bg-[#1f89de] hover:bg-[#1f89de]/80 text-white hover:text-white"
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export</span>
            </>
          )}
        </Button>
      </div>
    </div>
  </>
); 