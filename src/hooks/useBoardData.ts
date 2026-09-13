import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { boardService, type Board } from "@/services";

export const boardQueryKey = ["board"] as const;

export const boardQueryOptions = {
  queryKey: boardQueryKey,
  queryFn: () => boardService.getBoard(),
};

export function useBoardData() {
  const queryClient = useQueryClient();
  const query = useQuery(boardQueryOptions);

  const mutation = useMutation({
    mutationFn: (action: () => Promise<Board>) => action(),
    onSuccess: (board) => queryClient.setQueryData(boardQueryKey, board),
  });

  /** Run any service call and push the returned board into the cache. */
  const act = useCallback(
    (action: () => Promise<Board>) => mutation.mutate(action),
    [mutation],
  );

  return { board: query.data, isLoading: query.isLoading, act, isMutating: mutation.isPending };
}
