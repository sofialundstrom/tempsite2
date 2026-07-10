"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const pageText = "ALL MAKT ÅT TENGIL";
const MAX_VISIBLE_DESKTOP = 18;
const MAX_VISIBLE_MOBILE = 8;

function getEdgeMargin(isMobile: boolean) {
  return isMobile ? 5 : 3;
}

type FloatingText = {
  id: string;
  top: number;
  left: number;
  visible: boolean;
  glitchTop: number;
  glitchBottom: number;
};

type Region = {
  topMin: number;
  topMax: number;
  leftMin: number;
  leftMax: number;
};

type TextMetrics = {
  widthPct: number;
  heightPct: number;
};

type SpawnBounds = {
  minTop: number;
  minLeft: number;
  maxTop: number;
  maxLeft: number;
};

type Position = {
  top: number;
  left: number;
};

const textClassName =
  "whitespace-nowrap text-base text-[#f9ea38] sm:text-xs md:text-sm lg:text-base";

function getMaxVisible(isMobile: boolean) {
  return isMobile ? MAX_VISIBLE_MOBILE : MAX_VISIBLE_DESKTOP;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function isMobileViewport() {
  return window.innerWidth < 640;
}

function getCenterExclusion(isMobile: boolean): Region {
  return isMobile
    ? { topMin: 38, topMax: 62, leftMin: 6, leftMax: 94 }
    : { topMin: 32, topMax: 68, leftMin: 16, leftMax: 84 };
}

function getPaddedCenter(isMobile: boolean): Region {
  const center = getCenterExclusion(isMobile);
  const pad = isMobile
    ? { top: 2.5, left: 4 }
    : { top: 3, left: 2 };

  return {
    topMin: center.topMin - pad.top,
    topMax: center.topMax + pad.top,
    leftMin: center.leftMin - pad.left,
    leftMax: center.leftMax + pad.left,
  };
}

function getSpawnBounds(metrics: TextMetrics, isMobile: boolean): SpawnBounds {
  const margin = getEdgeMargin(isMobile);

  return {
    minTop: margin,
    minLeft: margin,
    maxTop: 100 - metrics.heightPct - margin,
    maxLeft: 100 - metrics.widthPct - margin,
  };
}

function getTextBox(top: number, left: number, metrics: TextMetrics): Region {
  return {
    topMin: top,
    topMax: top + metrics.heightPct,
    leftMin: left,
    leftMax: left + metrics.widthPct,
  };
}

function expandBox(box: Region, padTop: number, padLeft: number): Region {
  return {
    topMin: box.topMin - padTop,
    topMax: box.topMax + padTop,
    leftMin: box.leftMin - padLeft,
    leftMax: box.leftMax + padLeft,
  };
}

function boxesOverlap(a: Region, b: Region) {
  return !(
    a.leftMax <= b.leftMin ||
    a.leftMin >= b.leftMax ||
    a.topMax <= b.topMin ||
    a.topMin >= b.topMax
  );
}

function isValidPosition(
  top: number,
  left: number,
  metrics: TextMetrics,
  bounds: SpawnBounds,
  center: Region,
) {
  if (top < bounds.minTop || left < bounds.minLeft) return false;
  if (top > bounds.maxTop || left > bounds.maxLeft) return false;

  return !boxesOverlap(getTextBox(top, left, metrics), center);
}

function getOverlapPadding(metrics: TextMetrics, isMobile: boolean) {
  return isMobile
    ? { top: metrics.heightPct * 0.5, left: metrics.widthPct * 0.05 }
    : { top: metrics.heightPct * 0.4, left: metrics.widthPct * 0.06 };
}

function overlapsOthers(
  top: number,
  left: number,
  others: FloatingText[],
  metrics: TextMetrics,
  isMobile: boolean,
) {
  const padding = getOverlapPadding(metrics, isMobile);
  const candidate = expandBox(
    getTextBox(top, left, metrics),
    padding.top,
    padding.left,
  );

  return others.some((text) =>
    boxesOverlap(
      candidate,
      expandBox(
        getTextBox(text.top, text.left, metrics),
        padding.top,
        padding.left,
      ),
    ),
  );
}

function getCenterLeft(metrics: TextMetrics, bounds: SpawnBounds) {
  return Math.min(
    bounds.maxLeft,
    Math.max(bounds.minLeft, (100 - metrics.widthPct) / 2),
  );
}

function buildMobileSlots(
  metrics: TextMetrics,
  bounds: SpawnBounds,
  center: Region,
): Position[] {
  const slots: Position[] = [];
  const verticalGap = metrics.heightPct * 1.15;
  const centerBuffer = metrics.heightPct * 0.55;
  const centerLeft = getCenterLeft(metrics, bounds);
  const horizontalAlignments = [bounds.minLeft, centerLeft, bounds.maxLeft];
  let alignmentIndex = 0;

  function tryAddSlot(top: number, left?: number) {
    const slotLeft =
      left ?? horizontalAlignments[alignmentIndex % horizontalAlignments.length];

    if (
      isValidPosition(top, slotLeft, metrics, bounds, center) &&
      !slots.some((slot) =>
        boxesOverlap(
          getTextBox(top, slotLeft, metrics),
          getTextBox(slot.top, slot.left, metrics),
        ),
      )
    ) {
      slots.push({ top, left: slotLeft });
      if (left === undefined) alignmentIndex += 1;
    }
  }

  let top = bounds.minTop;
  while (top + metrics.heightPct < center.topMin - centerBuffer) {
    tryAddSlot(top);
    top += metrics.heightPct + verticalGap;
  }

  top = center.topMax + centerBuffer;
  while (top <= bounds.maxTop) {
    tryAddSlot(top);
    top += metrics.heightPct + verticalGap;
  }

  const nearTitleTop = Math.max(
    bounds.minTop,
    center.topMin - metrics.heightPct - metrics.heightPct * 0.35,
  );
  const nearTitleBottom = Math.min(
    bounds.maxTop,
    center.topMax + metrics.heightPct * 0.35,
  );

  for (const slotTop of [nearTitleTop, nearTitleBottom]) {
    for (const slotLeft of horizontalAlignments) {
      tryAddSlot(slotTop, slotLeft);
    }
  }

  return slots;
}

function buildRegions(
  metrics: TextMetrics,
  bounds: SpawnBounds,
  center: Region,
  isMobile: boolean,
): Region[] {
  const cols = isMobile ? 2 : 5;
  const rows = isMobile ? 4 : 4;
  const regions: Region[] = [];

  const spanWidth = bounds.maxLeft - bounds.minLeft;
  const spanHeight = bounds.maxTop - bounds.minTop;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const leftMin = bounds.minLeft + (col / cols) * spanWidth;
      const leftMax = bounds.minLeft + ((col + 1) / cols) * spanWidth;
      const topMin = bounds.minTop + (row / rows) * spanHeight;
      const topMax = bounds.minTop + ((row + 1) / rows) * spanHeight;

      const region: Region = {
        leftMin,
        leftMax: Math.max(leftMin, leftMax - metrics.widthPct),
        topMin,
        topMax: Math.max(topMin, topMax - metrics.heightPct),
      };

      if (region.leftMax <= region.leftMin || region.topMax <= region.topMin) {
        continue;
      }

      const sampleTop = randomBetween(region.topMin, region.topMax);
      const sampleLeft = randomBetween(region.leftMin, region.leftMax);

      if (isValidPosition(sampleTop, sampleLeft, metrics, bounds, center)) {
        regions.push(region);
      }
    }
  }

  return regions;
}

