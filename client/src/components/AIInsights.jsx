// AIInsights.jsx
import React from "react";

export default function AIInsights({ insights }) {
  if (!insights) return null;

  // Convert newline formatting to HTML line breaks
  const formatted = insights.replace(/\n/g, "<br/>");

  return (
    <div className="mt-6 p-5 bg-gray-900/40 rounded-xl border border-gray-700 text-gray-200">
      <h2 className="text-xl font-semibold mb-3 text-purple-300">
        💡 AI Financial Insights
      </h2>

      {/* Safely display formatted HTML */}
      <p
        className="leading-7"
        dangerouslySetInnerHTML={{ __html: formatted }}
      ></p>
    </div>
  );
}
