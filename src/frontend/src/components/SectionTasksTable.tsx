import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

export type TaskStatus = "Not Started" | "In Progress" | "Completed" | "N/A";

export interface AuditTask {
  id: string;
  description: string;
  status: TaskStatus;
}

const STATUS_OPTIONS: TaskStatus[] = [
  "Not Started",
  "In Progress",
  "Completed",
  "N/A",
];

function getStatusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case "Not Started":
      return "bg-muted text-muted-foreground border-border hover:bg-muted";
    case "In Progress":
      return "bg-blue-500/15 text-blue-600 border-blue-500/30 hover:bg-blue-500/20 dark:text-blue-400";
    case "Completed":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-400";
    case "N/A":
      return "bg-amber-500/15 text-amber-700 border-amber-500/30 hover:bg-amber-500/20 dark:text-amber-400";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case "Not Started":
      return <CircleDashed className="h-3.5 w-3.5" />;
    case "In Progress":
      return <Clock className="h-3.5 w-3.5" />;
    case "Completed":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "N/A":
      return <Minus className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptyTask(): AuditTask {
  return { id: generateId(), description: "", status: "Not Started" };
}

interface SectionTasksTableProps {
  sectionId: number | bigint;
}

export function SectionTasksTable({ sectionId }: SectionTasksTableProps) {
  const storageKey = `section-tasks-${sectionId.toString()}`;

  const [tasks, setTasks] = useState<AuditTask[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as AuditTask[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Persist to localStorage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks, storageKey]);

  // Re-load if sectionId changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as AuditTask[];
        if (Array.isArray(parsed)) {
          setTasks(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setTasks([]);
  }, [storageKey]);

  const addTask = () => {
    setTasks((prev) => [...prev, createEmptyTask()]);
  };

  const updateDescription = (id: string, description: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, description } : t)),
    );
  };

  const updateStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const totalCount = tasks.filter((t) => t.status !== "N/A").length;

  return (
    <div
      className="rounded-md border border-primary/30 bg-primary/5 overflow-hidden"
      data-ocid="tasks.panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/20">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm font-semibold text-primary tracking-wide">
          Audit Tasks
        </p>
        {tasks.length > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">
            {completedCount} of {totalCount} completed
          </span>
        )}
        <span className="ml-auto text-[10px] font-mono text-primary/50 uppercase tracking-widest mr-2">
          Auto-saved
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addTask}
          data-ocid="tasks.add_button"
          className="h-7 px-2.5 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </Button>
      </div>

      {/* Table or Empty State */}
      {tasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 px-4 gap-2"
          data-ocid="tasks.empty_state"
        >
          <CircleDashed className="h-8 w-8 text-primary/30" />
          <p className="text-sm text-muted-foreground text-center">
            No tasks yet. Click{" "}
            <span className="font-semibold text-primary">Add Task</span> to
            record work done under this account head.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table data-ocid="tasks.table">
            <TableHeader>
              <TableRow className="border-b border-primary/20 hover:bg-transparent">
                <TableHead className="w-10 text-xs font-semibold text-muted-foreground py-2 pl-4">
                  #
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground py-2">
                  Task Description
                </TableHead>
                <TableHead className="w-44 text-xs font-semibold text-muted-foreground py-2">
                  Progress Status
                </TableHead>
                <TableHead className="w-16 text-xs font-semibold text-muted-foreground py-2 text-right pr-4">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task, index) => (
                <TableRow
                  key={task.id}
                  data-ocid={`tasks.row.${index + 1}`}
                  className="border-b border-primary/10 hover:bg-primary/5 group"
                >
                  {/* Row number */}
                  <TableCell className="py-2.5 pl-4 text-xs font-mono text-muted-foreground w-10">
                    {index + 1}
                  </TableCell>

                  {/* Description */}
                  <TableCell className="py-2 pr-3">
                    <Input
                      value={task.description}
                      onChange={(e) =>
                        updateDescription(task.id, e.target.value)
                      }
                      placeholder="Describe the task performed..."
                      data-ocid={`tasks.description_input.${index + 1}`}
                      className="h-8 text-sm bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background/60 transition-all placeholder:text-muted-foreground/40"
                    />
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-2 w-44">
                    <Select
                      value={task.status}
                      onValueChange={(val) =>
                        updateStatus(task.id, val as TaskStatus)
                      }
                    >
                      <SelectTrigger
                        data-ocid={`tasks.status_select.${index + 1}`}
                        className="h-8 text-xs bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background/60 transition-all w-full"
                      >
                        <SelectValue>
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(task.status)}
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-medium px-1.5 py-0 leading-5 border pointer-events-none ${getStatusBadgeClass(task.status)}`}
                            >
                              {task.status}
                            </Badge>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            <span className="flex items-center gap-2">
                              {getStatusIcon(option)}
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-medium px-1.5 py-0 leading-5 border pointer-events-none ${getStatusBadgeClass(option)}`}
                              >
                                {option}
                              </Badge>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Delete */}
                  <TableCell className="py-2 text-right pr-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                      data-ocid={`tasks.delete_button.${index + 1}`}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer summary bar when tasks exist */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-primary/10 bg-primary/3">
          {STATUS_OPTIONS.map((status) => {
            const count = tasks.filter((t) => t.status === status).length;
            if (count === 0) return null;
            return (
              <span key={status} className="flex items-center gap-1.5">
                {getStatusIcon(status)}
                <span
                  className={`text-xs font-medium ${
                    status === "Not Started"
                      ? "text-muted-foreground"
                      : status === "In Progress"
                        ? "text-blue-600 dark:text-blue-400"
                        : status === "Completed"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {count} {status}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
