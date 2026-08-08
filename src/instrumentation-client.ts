import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    { path: "/api/posts", method: "POST" },
    { path: "/api/posts/*/agree/toggle", method: "POST" },
    { path: "/api/posts/*/report", method: "POST" },
    { path: "/api/candidate/first-message", method: "POST" },
    { path: "/api/candidate/first-message", method: "PATCH" },
    { path: "/api/candidate/replies", method: "POST" },
  ],
});
