"use client";
import { useEffect, useState } from "react";
import { ImageIcon, LoaderCircle } from "lucide-react";
import { DEMO_MODE, photoUrl } from "@/lib/api";
import { fetchPhoto } from "@/lib/photos";
import type { Account } from "@/lib/types";
import { Button } from "./ui";

export function RemotePhoto({ path, account, alt, className = "" }: {
  path?: string | null;
  account: Account;
  alt: string;
  className?: string;
}) {
  const source = DEMO_MODE && path?.startsWith("data:image/") ? path : photoUrl(path);
  return <PhotoContent key={`${account}:${source}`} source={source} account={account} alt={alt} className={className} />;
}

function PhotoContent({ source, account, alt, className }: {
  source?: string;
  account: Account;
  alt: string;
  className: string;
}) {
  const proxied = source?.startsWith("/gateway/");
  const [image, setImage] = useState(proxied ? undefined : source);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!source || !proxied) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    fetchPhoto(source, account, controller.signal).then((blob) => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setImage(objectUrl);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "잠시 후 다시 시도해주세요.");
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, account, proxied, attempt]);

  if (image && !error) return (
    <img key={attempt} className={`inspection-photo ${className}`} src={image} alt={alt}
      onError={() => setError("사진을 표시할 수 없습니다. 잠시 후 다시 시도해주세요.")} />
  );
  return (
    <div className={`inspection-image-placeholder ${className}`} role="status" aria-label={alt}>
      {source && !error ? <LoaderCircle size={28} className="animate-spin" /> : <ImageIcon size={28} />}
      <span>{!source ? "등록된 사진이 없습니다." : error ? "사진을 불러올 수 없어요" : "사진을 불러오는 중…"}</span>
      {error && <>
        <p>{error}</p>
        <Button variant="secondary" className="compact" onClick={() => {
          setError("");
          setImage(proxied ? undefined : source);
          setAttempt((value) => value + 1);
        }}>사진 다시 불러오기</Button>
      </>}
    </div>
  );
}
