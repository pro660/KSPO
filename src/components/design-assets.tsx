"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
const graphics = {
  searchBackground: {
    w: 345,
    h: 148,
    pieces: [{ id: "22:270", file: "11067.svg", x: 0, y: 0 }],
  },
  logo: {
    w: 231,
    h: 89.04,
    pieces: [
      {
        id: "22:97",
        file: "49e33.svg",
        x: 57.635,
        y: 67.2659,
      },
      {
        id: "22:98",
        file: "38045.svg",
        x: 50.5186,
        y: 67.2659,
      },
      {
        id: "22:99",
        file: "36581.svg",
        x: 41.4539,
        y: 67.0216,
      },
      {
        id: "22:100",
        file: "19a28.svg",
        x: 105.5559,
        y: 66.723,
      },
      {
        id: "22:101",
        file: "de106.svg",
        x: 103.4724,
        y: 77.6885,
      },
      {
        id: "22:102",
        file: "b516a.svg",
        x: 107.2606,
        y: 80.5385,
      },
      {
        id: "22:103",
        file: "00475.svg",
        x: 66.6997,
        y: 66.3158,
      },
      {
        id: "22:104",
        file: "b1f09.svg",
        x: 62.6949,
        y: 76.8199,
      },
      {
        id: "22:105",
        file: "961c8.svg",
        x: 98.1418,
        y: 67.2659,
      },
      {
        id: "22:106",
        file: "a999a.svg",
        x: 83.6925,
        y: 68.1073,
      },
      {
        id: "22:107",
        file: "95187.svg",
        x: 88.1842,
        y: 80.8641,
      },
      {
        id: "22:108",
        file: "7b47d.svg",
        x: 127.5005,
        y: 79.697,
      },
      {
        id: "22:109",
        file: "434b2.svg",
        x: 123.7935,
        y: 67.9445,
      },
      {
        id: "22:110",
        file: "714aa.svg",
        x: 145.1969,
        y: 67.2659,
      },
      {
        id: "22:111",
        file: "0b626.svg",
        x: 148.1462,
        y: 80.7013,
      },
      {
        id: "22:112",
        file: "961c8.svg",
        x: 35.7986,
        y: 67.2659,
      },
      {
        id: "22:113",
        file: "02861.svg",
        x: 0,
        y: 67.3201,
      },
      {
        id: "22:114",
        file: "2a8f9.svg",
        x: 25.5164,
        y: 80.7013,
      },
      {
        id: "22:115",
        file: "61f13.svg",
        x: 21.7822,
        y: 67.5645,
      },
      {
        id: "22:118",
        file: "abe4c.svg",
        x: 86.2631,
        y: 23.0508,
      },
      {
        id: "22:119",
        file: "0e71b.svg",
        x: 128.8361,
        y: 22.1281,
      },
      {
        id: "22:120",
        file: "fe7c6.svg",
        x: 0,
        y: 18.6809,
      },
      {
        id: "22:121",
        file: "cc665.svg",
        x: 48.3539,
        y: 23.0237,
      },
      {
        id: "22:123",
        file: "a8abd.svg",
        x: 174.2579,
        y: 12.0105,
      },
      {
        id: "22:125",
        file: "fa53d.svg",
        x: 153.3821,
        y: 0,
      },
      {
        id: "22:126",
        file: "f7269.svg",
        x: 193.0968,
        y: 3.0469,
      },
    ],
  },
  wordmark: {
    w: 116,
    h: 28.31,
    pieces: [
      {
        id: "22:257",
        file: "36287.svg",
        x: 43.3184,
        y: 11.3959,
      },
      {
        id: "22:258",
        file: "4bc88.svg",
        x: 64.6968,
        y: 10.9397,
      },
      {
        id: "22:259",
        file: "af462.svg",
        x: 0,
        y: 9.2355,
      },
      {
        id: "22:260",
        file: "ec7d8.svg",
        x: 24.2815,
        y: 11.3825,
      },
      {
        id: "22:262",
        file: "0fe45.svg",
        x: 87.5061,
        y: 5.9377,
      },
      {
        id: "22:264",
        file: "4d709.svg",
        x: 77.0229,
        y: 0,
      },
      {
        id: "22:265",
        file: "2e7d8.svg",
        x: 96.9663,
        y: 1.5064,
      },
    ],
  },
  facility: {
    w: 320,
    h: 145,
    pieces: [
      {
        id: "24:199",
        file: "f49cf.svg",
        x: 0,
        y: 0,
      },
      {
        id: "24:200",
        file: "e2ef4.svg",
        x: 252,
        y: 10,
      },
      {
        id: "24:201",
        file: "ee4ec.svg",
        x: 22,
        y: 65,
      },
      {
        id: "24:202",
        file: "4f175.svg",
        x: 62,
        y: 34,
      },
      {
        id: "24:203",
        file: "ddeee.svg",
        x: 82,
        y: 50,
      },
      {
        id: "24:205",
        file: "ff8d6.svg",
        x: 82,
        y: 72,
      },
      {
        id: "24:206",
        file: "ff8d6.svg",
        x: 123,
        y: 72,
      },
      {
        id: "24:207",
        file: "ff8d6.svg",
        x: 164,
        y: 72,
      },
      {
        id: "24:208",
        file: "ff8d6.svg",
        x: 205,
        y: 72,
      },
      {
        id: "24:209",
        file: "3642e.svg",
        x: 0,
        y: 128,
      },
    ],
  },
  facilityHero: {
    w: 402,
    h: 180,
    pieces: [
      {
        id: "24:230",
        file: "29668.svg",
        x: 0,
        y: 0,
      },
      {
        id: "24:231",
        file: "da6ee.svg",
        x: 316.5752,
        y: 12.4138,
      },
      {
        id: "24:232",
        file: "effb5.svg",
        x: 27.6377,
        y: 80.6897,
      },
      {
        id: "24:233",
        file: "56cc4.svg",
        x: 77.8877,
        y: 42.2069,
      },
      {
        id: "24:234",
        file: "8a73d.svg",
        x: 103.0127,
        y: 62.069,
      },
      {
        id: "24:236",
        file: "1b38a.svg",
        x: 103.0127,
        y: 89.3793,
      },
      {
        id: "24:237",
        file: "1b38a.svg",
        x: 154.5186,
        y: 89.3793,
      },
      {
        id: "24:238",
        file: "1b38a.svg",
        x: 206.0249,
        y: 89.3793,
      },
      {
        id: "24:239",
        file: "1b38a.svg",
        x: 257.5313,
        y: 89.3793,
      },
      {
        id: "24:240",
        file: "b8b0c.svg",
        x: 0,
        y: 158.8965,
      },
    ],
  },
  building: {
    w: 58,
    h: 50,
    pieces: [
      {
        id: "25:214",
        file: "70b74.svg",
        x: 5,
        y: 2.2858,
      },
      {
        id: "25:215",
        file: "0f10c.svg",
        x: 2,
        y: 10.2858,
      },
    ],
  },
  football: {
    w: 50,
    h: 50,
    pieces: [
      {
        id: "22:272",
        file: "99929.svg",
        x: 0,
        y: 0,
      },
      {
        id: "25:185",
        file: "0e1c8.svg",
        x: 16,
        y: 16,
      },
      {
        id: "25:186",
        file: "ae717.svg",
        x: 17.8999,
        y: 20,
      },
    ],
  },
  badminton: {
    w: 50,
    h: 50,
    pieces: [
      {
        id: "22:273",
        file: "99929.svg",
        x: 0,
        y: 0,
      },
      {
        id: "25:188",
        file: "56f5f.svg",
        x: 14.2664,
        y: 13.0209,
      },
      {
        id: "25:189",
        file: "853a8.svg",
        x: 26,
        y: 26,
      },
      {
        id: "25:190",
        file: "39c7b.svg",
        x: 28.7,
        y: 18,
      },
    ],
  },
  swim: {
    w: 50,
    h: 50,
    pieces: [
      {
        id: "22:274",
        file: "99929.svg",
        x: 0,
        y: 0,
      },
      {
        id: "25:192",
        file: "2468d.svg",
        x: 26.5,
        y: 17,
      },
      {
        id: "25:193",
        file: "0f29f.svg",
        x: 16,
        y: 22,
      },
    ],
  },
  basketball: {
    w: 50,
    h: 50,
    pieces: [
      {
        id: "22:275",
        file: "99929.svg",
        x: 0,
        y: 0,
      },
      {
        id: "25:195",
        file: "29d25.svg",
        x: 16,
        y: 16,
      },
      {
        id: "25:196",
        file: "b0556.svg",
        x: 16,
        y: 16,
      },
    ],
  },
  more: {
    w: 50,
    h: 50,
    pieces: [
      {
        id: "22:276",
        file: "99929.svg",
        x: 0,
        y: 0,
      },
      {
        id: "25:198",
        file: "6c027.svg",
        x: 17,
        y: 23,
      },
      {
        id: "25:199",
        file: "6c027.svg",
        x: 23,
        y: 23,
      },
      {
        id: "25:200",
        file: "6c027.svg",
        x: 29,
        y: 23,
      },
    ],
  },
  gym: {
    w: 24,
    h: 24,
    pieces: [
      {
        id: "25:206",
        file: "049b0.svg",
        x: 3,
        y: 9,
      },
    ],
  },
  multipurpose: {
    w: 24,
    h: 24,
    pieces: [
      {
        id: "25:211",
        file: "31bb1.svg",
        x: 3,
        y: 5,
      },
      {
        id: "25:212",
        file: "65647.svg",
        x: 3,
        y: 5,
      },
    ],
  },
  clock: {
    w: 24,
    h: 24,
    pieces: [
      {
        id: "32:263",
        file: "9dbba.svg",
        x: 2,
        y: 2,
      },
      {
        id: "32:264",
        file: "85a8f.svg",
        x: 12,
        y: 6,
      },
    ],
  },
  fee: {
    w: 24,
    h: 24,
    pieces: [
      {
        id: "32:266",
        file: "f2166.svg",
        x: 2,
        y: 2,
      },
      {
        id: "32:267",
        file: "6eb64.svg",
        x: 8,
        y: 7,
      },
    ],
  },
  calendar: {
    w: 24,
    h: 24,
    pieces: [
      {
        id: "32:269",
        file: "804e8.svg",
        x: 3,
        y: 4,
      },
      {
        id: "32:270",
        file: "192e8.svg",
        x: 3,
        y: 2,
      },
    ],
  },
  sparkles: {
    w: 20,
    h: 21,
    pieces: [
      {
        id: "27:206",
        file: "6226d.svg",
        x: 2,
        y: 2,
      },
      {
        id: "27:207",
        file: "eea75.svg",
        x: 13,
        y: 14,
      },
    ],
  },
  send: {
    w: 18,
    h: 18,
    pieces: [
      {
        id: "27:244",
        file: "617f3.svg",
        x: 1.0167480468750227,
        y: 1.0166259765625227,
      },
      {
        id: "27:245",
        file: "87d03.svg",
        x: 8.600000000000023,
        y: 7.516625976562523,
      },
    ],
  },
} as const;
export type GraphicName = keyof typeof graphics;
export function FluidGraphic({
  name,
  label,
}: {
  name: GraphicName;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();
  const graphic = graphics[name];
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(entries[0].contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      className="fluid-graphic"
      ref={ref}
      style={{ aspectRatio: `${graphic.w}/${graphic.h}` }}
    >
      <DesignGraphic name={name} label={label} width={width ?? graphic.w} />
    </div>
  );
}
export function DesignGraphic({
  name,
  width,
  className = "",
  label,
}: {
  name: GraphicName;
  width?: number;
  className?: string;
  label?: string;
}) {
  const graphic = graphics[name];
  const scale = (width ?? graphic.w) / graphic.w;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`design-graphic ${className}`}
      style={{ width: graphic.w * scale, height: graphic.h * scale }}
    >
      <span
        style={{
          position: "absolute",
          width: graphic.w,
          height: graphic.h,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {graphic.pieces.map((p, i) => (
          <span
            key={i}
            data-node-id={p.id}
            style={
              {
                position: "absolute",
                left: p.x,
                top: p.y,
                ...(p.file === "56f5f.svg"
                  ? { transform: "rotate(-35deg)", transformOrigin: "center" }
                  : {}),
              } as CSSProperties
            }
          >
            <img src={`/figma/${p.file}`} alt="" draggable={false} />
          </span>
        ))}
      </span>
    </span>
  );
}
