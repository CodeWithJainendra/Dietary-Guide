// import { createTRPCReact } from "@trpc/react-query";
// import { httpLink } from "@trpc/client";
// import type { AppRouter } from "@/backend/trpc/app-router";
// import superjson from "superjson";

// export const trpc = createTRPCReact<AppRouter>();

// const getBaseUrl = () => {
//   // For development, provide a fallback URL
//   if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
//     return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
//   }

//   // Fallback for development
//   if (__DEV__) {
//     return "http://localhost:3000";
//   }

//   // For production, you should always set the environment variable
//   console.warn("EXPO_PUBLIC_RORK_API_BASE_URL not set, using fallback");
//   return "http://localhost:3000";
// };

// export const trpcClient = {
//   links: [
//     // httpLink({
//     //   url: `${getBaseUrl()}/api/trpc`,
//     //   transformer: superjson,
//     //   // Add error handling for network issues
//     //   fetch: async (url, options) => {
//     //     try {
//     //       return await fetch(url, options);
//     //     } catch (error) {
//     //       console.warn("tRPC fetch error:", error);
//     //       // Return a mock response to prevent app crashes
//     //       return new Response(JSON.stringify({ error: "Network unavailable" }), {
//     //         status: 503,
//     //         headers: { 'Content-Type': 'application/json' }
//     //       });
//     //     }
//     //   }
//     // }),
//   ],
// };