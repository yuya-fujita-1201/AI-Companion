import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ScreenContainer } from "./components/ScreenContainer";
import { HomeView } from "./views/HomeView";
import { ChatView } from "./views/ChatView";
import { useChat } from "./hooks/useChat";
import { MemoriesView } from "./views/MemoriesView";

export default function App() {
  const [route, setRoute] = useState<"home" | "chat" | "memories">("home");
  const chat = useChat();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white noise">
      <ScreenContainer>
        <AnimatePresence mode="wait">
          {route === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex h-full flex-col"
            >
              <HomeView
                onStartChat={() => setRoute("chat")}
                onOpenMemories={() => setRoute("memories")}
              />
            </motion.div>
          ) : route === "chat" ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
              className="flex h-full flex-col"
            >
              <ChatView onBack={() => setRoute("home")} chat={chat} />
            </motion.div>
          ) : (
            <motion.div
              key="memories"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
              className="flex h-full flex-col"
            >
              <MemoriesView onBack={() => setRoute("home")} />
            </motion.div>
          )}
        </AnimatePresence>
      </ScreenContainer>
    </div>
  );
}
