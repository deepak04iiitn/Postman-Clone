"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTabStore } from "@/store/tabStore";
import { useAppStore } from "@/store/appStore";
import { sendRequest, environmentsApi } from "@/lib/api";
import { resolveRequest, resolveVariables } from "@/lib/variableResolver";
import type { KeyValuePair, EnvironmentVariable } from "@/types";

/** Build the Authorization header value from auth config, or null if none. */
function buildAuthHeader(
  authType: string,
  authConfig: Record<string, string>
): { key: string; value: string; enabled: true } | null {
  if (authType === "bearer" && authConfig.token) {
    return { key: "Authorization", value: `Bearer ${authConfig.token}`, enabled: true };
  }
  if (authType === "basic" && (authConfig.username || authConfig.password)) {
    const encoded = btoa(`${authConfig.username ?? ""}:${authConfig.password ?? ""}`);
    return { key: "Authorization", value: `Basic ${encoded}`, enabled: true };
  }
  return null;
}

export function useSendRequest() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const updateTab = useTabStore((s) => s.updateTab);
  const selectedEnvironmentId = useAppStore((s) => s.selectedEnvironmentId);
  const queryClient = useQueryClient();

  const send = useCallback(async () => {
    if (!tab || !activeTabId) return;
    if (tab.isLoading) return;

    // 1. Set loading state
    updateTab(activeTabId, { isLoading: true, response: null });

    try {
      // 2. Fetch environment variables if an environment is selected
      let variables: EnvironmentVariable[] = [];
      if (selectedEnvironmentId) {
        try {
          variables = await environmentsApi.getVariables(selectedEnvironmentId);
        } catch {
          // env fetch failed — proceed without variables
        }
      }

      // 3. Resolve {{variables}} in URL, headers, params, body
      const resolved = resolveRequest(
        tab.url,
        tab.headers,
        tab.params,
        tab.bodyContent,
        variables
      );

      // 4. Resolve {{variables}} inside auth config values, then build the header
      const rawAuthConfig = tab.authConfig as Record<string, string>;
      const resolvedAuthConfig: Record<string, string> = Object.fromEntries(
        Object.entries(rawAuthConfig).map(([k, v]) => [k, resolveVariables(v, variables)])
      );
      const authHeader = buildAuthHeader(tab.authType, resolvedAuthConfig);

      const finalHeaders: KeyValuePair[] = authHeader
        ? [
            ...resolved.headers.filter(
              (h) => h.key.toLowerCase() !== "authorization"
            ),
            authHeader,
          ]
        : resolved.headers;

      // 5. Call the runner proxy
      const result = await sendRequest({
        method: tab.method,
        url: resolved.url,
        headers: finalHeaders,
        params: resolved.params,
        body_type: tab.bodyType,
        body_content:
          tab.bodyType === "none" ? null : resolved.bodyContent || null,
        auth_type: tab.authType,
        auth_config: resolvedAuthConfig,
      });

      // 6. Store result in tab
      updateTab(activeTabId, { response: result, isLoading: false });

      // 7. Invalidate history so sidebar updates
      queryClient.invalidateQueries({ queryKey: ["history"] });

      if (result.error) {
        toast.error(`Request failed: ${result.error}`);
      }
    } catch (err) {
      updateTab(activeTabId, {
        isLoading: false,
        response: {
          status_code: null,
          response_time_ms: 0,
          response_size_bytes: 0,
          headers: {},
          body: null,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      });
      toast.error("Failed to send request");
    }
  }, [tab, activeTabId, updateTab, selectedEnvironmentId, queryClient]);

  return { send, isLoading: tab?.isLoading ?? false };
}
