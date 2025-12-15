interface Message {
  role: "user" | "assistant";
  content: string;
}

export const useExportChat = () => {
  const exportAsMarkdown = (messages: Message[], filename: string = "conversation") => {
    const content = messages.map((msg, idx) => {
      const role = msg.role === "user" ? "## 👤 You" : "## 🤖 AI Assistant";
      return `${role}\n\n${msg.content}\n\n---\n`;
    }).join("\n");

    const header = `# Conversation Export\n\n**Exported on:** ${new Date().toLocaleString()}\n\n---\n\n`;
    const fullContent = header + content;

    downloadFile(fullContent, `${filename}.md`, "text/markdown");
  };

  const exportAsText = (messages: Message[], filename: string = "conversation") => {
    const content = messages.map((msg) => {
      const role = msg.role === "user" ? "[YOU]" : "[AI ASSISTANT]";
      return `${role}\n${msg.content}\n\n${"=".repeat(50)}\n`;
    }).join("\n");

    const header = `CONVERSATION EXPORT\nExported on: ${new Date().toLocaleString()}\n${"=".repeat(50)}\n\n`;
    const fullContent = header + content;

    downloadFile(fullContent, `${filename}.txt`, "text/plain");
  };

  const exportAsPDF = async (messages: Message[], filename: string = "conversation") => {
    // Create a printable HTML document
    const content = messages.map((msg) => {
      const role = msg.role === "user" ? "You" : "AI Assistant";
      const bgColor = msg.role === "user" ? "#3b82f6" : "#1e293b";
      const textColor = "#ffffff";
      
      // Escape HTML and preserve code blocks
      const escapedContent = msg.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
          return `<pre style="background: #0f172a; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 12px 0;"><code>${code.trim()}</code></pre>`;
        })
        .replace(/\n/g, "<br>");

      return `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <div style="font-weight: 600; color: ${msg.role === "user" ? "#3b82f6" : "#8b5cf6"}; margin-bottom: 8px; font-size: 14px;">
            ${role}
          </div>
          <div style="background: ${bgColor}; color: ${textColor}; padding: 16px; border-radius: 12px; font-size: 14px; line-height: 1.6;">
            ${escapedContent}
          </div>
        </div>
      `;
    }).join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Conversation Export</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #0f172a;
              color: #f8fafc;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              color: #8b5cf6;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 16px;
              margin-bottom: 32px;
            }
            .meta {
              color: #94a3b8;
              font-size: 12px;
              margin-bottom: 32px;
            }
            pre {
              font-family: 'SF Mono', Monaco, monospace;
              font-size: 12px;
            }
            code {
              font-family: 'SF Mono', Monaco, monospace;
            }
            @media print {
              body { background: white; color: black; }
              pre { background: #f1f5f9 !important; color: black; }
              div[style*="background: #3b82f6"] { background: #dbeafe !important; color: black !important; }
              div[style*="background: #1e293b"] { background: #f1f5f9 !important; color: black !important; }
            }
          </style>
        </head>
        <body>
          <h1>💬 Conversation Export</h1>
          <div class="meta">Exported on: ${new Date().toLocaleString()}</div>
          ${content}
        </body>
      </html>
    `;

    // Open print dialog for PDF
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    exportAsMarkdown,
    exportAsText,
    exportAsPDF,
  };
};
