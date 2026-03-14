"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type JSONContent } from "novel";
import { toast } from "sonner";
import {
  updatePlanAction,
  updatePlanStatusAction,
  togglePlanOnBoardAction,
  deletePlanAction,
} from "@/app/(app)/dashboard/content/plans/actions";

interface UsePlanEditorParams {
  id: string;
  initialTitle: string;
  initialStatus: string;
  initialFormat: string | null;
  initialPriority: string | null;
  initialOnBoard: boolean;
}

export function usePlanEditor({
  id,
  initialTitle,
  initialStatus,
  initialFormat,
  initialPriority,
  initialOnBoard,
}: UsePlanEditorParams) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [format, setFormat] = useState(initialFormat);
  const [priority, setPriority] = useState(initialPriority);
  const [onBoard, setOnBoard] = useState(initialOnBoard);
  const [status, setStatus] = useState(initialStatus);
  const statusRef = useRef(initialStatus);
  const [isPending, startTransition] = useTransition();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingData = useRef<{ title?: string; format?: string | null; priority?: string | null }>({});

  const autoSave = useCallback(
    (data: {
      title?: string;
      format?: string | null;
      priority?: string | null;
    }) => {
      Object.assign(pendingData.current, data);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        updatePlanAction(id, pendingData.current);
        pendingData.current = {};
      }, 2000);
    },
    [id]
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      autoSave({ title: newTitle.trim() });
    },
    [autoSave]
  );

  const handleEditorSave = useCallback(
    (content: JSONContent) => {
      updatePlanAction(id, { content });
    },
    [id]
  );

  const handleFormatChange = useCallback(
    (newFormat: string | null) => {
      setFormat(newFormat);
      autoSave({ format: newFormat });
    },
    [autoSave]
  );

  const handlePriorityChange = useCallback(
    (newPriority: string) => {
      setPriority(newPriority);
      autoSave({ priority: newPriority });
    },
    [autoSave]
  );

  const handleOnBoardChange = useCallback(
    (newOnBoard: boolean) => {
      setOnBoard(newOnBoard);
      startTransition(async () => {
        const result = await togglePlanOnBoardAction(id, newOnBoard);
        if (!result.success) {
          toast.error(result.error ?? "Failed to toggle board");
          setOnBoard(!newOnBoard);
        }
      });
    },
    [id]
  );

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      const prevStatus = statusRef.current;
      statusRef.current = newStatus;
      setStatus(newStatus);
      startTransition(async () => {
        const result = await updatePlanStatusAction(id, newStatus);
        if (result.success) {
          toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        } else {
          toast.error(result.error ?? "Failed to update status");
          statusRef.current = prevStatus;
          setStatus(prevStatus);
        }
      });
    },
    [id]
  );

  const handleManualSave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    startTransition(async () => {
      const result = await updatePlanAction(id, {
        title: title.trim(),
        format,
        priority,
      });
      if (result.success) {
        toast.success("Plan saved");
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    });
  }, [id, title, format, priority, onBoard]);

  const handleDelete = useCallback(() => {
    if (!confirm("Delete this plan? This cannot be undone.")) return;

    startTransition(async () => {
      const result = await deletePlanAction(id);
      if (result.success) {
        toast.success("Plan deleted");
        router.push("/dashboard/content/plans");
      } else {
        toast.error(result.error ?? "Failed to delete plan");
      }
    });
  }, [id, router]);

  return {
    title,
    format,
    priority,
    onBoard,
    status,
    isPending,
    handleTitleChange,
    handleEditorSave,
    handleFormatChange,
    handlePriorityChange,
    handleOnBoardChange,
    handleStatusChange,
    handleManualSave,
    handleDelete,
  };
}
