// Production domain for Clerk custom domain - hardcoded to fix auth issue
export default {
  providers: [
    {
      domain: "https://clerk.thumbzap.com",
      applicationID: "convex",
    },
  ],
};
