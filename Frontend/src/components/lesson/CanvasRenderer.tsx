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
  let code = raw.trim();

  // Remove markdown fences if present
  code = code
    .replace(/^```[a-zA-Z]*\s*/g, '')
    .replace(/```\s*$/g, '');

  // Normalize smart quotes and dashes that occasionally break parsing
  code = code
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-');

  // Remove import/export lines (LLM often adds them despite instructions)
  code = code
    .replace(/^import\s+.*?;\s*$/gm, '')
    .replace(/^export\s+default\s+\w+\s*;?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, '');

  // If model prepends prose, trim everything before first component declaration
  const firstComponentIndex = (() => {
    const matches = [
      code.search(/\bconst\s+[A-Z]\w*\s*=\s*/),
      code.search(/\bfunction\s+[A-Z]\w*\s*\(/),
      code.search(/\bclass\s+[A-Z]\w*\s+extends\s+React\.Component/),
    ].filter((index) => index >= 0);
    return matches.length > 0 ? Math.min(...matches) : -1;
  })();

  if (firstComponentIndex > 0) {
    code = code.slice(firstComponentIndex);
  }

  // If a render call already exists, keep it and just return normalized code.
  const hasRenderCall = /\brender\s*\(/.test(code);
  if (hasRenderCall) {
    return code.trim();
  }

  // Find component name to mount
  const constMatch = code.match(/\bconst\s+([A-Z]\w*)\s*=/);
  const letMatch = code.match(/\blet\s+([A-Z]\w*)\s*=/);
  const varMatch = code.match(/\bvar\s+([A-Z]\w*)\s*=/);
  const funcMatch = code.match(/\bfunction\s+([A-Z]\w*)\s*\(/);
  const classMatch = code.match(/\bclass\s+([A-Z]\w*)\s+extends\s+React\.Component/);
  const componentName =
    constMatch?.[1] ||
    letMatch?.[1] ||
    varMatch?.[1] ||
    funcMatch?.[1] ||
    classMatch?.[1];

  if (componentName) {
    code = `${code}\n\nrender(<${componentName} />);`;
    return code.trim();
  }

  // JSX-only snippet fallback (e.g. `<div>...</div>`)
  if (code.startsWith('<')) {
    code = `render(${code});`;
    return code.trim();
  }

  // Last-resort fallback to satisfy noInline requirement.
  code = `${code}\n\nrender(<div />);`;

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
