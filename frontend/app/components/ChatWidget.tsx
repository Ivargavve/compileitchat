"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
import { Streamdown } from "streamdown";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Message = { role: "user" | "assistant"; content: string };

const styles: Record<string, CSSProperties> = {
  container: {
    position: "fixed",
    bottom: 20,
    right: 20,
    zIndex: 50,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  widget: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    boxShadow:
      "0 0 0 1px rgba(0,0,0,0.08), 0 4px 6px -1px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)",
    width: 400,
    maxWidth: "calc(100vw - 40px)",
    height: 550,
    maxHeight: "calc(100vh - 40px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e5e5e5",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#18181b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
  },
  headerText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: 14,
    color: "#18181b",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#71717a",
    margin: 0,
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "#71717a",
    cursor: "pointer",
    padding: 8,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.15s, color 0.15s",
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    backgroundColor: "#fafafa",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 8,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#18181b",
    fontSize: 15,
    fontWeight: 500,
    margin: 0,
  },
  emptySubtitle: {
    color: "#71717a",
    fontSize: 13,
    margin: 0,
    textAlign: "center" as const,
  },
  messageRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#18181b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 600,
    flexShrink: 0,
  },
  userMessageRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  userMessage: {
    maxWidth: "85%",
    padding: "10px 14px",
    borderRadius: 12,
    borderBottomRightRadius: 4,
    backgroundColor: "#18181b",
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap" as const,
  },
  assistantMessage: {
    maxWidth: "100%",
    padding: "10px 0",
    color: "#27272a",
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
  },
  form: {
    padding: "16px 20px",
    borderTop: "1px solid #e5e5e5",
    backgroundColor: "#ffffff",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f4f4f5",
    borderRadius: 10,
    padding: "4px 4px 4px 16px",
    border: "1px solid transparent",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  inputWrapperFocused: {
    borderColor: "#18181b",
    boxShadow: "0 0 0 3px rgba(24, 24, 27, 0.08)",
  },
  input: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    backgroundColor: "transparent",
    fontSize: 14,
    outline: "none",
    color: "#18181b",
  },
  sendButton: {
    backgroundColor: "#18181b",
    color: "#ffffff",
    border: "none",
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.15s, opacity 0.15s",
  },
  fabButton: {
    backgroundColor: "#18181b",
    color: "#ffffff",
    border: "none",
    width: 56,
    height: 56,
    borderRadius: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 4px 6px -1px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isLoading && isOpen) {
      inputRef.current?.focus();
    }
  }, [isLoading, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let messageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        if (!messageAdded) {
          setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
          messageAdded = true;
        } else {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantContent,
            };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ett fel uppstod. Försök igen." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {isOpen ? (
        <div ref={widgetRef} style={styles.widget}>
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>C</div>
              <div style={styles.headerText}>
                <p style={styles.headerTitle}>CompileIT Assistant</p>
                <p style={styles.headerSubtitle}>Alltid redo att hjälpa</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={styles.closeButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f4f4f5";
                e.currentTarget.style.color = "#18181b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#71717a";
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div style={styles.messagesArea}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="#71717a"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p style={styles.emptyTitle}>Hur kan jag hjälpa dig?</p>
                <p style={styles.emptySubtitle}>
                  Ställ en fråga om CompileIT
                </p>
              </div>
            ) : (
              messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} style={styles.userMessageRow}>
                    <div style={styles.userMessage}>{msg.content}</div>
                  </div>
                ) : (
                  <div key={i} style={styles.messageRow}>
                    <div style={styles.messageAvatar}>C</div>
                    <div style={styles.assistantMessage}>
                      {msg.content ? (
                        <Streamdown
                          linkSafety={{ enabled: false }}
                          components={{
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#18181b",
                                  textDecoration: "underline",
                                  textUnderlineOffset: "2px",
                                }}
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.content}
                        </Streamdown>
                      ) : null}
                    </div>
                  </div>
                )
              )
            )}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <div style={styles.messageRow}>
                <div style={styles.messageAvatar}>C</div>
                <div style={styles.assistantMessage}>
                  <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
                    <span style={{ width: 6, height: 6, backgroundColor: "#71717a", animation: "pulse 1.4s infinite", animationDelay: "0s" }} />
                    <span style={{ width: 6, height: 6, backgroundColor: "#71717a", animation: "pulse 1.4s infinite", animationDelay: "0.2s" }} />
                    <span style={{ width: 6, height: 6, backgroundColor: "#71717a", animation: "pulse 1.4s infinite", animationDelay: "0.4s" }} />
                  </span>
                  <style>{`
                    @keyframes pulse {
                      0%, 80%, 100% { opacity: 0.3; }
                      40% { opacity: 1; }
                    }
                  `}</style>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div
              style={{
                ...styles.inputWrapper,
                ...(inputFocused ? styles.inputWrapperFocused : {}),
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Skriv ett meddelande..."
                disabled={isLoading}
                style={{
                  ...styles.input,
                  opacity: isLoading ? 0.6 : 1,
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  ...styles.sendButton,
                  opacity: isLoading || !input.trim() ? 0.5 : 1,
                  cursor:
                    isLoading || !input.trim() ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && input.trim()) {
                    e.currentTarget.style.backgroundColor = "#27272a";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#18181b";
                }}
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={styles.fabButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow =
              "0 10px 25px -3px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 4px 6px -1px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)";
          }}
        >
          <svg
            width="26"
            height="26"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
