import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRecurringActionItems,
  getRecurringActionItemById,
  createRecurringActionItem,
  updateRecurringActionItem,
  deleteRecurringActionItem,
} from "../api/recurringActionItemApi";

export const recurringActionItemsQueryKey = ["recurringActionItems"];

export const useRecurringActionItems = () =>
  useQuery({
    queryKey: recurringActionItemsQueryKey,
    queryFn: getRecurringActionItems,
    select: (data) => (Array.isArray(data) ? data : data?.items || []),
  });

export const useRecurringActionItem = (id) =>
  useQuery({
    queryKey: ["recurringActionItem", id],
    queryFn: () => getRecurringActionItemById(id),
    enabled: Boolean(id),
  });

export const useCreateRecurringActionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecurringActionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringActionItemsQueryKey });
    },
  });
};

export const useUpdateRecurringActionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateRecurringActionItem(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringActionItemsQueryKey });
      queryClient.invalidateQueries({
        queryKey: ["recurringActionItem", variables.id],
      });
    },
  });
};

export const useDeleteRecurringActionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecurringActionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringActionItemsQueryKey });
    },
  });
};
