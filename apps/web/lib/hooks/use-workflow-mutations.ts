import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Workflow } from "./use-repository-dashboard";

interface DeleteWorkflowsData {
  repoSlug: string;
}

export function useWorkflowMutations() {
  const queryClient = useQueryClient();

  // Save/Update workflows with optimistic updates
  const saveWorkflowsMutation = useMutation({
    mutationFn: async ({ repoSlug, workflows }: { repoSlug: string; workflows: Workflow[] }) => {
      const response = await fetch(`/api/workflow/${repoSlug}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflows })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to save workflows');
      }
      
      return response.json();
    },
    onMutate: async ({ repoSlug, workflows }) => {
      // Cancel outgoing refetches for this repo's workflows
      await queryClient.cancelQueries({ queryKey: ['repository-workflows', repoSlug] });
      await queryClient.cancelQueries({ queryKey: ['workflow-existence', repoSlug] });
      
      // Snapshot previous values
      const previousWorkflows = queryClient.getQueryData(['repository-workflows', repoSlug]);
      const previousExistence = queryClient.getQueryData(['workflow-existence', repoSlug]);
      
      // Optimistically update workflows
      queryClient.setQueryData(['repository-workflows', repoSlug], workflows);
      
      // Optimistically update workflow existence
      queryClient.setQueryData(['workflow-existence', repoSlug], {
        hasWorkflows: workflows.length > 0,
        workflowCount: workflows.length
      });
      
      return { 
        previousWorkflows, 
        previousExistence,
        repoSlug 
      };
    },
    onError: (error, { repoSlug }, context) => {
      // Rollback on error
      if (context?.previousWorkflows) {
        queryClient.setQueryData(['repository-workflows', repoSlug], context.previousWorkflows);
      }
      if (context?.previousExistence) {
        queryClient.setQueryData(['workflow-existence', repoSlug], context.previousExistence);
      }
      
      console.error('Error saving workflows:', error);
    },
    onSuccess: (_data, _variables) => {
      // Success handled by onSettled
    },
    onSettled: (data, error, { repoSlug }) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['repository-workflows', repoSlug] });
      queryClient.invalidateQueries({ queryKey: ['workflow-existence', repoSlug] });
      queryClient.invalidateQueries({ queryKey: ['workflow-existence'] });
      queryClient.invalidateQueries({ queryKey: ['repository-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['yesterday-workflow-runs', repoSlug] });
    }
  });

  // Delete workflows with optimistic updates
  const deleteWorkflowsMutation = useMutation({
    mutationFn: async ({ repoSlug }: DeleteWorkflowsData) => {
      const response = await fetch(`/api/workflow/${repoSlug}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to delete workflows');
      }
      
      return response.json();
    },
    onMutate: async ({ repoSlug }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['repository-workflows', repoSlug] });
      await queryClient.cancelQueries({ queryKey: ['workflow-existence', repoSlug] });
      
      // Snapshot previous values
      const previousWorkflows = queryClient.getQueryData(['repository-workflows', repoSlug]);
      const previousExistence = queryClient.getQueryData(['workflow-existence', repoSlug]);
      
      // Optimistically clear workflows
      queryClient.setQueryData(['repository-workflows', repoSlug], []);
      queryClient.setQueryData(['workflow-existence', repoSlug], {
        hasWorkflows: false,
        workflowCount: 0
      });
      
      return { 
        previousWorkflows, 
        previousExistence,
        repoSlug 
      };
    },
    onError: (error, { repoSlug }, context) => {
      // Rollback on error
      if (context?.previousWorkflows) {
        queryClient.setQueryData(['repository-workflows', repoSlug], context.previousWorkflows);
      }
      if (context?.previousExistence) {
        queryClient.setQueryData(['workflow-existence', repoSlug], context.previousExistence);
      }
      
      console.error('Error deleting workflows:', error);
    },
    onSuccess: (_data, _variables) => {
      // Success handled by onSettled
    },
    onSettled: (data, error, { repoSlug }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['repository-workflows', repoSlug] });
      queryClient.invalidateQueries({ queryKey: ['workflow-existence', repoSlug] });
      queryClient.invalidateQueries({ queryKey: ['workflow-existence'] });
      queryClient.invalidateQueries({ queryKey: ['repository-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['yesterday-workflow-runs', repoSlug] });
    }
  });

  return {
    saveWorkflowsMutation,
    deleteWorkflowsMutation,
    isSaving: saveWorkflowsMutation.isPending,
    isDeleting: deleteWorkflowsMutation.isPending,
    saveError: saveWorkflowsMutation.error,
    deleteError: deleteWorkflowsMutation.error
  };
}