function getRegionIndex(top: number, left: number, regions: Region[]) {
  return regions.findIndex(
    (region) =>
      top >= region.topMin &&
      top <= region.topMax &&
      left >= region.leftMin &&
      left <= region.leftMax,
  );
}

function pickMobilePosition(
  metrics: TextMetrics,
  existing: FloatingText[],
  regionUsage: Map<number, number>,
) {
  const bounds = getSpawnBounds(metrics, true);
  const center = getPaddedCenter(true);
  const slots = buildMobileSlots(metrics, bounds, center);

  const available = slots
    .map((slot, index) => ({ slot, index }))
    .filter(
      ({ slot }) =>
        !overlapsOthers(slot.top, slot.left, existing, metrics, true),
    );

  if (available.length === 0) return null;

  const ranked = [...available].sort((a, b) => {
    const scoreA = (regionUsage.get(a.index) ?? 0) * 6 + Math.random() * 8;
    const scoreB = (regionUsage.get(b.index) ?? 0) * 6 + Math.random() * 8;
    return scoreA - scoreB;
  });

  const choice = ranked[Math.floor(Math.random() * Math.min(3, ranked.length))];
  return {
    position: choice.slot,
    regionIndex: choice.index,
  };
}

function pickDesktopPosition(
  metrics: TextMetrics,
  existing: FloatingText[],
  regionUsage: Map<number, number>,
) {
  const bounds = getSpawnBounds(metrics, false);
  const center = getPaddedCenter(false);
  const regions = buildRegions(metrics, bounds, center, false);

  if (regions.length === 0) return null;

  const occupied = new Set<number>();
  for (const text of existing) {
    const index = getRegionIndex(text.top, text.left, regions);
    if (index >= 0) occupied.add(index);
  }

  const ranked = regions
    .map((_, index) => index)
    .sort((a, b) => {
      const scoreA =
        (occupied.has(a) ? 60 : 0) +
        (regionUsage.get(a) ?? 0) * 6 +
        Math.random() * 8;
      const scoreB =
        (occupied.has(b) ? 60 : 0) +
        (regionUsage.get(b) ?? 0) * 6 +
        Math.random() * 8;
      return scoreA - scoreB;
    });

  for (const regionIndex of ranked) {
    const region = regions[regionIndex];

    for (let attempt = 0; attempt < 12; attempt++) {
      const top = randomBetween(region.topMin, region.topMax);
      const left = randomBetween(region.leftMin, region.leftMax);

      if (
        isValidPosition(top, left, metrics, bounds, center) &&
        !overlapsOthers(top, left, existing, metrics, false)
      ) {
        return { position: { top, left }, regionIndex };
      }
    }
  }

  return null;
}

