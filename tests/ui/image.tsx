import { createElement, type ImgHTMLAttributes } from "react";
export default function Image({
  priority: _priority,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) {
  void _priority;
  return createElement("img", props);
}
