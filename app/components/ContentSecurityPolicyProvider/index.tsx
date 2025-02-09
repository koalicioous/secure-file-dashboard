import React, { useEffect } from "react";

interface ContentSecurityPolicyProviderProps {
  policy: string;
  children?: React.ReactNode;
}

export const ContentSecurityPolicyProvider: React.FC<
  ContentSecurityPolicyProviderProps
> = ({ policy, children }) => {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = policy;

    document.head.appendChild(meta);

    return () => {
      if (document.head.contains(meta)) {
        document.head.removeChild(meta);
      }
    };
  }, [policy]);

  return <>{children}</>;
};
