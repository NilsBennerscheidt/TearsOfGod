"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingImageProps extends Omit<ImageProps, "onLoad" | "onError" | "ref"> {
  spinnerSize?: number;
  /** For the wrapping element — `className` still goes to the image itself. */
  wrapperClassName?: string;
}

/**
 * next/image with the brand loader over it until the file has actually
 * arrived, instead of an empty bordered box on a slow connection. Same
 * overlay PhotoTile uses for the media grid, for every other photo.
 *
 * A Client Component only because of `onLoad`; every prop it takes is
 * plain data, so Server Components can render it directly.
 */
export function LoadingImage({ spinnerSize = 28, wrapperClassName, alt, ...props }: LoadingImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached image can finish decoding before hydration attaches onLoad —
  // onLoad never fires for it, and the overlay would be stuck forever.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <div className={cn("relative", wrapperClassName)}>
      {!loaded && (
        <div aria-hidden="true" className="bg-pitch absolute inset-0 flex items-center justify-center">
          <LoadingSpinner variant="cycle" size={spinnerSize} />
        </div>
      )}
      {/* onError too: a broken file should show its alt text, not spin forever. */}
      <Image ref={imgRef} alt={alt} {...props} onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} />
    </div>
  );
}
