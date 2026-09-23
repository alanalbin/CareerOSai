import { useQuery, useMutation } from "@tanstack/react-query";

// A dynamic proxy to mock tRPC router calls so the UI compiles and displays without the Node backend
const createMockRouter = (path: string[] = []): any => {
  // Use a function as target so any nested property can be called (e.g. trpc.useUtils())
  const target = function() { return createMockRouter([...path]); };
  return new Proxy(
    target,
    {
      get(targetObj, prop) {
        if (prop === "useQuery") {
          return (input: any, options: any) => {
            return useQuery({
              queryKey: [...path, input],
              queryFn: async () => {
                const token = typeof window !== "undefined" ? localStorage.getItem("careeros_token") : null;
                const headers: Record<string, string> = {};
                if (token) headers["Authorization"] = `Bearer ${token}`;

                try {
                  const res = await fetch(`/api/${path.join("/")}`, { headers });
                  if (res.ok) return res.json();
                  return null;
                } catch (e) {
                  return null;
                }
              },
              ...options,
            });
          };
        }
        if (prop === "useMutation") {
          return (options: any) => {
            return useMutation({
              mutationFn: async (vars: any) => {
                const token = typeof window !== "undefined" ? localStorage.getItem("careeros_token") : null;
                const headers: Record<string, string> = { "Content-Type": "application/json" };
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const res = await fetch(`/api/${path.join("/")}`, {
                  method: "POST",
                  headers,
                  body: JSON.stringify(vars ?? {}),
                });

                if (!res.ok) {
                  let errMsg = `Request to /${path.join("/")} failed (${res.status})`;
                  try {
                    const errData = await res.json();
                    errMsg = errData.detail || errData.message || errMsg;
                  } catch {
                    const text = await res.text();
                    if (text) errMsg = text;
                  }
                  throw new Error(errMsg);
                }

                return res.json();
              },
              ...options,
            });
          };
        }
        return createMockRouter([...path, prop as string]);
      },
    }
  );
};

export const trpc = createMockRouter();