function pickPosition(
  metrics: TextMetrics,
  isMobile: boolean,
  existing: FloatingText[],
  regionUsage: Map<number, number>,
) {
  if (isMobile) {
    return pickMobilePosition(metrics, existing, regionUsage);
  }

  return pickDesktopPosition(metrics, existing, regionUsage);
}

function measureText(el: HTMLSpanElement): TextMetrics {
  const rect = el.getBoundingClientRect();
  return {
    widthPct: (rect.width / window.innerWidth) * 100,
    heightPct: (rect.height / window.innerHeight) * 100,
  };
}

export default function ScatteredText() {
  const [texts, setTexts] = useState<FloatingText[]>([]);
  const [metrics, setMetrics] = useState<TextMetrics | null>(null);
  const [layoutKey, setLayoutKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const measureRef = useRef<HTMLSpanElement>(null);
  const activeCount = useRef(0);
  const textsRef = useRef<FloatingText[]>([]);
  const regionUsage = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    textsRef.current = texts;
  }, [texts]);

  useLayoutEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;

    function updateLayout() {
      if (!measureRef.current) return;

      setMetrics(measureText(measureRef.current));
      setIsMobile(isMobileViewport());
      setTexts([]);
      activeCount.current = 0;
      regionUsage.current = new Map();
      setLayoutKey((key) => key + 1);
    }

    updateLayout();

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateLayout, 150);
    }

    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!metrics) return;

    const resolvedMetrics = metrics;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();

    function schedule(fn: () => void, ms: number) {
      const id = setTimeout(fn, ms);
      timeouts.add(id);
    }

    function removeText(id: string) {
      setTexts((prev) => prev.filter((text) => text.id !== id));
      activeCount.current = Math.max(0, activeCount.current - 1);
    }

    function spawn() {
      const isMobile = isMobileViewport();
      if (activeCount.current >= getMaxVisible(isMobile)) return;

      const picked = pickPosition(
        resolvedMetrics,
        isMobile,
        textsRef.current,
        regionUsage.current,
      );

      if (!picked) return;

      const { position, regionIndex } = picked;

      regionUsage.current.set(
        regionIndex,
        (regionUsage.current.get(regionIndex) ?? 0) + 1,
      );

      const id = crypto.randomUUID();
      const glitchTop = isMobile
        ? randomBetween(5, 8)
        : randomBetween(1.8, 3.6);
      const glitchBottom = isMobile
        ? randomBetween(4.5, 7)
        : randomBetween(1.6, 3.2);

      activeCount.current += 1;

      setTexts((prev) => [
        ...prev,
        {
          id,
          ...position,
          visible: false,
          glitchTop,
          glitchBottom,
        },
      ]);

      schedule(() => {
        setTexts((prev) =>
          prev.map((text) =>
            text.id === id ? { ...text, visible: true } : text,
          ),
        );
      }, 120);

      const visibleFor = randomBetween(4000, 8000);

      schedule(() => {
        setTexts((prev) =>
          prev.map((text) =>
            text.id === id ? { ...text, visible: false } : text,
          ),
        );
      }, visibleFor);

      schedule(() => removeText(id), visibleFor + 6800);
    }

    function scheduleSpawn() {
      schedule(() => {
        spawn();
        scheduleSpawn();
      }, randomBetween(isMobileViewport() ? 800 : 400, isMobileViewport() ? 2200 : 1200));
    }

    schedule(spawn, randomBetween(100, 400));
    schedule(spawn, randomBetween(300, 700));
    schedule(spawn, randomBetween(500, 900));
    scheduleSpawn();

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [layoutKey, metrics]);

  return (
    <>
      <span
        ref={measureRef}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 opacity-0 ${textClassName}`}
      >
        {pageText}
      </span>

      {texts.map((text) => (
        <span
          key={text.id}
          className={`scattered-text-random pointer-events-none ${text.visible ? "is-visible" : ""}`}
          style={{
            top: `${text.top}%`,
            left: `${text.left}%`,
            maxWidth: `calc(100vw - ${getEdgeMargin(isMobile) * 2}vw)`,
          }}
        >
          <span
            className={`glitch-scattered ${textClassName}`}
            data-text={pageText}
            style={
              {
                "--glitch-top": `${text.glitchTop}s`,
                "--glitch-bottom": `${text.glitchBottom}s`,
              } as React.CSSProperties
            }
          >
            {pageText}
          </span>
        </span>
      ))}
    </>
  );
}
