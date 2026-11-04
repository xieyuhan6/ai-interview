import type { AnchorHTMLAttributes } from "react";
export function useRouter() {
  return {
    push(path: string) {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
  };
}
export default function Link({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const router = useRouter();
  return (
    <a
      {...props}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        router.push(href || "/");
      }}
    >
      {children}
    </a>
  );
}
