import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LiveProvider, LivePreview, LiveError } from 'react-live';

interface CanvasRendererProps {
  codeString: string;
}

const scope = { React, useState, useEffect, useCallback, useMemo, useRef };

/**
 * Sanitize LLM-generated code so react-live can execute it.
 * - Strips import/export statements
 * - Ensures the component is rendered (not just defined)
 */
function sanitizeCode(raw: string): string {
  let code = raw;

  // Remove import lines (LLM often adds them despite instructions)
  code = code.replace(/^import\s+.*?;\s*$/gm, '');

  // Remove "export default ComponentName;" at the end
  code = code.replace(/export\s+default\s+\w+\s*;?\s*$/gm, '');

  // If the code defines a const Component = ... but doesn't render it,
  // find the component name and add a render call at the end.
  // Match patterns like: const MyComponent = () => { OR function MyComponent() {
  const constMatch = code.match(/^const\s+([A-Z]\w*)\s*=/m);
  const funcMatch = code.match(/^function\s+([A-Z]\w*)\s*\(/m);
  const componentName = constMatch?.[1] || funcMatch?.[1];

  if (componentName) {
    // Check if the code already ends with a render expression like <ComponentName /> or render(...)
    const trimmed = code.trimEnd();
    const hasRender =
      trimmed.endsWith('/>') ||
      trimmed.endsWith('>') ||
      trimmed.endsWith(')');

    // If the last meaningful line is just the closing brace of the component definition, add render
    if (!hasRender || trimmed.endsWith('};') || trimmed.endsWith('}')) {
      code = code + `\n\nrender(<${componentName} />);`;
    }
  }

  return code.trim();
}

/**
 * Safely renders a React code string from the AI agent
 * using react-live's sandboxed environment.
 */
export function CanvasRenderer({ codeString }: CanvasRendererProps) {
  const sanitized = sanitizeCode(codeString);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <LiveProvider code={sanitized} scope={scope} noInline>
        <div className="w-full h-full overflow-auto">
          <LiveError className="text-red-500 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2" />
          <LivePreview className="w-full h-full" />
        </div>
      </LiveProvider>
    </div>
  );
}
